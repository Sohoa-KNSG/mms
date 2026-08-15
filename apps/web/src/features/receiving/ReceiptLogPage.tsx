import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiGet } from '../../shared/api/client';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatDateTime } from '../../shared/format';

const receiptLogSchema = z.object({
  items: z.array(z.object({
    historyId: z.number(),
    receiptId: z.string(),
    warehouseCode: z.string().nullable(),
    customerName: z.string().nullable(),
    purchaseOrder: z.string().nullable(),
    statusCode: z.string().nullable(),
    statusLabel: z.string().nullable(),
    actionType: z.string().nullable(),
    actorName: z.string().nullable(),
    auditTime: z.string().nullable(),
  })),
  totalCount: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export function ReceiptLogPage() {
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: ['INB-04', search],
    queryFn: ({ signal }) => apiGet(`/receipts/log?search=${encodeURIComponent(search)}&page=1&pageSize=50`, receiptLogSchema, signal),
  });

  return (
    <>
      <PageHeader useCaseId="INB-04" title="Nhật ký nhận hàng" description="Theo dõi trạng thái và lịch sử cập nhật phiếu nhận." />
      <div className="filter-bar">
        <label>
          <span>Tìm phiếu, PO hoặc khách hàng</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nhập từ khóa" />
        </label>
      </div>
      <QueryState isLoading={query.isLoading} error={query.error} isEmpty={query.data?.items.length === 0} onRetry={() => void query.refetch()}>
        <DataTable
          caption="Nhật ký nhận hàng"
          rows={query.data?.items ?? []}
          rowKey={(row) => String(row.historyId)}
          columns={[
            { key: 'receipt', header: 'Phiếu', render: (row) => row.receiptId },
            { key: 'po', header: 'PO', render: (row) => row.purchaseOrder ?? '—' },
            { key: 'customer', header: 'Khách hàng', render: (row) => row.customerName ?? '—' },
            { key: 'status', header: 'Trạng thái', render: (row) => <span className="status-badge information">{row.statusLabel ?? row.statusCode ?? '—'}</span> },
            { key: 'actor', header: 'Người thực hiện', render: (row) => row.actorName ?? '—' },
            { key: 'time', header: 'Thời điểm', render: (row) => formatDateTime(row.auditTime) },
          ]}
        />
      </QueryState>
    </>
  );
}

