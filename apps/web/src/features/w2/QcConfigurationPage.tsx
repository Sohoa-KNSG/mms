import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import type { QcCriterionInput } from './w2Api';
import { w2Api } from './w2Api';

const emptyCriterion = (): QcCriterionInput => ({
  criterionId: null,
  criterionCode: '',
  criterionName: '',
  specification: null,
  sampleImage: null,
});

export function QcConfigurationPage() {
  const queryClient = useQueryClient();
  const [selectedCheckId, setSelectedCheckId] = useState<number | null>(null);
  const [groupCode, setGroupCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [level, setLevel] = useState(2);
  const [materialGroupCode, setMaterialGroupCode] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [criteria, setCriteria] = useState<QcCriterionInput[]>([emptyCriterion()]);
  const [expectedChangedAt, setExpectedChangedAt] = useState<string | null>(null);
  const query = useQuery({ queryKey: ['QC-01'], queryFn: ({ signal }) => w2Api.getQcConfiguration(null, signal) });

  useEffect(() => {
    if (selectedCheckId === null) return;
    const check = query.data?.checks.find((item) => item.checkId === selectedCheckId);
    if (!check) return;
    setGroupCode(check.qcGroupCode ?? ''); setGroupName(check.qcGroupName ?? '');
    setLevel(check.declarationLevel ?? 2); setMaterialGroupCode(check.materialGroupCode ?? '');
    setMaterialId(check.materialId ?? ''); setExpectedChangedAt(check.changedAt);
    const selectedCriteria = (query.data?.criteria ?? []).filter((item) => item.checkId === selectedCheckId).map((item) => ({
      criterionId: item.criterionId,
      criterionCode: item.criterionCode ?? '',
      criterionName: item.criterionName ?? '',
      specification: item.specification,
      sampleImage: item.sampleImage,
    }));
    setCriteria(selectedCriteria.length > 0 ? selectedCriteria : [emptyCriterion()]);
  }, [query.data, selectedCheckId]);

  const saveMutation = useMutation({
    mutationFn: () => w2Api.saveQcConfiguration({
      checkId: selectedCheckId,
      qcGroupCode: groupCode,
      qcGroupName: groupName,
      declarationLevel: level,
      materialGroupCode: level === 2 ? materialGroupCode : null,
      materialId: level === 3 ? materialId : null,
      expectedChangedAt,
      criteria: criteria.map((item) => ({ ...item, specification: item.specification || null, sampleImage: item.sampleImage || null })),
    }),
    onSuccess: async (result) => {
      setSelectedCheckId(result.checkId);
      await queryClient.invalidateQueries({ queryKey: ['QC-01'] });
    },
  });

  const updateCriterion = (index: number, field: keyof QcCriterionInput, value: string) => setCriteria((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));

  return (
    <>
      <PageHeader useCaseId="QC-01" title="Nhóm và tiêu chí QC" description="Khai báo cấu hình cấp nhóm vật tư hoặc cấp vật tư, đồng thời đồng bộ cờ kiểm tra đầu vào." />
      <section className="form-card">
        <div className="form-grid three-columns">
          <label><span>Cấu hình</span><select value={selectedCheckId ?? ''} onChange={(event) => setSelectedCheckId(event.target.value ? Number(event.target.value) : null)}><option value="">Tạo mới</option>{query.data?.checks.map((check) => <option key={check.checkId} value={check.checkId}>#{check.checkId} — {check.qcGroupName ?? check.qcGroupCode}</option>)}</select></label>
          <label><span>Mã nhóm QC</span><input value={groupCode} onChange={(event) => setGroupCode(event.target.value)} /></label>
          <label><span>Tên nhóm QC</span><input value={groupName} onChange={(event) => setGroupName(event.target.value)} /></label>
          <label><span>Cấp khai báo</span><select value={level} onChange={(event) => setLevel(Number(event.target.value))}><option value={2}>2 — Nhóm vật tư</option><option value={3}>3 — Vật tư</option></select></label>
          {level === 2 ? <label><span>Mã nhóm vật tư</span><input value={materialGroupCode} onChange={(event) => setMaterialGroupCode(event.target.value)} /></label> : <label><span>Mã vật tư</span><input value={materialId} onChange={(event) => setMaterialId(event.target.value)} /></label>}
        </div>
        <h2>Tiêu chí kiểm</h2>
        <div className="criteria-editor">
          {criteria.map((criterion, index) => (
            <div className="criteria-row" key={criterion.criterionId ?? `new-${index}`}>
              <input aria-label="Mã tiêu chí" placeholder="Mã tiêu chí" value={criterion.criterionCode} onChange={(event) => updateCriterion(index, 'criterionCode', event.target.value)} />
              <input aria-label="Tên tiêu chí" placeholder="Tên tiêu chí" value={criterion.criterionName} onChange={(event) => updateCriterion(index, 'criterionName', event.target.value)} />
              <input aria-label="Thông số" placeholder="Thông số" value={criterion.specification ?? ''} onChange={(event) => updateCriterion(index, 'specification', event.target.value)} />
              <button className="button secondary" type="button" disabled={criteria.length === 1} onClick={() => setCriteria((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Bỏ</button>
            </div>
          ))}
        </div>
        <div className="form-actions"><button className="button secondary" type="button" onClick={() => setCriteria((current) => [...current, emptyCriterion()])}>Thêm tiêu chí</button><button className="button primary" type="button" disabled={!groupCode.trim() || !groupName.trim() || saveMutation.isPending} onClick={() => saveMutation.mutate()}>Lưu cấu hình</button></div>
        {saveMutation.isSuccess ? <p className="action-success">Đã lưu mã kiểm #{saveMutation.data.checkId}.</p> : null}
        {saveMutation.error ? <p className="action-error">{saveMutation.error.message}</p> : null}
      </section>
      <QueryState isLoading={query.isLoading} error={query.error} onRetry={() => void query.refetch()}><p className="helper-text">Có {query.data?.checks.length ?? 0} cấu hình và {query.data?.criteria.length ?? 0} tiêu chí.</p></QueryState>
    </>
  );
}

