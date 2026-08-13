import { NavLink, Outlet } from 'react-router-dom';
import { useSession } from '../../features/access/useSession';
import { routesForNavigation } from '../routeRegistry';

export function AppShell() {
  const { session, navigation } = useSession();
  const allowedRoutes = routesForNavigation(navigation);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Điều hướng chính">
        <div className="brand-block">
          <span className="brand-kicker">SMART FACTORY</span>
          <strong>MMS</strong>
          <span>Quản lý kho vật tư</span>
        </div>
        <nav className="nav-list">
          <NavLink to="/home" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            Tổng quan
          </NavLink>
          {allowedRoutes.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              {route.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div>
            <span className="eyebrow">Môi trường vận hành</span>
            <strong>React Primary</strong>
          </div>
          <div className="user-block">
            <strong>{session.displayName}</strong>
            <span>{session.roleName || session.roleCode}</span>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
