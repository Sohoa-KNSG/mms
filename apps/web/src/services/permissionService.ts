// Permission & Role Management Service for UC-02 & MMS Roles
import { UserRole, AppPermission } from '../types';
import { NavModule } from '../components/Sidebar';

export interface RoleInfo {
  code: string;
  name: string;
  badge: string;
  bg: string;
  description: string;
}

export const APP_ROLES: RoleInfo[] = [
  {
    code: 'admin',
    name: 'Admin Hệ Thống',
    badge: 'Admin',
    bg: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Toàn quyền cấu hình hệ thống, quản trị phân quyền và truy cập tất cả các phân hệ.',
  },
  {
    code: 'truongphong_kho',
    name: 'Trưởng Phòng Kho',
    badge: 'Trưởng Phòng',
    bg: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Phê duyệt đề nghị xuất kho, điều phối kho, theo dõi Dashboard KPI & Báo cáo tổng thể.',
  },
  {
    code: 'ql_kiemke',
    name: 'Quản Lý Kiểm Kê',
    badge: 'Kiểm Kê',
    bg: 'bg-teal-100 text-teal-800 border-teal-200',
    description: 'Chuyên trách kiểm kê kho: Tạo kế hoạch, giám sát đếm từng thùng, đối soát 4 chiều và chốt hoàn thành kiểm kê.',
  },
  {
    code: 'thukho',
    name: 'Thủ Kho Trưởng',
    badge: 'Thủ Kho',
    bg: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Quản lý Nhập kho (nhận PO, đối soát, thủ tục nhập, in tem batch), Tồn kho & Kệ, Xác nhận trả nội bộ.',
  },
  {
    code: 'bophan_yeucau',
    name: 'Đơn Vị Yêu Cầu (Sản Xuất / R&D / Bảo Trì)',
    badge: 'Đơn Vị Yêu Cầu',
    bg: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'Đơn vị sử dụng vật tư: Lập đề nghị xuất kho theo kế hoạch/ngoài kế hoạch, theo dõi cấp phát và lập phiếu hoàn trả vật tư nội bộ về kho.',
  },
  {
    code: 'nhanvien',
    name: 'Nhân Viên Kho (PDA)',
    badge: 'Nhân Viên',
    bg: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Thao tác thực địa trên Máy quét PDA, Soạn hàng FIFO, quét barcode cất/dời kệ.',
  },
  {
    code: 'qc',
    name: 'Kỹ Thuật QC/QA',
    badge: 'QC/QA',
    bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Kiểm tra chất lượng vật tư, đánh giá Đạt/Không đạt và in tem kiểm định.',
  },
];

export interface PermissionItem {
  code: string;
  group: 'Nhập kho' | 'Xuất kho' | 'Soạn hàng' | 'Tồn kho & Kệ' | 'QC Kiểm định' | 'Quản trị' | 'Trả nội bộ';
  name: string;
  description: string;
}

