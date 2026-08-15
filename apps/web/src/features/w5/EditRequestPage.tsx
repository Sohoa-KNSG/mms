import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import type { OutboundRequestLine } from './contracts';
import { w5Api } from './w5Api';

const toLocalInput = (value: string | null) => {
  if (!value) return ''; const date = new Date(value); const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export function EditRequestPage() {
  const params = useParams(); const queryClient = useQueryClient();
  const [requestText, setRequestText] = useState(params.requestId ?? ''); const requestId = Number(requestText) || 0;
  const [neededAt, setNeededAt] = useState(''); const [destinationCode, setDestinationCode] = useState('');
  const [destinationName, setDestinationName] = useState(''); const [lines, setLines] = useState<OutboundRequestLine[]>([]);
  const query = useQuery({ queryKey: ['OUT-04', requestId], queryFn: ({ signal }) => w5Api.detail(requestId, signal), enabled: requestId > 0 });
  useEffect(() => { if (!query.data) return; setNeededAt(toLocalInput(query.data.header.neededAt)); setDestinationCode(query.data.header.destinationBravoCode ?? ''); setDestinationName(query.data.header.destinationName ?? ''); setLines(query.data.lines); }, [query.data]);
  const mutation = useMutation({ mutationFn: () => {
    if (!query.data?.header.changedAt) throw new Error('Phiếu không có phiên bản dữ liệu.');
    return w5Api.save(requestId, { planningUnit: query.data.header.planningUnit ?? '', neededAt: new Date(neededAt).toISOString(), destinationBravoCode: destinationCode || null, destinationName: destinationName || null, expectedChangedAt: query.data.header.changedAt, items: lines.map((line) => ({ planId: line.planId, materialId: line.materialId ?? '', bravoId: line.bravoId, materialName: line.materialName, quantity: line.quantity, unit: line.unit, note: line.note, destinationBravoCode: line.destinationBravoCode ?? (destinationCode || null) })) });
  }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['OUT-04', requestId] }); await queryClient.invalidateQueries({ queryKey: ['OUT-05'] }); } });
  const updateLine = (lineId: number, patch: Partial<OutboundRequestLine>) => setLines((current) => current.map((line) => line.lineId === lineId ? { ...line, ...patch } : line));
  return <><PageHeader useCaseId="OUT-04" title="Chỉnh sửa đề nghị xuất kho" description="Chỉ sửa phiếu chưa có quyết định duyệt và chưa bắt đầu soạn hàng; SP kiểm tra phiên bản trước khi ghi." />
    <section className="form-card"><div className="form-grid three-columns"><label><span>Mã phiếu</span><input inputMode="numeric" value={requestText} onChange={(event) => setRequestText(event.target.value)} /></label><label><span>Thời gian cần</span><input type="datetime-local" value={neededAt} onChange={(event) => setNeededAt(event.target.value)} /></label><label><span>Mã tổ nhận</span><input value={destinationCode} onChange={(event) => setDestinationCode(event.target.value)} /></label><label><span>Tên tổ nhận</span><input value={destinationName} onChange={(event) => setDestinationName(event.target.value)} /></label></div></section>
    {requestId > 0 ? <QueryState isLoading={query.isLoading} error={query.error} isEmpty={!query.data} onRetry={() => void query.refetch()}>{query.data ? <section className="form-card"><p>Trạng thái duyệt: <strong>{query.data.header.approvalStatus}</strong> · Soạn hàng: <strong>{query.data.header.pickingStatusCode ?? 'Chưa bắt đầu'}</strong></p><DataTable caption="Chi tiết phiếu" rows={lines} rowKey={(line) => String(line.lineId)} columns={[
      { key: 'material', header: 'Vật tư', render: (line) => `${line.materialId ?? ''} · ${line.materialName ?? ''}` },
      { key: 'quantity', header: 'Số lượng', render: (line) => <input type="number" min="0" step="any" value={line.quantity} onChange={(event) => updateLine(line.lineId, { quantity: Number(event.target.value) })} /> },
      { key: 'unit', header: 'ĐVT', render: (line) => line.unit ?? '—' },
      { key: 'destination', header: 'Tổ nhận', render: (line) => <input value={line.destinationBravoCode ?? destinationCode} onChange={(event) => updateLine(line.lineId, { destinationBravoCode: event.target.value })} /> },
      { key: 'note', header: 'Ghi chú', render: (line) => <input maxLength={100} value={line.note ?? ''} onChange={(event) => updateLine(line.lineId, { note: event.target.value })} /> },
      { key: 'remove', header: '', render: (line) => <button className="button secondary" type="button" onClick={() => setLines((current) => current.filter((item) => item.lineId !== line.lineId))}>Bỏ dòng</button> },
    ]} /><button className="button primary" type="button" disabled={!query.data.header.canEdit || !neededAt || !destinationCode || lines.length === 0 || lines.some((line) => line.quantity <= 0) || mutation.isPending} onClick={() => mutation.mutate()}>Lưu phiếu</button>
      {!query.data.header.canEdit ? <p className="action-error">Phiếu không còn điều kiện chỉnh sửa.</p> : null}{mutation.isSuccess ? <p className="action-success">Đã lưu phiếu #{mutation.data.requestId}.</p> : null}{mutation.error ? <p className="action-error">{mutation.error.message}</p> : null}</section> : null}</QueryState> : null}</>;
}
