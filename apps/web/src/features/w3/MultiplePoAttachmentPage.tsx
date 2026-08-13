import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatQuantity } from '../../shared/format';
import { w3Api } from './w3Api';

export function MultiplePoAttachmentPage() {
  const params = useParams();
  const [receiptText, setReceiptText] = useState(params.receiptId ?? '');
  const [search, setSearch] = useState('');
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const receiptId = Number(receiptText) > 0 ? Number(receiptText) : null;
  const query = useQuery({
    queryKey: ['INB-06', receiptId, search],
    queryFn: ({ signal }) => w3Api.getPurchaseOrderMatches(receiptId ?? 0, search, signal),
    enabled: receiptId !== null,
  });
  const mutation = useMutation({
    mutationFn: () => w3Api.attachMultiplePurchaseOrders(receiptId ?? 0, '2', (query.data?.lines ?? []).map((line) => ({
      receivingLineId: line.receivingLineId,
      purchaseOrderKey: mapping[line.receivingLineId] ?? '',
      receivedQuantity: line.receivedQuantity,
    }))),
  });

  return (
    <>
      <PageHeader useCaseId="INB-06" title="Cập nhật nhiều PO" description="Ánh xạ từng dòng nhận vào PO phù hợp; mọi PO phải cùng nhà cung cấp và có ít nhất hai PO khác nhau." />
      <div className="filter-bar">
        <label><span>Mã phiếu không PO</span><input type="number" min="1" value={receiptText} onChange={(event) => { setReceiptText(event.target.value); setMapping({}); }} /></label>
        <label><span>Lọc PO</span><input value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      </div>
      {receiptId ? <QueryState isLoading={query.isLoading} error={query.error} isEmpty={query.data?.lines.length === 0} onRetry={() => void query.refetch()}>
        <section className="form-card">
          <DataTable caption="Ánh xạ nhiều PO" rows={query.data?.lines ?? []} rowKey={(line) => String(line.receivingLineId)} columns={[
            { key: 'material', header: 'Vật tư', render: (line) => <><strong>{line.materialId}</strong><br /><small>{line.materialName ?? '—'}</small></> },
            { key: 'quantity', header: 'Thực nhận', align: 'right', render: (line) => `${formatQuantity(line.receivedQuantity)} ${line.unit ?? ''}` },
            { key: 'match', header: 'PO phù hợp', render: (line) => <select value={mapping[line.receivingLineId] ?? ''} onChange={(event) => setMapping((current) => ({ ...current, [line.receivingLineId]: event.target.value }))}><option value="">Chọn PO</option>{(query.data?.matches ?? []).filter((match) => match.receivingLineId === line.receivingLineId).map((match) => <option key={match.purchaseOrderKey} value={match.purchaseOrderKey}>{match.purchaseOrder} · còn {formatQuantity(match.remainingQuantity)}</option>)}</select> },
          ]} />
          <button className="button primary" type="button" disabled={mutation.isPending || (query.data?.lines ?? []).some((line) => !mapping[line.receivingLineId])} onClick={() => mutation.mutate()}>Xác nhận nhiều PO</button>
          {mutation.isSuccess ? <p className="action-success">Đã cập nhật {mutation.data.assignmentCount} dòng cho phiếu #{mutation.data.receiptId}.</p> : null}
          {mutation.error ? <p className="action-error">{mutation.error.message}</p> : null}
        </section>
      </QueryState> : <div className="state-panel">Nhập mã phiếu để tìm PO phù hợp.</div>}
    </>
  );
}

