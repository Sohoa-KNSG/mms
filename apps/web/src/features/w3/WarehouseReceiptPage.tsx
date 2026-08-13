import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatDateTime, formatQuantity } from '../../shared/format';
import { w3Api } from './w3Api';

export function WarehouseReceiptPage() {
  const [search, setSearch] = useState('');
  const [receiptId, setReceiptId] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const query = useQuery({ queryKey: ['INB-07', search, receiptId], queryFn: ({ signal }) => w3Api.getWarehouseQueue(search, receiptId, signal) });
  const lines = useMemo(() => (query.data?.lines ?? []).filter((line) => line.receiptId === receiptId), [query.data?.lines, receiptId]);
  const mutation = useMutation({
    mutationFn: () => w3Api.processWarehouseReceipt(receiptId ?? 0, '4', lines
      .map((line) => ({ receivingLineId: line.receivingLineId, quantity: quantities[line.receivingLineId] ?? line.remainingQuantity }))
      .filter((line) => line.quantity > 0)),
    onSuccess: () => void query.refetch(),
  });

  return (
    <>
      <PageHeader useCaseId="INB-07" title="Thủ tục nhập kho" description="Tạo phiếu giao dịch, batch và movement trong một transaction; phiếu chỉ được đóng khi toàn bộ số lượng đã nhập." />
      <div className="filter-bar"><label><span>Tìm phiếu đã kiểm</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã phiếu, PO, nhà cung cấp" /></label></div>
      <QueryState isLoading={query.isLoading} error={query.error} isEmpty={query.data?.items.length === 0} onRetry={() => void query.refetch()}>
        <DataTable caption="Phiếu chờ nhập kho" rows={query.data?.items ?? []} rowKey={(item) => String(item.receiptId)} columns={[
          { key: 'receipt', header: 'Phiếu', render: (item) => <button className="link-button" type="button" onClick={() => { setReceiptId(item.receiptId); setQuantities({}); }}>#{item.receiptId}</button> },
          { key: 'po', header: 'PO', render: (item) => item.purchaseOrder ?? '—' },
          { key: 'customer', header: 'Nhà cung cấp', render: (item) => item.customerName ?? '—' },
          { key: 'date', header: 'Ngày nhận', render: (item) => formatDateTime(item.receivedAt) },
          { key: 'count', header: 'Dòng còn lại', align: 'right', render: (item) => item.pendingLineCount },
        ]} />
      </QueryState>
      {receiptId ? <section className="form-card">
        <h2>Phiếu #{receiptId}</h2>
        <DataTable caption="Số lượng nhập kho" rows={lines} rowKey={(line) => String(line.receivingLineId)} columns={[
          { key: 'material', header: 'Vật tư', render: (line) => <><strong>{line.materialId}</strong><br /><small>{line.materialName ?? '—'}</small></> },
          { key: 'received', header: 'Thực nhận', align: 'right', render: (line) => formatQuantity(line.receivedQuantity) },
          { key: 'batched', header: 'Đã tạo batch', align: 'right', render: (line) => formatQuantity(line.batchedQuantity) },
          { key: 'quantity', header: 'Nhập lần này', render: (line) => <input type="number" min="0" max={line.remainingQuantity} step="any" value={quantities[line.receivingLineId] ?? line.remainingQuantity} onChange={(event) => setQuantities((current) => ({ ...current, [line.receivingLineId]: Number(event.target.value) }))} /> },
          { key: 'unit', header: 'Đơn vị', render: (line) => line.unit ?? '—' },
        ]} />
        <button className="button primary" type="button" disabled={mutation.isPending || lines.length === 0} onClick={() => mutation.mutate()}>Nhập kho</button>
        {mutation.isSuccess ? <p className="action-success">Đã tạo phiếu giao dịch #{mutation.data.transactionDocumentId} và {mutation.data.batchCount} batch. <Link to={`/receiving/batch-labels?transactionDocumentId=${mutation.data.transactionDocumentId}`}>In tem batch</Link></p> : null}
        {mutation.error ? <p className="action-error">{mutation.error.message}</p> : null}
      </section> : null}
    </>
  );
}

