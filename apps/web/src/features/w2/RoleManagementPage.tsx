import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { w2Api } from './w2Api';

export function RoleManagementPage() {
  const queryClient = useQueryClient();
  const [roleCode, setRoleCode] = useState('');
  const [roleName, setRoleName] = useState('');
  const [grants, setGrants] = useState<Record<string, string>>({});
  const query = useQuery({
    queryKey: ['ADM-01', roleCode],
    queryFn: ({ signal }) => w2Api.getRoleMatrix(roleCode || null, signal),
  });

  useEffect(() => {
    const role = query.data?.roles.find((item) => item.roleCode === roleCode);
    if (role) setRoleName(role.roleName ?? '');
    setGrants(Object.fromEntries(
      (query.data?.screens ?? [])
        .filter((screen) => screen.isGranted)
        .map((screen) => [screen.screenCode, screen.accessMode ?? 'VIEW']),
    ));
  }, [query.data, roleCode]);

  const selectedRole = useMemo(
    () => query.data?.roles.find((item) => item.roleCode === roleCode),
    [query.data, roleCode],
  );

  const saveMutation = useMutation({
    mutationFn: () => w2Api.saveRole(roleCode, {
      roleName,
      expectedChangedAt: selectedRole?.changedAt ?? null,
      permissions: (query.data?.screens ?? [])
        .filter((screen) => grants[screen.screenCode] !== undefined)
        .map((screen) => ({
          screenCode: screen.screenCode,
          screenLabel: screen.screenLabel,
          accessMode: grants[screen.screenCode] ?? 'VIEW',
        })),
    }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['ADM-01'] }),
  });

  return (
    <>
      <PageHeader useCaseId="ADM-01" title="Vai trò và quyền màn hình" description="Duy trì ma trận quyền; stored procedure bảo vệ quyền quản trị cuối cùng." />
      <section className="form-card">
        <div className="form-grid three-columns">
          <label>
            <span>Vai trò hiện có</span>
            <select value={roleCode} onChange={(event) => setRoleCode(event.target.value)}>
              <option value="">Tạo vai trò mới</option>
              {query.data?.roles.map((role) => <option key={role.roleCode} value={role.roleCode}>{role.roleCode}</option>)}
            </select>
          </label>
          <label>
            <span>Mã vai trò</span>
            <input value={roleCode} onChange={(event) => setRoleCode(event.target.value)} maxLength={50} />
          </label>
          <label>
            <span>Tên vai trò</span>
            <input value={roleName} onChange={(event) => setRoleName(event.target.value)} maxLength={50} />
          </label>
        </div>
        <button className="button primary" type="button" disabled={!roleCode.trim() || !roleName.trim() || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending ? 'Đang lưu…' : 'Lưu vai trò'}
        </button>
        {saveMutation.isSuccess ? <p className="action-success">Đã lưu {saveMutation.data.permissionCount} quyền.</p> : null}
        {saveMutation.error ? <p className="action-error">{saveMutation.error.message}</p> : null}
      </section>
      <QueryState isLoading={query.isLoading} error={query.error} isEmpty={query.data?.screens.length === 0} onRetry={() => void query.refetch()}>
        <div className="table-scroll">
          <table className="data-table">
            <caption className="sr-only">Ma trận quyền màn hình</caption>
            <thead><tr><th>Cấp quyền</th><th>Mã màn hình</th><th>Tên màn hình</th><th>Chế độ</th></tr></thead>
            <tbody>
              {query.data?.screens.map((screen) => (
                <tr key={screen.screenCode}>
                  <td><input type="checkbox" checked={grants[screen.screenCode] !== undefined} onChange={(event) => setGrants((current) => {
                    const next = { ...current };
                    if (event.target.checked) next[screen.screenCode] = screen.accessMode ?? 'VIEW';
                    else delete next[screen.screenCode];
                    return next;
                  })} /></td>
                  <td>{screen.screenCode}</td>
                  <td>{screen.screenLabel ?? '—'}</td>
                  <td>
                    <select value={grants[screen.screenCode] ?? 'VIEW'} disabled={grants[screen.screenCode] === undefined} onChange={(event) => setGrants((current) => ({ ...current, [screen.screenCode]: event.target.value }))}>
                      <option value="VIEW">Xem</option><option value="EDIT">Sửa</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryState>
    </>
  );
}

