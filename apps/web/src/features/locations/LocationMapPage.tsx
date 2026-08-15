import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiGet } from '../../shared/api/client';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatQuantity } from '../../shared/format';

const locationPageSchema = z.object({
  items: z.array(z.object({
    locationCode: z.string(),
    areaCode: z.string().nullable(),
    rackCode: z.string().nullable(),
    columnNumber: z.number().nullable(),
    levelNumber: z.number().nullable(),
    positionNumber: z.number().nullable(),
    description: z.string().nullable(),
    batchCount: z.number(),
    totalQuantity: z.number(),
  })),
  totalCount: z.number(),
});

export function LocationMapPage() {
  const [area, setArea] = useState('');
  const query = useQuery({
    queryKey: ['LOC-01', area],
    queryFn: ({ signal }) => apiGet(`/locations?area=${encodeURIComponent(area)}&page=1&pageSize=100`, locationPageSchema, signal),
  });

  return (
    <>
      <PageHeader useCaseId="LOC-01" title="Sơ đồ vị trí" description="Theo dõi vị trí kệ và số batch đang lưu." />
      <div className="filter-bar">
        <label>
          <span>Khu vực</span>
          <input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Tất cả khu vực" />
        </label>
      </div>
      <QueryState isLoading={query.isLoading} error={query.error} isEmpty={query.data?.items.length === 0} onRetry={() => void query.refetch()}>
        <DataTable
          caption="Danh mục vị trí kho"
          rows={query.data?.items ?? []}
          rowKey={(row) => row.locationCode}
          columns={[
            { key: 'location', header: 'Vị trí', render: (row) => row.locationCode },
            { key: 'area', header: 'Khu vực', render: (row) => row.areaCode ?? '—' },
            { key: 'rack', header: 'Kệ', render: (row) => row.rackCode ?? '—' },
            { key: 'column', header: 'Cột', align: 'right', render: (row) => row.columnNumber ?? '—' },
            { key: 'level', header: 'Tầng', align: 'right', render: (row) => row.levelNumber ?? '—' },
            { key: 'batches', header: 'Số batch', align: 'right', render: (row) => row.batchCount },
            { key: 'quantity', header: 'Tổng SL', align: 'right', render: (row) => formatQuantity(row.totalQuantity) },
          ]}
        />
      </QueryState>
    </>
  );
}

