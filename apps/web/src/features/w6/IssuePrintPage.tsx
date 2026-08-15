import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatDateTime, formatQuantity } from '../../shared/format';
import { w6Api } from './w6Api';

export function IssuePrintPage() {
  const documentId = Number(useParams().documentId ?? 0);
  const printData = useQuery({ queryKey: ['OUT-09-print', documentId], queryFn: ({ signal }) => w6Api.printData(documentId, signal), enabled: documentId > 0 });
  if (documentId <= 0) return <p className="action-error">Mã phiếu xuất không hợp lệ.</p>;
  return <><div className="no-print"><PageHeader useCaseId="OUT-09" title={`Bản in phiếu xuất #${documentId}`} description="Bản in được dựng từ dòng yêu cầu và giao dịch batch đã ghi nhận." actions={<button type="button" className="button primary" onClick={() => window.print()}>In phiếu</button>} /></div>
    <QueryState isLoading={printData.isLoading} error={printData.error} isEmpty={!printData.data} onRetry={() => void printData.refetch()}>{printData.data ? <article className="print-sheet"><header><div><span className="eyebrow">MMS · OUT_CON</span><h1>PHIẾU XUẤT KHO</h1></div><strong>Số: {printData.data.header.issueDocumentId}</strong></header><section className="print-meta"><div><span>Phiếu yêu cầu</span><strong>#{printData.data.header.requestId}</strong></div><div><span>Người nhận</span><strong>{printData.data.header.receiverName ?? printData.data.header.requesterName ?? '—'}</strong></div><div><span>Bộ phận</span><strong>{printData.data.header.destinationName ?? printData.data.header.departmentCode ?? '—'}</strong></div><div><span>Kho xuất</span><strong>{printData.data.header.warehouseFrom ?? '—'}</strong></div><div><span>Ngày lập</span><strong>{formatDateTime(printData.data.header.createdAt)}</strong></div><div><span>Người lập</span><strong>{printData.data.header.createdBy ?? '—'}</strong></div></section>
      <DataTable caption="Chi tiết phiếu xuất" rows={printData.data.lines} rowKey={(line) => String(line.lineId)} columns={[{ key: 'material', header: 'Vật tư', render: (line) => `${line.materialId ?? ''} · ${line.materialName ?? ''}` }, { key: 'requested', header: 'Yêu cầu', align: 'right', render: (line) => formatQuantity(line.requestedQuantity) }, { key: 'issued', header: 'Thực xuất', align: 'right', render: (line) => formatQuantity(line.issuedQuantity) }, { key: 'unit', header: 'ĐVT', render: (line) => line.unit ?? '—' }, { key: 'note', header: 'Ghi chú', render: (line) => line.note ?? '—' }]} />
      <DataTable caption="Chi tiết batch" rows={printData.data.transactions} rowKey={(item) => String(item.transactionId)} columns={[{ key: 'batch', header: 'Batch', render: (item) => item.batchId ? `#${item.batchId}` : '—' }, { key: 'material', header: 'Vật tư', render: (item) => item.materialId ?? '—' }, { key: 'location', header: 'Vị trí', render: (item) => item.locationCode ?? '—' }, { key: 'quantity', header: 'Số lượng', align: 'right', render: (item) => `${formatQuantity(item.quantity)} ${item.unit ?? ''}` }]} /><footer><strong>Người lập phiếu</strong><strong>Người nhận hàng</strong></footer></article> : null}</QueryState></>;
}
