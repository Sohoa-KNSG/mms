import { z } from 'zod';

const nullableString = z.string().nullable();
const nullableNumber = z.number().nullable();
const nullableDate = z.string().nullable();

export const pickingQueueItemSchema = z.object({
  requestId: z.number(), departmentCode: nullableString, requesterName: nullableString,
  neededAt: nullableDate, approvedAt: nullableDate, destinationBravoCode: nullableString,
  destinationName: nullableString, pickingStatusCode: nullableString, pickingStatus: z.string(),
  issueDocumentId: nullableNumber, issueDocumentStatusCode: nullableString, lineCount: z.number(),
  requestedQuantity: z.number(), issuedQuantity: z.number(), changedAt: nullableDate,
});
export const pickingQueueSchema = z.object({ items: z.array(pickingQueueItemSchema), totalCount: z.number(), page: z.number(), pageSize: z.number() });
export const pickingHeaderSchema = z.object({
  requestId: z.number(), departmentCode: nullableString, requesterName: nullableString,
  neededAt: nullableDate, approvedAt: nullableDate, destinationBravoCode: nullableString,
  destinationName: nullableString, requestStatusCode: nullableString, pickingStatusCode: nullableString,
  issueDocumentId: nullableNumber, issueDocumentStatusCode: nullableString,
  canStart: z.boolean(), canPick: z.boolean(), canComplete: z.boolean(), changedAt: nullableDate,
});
export const pickingLineSchema = z.object({
  lineId: z.number(), materialId: nullableString, bravoId: nullableString, materialName: nullableString,
  requestedQuantity: z.number(), issuedQuantity: z.number(), remainingQuantity: z.number(),
  availableQuantity: z.number(), unit: nullableString, destinationBravoCode: nullableString, note: nullableString,
});
export const pickTransactionSchema = z.object({
  transactionId: z.number(), batchId: nullableNumber, lineId: z.number(), materialId: nullableString,
  quantity: z.number(), unit: nullableString, locationCode: nullableString, createdAt: nullableDate,
});
export const pickingRequestSchema = z.object({ header: pickingHeaderSchema, lines: z.array(pickingLineSchema), transactions: z.array(pickTransactionSchema) });
export const startedPickingSchema = z.object({ requestId: z.number(), issueDocumentId: z.number(), pickingStatusCode: z.string(), startedAt: z.string() });
export const pickableBatchSchema = z.object({
  batchId: z.number(), materialId: z.string(), bravoId: nullableString, materialName: nullableString,
  availableQuantity: z.number(), unit: nullableString, locationCode: nullableString,
  locationName: nullableString, receivedAt: nullableDate, changedAt: nullableDate,
});
export const pickableBatchesSchema = z.array(pickableBatchSchema);
export const pickedBatchSchema = z.object({
  requestId: z.number(), lineId: z.number(), batchId: z.number(), transactionId: z.number(),
  issueDocumentId: z.number(), issuedQuantity: z.number(), remainingLineQuantity: z.number(),
  remainingBatchQuantity: z.number(), changedAt: z.string(),
});
export const completedGoodsIssueSchema = z.object({ requestId: z.number(), issueDocumentId: z.number(), pickingStatusCode: z.string(), issueDocumentStatusCode: z.string(), completedAt: z.string() });
export const issueDocumentSchema = z.object({
  issueDocumentId: z.number(), requestId: z.number(), requesterName: nullableString,
  departmentCode: nullableString, destinationBravoCode: nullableString, destinationName: nullableString,
  neededAt: nullableDate, createdAt: nullableDate, issueDocumentStatusCode: nullableString,
  totalQuantity: z.number(), batchCount: z.number(),
});
export const issueDocumentsSchema = z.object({ items: z.array(issueDocumentSchema), totalCount: z.number(), page: z.number(), pageSize: z.number() });
export const issuePrintHeaderSchema = z.object({
  issueDocumentId: z.number(), requestId: z.number(), operationCode: nullableString,
  warehouseFrom: nullableString, warehouseTo: nullableString, receiverName: nullableString,
  createdBy: nullableString, bravoDocumentNumber: nullableString, createdAt: nullableDate,
  issueDocumentStatusCode: nullableString, requesterName: nullableString, departmentCode: nullableString,
  destinationBravoCode: nullableString, destinationName: nullableString, neededAt: nullableDate,
});
export const issuePrintLineSchema = z.object({
  lineId: z.number(), materialId: nullableString, bravoId: nullableString, materialName: nullableString,
  requestedQuantity: z.number(), issuedQuantity: z.number(), unit: nullableString, note: nullableString,
});
export const issuePrintTransactionSchema = z.object({
  transactionId: z.number(), batchId: nullableNumber, lineId: z.number(), materialId: nullableString,
  materialName: nullableString, quantity: z.number(), unit: nullableString,
  locationCode: nullableString, createdAt: nullableDate,
});
export const issuePrintDataSchema = z.object({ header: issuePrintHeaderSchema, lines: z.array(issuePrintLineSchema), transactions: z.array(issuePrintTransactionSchema) });

export type PickableBatch = z.infer<typeof pickableBatchSchema>;
