import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatDateTime, formatQuantity } from '../../shared/format';
import { w6Api } from './w6Api';

export function IssueDocumentsPage() {
  const [search, setSearch] = useState('');
  const documents = useQuery({ queryKey: ['OUT-09', search], queryFn: ({ signal }) => w6Api.documents(search, signal) });
  return <><PageHeader useCaseId="OUT-09" title="Phiếu xuất kho" description="Danh sách phiếu OUT_CON còn hiệu lực và dữ liệu in được tổng hợp trực tiếp từ giao dịch batch." />
    <section className="filter-bar"><label><span>Tìm phiếu</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã phiếu xuất, mã yêu cầu, người nhận" /></label></section>
    <QueryState isLoading={documents.isLoading} error={documents.error} isEmpty={documents.data?.items.length === 0} onRetry={() => void documents.refetch()}><DataTable caption="Phiếu xuất" rows={documents.data?.items ?? []} rowKey={(item) => String(item.issueDocumentId)} columns={[
      { key: 'document', header: 'Phiếu xuất', render: (item) => `#${item.issueDocumentId}` }, { key: 'request', header: 'Yêu cầu', render: (item) => `#${item.requestId}` },
      { key: 'requester', header: 'Người nhận', render: (item) => item.requesterName ?? '—' }, { key: 'time', header: 'Thời gian', render: (item) => formatDateTime(item.createdAt) },
      { key: 'quantity', header: 'Số lượng', align: 'right', render: (item) => formatQuantity(item.totalQuantity) }, { key: 'batches', header: 'Số batch', align: 'right', render: (item) => item.batchCount },
      { key: 'print', header: '', render: (item) => <Link className="button secondary" to={`/outbound/issue-documents/${item.issueDocumentId}/print`}>Xem bản in</Link> },
    ]} /></QueryState></>;
}
