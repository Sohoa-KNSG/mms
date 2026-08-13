import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatDateTime, formatQuantity } from '../../shared/format';
import { w2Api } from './w2Api';

export function CreateInspectionPage() {
  const [search, setSearch] = useState('');
  const [receiptId, setReceiptId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const query = useQuery({
    queryKey: ['QC-03', search, receiptId],
    queryFn: ({ signal }) => w2Api.getInspectionCandidates(search, receiptId, signal),
  });
  const mutation = useMutation({ mutationFn: () => w2Api.createInspection(receiptId ?? 0, note || null) });

  return (
    <>
      <PageHeader useCaseId="QC-03" title="Lập phiếu kiểm" description="Chọn phiếu nhận còn vật tư cần QC và tạo hồ sơ kiểm duy nhất đang mở." />
      <div className="filter-bar"><label><span>Tìm phiếu nhận</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã phiếu, PO, khách hàng" /></label></div>
      <QueryState isLoading={query.isLoading} error={query.error} isEmpty={query.data?.items.length === 0} onRetry={() => void query.refetch()}>
        <DataTable caption="Phiếu nhận chờ QC" rows={query.data?.items ?? []} rowKey={(item) => String(item.receiptId)} columns={[
          { key: 'receipt', header: 'Phiếu nhận', render: (item) => <button className="link-button" type="button" onClick={() => setReceiptId(item.receiptId)}>#{item.receiptId}</button> },
          { key: 'po', header: 'PO', render: (item) => item.purchaseOrder ?? '—' },
          { key: 'customer', header: 'Khách hàng', render: (item) => item.customerName ?? '—' },
          { key: 'date', header: 'Ngày nhận', render: (item) => formatDateTime(item.receivedAt) },
          { key: 'count', header: 'Vật tư chờ kiểm', align: 'right', render: (item) => item.pendingMaterialCount },
        ]} />
      </QueryState>
      {receiptId ? <section className="form-card">
        <h2>Phiếu nhận #{receiptId}</h2>
        <DataTable caption="Vật tư cần kiểm" rows={query.data?.lines ?? []} rowKey={(line) => String(line.receivingLineId)} columns={[
          { key: 'material', header: 'Mã vật tư', render: (line) => line.materialId ?? '—' },
          { key: 'name', header: 'Tên vật tư', render: (line) => line.materialName ?? '—' },
          { key: 'quantity', header: 'Thực nhận', align: 'right', render: (line) => `${formatQuantity(line.quantityReceived)} ${line.unit ?? ''}` },
          { key: 'check', header: 'Mã kiểm', render: (line) => line.checkId ? `#${line.checkId}` : '—' },
          { key: 'group', header: 'Nhóm QC', render: (line) => line.qcGroupName ?? line.qcGroupCode ?? '—' },
        ]} />
        <label className="wide-field"><span>Ghi chú</span><textarea value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <button className="button primary" type="button" disabled={mutation.isPending} onClick={() => mutation.mutate()}>Tạo phiếu kiểm</button>
        {mutation.isSuccess ? <p className="action-success">Phiếu kiểm #{mutation.data.inspectionId} đã sẵn sàng. <Link to={`/quality/evaluation/${mutation.data.inspectionId}`}>Mở đánh giá</Link></p> : null}
        {mutation.error ? <p className="action-error">{mutation.error.message}</p> : null}
      </section> : null}
    </>
  );
}

