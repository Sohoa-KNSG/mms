import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatDateTime, formatQuantity } from '../../shared/format';
import { w5Api } from './w5Api';

const approvalLabel: Record<string, string> = { pending: 'Chờ duyệt', approve: 'Đã duyệt', reject: 'Từ chối', cancelled: 'Đã hủy' };
const pickingLabel: Record<string, string> = { '0': 'Chờ soạn', '1': 'Đang soạn', '2': 'Hoàn thành' };

export function RequestsPage() {
  const queryClient = useQueryClient(); const [search, setSearch] = useState(''); const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState(0); const [note, setNote] = useState(''); const [cancelReason, setCancelReason] = useState('');
  const queue = useQuery({ queryKey: ['OUT-05', search, status], queryFn: ({ signal }) => w5Api.queue(search, status, signal) });
  const detail = useQuery({ queryKey: ['OUT-05-detail', selectedId], queryFn: ({ signal }) => w5Api.detail(selectedId, signal), enabled: selectedId > 0 });
  const refresh = async () => { await queryClient.invalidateQueries({ queryKey: ['OUT-05'] }); await queryClient.invalidateQueries({ queryKey: ['OUT-05-detail', selectedId] }); };
  const decide = useMutation({ mutationFn: (decision: 'approve' | 'reject') => {
    const pending = detail.data?.approvals.find((item) => item.decision === null);
    if (!pending) throw new Error('Không tìm thấy bước duyệt đang chờ.');
    return w5Api.decide(selectedId, pending.approvalRunId, decision, note);
  }, onSuccess: refresh });
  const cancel = useMutation({ mutationFn: () => {
    const changedAt = detail.data?.header.changedAt; if (!changedAt) throw new Error('Phiếu không có phiên bản dữ liệu.');
    return w5Api.cancel(selectedId, cancelReason, changedAt);
  }, onSuccess: refresh });
  return <><PageHeader useCaseId="OUT-05" title="Theo dõi và phê duyệt đề nghị" description="Một hàng đợi thống nhất cho người lập, người duyệt và quản trị; quyết định nhiều bước được ghi trực tiếp bởi SP." />
    <section className="form-card"><div className="form-grid three-columns"><label><span>Tìm phiếu</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã phiếu, người lập, tổ nhận" /></label><label><span>Trạng thái duyệt</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tất cả</option><option value="pending">Chờ duyệt</option><option value="approve">Đã duyệt</option><option value="reject">Từ chối</option><option value="cancelled">Đã hủy</option></select></label></div></section>
    <QueryState isLoading={queue.isLoading} error={queue.error} isEmpty={queue.data?.items.length === 0} onRetry={() => void queue.refetch()}><DataTable caption="Danh sách đề nghị" rows={queue.data?.items ?? []} rowKey={(item) => String(item.requestId)} columns={[
      { key: 'id', header: 'Phiếu', render: (item) => `#${item.requestId}` }, { key: 'requester', header: 'Người lập', render: (item) => item.requesterName ?? '—' },
      { key: 'type', header: 'Loại', render: (item) => item.classification ?? '—' }, { key: 'needed', header: 'Thời gian cần', render: (item) => formatDateTime(item.neededAt) },
      { key: 'quantity', header: 'Tổng SL', align: 'right', render: (item) => formatQuantity(item.totalQuantity) },
      { key: 'approval', header: 'Phê duyệt', render: (item) => approvalLabel[item.approvalStatus] ?? item.approvalStatus },
      { key: 'picking', header: 'Soạn hàng', render: (item) => item.pickingStatusCode ? (pickingLabel[item.pickingStatusCode] ?? item.pickingStatusCode) : '—' },
      { key: 'open', header: '', render: (item) => <button className="button secondary" type="button" onClick={() => { setSelectedId(item.requestId); setNote(''); setCancelReason(''); }}>Mở</button> },
    ]} /></QueryState>
    {selectedId > 0 ? <QueryState isLoading={detail.isLoading} error={detail.error} isEmpty={!detail.data} onRetry={() => void detail.refetch()}>{detail.data ? <section className="form-card"><h2>Phiếu #{detail.data.header.requestId}</h2><p>{detail.data.header.requesterName} · {detail.data.header.planningUnit} · {approvalLabel[detail.data.header.approvalStatus] ?? detail.data.header.approvalStatus}</p>
      <DataTable caption="Vật tư" rows={detail.data.lines} rowKey={(line) => String(line.lineId)} columns={[{ key: 'material', header: 'Vật tư', render: (line) => `${line.materialId ?? ''} · ${line.materialName ?? ''}` }, { key: 'quantity', header: 'Số lượng', align: 'right', render: (line) => `${formatQuantity(line.quantity)} ${line.unit ?? ''}` }, { key: 'destination', header: 'Tổ nhận', render: (line) => line.destinationBravoCode ?? '—' }, { key: 'note', header: 'Ghi chú', render: (line) => line.note ?? '—' }]} />
      <h3>Lịch sử phê duyệt</h3><DataTable caption="Lịch sử phê duyệt" rows={detail.data.approvals} rowKey={(item) => String(item.approvalRunId)} columns={[{ key: 'step', header: 'Bước', render: (item) => `${item.approvalStep ?? '—'}/${item.totalApprovalSteps ?? '—'}` }, { key: 'approver', header: 'Người duyệt', render: (item) => item.approverName ?? item.approverEmployeeCode ?? '—' }, { key: 'decision', header: 'Quyết định', render: (item) => item.decision ? (approvalLabel[item.decision] ?? item.decision) : 'Chờ duyệt' }, { key: 'time', header: 'Thời gian', render: (item) => formatDateTime(item.decidedAt) }, { key: 'note', header: 'Ghi chú', render: (item) => item.note ?? '—' }]} />
      <div className="form-grid three-columns"><label><span>Ghi chú quyết định</span><input value={note} onChange={(event) => setNote(event.target.value)} /></label><label><span>Lý do hủy</span><input value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} /></label></div>
      <div className="button-row">{detail.data.header.canEdit ? <Link className="button secondary" to={`/outbound/requests/edit/${selectedId}`}>Chỉnh sửa</Link> : null}<button className="button primary" type="button" disabled={!detail.data.header.canApprove || decide.isPending} onClick={() => decide.mutate('approve')}>Duyệt</button><button className="button secondary" type="button" disabled={!detail.data.header.canApprove || !note.trim() || decide.isPending} onClick={() => decide.mutate('reject')}>Từ chối</button><button className="button secondary" type="button" disabled={!detail.data.header.canCancel || !cancelReason.trim() || cancel.isPending} onClick={() => cancel.mutate()}>Hủy phiếu</button></div>
      {decide.error ? <p className="action-error">{decide.error.message}</p> : null}{cancel.error ? <p className="action-error">{cancel.error.message}</p> : null}
    </section> : null}</QueryState> : null}</>;
}