export const PERMISSION_CATALOG: PermissionItem[] = [
  // Nhóm Nhập kho
  { code: 'inbound.receive', group: 'Nhập kho', name: 'Quét & nhận hàng theo PO / Không PO', description: 'Tiếp nhận hàng hóa tại cửa kho' },
  { code: 'inbound.update_po', group: 'Nhập kho', name: 'Cập nhật & đối soát số lượng PO', description: 'Đối chiếu số lượng thực nhận so với PO gốc' },
  { code: 'inbound.finalize', group: 'Nhập kho', name: 'Hoàn tất thủ tục nhập kho & sinh Batch', description: 'Chốt phiếu nhập và tạo lô hàng tồn kho' },
  { code: 'inbound.print_label', group: 'Nhập kho', name: 'In tem nhãn Barcode / QR Batch', description: 'In tem mã vạch dán kiện hàng mới' },

  // Nhóm Xuất kho
  { code: 'outbound.request', group: 'Xuất kho', name: 'Tạo đề nghị xuất kho', description: 'Lập phiếu đề nghị xuất vật tư (Theo KH / Ngoài KH / Vượt mức)' },
  { code: 'outbound.view_dept', group: 'Xuất kho', name: 'Xem đề nghị xuất của đơn vị mình', description: 'Theo dõi tiến độ duyệt và cấp phát vật tư của phân xưởng' },
  { code: 'outbound.approve', group: 'Xuất kho', name: 'Phê duyệt / Từ chối đề nghị xuất', description: 'Ký duyệt phiếu xuất dành cho Quản lý / Trưởng phòng kho' },
  { code: 'outbound.finalize', group: 'Xuất kho', name: 'Hoàn tất thủ tục xuất & in phiếu xuất', description: 'Trừ tồn kho chính thức và in phiếu xuất kho' },

  // Nhóm Trả nội bộ
  { code: 'returns.create', group: 'Trả nội bộ', name: 'Lập phiếu trả vật tư nội bộ (RET-01)', description: 'Cho phép phân xưởng lập phiếu hoàn trả vật tư thừa/hỏng về kho' },
  { code: 'returns.confirm', group: 'Trả nội bộ', name: 'Thủ kho xác nhận nhập kho trả nội bộ (RET-02)', description: 'Cho phép thủ kho kiểm tra, phân loại chất lượng và nhập kho' },

  // Nhóm Soạn hàng (PDA)
  { code: 'picking.queue', group: 'Soạn hàng', name: 'Xem hàng đợi soạn hàng', description: 'Danh sách đơn hàng đã duyệt chờ soạn' },
  { code: 'picking.fifo_scan', group: 'Soạn hàng', name: 'Quét soạn hàng theo lô ưu tiên FIFO', description: 'Gợi ý vị trí và quét xác nhận lô hàng FIFO' },
  { code: 'picking.pda', group: 'Soạn hàng', name: 'Sử dụng Chế độ Máy quét cầm tay PDA', description: 'Giao diện tối ưu máy quét Laser công nghiệp' },

  // Nhóm Tồn kho & Kệ
  { code: 'inventory.view', group: 'Tồn kho & Kệ', name: 'Tra cứu tồn kho & Sơ đồ vị trí kệ', description: 'Xem thẻ kho, sơ đồ kệ và mức min/max' },
  { code: 'inventory.putaway', group: 'Tồn kho & Kệ', name: 'Quét barcode cất kệ (Putaway)', description: 'Quét vị trí ô kệ để cất hàng' },
  { code: 'inventory.transfer', group: 'Tồn kho & Kệ', name: 'Chuyển vị trí kệ & Hạ kệ', description: 'Dời hàng từ kệ này sang kệ khác hoặc hạ kệ' },
  { code: 'inventory.split', group: 'Tồn kho & Kệ', name: 'Tách batch & Khai báo tồn kho', description: 'Chia nhỏ lô hàng hoặc nhập số dư ban đầu' },
  { code: 'inventory.audit', group: 'Tồn kho & Kệ', name: 'Kiểm kê Cycle Count (Vật tư & Kệ)', description: 'Tạo kế hoạch kiểm kê xoay vòng và đối soát số lượng thực tế' },

  // Nhóm QC Kiểm định
  { code: 'qc.evaluate', group: 'QC Kiểm định', name: 'Kiểm tra chất lượng Đạt / Không đạt', description: 'Đánh giá chất lượng lô hàng và in phiếu QC' },
  { code: 'qc.config', group: 'QC Kiểm định', name: 'Khai báo bộ tiêu chuẩn QC', description: 'Thiết lập chỉ tiêu và nhóm kiểm tra' },

  // Nhóm Quản trị & Báo cáo
  { code: 'admin.roles', group: 'Quản trị', name: 'Quản trị ma trận phân quyền vai trò', description: 'Phân quyền chức năng cho từng Role' },
  { code: 'admin.dashboard', group: 'Quản trị', name: 'Dashboard KPIs & Báo cáo tổng thể', description: 'Báo cáo xuất-nhập-tồn và giám sát vận hành' },
];

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: PERMISSION_CATALOG.map(p => p.code),
  truongphong_kho: [
    'qc.evaluate',
    'outbound.request',
    'outbound.approve',
    'outbound.view_dept',
    'picking.queue',
    'inventory.view',
    'inventory.audit',
    'admin.dashboard',
  ],
  ql_kiemke: [
    'inventory.view',
    'inventory.audit',
    'picking.pda',
  ],
  thukho: [
    'inbound.receive',
    'inbound.update_po',
    'inbound.finalize',
    'inbound.print_label',
    'qc.evaluate',
    'outbound.request',
    'outbound.finalize',
    'outbound.view_dept',
    'returns.create',
    'returns.confirm',
    'picking.queue',
    'picking.fifo_scan',
    'picking.pda',
    'inventory.view',
    'inventory.putaway',
    'inventory.transfer',
    'inventory.split',
    'inventory.audit',
    'admin.dashboard',
  ],
  bophan_yeucau: [
    'outbound.request',
    'outbound.view_dept',
    'returns.create',
    'inventory.view',
  ],
  nhanvien: [
    'inbound.receive',
    'picking.queue',
    'picking.fifo_scan',
    'picking.pda',
    'inventory.view',
    'inventory.putaway',
    'inventory.transfer',
  ],
  qc: [
    'qc.evaluate',
    'qc.config',
    'inventory.view',
  ],
};

