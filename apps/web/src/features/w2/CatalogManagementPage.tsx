import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { w2Api } from './w2Api';

const catalogs = [
  ['MATERIAL_GROUP', 'Nhóm vật tư'],
  ['RECEIPT_STATUS', 'Trạng thái nhận hàng'],
  ['WAREHOUSE_OPERATION', 'Nghiệp vụ kho'],
  ['INVENTORY_STATUS', 'Trạng thái tồn'],
  ['BATCH_EVENT', 'Sự kiện batch'],
  ['LOCATION_EVENT', 'Sự kiện vị trí'],
] as const;

export function CatalogManagementPage() {
  const queryClient = useQueryClient();
  const [catalogCode, setCatalogCode] = useState<string>('MATERIAL_GROUP');
  const [keyCode, setKeyCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logicValue, setLogicValue] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const [expectedChangedAt, setExpectedChangedAt] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ['ADM-02', catalogCode],
    queryFn: ({ signal }) => w2Api.getCatalog(catalogCode, signal),
  });

  useEffect(() => {
    setKeyCode(''); setName(''); setDescription(''); setLogicValue(''); setDisplayValue(''); setExpectedChangedAt(null);
  }, [catalogCode]);

  const saveMutation = useMutation({
    mutationFn: () => w2Api.saveCatalogItem(catalogCode, keyCode, {
      name,
      description: description || null,
      logicValue: logicValue || null,
      displayValue: displayValue || null,
      expectedChangedAt,
    }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['ADM-02', catalogCode] }),
  });

  const selectItem = (item: NonNullable<typeof query.data>[number]) => {
    setKeyCode(item.keyCode); setName(item.name ?? ''); setDescription(item.description ?? '');
    setLogicValue(item.logicValue ?? ''); setDisplayValue(item.displayValue ?? ''); setExpectedChangedAt(item.changedAt);
  };

  return (
    <>
      <PageHeader useCaseId="ADM-02" title="Danh mục và cấu hình" description="Chỉ cho phép các danh mục trong whitelist; không cung cấp thao tác xóa cứng." />
      <section className="form-card">
        <div className="form-grid three-columns">
          <label><span>Danh mục</span><select value={catalogCode} onChange={(event) => setCatalogCode(event.target.value)}>{catalogs.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
          <label><span>Mã</span><input value={keyCode} onChange={(event) => setKeyCode(event.target.value)} maxLength={50} /></label>
          <label><span>Tên</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} /></label>
          <label><span>Mô tả</span><input value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label><span>Logic</span><input value={logicValue} onChange={(event) => setLogicValue(event.target.value)} placeholder="-1, 0, 1 hoặc mã logic" /></label>
          <label><span>Nhóm/hiển thị</span><input value={displayValue} onChange={(event) => setDisplayValue(event.target.value)} /></label>
        </div>
        <div className="form-actions"><button className="button primary" type="button" disabled={!keyCode.trim() || !name.trim() || saveMutation.isPending} onClick={() => saveMutation.mutate()}>Lưu danh mục</button><button className="button secondary" type="button" onClick={() => { setKeyCode(''); setName(''); setExpectedChangedAt(null); }}>Tạo mới</button></div>
        {saveMutation.isSuccess ? <p className="action-success">Đã lưu {saveMutation.data.keyCode}.</p> : null}
        {saveMutation.error ? <p className="action-error">{saveMutation.error.message}</p> : null}
      </section>
      <QueryState isLoading={query.isLoading} error={query.error} isEmpty={query.data?.length === 0} onRetry={() => void query.refetch()}>
        <DataTable caption="Danh mục cấu hình" rows={query.data ?? []} rowKey={(item) => item.keyCode} columns={[
          { key: 'key', header: 'Mã', render: (item) => <button className="link-button" type="button" onClick={() => selectItem(item)}>{item.keyCode}</button> },
          { key: 'name', header: 'Tên', render: (item) => item.name ?? '—' },
          { key: 'description', header: 'Mô tả', render: (item) => item.description ?? '—' },
          { key: 'logic', header: 'Logic', render: (item) => item.logicValue ?? '—' },
          { key: 'display', header: 'Nhóm/hiển thị', render: (item) => item.displayValue ?? '—' },
        ]} />
      </QueryState>
    </>
  );
}

