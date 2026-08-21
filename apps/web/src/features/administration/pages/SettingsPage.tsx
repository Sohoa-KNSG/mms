import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  Shield,
  Layers,
  MapPin,
  CheckSquare,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  Edit2,
  Save,
  ShieldCheck,
  Smartphone,
  Truck,
  ArrowUpFromLine,
  Boxes,
  Lock,
  Search,
  Key,
  UserCheck,
  Building,
  Briefcase,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useWarehouse } from '../../../app/providers/warehouseStore';
import { UserRole, User } from '../../../shared/types';
import {
  permissionService,
  APP_ROLES,
  PERMISSION_CATALOG,
  PermissionItem,
  RoleInfo,
  UserManagementItem,
  SaveUserPayload
} from '../../../features/administration/api/permissionApi';

export const SettingsModule: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    materials,
    locations,
    qcCriteria,
    resetData
  } = useWarehouse();

  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'materials' | 'locations' | 'system'>('users');
  const [matrix, setMatrix] = useState<Record<string, string[]>>(() => permissionService.getMatrix());
  const [appRoles, setAppRoles] = useState<RoleInfo[]>(APP_ROLES);
  const [appPermissions, setAppPermissions] = useState<PermissionItem[]>(PERMISSION_CATALOG);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);

  // Users State
  const [users, setUsers] = useState<UserManagementItem[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  
  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [modalUser, setModalUser] = useState<SaveUserPayload>({
    userId: '',
    fullName: '',
    password: '',
    roleCode: 'bophan_yeucau',
    jobTitle: '',
    departmentName: '',
    isActive: 1
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [userModalError, setUserModalError] = useState<string | null>(null);

  // Load live matrix and roles
  const loadLiveMatrix = async () => {
    try {
      const res = await permissionService.getLiveMatrix();
      if (res.roles.length > 0) setAppRoles(res.roles);
      if (res.permissions.length > 0) setAppPermissions(res.permissions);
      setMatrix(res.matrix);
    } catch (e) {
      console.warn(e);
    }
  };

  // Load users from MMS1 Database
  const loadUsers = async (search?: string, role?: string) => {
    setIsUsersLoading(true);
    try {
      const list = await permissionService.getUsers(search, role);
      setUsers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    loadLiveMatrix();
    loadUsers();
  }, []);

  const handleTogglePermission = (roleCode: string, permCode: string) => {
    if (roleCode === 'admin') return; // Admin always has full access
    const current = matrix[roleCode] || [];
    const next = current.includes(permCode)
      ? current.filter(p => p !== permCode)
      : [...current, permCode];
    
    setMatrix(prev => ({
      ...prev,
      [roleCode]: next
    }));
  };

  const handleSaveMatrix = async () => {
    setIsSavingMatrix(true);
    try {
      for (const role of appRoles) {
        if (role.code !== 'admin') {
          const perms = matrix[role.code] || [];
          await permissionService.saveLiveRolePermissions(role.code, perms);
        }
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert('Lỗi lưu ma trận phân quyền.');
    } finally {
      setIsSavingMatrix(false);
    }
  };

  const handleOpenAddUser = () => {
    setIsEditMode(false);
    setModalUser({
      userId: '',
      fullName: '',
      password: '',
      roleCode: 'bophan_yeucau',
      jobTitle: '',
      departmentName: '',
      isActive: 1
    });
    setUserModalError(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: UserManagementItem) => {
    setIsEditMode(true);
    setModalUser({
      userId: u.userId,
      fullName: u.fullName,
      password: '',
      roleCode: u.roleCode || 'bophan_yeucau',
      jobTitle: u.jobTitle || '',
      departmentName: u.departmentName || '',
      isActive: u.isActive
    });
    setUserModalError(null);
    setIsUserModalOpen(true);
  };

  const handleSaveUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalUser.userId.trim() || !modalUser.fullName.trim()) {
      setUserModalError('Vui lòng nhập đầy đủ mã tài khoản và họ tên.');
      return;
    }
    setIsSavingUser(true);
    setUserModalError(null);
    try {
      await permissionService.saveUser(modalUser);
      setIsUserModalOpen(false);
      loadUsers(userSearch, userRoleFilter);
    } catch (err: any) {
      setUserModalError(err.message || 'Lỗi lưu tài khoản.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const permissionGroups = Array.from(new Set(appPermissions.map(p => p.group)));

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Hệ Thống Phân Quyền & Quản Trị Người Dùng (UC-28 / ADM-01)
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Quản Trị Người Dùng, Vai Trò & Phân Quyền
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kết nối trực tiếp CSDL MMS1: Quản lý 100+ tài khoản nhân viên, phân quyền ma trận 6 nhóm vai trò và 22 quyền nghiệp vụ.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'users' as const, label: `👥 Người Dùng (${users.length})` },
            { id: 'roles' as const, label: '🛡️ Phân Quyền Vai Trò (UC-02)' },
            { id: 'materials' as const, label: '📦 Master Data SKU' },
            { id: 'locations' as const, label: '📍 Vị Trí Kệ Kho' },
            { id: 'system' as const, label: '⚙️ Hệ Thống' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === t.id
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          TAB 1: QUẢN TRỊ NGƯỜI DÙNG & GÁN VAI TRÒ (USER MANAGEMENT)
      ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => {
                    setUserSearch(e.target.value);
                    loadUsers(e.target.value, userRoleFilter);
                  }}
                  placeholder="Tìm mã nhân viên, họ tên, phòng ban..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              {/* Role filter */}
              <select
                value={userRoleFilter}
                onChange={e => {
                  setUserRoleFilter(e.target.value);
                  loadUsers(userSearch, e.target.value);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 cursor-pointer"
              >
                <option value="">-- Tất cả vai trò ({appRoles.length}) --</option>
                {appRoles.map(r => (
                  <option key={r.code} value={r.code}>{r.name} ({r.code})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadUsers(userSearch, userRoleFilter)}
                className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
              >
                Làm mới
              </button>
              <button
                onClick={handleOpenAddUser}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Người Dùng Mới
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Mã TK (user_n)</th>
                    <th className="p-3.5">Họ Và Tên</th>
                    <th className="p-3.5">Nhóm Vai Trò</th>
                    <th className="p-3.5">Chức Danh / Vị Trí</th>
                    <th className="p-3.5">Phòng Ban / Phân Xưởng</th>
                    <th className="p-3.5 text-center">Trạng Thái</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isUsersLoading ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500 text-xs">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                        Đang tải danh sách người dùng từ MMS1...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400 text-xs">
                        Không tìm thấy người dùng nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    users.map(u => {
                      const roleObj = appRoles.find(r => r.code === u.roleCode) || {
                        code: u.roleCode,
                        name: u.roleName || u.roleCode,
                        badge: u.roleCode,
                        bg: 'bg-slate-100 text-slate-700 border-slate-300'
                      };
                      return (
                        <tr key={u.userId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-blue-700">
                            {u.userId}
                            {u.employeeCode && (
                              <span className="text-[10px] text-slate-400 font-normal ml-1">
                                (MSNV: {u.employeeCode})
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-semibold text-slate-900">
                            {u.fullName}
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${roleObj.bg}`}>
                              {roleObj.name}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600">
                            {u.jobTitle || '—'}
                          </td>
                          <td className="p-3.5 text-slate-600">
                            {u.departmentName || '—'}
                          </td>
                          <td className="p-3.5 text-center">
                            {u.isActive === 1 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Hoạt động
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                Khóa
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" /> Gán Vai Trò
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: MA TRẬN PHÂN QUYỀN VAI TRÒ (ROLE MATRIX)
      ========================================================================= */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Ma Trận Phân Quyền Nghiệp Vụ Chuẩn MMS1 Database</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tích chọn để cấp hoặc thu hồi quyền hạn trực tiếp. Phân quyền sẽ được lưu vào bảng tbl_app_role_permission.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 animate-in fade-in">
                    <Check className="w-4 h-4" /> Đã lưu vào CSDL MMS1!
                  </span>
                )}
                <button
                  onClick={handleSaveMatrix}
                  disabled={isSavingMatrix}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingMatrix ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Lưu Phân Quyền Vào CSDL</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 w-2/5">Chức Năng Nghiệp Vụ</th>
                    {appRoles.map(role => (
                      <th key={role.code} className="p-3 text-center">
                        <div className="font-bold text-slate-800">{role.badge}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{role.code}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {permissionGroups.map(group => {
                    const groupPerms = appPermissions.filter(p => p.group === group);
                    return (
                      <React.Fragment key={group}>
                        <tr className="bg-slate-100/70">
                          <td colSpan={appRoles.length + 1} className="px-3.5 py-2 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                            {group} ({groupPerms.length} quyền)
                          </td>
                        </tr>
                        {groupPerms.map(perm => (
                          <tr key={perm.code} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3.5 pl-6">
                              <div className="font-semibold text-slate-800">{perm.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{perm.code} - {perm.description}</div>
                            </td>
                            {appRoles.map(role => {
                              const isGranted = role.code === 'admin' || (matrix[role.code] || []).includes(perm.code);
                              const isDisabled = role.code === 'admin';
                              return (
                                <td key={role.code} className="p-3 text-center">
                                  <label className="inline-flex items-center justify-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isGranted}
                                      disabled={isDisabled}
                                      onChange={() => handleTogglePermission(role.code, perm.code)}
                                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                  </label>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Thêm / Sửa / Gán vai trò người dùng */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {isEditMode ? `Cập Nhật & Gán Vai Trò: ${modalUser.userId}` : 'Thêm Tài Khoản Người Dùng Mới'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cập nhật bảng tbl_dm_user trên CSDL MMS1.
                </p>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>

            {userModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{userModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUserSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã Tài Khoản (user_n): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isEditMode}
                    value={modalUser.userId}
                    onChange={e => setModalUser({ ...modalUser, userId: e.target.value })}
                    placeholder="VD: 10003, thukho..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase font-bold text-slate-900 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mật Khẩu Mới:
                  </label>
                  <input
                    type="password"
                    value={modalUser.password || ''}
                    onChange={e => setModalUser({ ...modalUser, password: e.target.value })}
                    placeholder={isEditMode ? 'Để trống nếu giữ nguyên' : 'Mặc định: 123'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ Và Tên: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalUser.fullName}
                  onChange={e => setModalUser({ ...modalUser, fullName: e.target.value })}
                  placeholder="VD: NGUYỄN VĂN A"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nhóm Vai Trò Phân Quyền (Role): <span className="text-rose-500">*</span>
                </label>
                <select
                  value={modalUser.roleCode}
                  onChange={e => setModalUser({ ...modalUser, roleCode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-blue-800 bg-blue-50/50 cursor-pointer"
                >
                  {appRoles.map(r => (
                    <option key={r.code} value={r.code}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Người dùng sẽ tự động nhận các quyền thuộc nhóm vai trò này khi đăng nhập.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Chức Danh / Vị Trí:
                  </label>
                  <input
                    type="text"
                    value={modalUser.jobTitle || ''}
                    onChange={e => setModalUser({ ...modalUser, jobTitle: e.target.value })}
                    placeholder="VD: Thủ kho, Nhân viên..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Phòng Ban / Phân Xưởng:
                  </label>
                  <input
                    type="text"
                    value={modalUser.departmentName || ''}
                    onChange={e => setModalUser({ ...modalUser, departmentName: e.target.value })}
                    placeholder="VD: Kho Vận, NM1_QA..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Trạng Thái Tài Khoản:
                </label>
                <select
                  value={modalUser.isActive}
                  onChange={e => setModalUser({ ...modalUser, isActive: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 cursor-pointer"
                >
                  <option value={1}>Hoạt động (Active)</option>
                  <option value={0}>Khóa tài khoản (Disabled)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isEditMode ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: SKU Master Data */}
      {activeTab === 'materials' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Danh Mục Master Data Vật Tư (SKU Catalog)</h3>
              <p className="text-xs text-slate-500">Khai báo mã hàng, phân nhóm, đơn vị tính và định mức tồn an toàn.</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Mã SKU</th>
                  <th className="p-3">Tên Vật Tư</th>
                  <th className="p-3">Phân Nhóm</th>
                  <th className="p-3">ĐVT</th>
                  <th className="p-3 text-right">Min Tồn</th>
                  <th className="p-3 text-right">Max Tồn</th>
                  <th className="p-3 text-right">Đơn Giá Chuẩn</th>
                  <th className="p-3 text-center">Kiểm QC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.map(m => (
                  <tr key={m.id}>
                    <td className="p-3 font-mono font-bold text-blue-700">{m.code}</td>
                    <td className="p-3 font-semibold text-slate-800">{m.name}</td>
                    <td className="p-3 text-slate-600">{m.categoryName}</td>
                    <td className="p-3 text-slate-500">{m.unit}</td>
                    <td className="p-3 font-mono text-right text-slate-700">{m.minStock}</td>
                    <td className="p-3 font-mono text-right text-slate-700">{m.maxStock}</td>
                    <td className="p-3 font-mono text-right text-slate-700">{m.standardPrice.toLocaleString('vi-VN')} đ</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Bắt Buộc
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Locations Master Data */}
      {activeTab === 'locations' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Danh Sách Vị Trí Kệ Kho (Locations Catalog)</h3>
              <p className="text-xs text-slate-500">Mã hóa theo chuẩn: KHO - KỆ - TẦNG (e.g. KA-K01-T1).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {locations.map(loc => (
              <div key={loc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-blue-700 text-sm">{loc.code}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                    {loc.status}
                  </span>
                </div>
                <div className="text-slate-700 font-medium">{loc.warehouse}</div>
                <div className="text-slate-500 text-[11px]">
                  Kệ: {loc.rack} • Tầng: {loc.tier} • Sức chứa: {loc.occupied}/{loc.capacity} slot
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: System Reset */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Khôi Phục Dữ Liệu Mẫu (Demo Reset)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Khôi phục toàn bộ trạng thái phiếu nhận hàng, đánh giá QC, số dư kho và đề nghị xuất về kịch bản ban đầu.
            </p>
          </div>

          <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-3">
            <div className="font-bold text-rose-900 text-xs">Lưu ý khi khôi phục:</div>
            <p className="text-xs text-rose-700 leading-relaxed">
              Thao tác này sẽ đặt lại dữ liệu trong bộ nhớ trình duyệt (localStorage), bao gồm các phiếu nhận hàng và đề nghị xuất bạn vừa tạo.
            </p>
            <button
              onClick={() => {
                if (confirm('Bạn có chắc chắn muốn khôi phục toàn bộ dữ liệu về mặc định?')) {
                  resetData();
                  alert('Đã khôi phục dữ liệu mẫu thành công!');
                }
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Khôi Phục Dữ Liệu Mẫu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
