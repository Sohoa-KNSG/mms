import type { ReactNode } from 'react';

interface PageHeaderProps {
  useCaseId: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ useCaseId, title, description, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <span className="eyebrow">{useCaseId}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

