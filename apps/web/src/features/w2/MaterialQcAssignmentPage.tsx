import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { w2Api } from './w2Api';

export function MaterialQcAssignmentPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<'MATERIAL' | 'MATERIAL_GROUP'>('MATERIAL');
  const [targetCode, setTargetCode] = useState('');
  const [checkId, setCheckId] = useState<number | null>(null);
  const [expectedCheckId, setExpectedCheckId] = useState<number | null>(null);
  const query = useQuery({ queryKey: ['QC-02', search], queryFn: ({ signal }) => w2Api.getMaterialAssignments(search, signal) });
  const mutation = useMutation({
    mutationFn: () => w2Api.assignMaterialCheck({ scope, targetCode, checkId, expectedCheckId: scope === 'MATERIAL' ? expectedCheckId : null }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['QC-02'] }),
  });

  return (
    <>
      <PageHeader useCaseId="QC-02" title="Gán cấu hình QC" description="Gán mã kiểm theo vật tư hoặc nhóm; các override cấp vật tư được giữ ưu tiên." />
      <section className="form-card">
        <div className="form-grid three-columns">
          <label><span>Phạm vi</span><select value={scope} onChange={(event) => { setScope(event.target.value as 'MATERIAL' | 'MATERIAL_GROUP'); setExpectedCheckId(null); }}><option value="MATERIAL">Vật tư</option><option value="MATERIAL_GROUP">Nhóm vật tư</option></select></label>
          <label><span>Mã đối tượng</span><input value={targetCode} onChange={(event) => setTargetCode(event.target.value)} /></label>
          <label><span>Mã kiểm</span><select value={checkId ?? ''} onChange={(event) => setCheckId(event.target.value ? Number(event.target.value) : null)}><option value="">Không kiểm</option>{query.data?.checks.map((check) => <option key={check.checkId} value={check.checkId}>#{check.checkId} — {check.qcGroupName ?? check.qcGroupCode}</option>)}</select></label>
        </div>
        <button className="button primary" type="button" disabled={!targetCode.trim() || mutation.isPending} onClick={() => mutation.mutate()}>Áp dụng</button>
        {mutation.isSuccess ? <p className="action-success">Đã cập nhật {mutation.data.affectedMaterialCount} vật tư.</p> : null}
        {mutation.error ? <p className="action-error">{mutation.error.message}</p> : null}
      </section>
      <div className="filter-bar"><label><span>Tìm vật tư</span><input value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
      <QueryState isLoading={query.isLoading} error={query.error} isEmpty={query.data?.items.length === 0} onRetry={() => void query.refetch()}>
        <DataTable caption="Ánh xạ QC vật tư" rows={query.data?.items ?? []} rowKey={(item) => item.materialId} columns={[
          { key: 'material', header: 'Mã vật tư', render: (item) => <button className="link-button" type="button" onClick={() => { setScope('MATERIAL'); setTargetCode(item.materialId); setCheckId(item.checkId); setExpectedCheckId(item.checkId); }}>{item.materialId}</button> },
          { key: 'name', header: 'Tên vật tư', render: (item) => item.materialName ?? '—' },
          { key: 'group', header: 'Nhóm vật tư', render: (item) => item.materialGroupCode ?? '—' },
          { key: 'check', header: 'Mã kiểm', render: (item) => item.checkId ? `#${item.checkId}` : 'Không kiểm' },
          { key: 'qc', header: 'Nhóm QC', render: (item) => item.qcGroupName ?? item.qcGroupCode ?? '—' },
        ]} />
      </QueryState>
    </>
  );
}

