import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatDateTime, formatQuantity } from '../../shared/format';
import { w2Api } from './w2Api';

export function InspectionPrintPage() {
  const params = useParams();
  const [inspectionInput, setInspectionInput] = useState(params.inspectionId ?? '');
  const inspectionId = Number(inspectionInput) > 0 ? Number(inspectionInput) : null;
  const query = useQuery({
    queryKey: ['QC-06', inspectionId],
    queryFn: ({ signal }) => w2Api.getInspectionPrintData(inspectionId ?? 0, signal),
    enabled: inspectionId !== null,
  });

  return (
    <>
      <div className="no-print"><PageHeader useCaseId="QC-06" title="In phiếu kiểm" description="Chỉ phát hành khi mọi vật tư cần QC đã có kết luận." /><section className="form-card"><div className="form-actions"><label><span>Mã phiếu kiểm</span><input type="number" min={1} value={inspectionInput} onChange={(event) => setInspectionInput(event.target.value)} /></label><button className="button primary" type="button" disabled={!query.data} onClick={() => window.print()}>In / xuất PDF</button></div></section></div>
      <QueryState isLoading={query.isLoading} error={query.error} onRetry={() => void query.refetch()}>
        {query.data ? <article className="print-sheet">
          <header><div><span>SMART FACTORY — MMS</span><h1>PHIẾU KIỂM CHẤT LƯỢNG</h1></div><strong>QC #{query.data.header.inspectionId}</strong></header>
          <div className="print-meta"><div><span>Phiếu nhận</span><strong>#{query.data.header.receiptId}</strong></div><div><span>PO</span><strong>{query.data.header.purchaseOrder ?? '—'}</strong></div><div><span>Khách hàng</span><strong>{query.data.header.customerName ?? '—'}</strong></div><div><span>Người lập</span><strong>{query.data.header.createdByName ?? query.data.header.createdBy ?? '—'}</strong></div><div><span>Ngày lập</span><strong>{formatDateTime(query.data.header.createdAt)}</strong></div><div><span>Ngày in</span><strong>{formatDateTime(query.data.header.printedAt)}</strong></div></div>
          <DataTable caption="Vật tư kiểm" rows={query.data.materials} rowKey={(item) => String(item.receivingLineId)} columns={[
            { key: 'material', header: 'Vật tư', render: (item) => `${item.materialId ?? ''} — ${item.materialName ?? ''}` },
            { key: 'received', header: 'Thực nhận', render: (item) => `${formatQuantity(item.quantityReceived)} ${item.unit ?? ''}` },
            { key: 'inspected', header: 'Đã kiểm', render: (item) => formatQuantity(item.inspectedQuantity ?? 0) },
            { key: 'failed', header: 'Không đạt', render: (item) => formatQuantity(item.failedQuantity ?? 0) },
            { key: 'result', header: 'Kết luận', render: (item) => item.overallResultLabel ?? '—' },
          ]} />
          <DataTable caption="Kết quả tiêu chí" rows={query.data.criteria} rowKey={(item) => `${item.receivingLineId}-${item.criterionId}`} columns={[
            { key: 'line', header: 'Dòng nhận', render: (item) => item.receivingLineId ?? '—' },
            { key: 'criterion', header: 'Tiêu chí', render: (item) => item.criterionName ?? item.criterionCode ?? '—' },
            { key: 'spec', header: 'Thông số', render: (item) => item.specification ?? '—' },
            { key: 'result', header: 'Kết quả', render: (item) => item.resultCode ?? '—' },
            { key: 'note', header: 'Ghi nhận', render: (item) => item.defectNote ?? '—' },
          ]} />
          <footer><div>Người kiểm</div><div>Quản lý QC</div></footer>
        </article> : null}
      </QueryState>
    </>
  );
}

