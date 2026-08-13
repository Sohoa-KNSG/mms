import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatDateTime, formatQuantity } from '../../shared/format';
import { w6Api } from './w6Api';

export function GoodsIssuePage() {
  const queryClient = useQueryClient(); const requestId = Number(useParams().requestId ?? 0);
  const request = useQuery({ queryKey: ['OUT-08', requestId], queryFn: ({ signal }) => w6Api.request(requestId, signal), enabled: requestId > 0 });
  const complete = useMutation({ mutationFn: () => w6Api.complete(requestId), onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['OUT-08', requestId] }) });
  const hasVariance = request.data?.lines.some((line) => Math.abs(line.remainingQuantity) > 0.0001) ?? true;
  if (requestId <= 0) return <p className="action-error">Mã phiếu không hợp lệ.</p>;
  return <><PageHeader useCaseId="OUT-08" title={`Xác nhận xuất kho · Phiếu #${requestId}`} description="Chỉ SP được phép đóng phiếu; mọi dòng phải đủ số lượng và phiếu OUT_CON phải đang hoạt động." />
    <QueryState isLoading={request.isLoading} error={request.error} isEmpty={!request.data} onRetry={() => void request.refetch()}>{request.data ? <>
      <section className="summary-strip"><div><span>Phiếu xuất</span><strong>{request.data.header.issueDocumentId ? `#${request.data.header.issueDocumentId}` : '—'}</strong></div><div><span>Người nhận</span><strong>{request.data.header.requesterName ?? '—'}</strong></div><div><span>Thời gian cần</span><strong>{formatDateTime(request.data.header.neededAt)}</strong></div></section>
      <DataTable caption="Đối chiếu yêu cầu và thực xuất" rows={request.data.lines} rowKey={(line) => String(line.lineId)} columns={[
        { key: 'material', header: 'Vật tư', render: (line) => `${line.materialId ?? ''} · ${line.materialName ?? ''}` },
        { key: 'requested', header: 'Yêu cầu', align: 'right', render: (line) => formatQuantity(line.requestedQuantity) },
        { key: 'issued', header: 'Thực xuất', align: 'right', render: (line) => formatQuantity(line.issuedQuantity) },
        { key: 'variance', header: 'Chênh lệch', align: 'right', render: (line) => <span className={Math.abs(line.remainingQuantity) > 0.0001 ? 'text-danger' : 'text-success'}>{formatQuantity(line.remainingQuantity)}</span> },
      ]} />
      <section className="form-card"><p className={hasVariance ? 'action-error' : 'action-success'}>{hasVariance ? 'Chưa đủ số lượng; không thể hoàn tất phiếu.' : 'Đã đối chiếu đủ số lượng; phiếu có thể hoàn tất.'}</p><div className="button-row"><Link className="button secondary" to={`/outbound/picking/${requestId}/batches`}>Quay lại soạn</Link><button className="button primary" type="button" disabled={hasVariance || !request.data.header.canComplete || complete.isPending} onClick={() => complete.mutate()}>Hoàn tất xuất kho</button>{request.data.header.issueDocumentId ? <Link className="button secondary" to={`/outbound/issue-documents/${request.data.header.issueDocumentId}/print`}>In phiếu</Link> : null}</div>{complete.error ? <p className="action-error">{complete.error.message}</p> : null}</section>
    </> : null}</QueryState></>;
}
