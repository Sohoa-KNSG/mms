import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { apiGet } from '../../shared/api/client';
import { DataTable } from '../../shared/components/DataTable';
import { PageHeader } from '../../shared/components/PageHeader';
import { QueryState } from '../../shared/components/QueryState';
import { formatDateTime, formatQuantity } from '../../shared/format';

const materialHistorySchema = z.object({
  material: z.object({
    materialId: z.string(),
    bravoId: z.string().nullable(),
    materialName: z.string().nullable(),
    unit: z.string().nullable(),
    currentBalance: z.number(),
  }),
  items: z.array(z.object({
    transactionId: z.number(),
    batchId: z.number().nullable(),
    documentId: z.number().nullable(),
    operationCode: z.string().nullable(),
    operationName: z.string().nullable(),
    quantity: z.number(),
    signedQuantity: z.number(),
    occurredAt: z.string().nullable(),
    statusCode: z.string().nullable(),
  })),
  totalCount: z.number(),
});

export function MaterialHistoryPage() {
  const params = useParams();
  const [materialId, setMaterialId] = useState(params.materialId ?? '');
  const enabled = materialId.trim().length > 0;
  const query = useQuery({
    queryKey: ['INV-03', materialId],
    queryFn: ({ signal }) => apiGet(`/materials/${encodeURIComponent(materialId)}/history?page=1&pageSize=100`, materialHistorySchema, signal),
    enabled,
  });

  return (
    <>
      <PageHeader useCaseId="INV-03" title="Lịch sử vật tư" description="Tra cứu số dư và các giao dịch theo mã vật tư." />
      <div className="filter-bar">
        <label>
          <span>Mã vật tư</span>
          <input value={materialId} onChange={(event) => setMaterialId(event.target.value)} placeholder="Nhập mã vật tư" />
        </label>
      </div>
      {!enabled ? <div className="state-panel">Nhập mã vật tư để tra cứu.</div> : null}
      {enabled ? (
        <QueryState isLoading={query.isLoading} error={query.error} onRetry={() => void query.refetch()}>
          {query.data ? (
            <>
              <section className="summary-strip" aria-label="Tóm tắt vật tư">
                <div><span>Mã vật tư</span><strong>{query.data.material.materialId}</strong></div>
                <div><span>Tên vật tư</span><strong>{query.data.material.materialName ?? '—'}</strong></div>
                <div><span>Tồn hiện tại</span><strong>{formatQuantity(query.data.material.currentBalance)} {query.data.material.unit ?? ''}</strong></div>
              </section>
              <DataTable
                caption="Lịch sử giao dịch vật tư"
                rows={query.data.items}
                rowKey={(row) => String(row.transactionId)}
                columns={[
                  { key: 'time', header: 'Thời điểm', render: (row) => formatDateTime(row.occurredAt) },
                  { key: 'operation', header: 'Nghiệp vụ', render: (row) => row.operationName ?? row.operationCode ?? '—' },
                  { key: 'batch', header: 'Batch', render: (row) => row.batchId ?? '—' },
                  { key: 'document', header: 'Chứng từ', render: (row) => row.documentId ?? '—' },
                  { key: 'quantity', header: 'Số lượng', align: 'right', render: (row) => formatQuantity(row.quantity) },
                  { key: 'signed', header: 'Ảnh hưởng tồn', align: 'right', render: (row) => formatQuantity(row.signedQuantity) },
                  { key: 'status', header: 'Trạng thái', render: (row) => row.statusCode ?? '—' },
                ]}
              />
            </>
          ) : null}
        </QueryState>
      ) : null}
    </>
  );
}

