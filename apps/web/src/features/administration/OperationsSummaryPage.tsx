import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiGet } from '../../shared/api/client';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatQuantity } from '../../shared/format';

const operationsSummarySchema = z.object({
  generatedAt: z.string(),
  inventoryMaterialCount: z.number(),
  activeBatchCount: z.number(),
  unlocatedBatchCount: z.number(),
  receiptCountToday: z.number(),
  transactionCountToday: z.number(),
  statusCounts: z.array(z.object({
    scope: z.string(),
    statusCode: z.string(),
    statusLabel: z.string().nullable(),
    count: z.number(),
  })),
  balanceVarianceCount: z.number(),
  totalAbsoluteVariance: z.number(),
});

export function OperationsSummaryPage() {
  const query = useQuery({
    queryKey: ['ADM-03'],
    queryFn: ({ signal }) => apiGet('/operations/summary', operationsSummarySchema, signal),
    refetchInterval: 60_000,
  });

  return (
    <>
      <PageHeader useCaseId="ADM-03" title="Giám sát vận hành" description="Tổng hợp nhanh trạng thái kho và các ngoại lệ cần chú ý." />
      <QueryState isLoading={query.isLoading} error={query.error} onRetry={() => void query.refetch()}>
        {query.data ? (
          <>
            <section className="kpi-grid" aria-label="Chỉ số vận hành">
              <article><span>Vật tư có tồn</span><strong>{query.data.inventoryMaterialCount}</strong></article>
              <article><span>Batch hoạt động</span><strong>{query.data.activeBatchCount}</strong></article>
              <article><span>Batch chưa có vị trí</span><strong>{query.data.unlocatedBatchCount}</strong></article>
              <article><span>Phiếu nhận hôm nay</span><strong>{query.data.receiptCountToday}</strong></article>
              <article><span>Giao dịch hôm nay</span><strong>{query.data.transactionCountToday}</strong></article>
              <article className={query.data.balanceVarianceCount > 0 ? 'danger' : 'success'}>
                <span>Vật tư lệch tồn</span><strong>{query.data.balanceVarianceCount}</strong>
                <small>{formatQuantity(query.data.totalAbsoluteVariance)}</small>
              </article>
            </section>
            <DataTable
              caption="Số lượng theo trạng thái"
              rows={query.data.statusCounts}
              rowKey={(row) => `${row.scope}-${row.statusCode}`}
              columns={[
                { key: 'scope', header: 'Phạm vi', render: (row) => row.scope },
                { key: 'status', header: 'Trạng thái', render: (row) => row.statusLabel ?? row.statusCode },
                { key: 'count', header: 'Số lượng', align: 'right', render: (row) => row.count },
              ]}
            />
          </>
        ) : null}
      </QueryState>
    </>
  );
}

