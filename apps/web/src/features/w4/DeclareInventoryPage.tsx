import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DataTable } from '../../shared/components/DataTable'; import { PageHeader } from '../../shared/components/PageHeader'; import { QueryState } from '../../shared/components/QueryState'; import { formatQuantity } from '../../shared/format'; import { w4Api } from './w4Api';

interface Entry { materialId: string; materialName: string | null; unit: string | null; quantity: number; locationCode: string | null }
export function DeclareInventoryPage() {
  const [search, setSearch] = useState(''); const [warehouse, setWarehouse] = useState('20020100'); const [reason, setReason] = useState(''); const [entries, setEntries] = useState<Record<string, Entry>>({});
  const query = useQuery({ queryKey: ['INV-04', search], queryFn: ({ signal }) => w4Api.declarationCatalog(search, signal) });
  const mutation = useMutation({ mutationFn: () => w4Api.declareInventory(warehouse, reason, Object.values(entries).map((item) => ({ materialId: item.materialId, quantity: item.quantity, unit: item.unit, locationCode: item.locationCode }))) });
  return <><PageHeader useCaseId="INV-04" title="Khai báo tồn kho" description="Tạo batch và transaction ADJ_UP có căn cứ, không chỉnh trực tiếp số tồn." />
    <section className="form-card"><div className="form-grid three-columns"><label><span>Kho</span><input value={warehouse} onChange={(e) => setWarehouse(e.target.value)} /></label><label><span>Căn cứ điều chỉnh</span><input maxLength={50} value={reason} onChange={(e) => setReason(e.target.value)} /></label><label><span>Tìm vật tư</span><input value={search} onChange={(e) => setSearch(e.target.value)} /></label></div></section>
    <QueryState isLoading={query.isLoading} error={query.error} isEmpty={query.data?.items.length === 0} onRetry={() => void query.refetch()}><DataTable caption="Vật tư" rows={query.data?.items ?? []} rowKey={(x) => x.materialId} columns={[
      { key: 'id', header: 'Mã', render: (x) => x.materialId }, { key: 'name', header: 'Tên vật tư', render: (x) => x.materialName ?? '—' }, { key: 'current', header: 'Tồn hiện tại', align: 'right', render: (x) => `${formatQuantity(x.currentQuantity)} ${x.unit ?? ''}` },
      { key: 'choose', header: '', render: (x) => <button className="button secondary" type="button" onClick={() => setEntries((current) => current[x.materialId] ? Object.fromEntries(Object.entries(current).filter(([key]) => key !== x.materialId)) : { ...current, [x.materialId]: { materialId: x.materialId, materialName: x.materialName, unit: x.unit, quantity: 1, locationCode: null } })}>{entries[x.materialId] ? 'Bỏ chọn' : 'Chọn'}</button> },
    ]} /></QueryState>
    {Object.values(entries).length ? <section className="form-card"><h2>Danh sách khai báo</h2><DataTable caption="Danh sách khai báo" rows={Object.values(entries)} rowKey={(x) => x.materialId} columns={[
      { key: 'material', header: 'Vật tư', render: (x) => `${x.materialId} · ${x.materialName ?? ''}` }, { key: 'quantity', header: 'Số lượng', render: (x) => <input type="number" min="0" step="any" value={x.quantity} onChange={(e) => setEntries((c) => ({ ...c, [x.materialId]: { ...x, quantity: Number(e.target.value) } }))} /> },
      { key: 'location', header: 'Vị trí', render: (x) => <select value={x.locationCode ?? ''} onChange={(e) => setEntries((c) => ({ ...c, [x.materialId]: { ...x, locationCode: e.target.value || null } }))}><option value="">Chưa lên kệ</option>{query.data?.locations.map((l) => <option key={l.locationCode} value={l.locationCode}>{l.locationCode} · {l.description}</option>)}</select> },
    ]} /><button className="button primary" type="button" disabled={!warehouse.trim() || !reason.trim() || mutation.isPending} onClick={() => mutation.mutate()}>Ghi nhận tồn</button>{mutation.isSuccess ? <p className="action-success">Đã tạo {mutation.data.batchCount} batch, phiếu giao dịch #{mutation.data.transactionDocumentId}.</p> : null}{mutation.error ? <p className="action-error">{mutation.error.message}</p> : null}</section> : null}</>;
}

