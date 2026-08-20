// Authentication Service for UC-01 (AUTH-01) and UC-02 (AUTH-02)

export interface UserSession {
  userId: string;
  displayName: string;
  roleCode: string;
  roleName?: string;
  jobTitle?: string;
  departmentCode?: string;
  bravoDepartmentCode?: string;
  bravoDepartmentName?: string;
}

export interface NavigationItem {
  screenCode: string;
  label: string;
  accessMode?: string;
}

export interface LoginResponse {
  success: boolean;
  data?: UserSession;
  error?: string;
}

const API_BASE = '/api/v1';

export const authService = {
  /**
   * UC-01: Authenticate with username and password
   */
  async login(userName: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName: userName.trim(), password }),
      });

      if (!response.ok) {
        let errorMsg = 'Đăng nhập không thành công.';
        try {
          const errData = await response.json();
          errorMsg = errData.detail || errData.title || errorMsg;
        } catch {
          // ignore json parse error
        }
        return { success: false, error: errorMsg };
      }

      const session: UserSession = await response.json();
      return { success: true, data: session };
    } catch (err: any) {
      return { success: false, error: err.message || 'Không thể kết nối đến máy chủ API.' };
    }
  },

  /**
   * UC-01: Get active user session context
   */
  async getSession(): Promise<UserSession | null> {
    try {
      const response = await fetch(`${API_BASE}/session`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * UC-01: Logout and clear session cookie
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
      });
    } catch {
      // ignore
    }
  },

  /**
   * UC-02: Get authorized navigation screens for user
   */
  async getNavigation(): Promise<NavigationItem[]> {
    try {
      const response = await fetch(`${API_BASE}/navigation`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch {
      return [];
    }
  }
};
