import type { ReactNode } from 'react';
import { ApiError } from '../api/client';

interface QueryStateProps {
  isLoading: boolean;
  error: Error | null;
  isEmpty?: boolean;
  onRetry: () => void;
  children: ReactNode;
}

export function QueryState({ isLoading, error, isEmpty = false, onRetry, children }: QueryStateProps) {
  if (isLoading) {
    return <div className="state-panel" role="status">Đang tải dữ liệu…</div>;
  }

  if (error) {
    const trace = error instanceof ApiError && error.traceId ? ` Mã truy vết: ${error.traceId}` : '';
    return (
      <div className="state-panel error" role="alert">
        <strong>Không thể tải dữ liệu</strong>
        <p>{error.message}{trace}</p>
        <button className="button secondary" type="button" onClick={onRetry}>Thử lại</button>
      </div>
    );
  }

  if (isEmpty) {
    return <div className="state-panel">Không có dữ liệu phù hợp với điều kiện hiện tại.</div>;
  }

  return children;
}

