import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="state-panel" aria-labelledby="not-found-title">
      <span className="status-badge neutral">404</span>
      <h1 id="not-found-title">Không tìm thấy màn hình</h1>
      <p>Đường dẫn không tồn tại hoặc bạn chưa được cấp quyền truy cập.</p>
      <Link className="button primary" to="/home">Về trang tổng quan</Link>
    </section>
  );
}

