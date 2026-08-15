import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatQuantity } from '../../shared/format';
import type { OutboundCatalogItem } from './contracts';
import { w5Api, type OutboundRequestItemInput, type RequestKind } from './w5Api';

interface Props { useCaseId: string; title: string; description: string; kind: RequestKind; enforceLimit: boolean }
interface DraftLine { item: OutboundCatalogItem; quantity: number; note: string }
const localDateTime = () => {
  const date = new Date(Date.now() + 60 * 60 * 1000); const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const keyOf = (item: OutboundCatalogItem) => `${item.planId ?? 'none'}:${item.materialId}`;

export function RequestComposerPage({ useCaseId, title, description, kind, enforceLimit }: Props) {
  const [planningUnit, setPlanningUnit] = useState(''); const [search, setSearch] = useState('');
  const [destinationCode, setDestinationCode] = useState(''); const [neededAt, setNeededAt] = useState(localDateTime);
  const [draft, setDraft] = useState<Record<string, DraftLine>>({});
  const query = useQuery({ queryKey: [useCaseId, planningUnit, search], queryFn: ({ signal }) => w5Api.catalog(kind, planningUnit, search, signal) });
  const destinations = useMemo(() => (query.data?.destinations ?? []).filter((item) => !planningUnit || item.planningUnit === planningUnit), [query.data, planningUnit]);
  const destination = destinations.find((item) => item.destinationBravoCode === destinationCode);
  const items = Object.values(draft).map<OutboundRequestItemInput>(({ item, quantity, note }) => ({
    planId: item.planId, materialId: item.materialId, bravoId: item.bravoId, materialName: item.materialName,
    quantity, unit: item.unit, note: note || null, destinationBravoCode: destinationCode || null,
  }));
  const invalidLimit = enforceLimit && Object.values(draft).some(({ item, quantity }) => item.remainingQuantity !== null && quantity > item.remainingQuantity);
  const mutation = useMutation({ mutationFn: () => w5Api.create(kind, {
    planningUnit, neededAt: new Date(neededAt).toISOString(), destinationBravoCode: destinationCode || null,
    destinationName: destination?.destinationName ?? null, items,
  }), onSuccess: () => setDraft({}) });
  const toggle = (item: OutboundCatalogItem) => setDraft((current) => {
    const key = keyOf(item); if (current[key]) return Object.fromEntries(Object.entries(current).filter(([entry]) => entry !== key));
    return { ...current, [key]: { item, quantity: 1, note: '' } };
  });
  return <><PageHeader useCaseId={useCaseId} title={title} description={description} />
    <section className="form-card"><div className="form-grid three-columns">
      <label><span>Đơn vị kế hoạch</span><select value={planningUnit} onChange={(event) => { setPlanningUnit(event.target.value); setDestinationCode(''); setDraft({}); }}><option value="">Chọn đơn vị</option>{query.data?.planningUnits.map((unit) => <option key={unit.planningUnit} value={unit.planningUnit}>{unit.planningUnitName ?? unit.planningUnit}</option>)}</select></label>
      <label><span>Tổ nhận Bravo</span><select value={destinationCode} onChange={(event) => setDestinationCode(event.target.value)}><option value="">Chọn tổ nhận</option>{destinations.map((item) => <option key={item.destinationBravoCode} value={item.destinationBravoCode}>{item.destinationName ?? item.destinationBravoCode}</option>)}</select></label>
      <label><span>Thời gian cần</span><input type="datetime-local" value={neededAt} onChange={(event) => setNeededAt(event.target.value)} /></label>
      <label><span>Tìm vật tư</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã hoặc tên vật tư" /></label>
    </div></section>
    <QueryState isLoading={query.isLoading} error={query.error} isEmpty={query.data?.items.length === 0} onRetry={() => void query.refetch()}>
      <DataTable caption="Danh mục vật tư" rows={query.data?.items ?? []} rowKey={keyOf} columns={[
        { key: 'id', header: 'Mã', render: (item) => item.materialId },
        { key: 'name', header: 'Tên vật tư', render: (item) => item.materialName ?? '—' },
        { key: 'plan', header: 'Định mức / đã giữ', align: 'right', render: (item) => item.limitQuantity === null ? 'Ngoài kế hoạch' : `${formatQuantity(item.limitQuantity)} / ${formatQuantity(item.usedQuantity)}` },
        { key: 'remaining', header: 'Còn lại', align: 'right', render: (item) => item.remainingQuantity === null ? '—' : formatQuantity(item.remainingQuantity) },
        { key: 'action', header: '', render: (item) => <button className="button secondary" type="button" onClick={() => toggle(item)}>{draft[keyOf(item)] ? 'Bỏ chọn' : 'Chọn'}</button> },
      ]} />
    </QueryState>
    {items.length ? <section className="form-card"><h2>Chi tiết trình duyệt</h2><DataTable caption="Chi tiết phiếu" rows={Object.entries(draft)} rowKey={([key]) => key} columns={[
      { key: 'material', header: 'Vật tư', render: ([, row]) => `${row.item.materialId} · ${row.item.materialName ?? ''}` },
      { key: 'quantity', header: 'Số lượng', render: ([key, row]) => <input type="number" min="0" step="any" value={row.quantity} onChange={(event) => setDraft((current) => ({ ...current, [key]: { ...row, quantity: Number(event.target.value) } }))} /> },
      { key: 'unit', header: 'ĐVT', render: ([, row]) => row.item.unit ?? '—' },
      { key: 'note', header: 'Ghi chú', render: ([key, row]) => <input value={row.note} maxLength={100} onChange={(event) => setDraft((current) => ({ ...current, [key]: { ...row, note: event.target.value } }))} /> },
    ]} />
      {invalidLimit ? <p className="action-error">Có dòng vượt định mức còn lại. Hãy giảm số lượng hoặc dùng OUT-03.</p> : null}
      <button className="button primary" type="button" disabled={!planningUnit || !destinationCode || !neededAt || invalidLimit || items.some((item) => item.quantity <= 0) || mutation.isPending} onClick={() => mutation.mutate()}>Trình duyệt</button>
      {mutation.isSuccess ? <p className="action-success">Đã tạo phiếu #{mutation.data.requestId}, bước duyệt 1/{mutation.data.totalApprovalSteps}.</p> : null}
      {mutation.error ? <p className="action-error">{mutation.error.message}</p> : null}
    </section> : null}</>;
}
