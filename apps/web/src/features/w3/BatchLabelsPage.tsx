import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatDateTime, formatQuantity } from '../../shared/format';
import { w3Api } from './w3Api';

export function BatchLabelsPage() {
  const [params] = useSearchParams();
  const [receiptText, setReceiptText] = useState(params.get('receiptId') ?? '');
  const [transactionText, setTransactionText] = useState(params.get('transactionDocumentId') ?? '');
  const [batchText, setBatchText] = useState(params.get('batchId') ?? '');
  const [filter, setFilter] = useState<{ receiptId?: number; transactionDocumentId?: number; batchId?: number } | null>(() => {
    const transactionDocumentId = Number(params.get('transactionDocumentId'));
    return transactionDocumentId > 0 ? { transactionDocumentId } : null;
  });
  const query = useQuery({
    queryKey: ['INB-08', filter],
    queryFn: ({ signal }) => w3Api.getBatchLabels(filter ?? {}, signal),
    enabled: filter !== null,
  });

  const load = () => setFilter({
    ...(Number(receiptText) > 0 ? { receiptId: Number(receiptText) } : {}),
    ...(Number(transactionText) > 0 ? { transactionDocumentId: Number(transactionText) } : {}),
    ...(Number(batchText) > 0 ? { batchId: Number(batchText) } : {}),
  });

  return (
    <>
      <PageHeader useCaseId="INB-08" title="In tem batch" description="Tra cứu batch theo phiếu nhận, phiếu giao dịch hoặc mã batch và in nhãn kho." actions={<button className="button primary no-print" type="button" disabled={!query.data?.labels.length} onClick={() => window.print()}>In nhãn</button>} />
      <div className="filter-bar no-print">
        <label><span>Phiếu nhận</span><input type="number" min="1" value={receiptText} onChange={(event) => setReceiptText(event.target.value)} /></label>
        <label><span>Phiếu giao dịch</span><input type="number" min="1" value={transactionText} onChange={(event) => setTransactionText(event.target.value)} /></label>
        <label><span>Batch</span><input type="number" min="1" value={batchText} onChange={(event) => setBatchText(event.target.value)} /></label>
        <button className="button secondary" type="button" disabled={!receiptText && !transactionText && !batchText} onClick={load}>Tải nhãn</button>
      </div>
      {filter ? <QueryState isLoading={query.isLoading} error={query.error} isEmpty={query.data?.labels.length === 0} onRetry={() => void query.refetch()}>
        <div className="label-grid">
          {(query.data?.labels ?? []).map((label) => <article className="batch-label" key={label.batchId}>
            <header><strong>MMS · BATCH</strong><span>#{label.batchId}</span></header>
            <div className="barcode-value">*{label.barcodeValue}*</div>
            <h2>{label.materialName ?? label.materialId}</h2>
            <dl>
              <div><dt>Mã vật tư</dt><dd>{label.materialId ?? '—'}</dd></div>
              <div><dt>Số lượng</dt><dd>{formatQuantity(label.quantity)} {label.unit ?? ''}</dd></div>
              <div><dt>Phiếu nhận</dt><dd>#{label.receiptId}</dd></div>
              <div><dt>Phiếu giao dịch</dt><dd>#{label.transactionDocumentId}</dd></div>
              <div><dt>Kho</dt><dd>{label.warehouseCode ?? '—'}</dd></div>
              <div><dt>Ngày tạo</dt><dd>{formatDateTime(label.createdAt)}</dd></div>
            </dl>
          </article>)}
        </div>
      </QueryState> : <div className="state-panel">Nhập ít nhất một mã để tải nhãn.</div>}
    </>
  );
}

