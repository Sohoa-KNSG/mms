import { useQuery } from '@tanstack/react-query';
import { Outlet } from 'react-router-dom';
import { accessApi } from './accessApi';
import { SessionContext } from './SessionContext';
import { ApiError } from '../../shared/api/client';
import { LoginPage } from './LoginPage';

export function SessionGate() {
  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: ({ signal }) => accessApi.getSession(signal),
    staleTime: 5 * 60_000,
  });

  const navigationQuery = useQuery({
    queryKey: ['navigation'],
    queryFn: ({ signal }) => accessApi.getNavigation(signal),
    staleTime: 5 * 60_000,
    enabled: sessionQuery.isSuccess,
  });

  if (sessionQuery.error instanceof ApiError && sessionQuery.error.status === 401) return <LoginPage />;

  if (sessionQuery.isLoading || navigationQuery.isLoading) {
    return <div className="boot-state" role="status">Đang xác thực và tải quyền truy cập…</div>;
  }

  const error = sessionQuery.error ?? navigationQuery.error;
  if (error || !sessionQuery.data || !navigationQuery.data) {
    return (
      <main className="boot-state error" role="alert">
        <div>
          <span className="status-badge danger">AUTH-01</span>
          <h1>Không thể khởi tạo phiên MMS</h1>
          <p>{error?.message ?? 'Không nhận được thông tin người dùng hoặc quyền truy cập.'}</p>
          <button className="button primary" type="button" onClick={() => window.location.reload()}>
            Thử lại
          </button>
        </div>
      </main>
    );
  }

  return (
    <SessionContext.Provider value={{ session: sessionQuery.data, navigation: navigationQuery.data }}>
      <Outlet />
    </SessionContext.Provider>
  );
}
