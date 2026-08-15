import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatDateTime, formatQuantity } from '../../shared/format';
import { w6Api } from './w6Api';

const statusLabel: Record<string, string> = { ready: 'Chờ soạn', picking: 'Đang soạn', completed: 'Hoàn thành' };

export function PickingQueuePage() {
  const queryClient = useQueryClient(); const [search, setSearch] = useState(''); const [status, setStatus] = useState('');
  const queue = useQuery({ queryKey: ['OUT-06', search, status], queryFn: ({ signal }) => w6Api.queue(search, status, signal) });
  const start = useMutation({ mutationFn: (requestId: number) => w6Api.start(requestId), onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['OUT-06'] }) });
  return <><PageHeader useCaseId="OUT-06" title="Hàng đợi soạn hàng" description="Phiếu trạng thái legacy 4 được ưu tiên theo thời điểm duyệt; bắt đầu soạn sẽ tạo hoặc dùng lại đúng một phiếu OUT_CON." />
    <section className="filter-bar"><label><span>Tìm phiếu</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã phiếu, người lập, đơn vị nhận" /></label><label><span>Trạng thái</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tất cả</option><option value="ready">Chờ soạn</option><option value="picking">Đang soạn</option><option value="completed">Hoàn thành</option></select></label></section>
    <QueryState isLoading={queue.isLoading} error={queue.error} isEmpty={queue.data?.items.length === 0} onRetry={() => void queue.refetch()}><DataTable caption="Phiếu cần soạn" rows={queue.data?.items ?? []} rowKey={(item) => String(item.requestId)} columns={[
      { key: 'request', header: 'Phiếu', render: (item) => `#${item.requestId}` },
      { key: 'requester', header: 'Người yêu cầu', render: (item) => item.requesterName ?? '—' },
      { key: 'needed', header: 'Thời gian cần', render: (item) => formatDateTime(item.neededAt) },
      { key: 'quantity', header: 'Đã soạn / Yêu cầu', align: 'right', render: (item) => `${formatQuantity(item.issuedQuantity)} / ${formatQuantity(item.requestedQuantity)}` },
      { key: 'status', header: 'Trạng thái', render: (item) => statusLabel[item.pickingStatus] ?? item.pickingStatus },
      { key: 'actions', header: '', render: (item) => <div className="button-row">{item.pickingStatus === 'ready' ? <button type="button" className="button primary" disabled={start.isPending} onClick={() => start.mutate(item.requestId)}>Bắt đầu</button> : null}<Link className="button secondary" to={`/outbound/picking/${item.requestId}/batches`}>Mở phiếu</Link></div> },
    ]} /></QueryState>{start.error ? <p className="action-error">{start.error.message}</p> : null}</>;
}
