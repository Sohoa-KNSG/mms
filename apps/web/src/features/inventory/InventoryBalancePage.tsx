import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiGet } from '../../shared/api/client';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatQuantity } from '../../shared/format';

const balancePageSchema = z.object({
  items: z.array(z.object({
    materialId: z.string(),
    bravoId: z.string().nullable(),
    materialName: z.string().nullable(),
    unit: z.string(),
    warehouseCode: z.string().nullable(),
    batchBalance: z.number(),
    ledgerBalance: z.number(),
    variance: z.number(),
  })),
  totalCount: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export function InventoryBalancePage() {
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: ['INV-01', search],
    queryFn: ({ signal }) => apiGet(`/inventory/balances?search=${encodeURIComponent(search)}&page=1&pageSize=50`, balancePageSchema, signal),
  });

  return (
    <>
      <PageHeader useCaseId="INV-01" title="Tồn kho" description="Đối chiếu số dư batch với ledger giao dịch theo vật tư." />
      <div className="filter-bar">
        <label>
          <span>Tìm vật tư</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã hoặc tên vật tư" />
        </label>
      </div>
      <QueryState isLoading={query.isLoading} error={query.error} isEmpty={query.data?.items.length === 0} onRetry={() => void query.refetch()}>
        <DataTable
          caption="Tồn kho theo vật tư"
          rows={query.data?.items ?? []}
          rowKey={(row) => `${row.materialId}-${row.warehouseCode ?? ''}-${row.unit}`}
          columns={[
            { key: 'materialId', header: 'Mã vật tư', render: (row) => row.materialId },
            { key: 'name', header: 'Tên vật tư', render: (row) => row.materialName ?? '—' },
            { key: 'warehouse', header: 'Kho', render: (row) => row.warehouseCode ?? '—' },
            { key: 'batch', header: 'Tồn batch', align: 'right', render: (row) => formatQuantity(row.batchBalance) },
            { key: 'ledger', header: 'Tồn ledger', align: 'right', render: (row) => formatQuantity(row.ledgerBalance) },
            { key: 'variance', header: 'Chênh lệch', align: 'right', render: (row) => <span className={Math.abs(row.variance) > 0.000001 ? 'text-danger' : 'text-success'}>{formatQuantity(row.variance)}</span> },
            { key: 'unit', header: 'ĐVT', render: (row) => row.unit },
          ]}
        />
      </QueryState>
    </>
  );
}

