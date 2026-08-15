import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { w3Api, type ReceivingLineInput } from './w3Api';

export function ReceiptEditorPage() {
  const params = useParams();
  const [receiptText, setReceiptText] = useState(params.receiptId ?? '');
  const receiptId = Number(receiptText) > 0 ? Number(receiptText) : null;
  const [warehouseCode, setWarehouseCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [purchaseOrder, setPurchaseOrder] = useState('');
  const [imageLink, setImageLink] = useState('');
  const [lines, setLines] = useState<ReceivingLineInput[]>([]);
  const query = useQuery({
    queryKey: ['INB-03', receiptId],
    queryFn: ({ signal }) => w3Api.getReceipt(receiptId ?? 0, signal),
    enabled: receiptId !== null,
  });

  useEffect(() => {
    if (!query.data?.header) return;
    setWarehouseCode(query.data.header.warehouseCode ?? '');
    setCustomerName(query.data.header.customerName ?? '');
    setPurchaseOrder(query.data.header.purchaseOrder ?? '');
    setLines(query.data.lines.map((line) => ({
      receivingLineId: line.receivingLineId,
      purchaseOrderKey: line.purchaseOrderKey,
      materialId: line.materialId ?? '',
      documentQuantity: line.documentQuantity,
      receivedQuantity: line.receivedQuantity,
      unit: line.unit,
      deliveryDate: line.deliveryDate?.slice(0, 10) ?? null,
    })));
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: (action: 'SAVE' | 'CONFIRM' | 'CANCEL') => w3Api.saveReceipt(receiptId ?? 0, {
      warehouseCode, customerName, purchaseOrder, action,
      expectedStatus: query.data?.header?.statusCode ?? '', lines,
      images: imageLink.trim() ? [{ category: '1', imageLink: imageLink.trim() }] : [],
    }),
    onSuccess: () => void query.refetch(),
  });

  return (
    <>
      <PageHeader useCaseId="INB-03" title="Tạo và chỉnh sửa phiếu nhận" description="Sửa phiếu nháp/chờ kiểm với kiểm soát trạng thái; phiếu đã QC hoặc phát sinh batch sẽ bị khóa." />
      <div className="filter-bar"><label><span>Mã phiếu nhận</span><input type="number" min="1" value={receiptText} onChange={(event) => setReceiptText(event.target.value)} /></label></div>
      {receiptId ? <QueryState isLoading={query.isLoading} error={query.error} isEmpty={!query.data?.header} onRetry={() => void query.refetch()}>
        {query.data?.header ? <section className="form-card">
          <h2>Phiếu #{query.data.header.receiptId} · trạng thái {query.data.header.statusCode}</h2>
          {!query.data.header.canEdit ? <p className="action-error">Phiếu này đã khóa nghiệp vụ và chỉ có thể xem.</p> : null}
          <div className="form-grid three-columns">
            <label><span>Kho</span><input disabled={!query.data.header.canEdit} value={warehouseCode} onChange={(event) => setWarehouseCode(event.target.value)} /></label>
            <label><span>Nhà cung cấp</span><input disabled={!query.data.header.canEdit} value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></label>
            <label><span>PO / loại phiếu</span><input disabled={!query.data.header.canEdit} value={purchaseOrder} onChange={(event) => setPurchaseOrder(event.target.value)} /></label>
          </div>
          <DataTable caption="Dòng nhận hàng" rows={lines} rowKey={(line) => String(line.receivingLineId ?? line.materialId)} columns={[
            { key: 'material', header: 'Mã vật tư', render: (line) => line.materialId },
            { key: 'document', header: 'SL chứng từ', render: (line) => <input disabled={!query.data.header?.canEdit} type="number" min="0" step="any" value={line.documentQuantity} onChange={(event) => setLines((current) => current.map((item) => item === line ? { ...item, documentQuantity: Number(event.target.value) } : item))} /> },
            { key: 'received', header: 'SL thực nhận', render: (line) => <input disabled={!query.data.header?.canEdit} type="number" min="0" step="any" value={line.receivedQuantity} onChange={(event) => setLines((current) => current.map((item) => item === line ? { ...item, receivedQuantity: Number(event.target.value) } : item))} /> },
            { key: 'unit', header: 'Đơn vị', render: (line) => line.unit ?? '—' },
            { key: 'remove', header: '', render: (line) => <button disabled={!query.data.header?.canEdit} className="link-button" type="button" onClick={() => setLines((current) => current.filter((item) => item !== line))}>Loại bỏ</button> },
          ]} />
          <label><span>Thêm liên kết ảnh</span><input disabled={!query.data.header.canEdit} value={imageLink} onChange={(event) => setImageLink(event.target.value)} /></label>
          <div className="form-actions">
            <button className="button secondary" type="button" disabled={!query.data.header.canEdit || mutation.isPending} onClick={() => mutation.mutate('SAVE')}>Lưu nháp</button>
            <button className="button primary" type="button" disabled={!query.data.header.canEdit || mutation.isPending} onClick={() => mutation.mutate('CONFIRM')}>Xác nhận</button>
            <button className="button danger-button" type="button" disabled={!query.data.header.canEdit || mutation.isPending} onClick={() => mutation.mutate('CANCEL')}>Hủy phiếu</button>
          </div>
          {mutation.isSuccess ? <p className="action-success">Đã cập nhật phiếu, trạng thái mới {mutation.data.statusCode}.</p> : null}
          {mutation.error ? <p className="action-error">{mutation.error.message}</p> : null}
        </section> : null}
      </QueryState> : <div className="state-panel">Nhập mã phiếu để mở hồ sơ.</div>}
    </>
  );
}

