import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatQuantity } from '../../shared/format';
import type { EvaluateMaterialRequest } from './w2Api';
import { w2Api } from './w2Api';

type CriterionResult = EvaluateMaterialRequest['results'][number];

export function EvaluateMaterialPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const [inspectionInput, setInspectionInput] = useState(params.inspectionId ?? '');
  const inspectionId = Number(inspectionInput) > 0 ? Number(inspectionInput) : null;
  const [receivingLineId, setReceivingLineId] = useState<number | null>(null);
  const [inspectionType, setInspectionType] = useState<'AQL' | '100%'>('AQL');
  const [inspectedQuantity, setInspectedQuantity] = useState('');
  const [failedQuantity, setFailedQuantity] = useState('0');
  const [overallResultCode, setOverallResultCode] = useState<'1' | '2' | '3'>('1');
  const [results, setResults] = useState<Record<number, CriterionResult>>({});
  const query = useQuery({
    queryKey: ['QC-04', inspectionId, receivingLineId],
    queryFn: ({ signal }) => w2Api.getEvaluation(inspectionId ?? 0, receivingLineId, signal),
    enabled: inspectionId !== null,
  });
  const selectedMaterial = useMemo(() => query.data?.materials.find((item) => item.receivingLineId === receivingLineId), [query.data, receivingLineId]);
  const selectedCriteria = useMemo(() => query.data?.criteria.filter((item) => item.receivingLineId === receivingLineId) ?? [], [query.data, receivingLineId]);

  useEffect(() => {
    if (!selectedMaterial) return;
    setInspectedQuantity(String(selectedMaterial.quantityReceived));
    setResults(Object.fromEntries(selectedCriteria.map((criterion) => [criterion.criterionId, {
      criterionId: criterion.criterionId,
      resultCode: (criterion.resultCode === 'Không Đạt' || criterion.resultCode === 'Không Kiểm' ? criterion.resultCode : 'Đạt'),
      defectNote: criterion.defectNote,
    }])));
  }, [selectedCriteria, selectedMaterial]);

  const mutation = useMutation({
    mutationFn: () => w2Api.evaluateMaterial(inspectionId ?? 0, {
      receivingLineId: receivingLineId ?? 0,
      inspectionType,
      inspectedQuantity: Number(inspectedQuantity),
      failedQuantity: Number(failedQuantity),
      overallResultCode,
      results: selectedCriteria.map((criterion) => results[criterion.criterionId] ?? { criterionId: criterion.criterionId, resultCode: 'Đạt', defectNote: null }),
    }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['QC-04', inspectionId] }),
  });

  return (
    <>
      <PageHeader useCaseId="QC-04" title="Đánh giá vật tư" description="Kết luận và từng tiêu chí được kiểm tra tính nhất quán trong một transaction SQL." />
      <section className="form-card"><label><span>Mã phiếu kiểm</span><input type="number" min={1} value={inspectionInput} onChange={(event) => { setInspectionInput(event.target.value); setReceivingLineId(null); }} /></label></section>
      <QueryState isLoading={query.isLoading} error={query.error} isEmpty={inspectionId !== null && query.data?.materials.length === 0} onRetry={() => void query.refetch()}>
        {query.data?.inspection ? <div className="summary-strip"><div><span>Phiếu nhận</span><strong>#{query.data.inspection.receiptId}</strong></div><div><span>PO</span><strong>{query.data.inspection.purchaseOrder ?? '—'}</strong></div><div><span>Khách hàng</span><strong>{query.data.inspection.customerName ?? '—'}</strong></div></div> : null}
        <div className="card-grid">{query.data?.materials.map((material) => <button className={`selection-card ${receivingLineId === material.receivingLineId ? 'selected' : ''}`} type="button" key={material.receivingLineId} onClick={() => setReceivingLineId(material.receivingLineId)}><strong>{material.materialId}</strong><span>{material.materialName}</span><small>{formatQuantity(material.quantityReceived)} {material.unit}</small><span>{material.overallResultCode ? `Đã kết luận: ${material.overallResultCode}` : 'Chờ đánh giá'}</span></button>)}</div>
      </QueryState>
      {selectedMaterial ? <section className="form-card">
        <div className="form-grid four-columns">
          <label><span>Loại kiểm</span><select value={inspectionType} onChange={(event) => setInspectionType(event.target.value as 'AQL' | '100%')}><option>AQL</option><option>100%</option></select></label>
          <label><span>Số lượng kiểm</span><input type="number" min={0} step="any" value={inspectedQuantity} onChange={(event) => setInspectedQuantity(event.target.value)} /></label>
          <label><span>Số lượng không đạt</span><input type="number" min={0} step="any" value={failedQuantity} onChange={(event) => setFailedQuantity(event.target.value)} /></label>
          <label><span>Kết luận</span><select value={overallResultCode} onChange={(event) => setOverallResultCode(event.target.value as '1' | '2' | '3')}><option value="1">Đạt</option><option value="2">Không đạt</option><option value="3">Nhân nhượng</option></select></label>
        </div>
        <div className="criteria-editor">{selectedCriteria.map((criterion) => <div className="criteria-evaluation-row" key={criterion.criterionId}><div><strong>{criterion.criterionCode}</strong><span>{criterion.criterionName}</span><small>{criterion.specification}</small></div><select value={results[criterion.criterionId]?.resultCode ?? 'Đạt'} onChange={(event) => setResults((current) => ({ ...current, [criterion.criterionId]: { criterionId: criterion.criterionId, resultCode: event.target.value as CriterionResult['resultCode'], defectNote: current[criterion.criterionId]?.defectNote ?? null } }))}><option>Đạt</option><option>Không Đạt</option><option>Không Kiểm</option></select><input placeholder="Ghi nhận lỗi" value={results[criterion.criterionId]?.defectNote ?? ''} onChange={(event) => setResults((current) => ({ ...current, [criterion.criterionId]: { criterionId: criterion.criterionId, resultCode: current[criterion.criterionId]?.resultCode ?? 'Đạt', defectNote: event.target.value || null } }))} /></div>)}</div>
        <button className="button primary" type="button" disabled={selectedCriteria.length === 0 || mutation.isPending} onClick={() => mutation.mutate()}>Lưu đánh giá</button>
        {mutation.isSuccess ? <p className="action-success">Đã lưu {mutation.data.resultCount} kết quả tiêu chí.</p> : null}
        {mutation.error ? <p className="action-error">{mutation.error.message}</p> : null}
      </section> : null}
    </>
  );
}

