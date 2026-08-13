import { Link } from 'react-router-dom';
import { PageHeader } from '../../shared/components/PageHeader';
import { routesForNavigation } from '../../app/routeRegistry';
import { useSession } from '../access/useSession';

export function HomePage() {
  const { session, navigation } = useSession();
  const available = routesForNavigation(navigation);

  return (
    <>
      <PageHeader
        useCaseId="MMS"
        title={`Xin chào, ${session.displayName}`}
        description="Chọn một chức năng được phân quyền để bắt đầu vận hành."
      />
      <section className="card-grid" aria-label="Chức năng được phép">
        {available.map((route) => (
          <Link className="feature-card" key={route.path} to={route.path}>
            <span className="eyebrow">{route.useCaseId}</span>
            <strong>{route.label}</strong>
            <span>Mở chức năng →</span>
          </Link>
        ))}
        {available.length === 0 ? (
          <div className="state-panel">
            Tài khoản chưa có màn hình React tương ứng trong wave hiện tại.
          </div>
        ) : null}
      </section>
    </>
  );
}
