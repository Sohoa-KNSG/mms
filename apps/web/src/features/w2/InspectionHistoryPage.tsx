import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatDateTime, formatQuantity } from '../../shared/format';
import type { InspectionHistory } from './contracts';
import { w2Api } from './w2Api';

type Detail = InspectionHistory['details'][number];

export function InspectionHistoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [inspectionId, setInspectionId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Detail | null>(null);
  const [inspectionType, setInspectionType] = useState<'AQL' | '100%'>('AQL');
  const [inspectedQuantity, setInspectedQuantity] = useState('');
  const [failedQuantity, setFailedQuantity] = useState('');
  const [resultCode, setResultCode] = useState<'Đạt' | 'Không Đạt' | 'Không Kiểm'>('Đạt');
  const [overallResultCode, setOverallResultCode] = useState<'1' | '2' | '3'>('1');
  const [defectNote, setDefectNote] = useState('');
  const query = useQuery({ queryKey: ['QC-05', search, inspectionId], queryFn: ({ signal }) => w2Api.getInspectionHistory(search, inspectionId, signal) });

  useEffect(() => {
    if (!selectedDetail) return;
    setInspectionType(selectedDetail.inspectionType === '100%' ? '100%' : 'AQL');
    setInspectedQuantity(String(selectedDetail.inspectedQuantity ?? 0));
    setFailedQuantity(String(selectedDetail.failedQuantity ?? 0));
    setResultCode(selectedDetail.resultCode === 'Không Đạt' || selectedDetail.resultCode === 'Không Kiểm' ? selectedDetail.resultCode : 'Đạt');
    setOverallResultCode(selectedDetail.overallResultCode === '2' || selectedDetail.overallResultCode === '3' ? selectedDetail.overallResultCode : '1');
    setDefectNote(selectedDetail.defectNote ?? '');
  }, [selectedDetail]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!selectedDetail?.changedAt) throw new Error('Thiếu phiên bản dữ liệu để hiệu chỉnh.');
      return w2Api.updateInspectionResult(selectedDetail.qcResultId, {
        inspectionType,
        inspectedQuantity: Number(inspectedQuantity),
        failedQuantity: Number(failedQuantity),
        resultCode,
        overallResultCode,
        defectNote: defectNote || null,
        expectedChangedAt: selectedDetail.changedAt,
      });
    },
    onSuccess: async () => {
      setSelectedDetail(null);
      await queryClient.invalidateQueries({ queryKey: ['QC-05'] });
    },
  });

  return (
    <>
      <PageHeader useCaseId="QC-05" title="Lịch sử QC" description="Tra cứu kết quả; chỉ hiệu chỉnh phiếu chưa khóa và có kiểm tra concurrency." />
      <div className="filter-bar"><label><span>Tìm phiếu kiểm</span><input value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
      <QueryState isLoading={query.isLoading} error={query.error} isEmpty={query.data?.items.length === 0} onRetry={() => void query.refetch()}>
        <DataTable caption="Lịch sử phiếu QC" rows={query.data?.items ?? []} rowKey={(item) => String(item.inspectionId)} columns={[
          { key: 'id', header: 'Phiếu kiểm', render: (item) => <button className="link-button" type="button" onClick={() => { setInspectionId(item.inspectionId); setSelectedDetail(null); }}>#{item.inspectionId}</button> },
          { key: 'receipt', header: 'Phiếu nhận', render: (item) => item.receiptId ? `#${item.receiptId}` : '—' },
          { key: 'po', header: 'PO', render: (item) => item.purchaseOrder ?? '—' },
          { key: 'customer', header: 'Khách hàng', render: (item) => item.customerName ?? '—' },
          { key: 'count', header: 'Vật tư / kết quả', render: (item) => `${item.evaluatedMaterialCount} / ${item.resultRowCount}` },
          { key: 'created', header: 'Ngày tạo', render: (item) => formatDateTime(item.createdAt) },
          { key: 'print', header: 'In', render: (item) => <Link to={`/quality/print/${item.inspectionId}`}>Mở phiếu</Link> },
        ]} />
      </QueryState>
      {inspectionId ? <section className="form-card"><h2>Chi tiết phiếu #{inspectionId}</h2><DataTable caption="Kết quả tiêu chí" rows={query.data?.details ?? []} rowKey={(item) => String(item.qcResultId)} columns={[
        { key: 'material', header: 'Vật tư', render: (item) => item.materialId ?? item.materialName ?? '—' },
        { key: 'criterion', header: 'Tiêu chí', render: (item) => item.criterionName ?? item.criterionCode ?? '—' },
        { key: 'quantity', header: 'Kiểm / lỗi', render: (item) => `${formatQuantity(item.inspectedQuantity ?? 0)} / ${formatQuantity(item.failedQuantity ?? 0)}` },
        { key: 'result', header: 'Kết quả', render: (item) => item.resultCode ?? '—' },
        { key: 'action', header: 'Thao tác', render: (item) => <button className="link-button" type="button" disabled={item.isLocked} onClick={() => setSelectedDetail(item)}>{item.isLocked ? 'Đã khóa' : 'Hiệu chỉnh'}</button> },
      ]} /></section> : null}
      {selectedDetail ? <section className="form-card"><h2>Hiệu chỉnh kết quả #{selectedDetail.qcResultId}</h2><div className="form-grid three-columns">
        <label><span>Loại kiểm</span><select value={inspectionType} onChange={(event) => setInspectionType(event.target.value as 'AQL' | '100%')}><option>AQL</option><option>100%</option></select></label>
        <label><span>Số lượng kiểm</span><input type="number" value={inspectedQuantity} onChange={(event) => setInspectedQuantity(event.target.value)} /></label>
        <label><span>Số lượng không đạt</span><input type="number" value={failedQuantity} onChange={(event) => setFailedQuantity(event.target.value)} /></label>
        <label><span>Kết quả tiêu chí</span><select value={resultCode} onChange={(event) => setResultCode(event.target.value as typeof resultCode)}><option>Đạt</option><option>Không Đạt</option><option>Không Kiểm</option></select></label>
        <label><span>Kết luận vật tư</span><select value={overallResultCode} onChange={(event) => setOverallResultCode(event.target.value as typeof overallResultCode)}><option value="1">Đạt</option><option value="2">Không đạt</option><option value="3">Nhân nhượng</option></select></label>
        <label><span>Ghi nhận lỗi</span><input value={defectNote} onChange={(event) => setDefectNote(event.target.value)} /></label>
      </div><button className="button primary" type="button" disabled={mutation.isPending} onClick={() => mutation.mutate()}>Lưu hiệu chỉnh</button>{mutation.error ? <p className="action-error">{mutation.error.message}</p> : null}</section> : null}
    </>
  );
}

