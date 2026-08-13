import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { apiGet } from '../../shared/api/client';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatDateTime, formatQuantity } from '../../shared/format';

const batchHistorySchema = z.object({
  batch: z.object({
    batchId: z.number(),
    materialId: z.string(),
    materialName: z.string().nullable(),
    quantity: z.number(),
    unit: z.string(),
    warehouseCode: z.string().nullable(),
    locationCode: z.string().nullable(),
    inventoryStatus: z.string(),
  }),
  events: z.array(z.object({
    eventId: z.string(),
    eventType: z.string(),
    eventName: z.string().nullable(),
    quantity: z.number().nullable(),
    actorId: z.string().nullable(),
    occurredAt: z.string().nullable(),
    reference: z.string().nullable(),
  })),
});

export function BatchHistoryPage() {
  const params = useParams();
  const [input, setInput] = useState(params.batchId ?? '');
  const batchId = Number(input);
  const enabled = Number.isInteger(batchId) && batchId > 0;
  const query = useQuery({
    queryKey: ['INV-02', batchId],
    queryFn: ({ signal }) => apiGet(`/batches/${batchId}/history`, batchHistorySchema, signal),
    enabled,
  });

  return (
    <>
      <PageHeader useCaseId="INV-02" title="Lịch sử batch" description="Truy vết giao dịch, sự kiện tồn và sự kiện vị trí của một batch." />
      <div className="filter-bar">
        <label>
          <span>Mã batch</span>
          <input inputMode="numeric" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ví dụ: 10245" />
        </label>
      </div>
      {!enabled ? <div className="state-panel">Nhập mã batch hợp lệ để tra cứu.</div> : null}
      {enabled ? (
        <QueryState isLoading={query.isLoading} error={query.error} onRetry={() => void query.refetch()}>
          {query.data ? (
            <>
              <section className="summary-strip" aria-label="Thông tin batch">
                <div><span>Vật tư</span><strong>{query.data.batch.materialId}</strong></div>
                <div><span>Số lượng</span><strong>{formatQuantity(query.data.batch.quantity)} {query.data.batch.unit}</strong></div>
                <div><span>Vị trí</span><strong>{query.data.batch.locationCode ?? 'Chưa lên kệ'}</strong></div>
                <div><span>Trạng thái</span><strong>{query.data.batch.inventoryStatus}</strong></div>
              </section>
              <DataTable
                caption="Dòng thời gian batch"
                rows={query.data.events}
                rowKey={(row) => row.eventId}
                columns={[
                  { key: 'time', header: 'Thời điểm', render: (row) => formatDateTime(row.occurredAt) },
                  { key: 'type', header: 'Loại', render: (row) => row.eventType },
                  { key: 'name', header: 'Sự kiện', render: (row) => row.eventName ?? '—' },
                  { key: 'quantity', header: 'Số lượng', align: 'right', render: (row) => row.quantity === null ? '—' : formatQuantity(row.quantity) },
                  { key: 'actor', header: 'Người thực hiện', render: (row) => row.actorId ?? '—' },
                  { key: 'reference', header: 'Tham chiếu', render: (row) => row.reference ?? '—' },
                ]}
              />
            </>
          ) : null}
        </QueryState>
      ) : null}
    </>
  );
}

