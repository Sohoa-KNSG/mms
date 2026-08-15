import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatDateTime, formatQuantity } from '../../shared/format';
import { w3Api } from './w3Api';

export function SinglePoAttachmentPage() {
  const [receiptSearch, setReceiptSearch] = useState('');
  const [poSearch, setPoSearch] = useState('');
  const [receiptId, setReceiptId] = useState<number | null>(null);
  const [purchaseOrder, setPurchaseOrder] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const receipts = useQuery({ queryKey: ['INB-05-receipts', receiptSearch], queryFn: ({ signal }) => w3Api.getUnmatchedReceipts(receiptSearch, signal) });
  const purchaseOrders = useQuery({ queryKey: ['INB-05-pos', poSearch], queryFn: ({ signal }) => w3Api.getPurchaseOrders(poSearch, signal) });
  const receiptLines = useMemo(() => (receipts.data?.lines ?? []).filter((line) => line.receiptId === receiptId), [receipts.data?.lines, receiptId]);
  const poLines = useMemo(() => (purchaseOrders.data?.lines ?? []).filter((line) => line.purchaseOrder === purchaseOrder), [purchaseOrders.data?.lines, purchaseOrder]);
  const mutation = useMutation({
    mutationFn: () => w3Api.attachPurchaseOrder(receiptId ?? 0, purchaseOrder ?? '', '2', receiptLines.map((line) => ({
      receivingLineId: line.receivingLineId,
      purchaseOrderKey: mapping[line.receivingLineId] ?? '',
      receivedQuantity: line.receivedQuantity,
    }))),
    onSuccess: () => void receipts.refetch(),
  });

  return (
    <>
      <PageHeader useCaseId="INB-05" title="Cập nhật một PO" description="Đối soát phiếu không PO với một PO; SP kiểm tra vật tư, đơn vị và số lượng còn lại trước khi gắn." />
      <div className="split-grid">
        <section>
          <div className="filter-bar"><label><span>Tìm phiếu không PO</span><input value={receiptSearch} onChange={(event) => setReceiptSearch(event.target.value)} /></label></div>
          <QueryState isLoading={receipts.isLoading} error={receipts.error} isEmpty={receipts.data?.items.length === 0} onRetry={() => void receipts.refetch()}>
            <DataTable caption="Phiếu không PO" rows={receipts.data?.items ?? []} rowKey={(item) => String(item.receiptId)} columns={[
              { key: 'receipt', header: 'Phiếu', render: (item) => <button className="link-button" type="button" onClick={() => { setReceiptId(item.receiptId); setMapping({}); }}>#{item.receiptId}</button> },
              { key: 'customer', header: 'Nhà cung cấp khai báo', render: (item) => item.customerName ?? '—' },
              { key: 'date', header: 'Ngày tạo', render: (item) => formatDateTime(item.createdAt) },
            ]} />
          </QueryState>
        </section>
        <section>
          <div className="filter-bar"><label><span>Tìm PO</span><input value={poSearch} onChange={(event) => setPoSearch(event.target.value)} /></label></div>
          <QueryState isLoading={purchaseOrders.isLoading} error={purchaseOrders.error} isEmpty={purchaseOrders.data?.items.length === 0} onRetry={() => void purchaseOrders.refetch()}>
            <DataTable caption="PO" rows={purchaseOrders.data?.items ?? []} rowKey={(item) => item.purchaseOrder} columns={[
              { key: 'po', header: 'PO', render: (item) => <button className="link-button" type="button" onClick={() => { setPurchaseOrder(item.purchaseOrder); setMapping({}); }}>{item.purchaseOrder}</button> },
              { key: 'customer', header: 'Nhà cung cấp', render: (item) => item.customerCode ?? '—' },
              { key: 'remaining', header: 'Còn lại', align: 'right', render: (item) => formatQuantity(item.remainingQuantity) },
            ]} />
          </QueryState>
        </section>
      </div>
      {receiptId && purchaseOrder ? <section className="form-card">
        <h2>Ánh xạ phiếu #{receiptId} vào PO {purchaseOrder}</h2>
        <DataTable caption="Ánh xạ dòng" rows={receiptLines} rowKey={(line) => String(line.receivingLineId)} columns={[
          { key: 'material', header: 'Vật tư nhận', render: (line) => `${line.materialId ?? '—'} · ${line.materialName ?? ''}` },
          { key: 'quantity', header: 'Thực nhận', align: 'right', render: (line) => `${formatQuantity(line.receivedQuantity)} ${line.unit ?? ''}` },
          { key: 'mapping', header: 'Dòng PO', render: (line) => <select value={mapping[line.receivingLineId] ?? ''} onChange={(event) => setMapping((current) => ({ ...current, [line.receivingLineId]: event.target.value }))}><option value="">Chọn dòng PO</option>{poLines.filter((candidate) => candidate.materialId === line.materialId && candidate.remainingQuantity >= line.receivedQuantity).map((candidate) => <option key={candidate.purchaseOrderKey} value={candidate.purchaseOrderKey}>{candidate.materialId} · còn {formatQuantity(candidate.remainingQuantity)}</option>)}</select> },
        ]} />
        <button className="button primary" type="button" disabled={mutation.isPending || receiptLines.some((line) => !mapping[line.receivingLineId])} onClick={() => mutation.mutate()}>Gắn PO</button>
        {mutation.isSuccess ? <p className="action-success">Đã cập nhật phiếu #{mutation.data.receiptId}.</p> : null}
        {mutation.error ? <p className="action-error">{mutation.error.message}</p> : null}
      </section> : null}
    </>
  );
}

