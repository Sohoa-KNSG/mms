import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatDateTime, formatQuantity } from '../../shared/format';
import { w3Api } from './w3Api';

export function ReceiveWithPoPage() {
  const [search, setSearch] = useState('');
  const [purchaseOrder, setPurchaseOrder] = useState<string | null>(null);
  const [warehouseCode, setWarehouseCode] = useState('20020100');
  const [imageLink, setImageLink] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const query = useQuery({ queryKey: ['INB-01', search], queryFn: ({ signal }) => w3Api.getPurchaseOrders(search, signal) });
  const lines = useMemo(
    () => (query.data?.lines ?? []).filter((line) => line.purchaseOrder === purchaseOrder),
    [query.data?.lines, purchaseOrder],
  );
  const mutation = useMutation({
    mutationFn: () => w3Api.createReceiptWithPo({
      purchaseOrder: purchaseOrder ?? '',
      warehouseCode,
      lines: lines.filter((line) => (quantities[line.purchaseOrderKey] ?? 0) > 0 && line.materialId).map((line) => ({
        receivingLineId: null,
        purchaseOrderKey: line.purchaseOrderKey,
        materialId: line.materialId ?? '',
        documentQuantity: quantities[line.purchaseOrderKey] ?? 0,
        receivedQuantity: quantities[line.purchaseOrderKey] ?? 0,
        unit: line.unit,
        deliveryDate: line.deliveryDate?.slice(0, 10) ?? null,
      })),
      images: imageLink.trim() ? [{ category: '1', imageLink: imageLink.trim() }] : [],
    }),
  });

  return (
    <>
      <PageHeader useCaseId="INB-01" title="Nhận hàng theo PO" description="Chọn PO còn hiệu lực, khai báo số lượng thực nhận và tạo phiếu chờ kiểm trong một giao dịch." />
      <div className="filter-bar"><label><span>Tìm PO</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã PO, nhà cung cấp, vật tư" /></label></div>
      <QueryState isLoading={query.isLoading} error={query.error} isEmpty={query.data?.items.length === 0} onRetry={() => void query.refetch()}>
        <DataTable caption="PO còn số lượng" rows={query.data?.items ?? []} rowKey={(item) => item.purchaseOrder} columns={[
          { key: 'po', header: 'PO', render: (item) => <button className="link-button" type="button" onClick={() => setPurchaseOrder(item.purchaseOrder)}>{item.purchaseOrder}</button> },
          { key: 'customer', header: 'Nhà cung cấp', render: (item) => item.customerCode ?? '—' },
          { key: 'delivery', header: 'Ngày giao', render: (item) => formatDateTime(item.deliveryDate) },
          { key: 'remaining', header: 'Còn lại', align: 'right', render: (item) => formatQuantity(item.remainingQuantity) },
        ]} />
      </QueryState>
      {purchaseOrder ? <section className="form-card">
        <h2>PO {purchaseOrder}</h2>
        <div className="form-grid">
          <label><span>Kho nhận</span><input value={warehouseCode} onChange={(event) => setWarehouseCode(event.target.value)} /></label>
          <label><span>Liên kết ảnh phiếu (không bắt buộc)</span><input value={imageLink} onChange={(event) => setImageLink(event.target.value)} placeholder="https://..." /></label>
        </div>
        <DataTable caption="Dòng PO" rows={lines} rowKey={(line) => line.purchaseOrderKey} columns={[
          { key: 'material', header: 'Vật tư', render: (line) => <><strong>{line.materialId}</strong><br /><small>{line.materialName ?? '—'}</small></> },
          { key: 'remaining', header: 'Còn lại', align: 'right', render: (line) => `${formatQuantity(line.remainingQuantity)} ${line.unit ?? ''}` },
          { key: 'quantity', header: 'Thực nhận', render: (line) => <input aria-label={`Số lượng ${line.materialId ?? ''}`} type="number" min="0" max={line.remainingQuantity} step="any" value={quantities[line.purchaseOrderKey] ?? ''} onChange={(event) => setQuantities((current) => ({ ...current, [line.purchaseOrderKey]: Number(event.target.value) }))} /> },
        ]} />
        <div className="form-actions"><button className="button primary" type="button" disabled={mutation.isPending || !warehouseCode.trim()} onClick={() => mutation.mutate()}>Tạo phiếu nhận</button></div>
        {mutation.isSuccess ? <p className="action-success">Đã tạo phiếu nhận #{mutation.data.receiptId}, trạng thái {mutation.data.statusCode}.</p> : null}
        {mutation.error ? <p className="action-error">{mutation.error.message}</p> : null}
      </section> : null}
    </>
  );
}

