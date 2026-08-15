import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatDateTime, formatQuantity } from '../../shared/format';
import type { PickableBatch } from './contracts';
import { w6Api } from './w6Api';

export function BatchPickingPage() {
  const queryClient = useQueryClient(); const requestId = Number(useParams().requestId ?? 0);
  const [lineId, setLineId] = useState(0); const [selectedBatch, setSelectedBatch] = useState<PickableBatch | null>(null); const [quantity, setQuantity] = useState('');
  const request = useQuery({ queryKey: ['OUT-07-request', requestId], queryFn: ({ signal }) => w6Api.request(requestId, signal), enabled: requestId > 0 });
  useEffect(() => { if (!lineId && request.data?.lines[0]) setLineId(request.data.lines[0].lineId); }, [lineId, request.data]);
  const batches = useQuery({ queryKey: ['OUT-07-batches', requestId, lineId], queryFn: ({ signal }) => w6Api.batches(requestId, lineId, signal), enabled: requestId > 0 && lineId > 0 });
  const currentLine = useMemo(() => request.data?.lines.find((line) => line.lineId === lineId), [lineId, request.data]);
  const pick = useMutation({ mutationFn: () => {
    if (!selectedBatch) throw new Error('Vui lòng chọn batch.');
    return w6Api.pick(requestId, lineId, { batchId: selectedBatch.batchId, quantity: Number(quantity), expectedBatchQuantity: selectedBatch.availableQuantity, expectedLocationCode: selectedBatch.locationCode });
  }, onSuccess: async () => { setSelectedBatch(null); setQuantity(''); await queryClient.invalidateQueries({ queryKey: ['OUT-07-request', requestId] }); await queryClient.invalidateQueries({ queryKey: ['OUT-07-batches', requestId, lineId] }); } });
  if (requestId <= 0) return <p className="action-error">Mã phiếu không hợp lệ.</p>;
  return <><PageHeader useCaseId="OUT-07" title={`Soạn theo batch · Phiếu #${requestId}`} description="Batch được sắp FIFO; SP kiểm tra lại vật tư, tồn, vị trí và phần nhu cầu còn lại ngay trong giao dịch." />
    <QueryState isLoading={request.isLoading} error={request.error} isEmpty={!request.data} onRetry={() => void request.refetch()}>{request.data ? <>
      <section className="summary-strip"><div><span>Người yêu cầu</span><strong>{request.data.header.requesterName ?? '—'}</strong></div><div><span>Phiếu xuất</span><strong>{request.data.header.issueDocumentId ? `#${request.data.header.issueDocumentId}` : 'Chưa tạo'}</strong></div><div><span>Trạng thái</span><strong>{request.data.header.pickingStatusCode === '1' ? 'Đang soạn' : request.data.header.pickingStatusCode === '2' ? 'Hoàn thành' : 'Chờ soạn'}</strong></div></section>
      <DataTable caption="Dòng yêu cầu" rows={request.data.lines} rowKey={(line) => String(line.lineId)} columns={[
        { key: 'material', header: 'Vật tư', render: (line) => `${line.materialId ?? ''} · ${line.materialName ?? ''}` },
        { key: 'requested', header: 'Yêu cầu', align: 'right', render: (line) => formatQuantity(line.requestedQuantity) },
        { key: 'issued', header: 'Đã soạn', align: 'right', render: (line) => formatQuantity(line.issuedQuantity) },
        { key: 'remaining', header: 'Còn lại', align: 'right', render: (line) => formatQuantity(line.remainingQuantity) },
        { key: 'stock', header: 'Tồn khả dụng', align: 'right', render: (line) => formatQuantity(line.availableQuantity) },
        { key: 'open', header: '', render: (line) => <button className="button secondary" type="button" onClick={() => { setLineId(line.lineId); setSelectedBatch(null); }}>Chọn</button> },
      ]} />
      {currentLine ? <section className="form-card"><h2>Batch cho {currentLine.materialId} · còn {formatQuantity(currentLine.remainingQuantity)} {currentLine.unit ?? ''}</h2><QueryState isLoading={batches.isLoading} error={batches.error} isEmpty={batches.data?.length === 0} onRetry={() => void batches.refetch()}><div className="card-grid">{batches.data?.map((batch, index) => <button type="button" className={`selection-card ${index === 0 ? 'fifo-card' : ''} ${selectedBatch?.batchId === batch.batchId ? 'selected' : ''}`} key={batch.batchId} onClick={() => { setSelectedBatch(batch); setQuantity(String(Math.min(batch.availableQuantity, currentLine.remainingQuantity))); }}><strong>Batch #{batch.batchId}</strong><span className="location-badge">{batch.locationCode ?? 'Không vị trí'}</span><span>{formatQuantity(batch.availableQuantity)} {batch.unit ?? ''}</span><small>Nhập {formatDateTime(batch.receivedAt)}</small></button>)}</div></QueryState>
        <div className="form-actions"><label><span>Số lượng xuất</span><input type="number" min="0" step="0.0001" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label><button className="button primary" type="button" disabled={!request.data.header.canPick || !selectedBatch || Number(quantity) <= 0 || Number(quantity) > Math.min(selectedBatch.availableQuantity, currentLine.remainingQuantity) || pick.isPending} onClick={() => pick.mutate()}>Xác nhận batch</button></div>{pick.error ? <p className="action-error">{pick.error.message}</p> : null}</section> : null}
      <div className="button-row"><Link className="button secondary" to="/outbound/picking">Về hàng đợi</Link><Link className="button primary" to={`/outbound/goods-issue/${requestId}`}>Kiểm tra và hoàn tất</Link></div>
    </> : null}</QueryState></>;
}
