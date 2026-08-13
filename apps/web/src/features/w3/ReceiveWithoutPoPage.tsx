import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { w3Api } from './w3Api';

interface SelectedMaterial { materialId: string; materialName: string | null; unit: string | null; quantity: number }

export function ReceiveWithoutPoPage() {
  const [search, setSearch] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [warehouseCode, setWarehouseCode] = useState('20020100');
  const [imageLink, setImageLink] = useState('');
  const [selected, setSelected] = useState<Record<string, SelectedMaterial>>({});
  const query = useQuery({ queryKey: ['INB-02', search], queryFn: ({ signal }) => w3Api.getMaterials(search, signal) });
  const mutation = useMutation({
    mutationFn: () => w3Api.createReceiptWithoutPo({
      supplierName,
      warehouseCode,
      lines: Object.values(selected).filter((item) => item.quantity > 0).map((item) => ({
        receivingLineId: null, purchaseOrderKey: null, materialId: item.materialId,
        documentQuantity: item.quantity, receivedQuantity: item.quantity, unit: item.unit, deliveryDate: null,
      })),
      images: imageLink.trim() ? [{ category: '1', imageLink: imageLink.trim() }] : [],
    }),
  });

  return (
    <>
      <PageHeader useCaseId="INB-02" title="Nhận hàng không PO" description="Ghi nhận nhà cung cấp, vật tư và số lượng; phiếu có thể được gắn PO ở bước đối soát sau." />
      <section className="form-card">
        <div className="form-grid three-columns">
          <label><span>Nhà cung cấp</span><input value={supplierName} onChange={(event) => setSupplierName(event.target.value)} /></label>
          <label><span>Kho nhận</span><input value={warehouseCode} onChange={(event) => setWarehouseCode(event.target.value)} /></label>
          <label><span>Liên kết ảnh phiếu</span><input value={imageLink} onChange={(event) => setImageLink(event.target.value)} placeholder="https://..." /></label>
        </div>
      </section>
      <div className="filter-bar"><label><span>Tìm vật tư</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã hoặc tên vật tư" /></label></div>
      <QueryState isLoading={query.isLoading} error={query.error} isEmpty={query.data?.items.length === 0} onRetry={() => void query.refetch()}>
        <DataTable caption="Danh mục vật tư" rows={query.data?.items ?? []} rowKey={(item) => item.materialId} columns={[
          { key: 'material', header: 'Mã vật tư', render: (item) => item.materialId },
          { key: 'name', header: 'Tên vật tư', render: (item) => item.materialName ?? '—' },
          { key: 'unit', header: 'Đơn vị', render: (item) => item.unit ?? '—' },
          { key: 'select', header: 'Chọn', render: (item) => <button className="button secondary" type="button" onClick={() => setSelected((current) => current[item.materialId] ? Object.fromEntries(Object.entries(current).filter(([key]) => key !== item.materialId)) : { ...current, [item.materialId]: { materialId: item.materialId, materialName: item.materialName, unit: item.unit, quantity: 1 } })}>{selected[item.materialId] ? 'Bỏ chọn' : 'Chọn'}</button> },
        ]} />
      </QueryState>
      {Object.values(selected).length > 0 ? <section className="form-card">
        <h2>Vật tư thực nhận</h2>
        <DataTable caption="Vật tư đã chọn" rows={Object.values(selected)} rowKey={(item) => item.materialId} columns={[
          { key: 'material', header: 'Vật tư', render: (item) => <><strong>{item.materialId}</strong><br /><small>{item.materialName ?? '—'}</small></> },
          { key: 'unit', header: 'Đơn vị', render: (item) => item.unit ?? '—' },
          { key: 'quantity', header: 'Số lượng', render: (item) => <input aria-label={`Số lượng ${item.materialId}`} type="number" min="0" step="any" value={item.quantity} onChange={(event) => setSelected((current) => ({ ...current, [item.materialId]: { ...item, quantity: Number(event.target.value) } }))} /> },
        ]} />
        <button className="button primary" type="button" disabled={mutation.isPending || !supplierName.trim() || !warehouseCode.trim()} onClick={() => mutation.mutate()}>Tạo phiếu không PO</button>
        {mutation.isSuccess ? <p className="action-success">Đã tạo phiếu #{mutation.data.receiptId}.</p> : null}
        {mutation.error ? <p className="action-error">{mutation.error.message}</p> : null}
      </section> : null}
    </>
  );
}