const STORAGE_KEY = 'mms_role_permissions_v5';

export interface UserManagementItem {
  userId: string;
  fullName: string;
  employeeCode?: number | null;
  password?: string | null;
  roleCode: string;
  roleName: string;
  jobTitle?: string | null;
  departmentCode?: string | null;
  bravoDepartmentCode?: string | null;
  departmentName?: string | null;
  isActive: number;
}

export interface SaveUserPayload {
  userId: string;
  fullName: string;
  password?: string;
  roleCode: string;
  jobTitle?: string;
  departmentName?: string;
  isActive: number;
}

export const permissionService = {
  /**
   * Get all permissions matrix for all roles from API (or local fallback)
   */
  async getLiveMatrix(): Promise<{
    roles: RoleInfo[];
    permissions: PermissionItem[];
    matrix: Record<string, string[]>;
  }> {
    try {
      const token = localStorage.getItem('mms_token') || 'dev-token-admin';
      const res = await fetch('/api/v1/administration/app-roles', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const matrixObj: Record<string, string[]> = {};
        if (data.matrix) {
          Object.keys(data.matrix).forEach(k => {
            matrixObj[k] = data.matrix[k] || [];
          });
        }
        return {
          roles: (data.roles || []).map((r: any) => ({
            code: r.roleCode,
            name: r.roleName,
            badge: r.roleName.split(' ')[0],
            bg: r.roleCode === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                r.roleCode === 'truongphong_kho' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                r.roleCode === 'thukho' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                r.roleCode === 'qc' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                r.roleCode === 'bophan_yeucau' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                'bg-slate-100 text-slate-800 border-slate-300',
            description: r.description || ''
          })),
          permissions: (data.permissions || []).map((p: any) => ({
            code: p.permissionCode,
            group: p.moduleGroup,
            name: p.permissionName,
            description: p.description || ''
          })),
          matrix: matrixObj
        };
      }
    } catch (e) {
      console.warn('Cannot fetch live role matrix, using default', e);
    }
    return {
      roles: APP_ROLES,
      permissions: PERMISSION_CATALOG,
      matrix: this.getMatrix()
    };
  },

  /**
   * Save role permissions to MMS1 Database
   */
  async saveLiveRolePermissions(roleCode: string, permissionCodes: string[]): Promise<boolean> {
    try {
      const token = localStorage.getItem('mms_token') || 'dev-token-admin';
      const res = await fetch(`/api/v1/administration/app-roles/${encodeURIComponent(roleCode)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          roleCode,
          permissionCodes
        })
      });
      if (res.ok) {
        this.saveRolePermissions(roleCode, permissionCodes);
        return true;
      }
    } catch (e) {
      console.error('Save role permissions error', e);
    }
    this.saveRolePermissions(roleCode, permissionCodes);
    return false;
  },

  /**
   * Get users list from MMS1 Database tbl_dm_user
   */
  async getUsers(search?: string, roleCode?: string): Promise<UserManagementItem[]> {
    try {
      const token = localStorage.getItem('mms_token') || 'dev-token-admin';
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleCode) params.append('roleCode', roleCode);

      const res = await fetch(`/api/v1/administration/users?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to get users', e);
    }
    return [];
  },

  /**
   * Save user (create or update) in MMS1 Database tbl_dm_user
   */
  async saveUser(payload: SaveUserPayload): Promise<{ isSuccess: boolean; message: string }> {
    const token = localStorage.getItem('mms_token') || 'dev-token-admin';
    const isNew = !payload.userId; // create if new
    const res = await fetch(isNew ? '/api/v1/administration/users' : `/api/v1/administration/users/${encodeURIComponent(payload.userId)}`, {
      method: isNew ? 'POST' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Lỗi cập nhật người dùng.' }));
      throw new Error(err.message || 'Lỗi xử lý tài khoản.');
    }
    return await res.json();
  },

  /**
   * Get all permissions matrix for all roles (local)
   */
  getMatrix(): Record<string, string[]> {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_ROLE_PERMISSIONS, ...parsed };
      }
    } catch {
      // fallback
    }
    return DEFAULT_ROLE_PERMISSIONS;
  },

  /**
   * Save updated permissions for a role (local)
   */
  saveRolePermissions(roleCode: string, permissions: string[]): void {
    const matrix = this.getMatrix();
    matrix[roleCode] = permissions;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matrix));
  },

  /**
   * Check if a role has a specific permission
   */
  hasPermission(role: UserRole, permissionCode: string): boolean {
    const normalizedRole = this.normalizeRole(role);
    if (normalizedRole === 'admin') return true;
    const matrix = this.getMatrix();
    const rolePerms = matrix[normalizedRole] || [];
    return rolePerms.includes(permissionCode);
  },

  /**
   * Normalize any legacy or incoming role code to standard roles
   */
  normalizeRole(role: UserRole | string): string {
    const r = (role || '').toLowerCase();
    if (r.includes('admin')) return 'admin';
    if (r.includes('kiemke') || r.includes('kiem_ke') || r.includes('audit')) return 'ql_kiemke';
    if (r.includes('qc') || r.includes('qa')) return 'qc';
    if (r.includes('truongphong') || r.includes('ql_kho') || r.includes('quanly')) return 'truongphong_kho';
    if (r.includes('thukho') || r.includes('kho')) return 'thukho';
    if (r.includes('yeucau') || r.includes('bophan') || r.includes('sx') || r.includes('sanxuat') || r.includes('donvi')) return 'bophan_yeucau';
    if (r.includes('nhanvien') || r.includes('nv_kho') || r.includes('prod')) return 'nhanvien';
    return 'nhanvien';
  },

  /**
   * Check which sidebar modules are accessible for a role
   */
  getAllowedModules(role: UserRole): NavModule[] {
    const norm = this.normalizeRole(role);
    if (norm === 'admin') {
      return ['dashboard', 'handheld', 'receiving', 'qc', 'putaway', 'inventory', 'cycle_count', 'outbound', 'reports', 'settings'];
    }

    // Role Quản lý chỉ dùng chuyên trách Kiểm kê
    if (norm === 'ql_kiemke') {
      return ['cycle_count', 'inventory', 'handheld'];
    }

    if (norm === 'bophan_yeucau') {
      return ['outbound', 'receiving', 'inventory'];
    }

    const allowed: NavModule[] = [];
    const matrix = this.getMatrix();
    const perms = matrix[norm] || [];

    if (perms.includes('admin.dashboard')) allowed.push('dashboard');
    if (perms.includes('picking.pda') || perms.includes('picking.fifo_scan')) allowed.push('handheld');
    if (perms.some(p => p.startsWith('inbound.') || p.startsWith('returns.'))) allowed.push('receiving');
    if (perms.some(p => p.startsWith('qc.'))) allowed.push('qc');
    if (perms.includes('inventory.putaway')) allowed.push('putaway');
    if (perms.some(p => p.startsWith('inventory.'))) allowed.push('inventory');
    if (perms.includes('inventory.audit') || norm === 'thukho') allowed.push('cycle_count');
    if (perms.some(p => p.startsWith('outbound.'))) allowed.push('outbound');
    if (perms.includes('admin.dashboard')) allowed.push('reports');
    if (norm === 'admin' || perms.includes('admin.roles')) allowed.push('settings');

    return allowed.length > 0 ? allowed : ['outbound', 'inventory'];
  }
};
