import { z } from 'zod';
const s = z.string().nullable(); const d = z.string().nullable();
export const declarationCatalogSchema = z.object({
  items: z.array(z.object({ materialId: z.string(), bravoId: s, materialName: s, unit: s, currentQuantity: z.number() })),
  locations: z.array(z.object({ locationCode: z.string(), areaCode: s, shelfCode: s, columnNumber: z.number().nullable(), floorNumber: z.number().nullable(), positionNumber: z.number().nullable(), description: s })),
  totalCount: z.number(), page: z.number(), pageSize: z.number(),
});
export const declareInventoryResultSchema = z.object({ transactionDocumentId: z.number(), batchCount: z.number(), createdAt: z.string(), batches: z.array(z.object({ materialId: z.string(), batchId: z.number() })) });
export const splittableBatchPageSchema = z.object({
  items: z.array(z.object({ batchId: z.number(), receivingLineId: z.number().nullable(), warehouseCode: s, materialId: s, bravoId: s, materialName: s, quantity: z.number(), unit: s, locationCode: s, inventoryStatusCode: s, transactionBalance: z.number(), isBalanced: z.boolean(), changedAt: d })),
  totalCount: z.number(), page: z.number(), pageSize: z.number(),
});
export const splitBatchResultSchema = z.object({ sourceBatchId: z.number(), newBatchId: z.number(), transactionDocumentId: z.number(), sourceQuantity: z.number(), newQuantity: z.number(), changedAt: z.string() });
export const batchCountDataSchema = z.object({
  batch: z.object({ batchId: z.number(), materialId: s, bravoId: s, materialName: s, systemQuantity: z.number(), unit: s, warehouseCode: s, locationCode: s, inventoryStatusCode: s, changedAt: d }).nullable(),
  transactions: z.array(z.object({ transactionId: z.number(), transactionDocumentId: z.number().nullable(), operationCode: s, quantity: z.number(), unit: s, createdAt: d })),
});
export const countBatchResultSchema = z.object({ batchId: z.number(), transactionDocumentId: z.number(), previousQuantity: z.number(), actualQuantity: z.number(), differenceQuantity: z.number(), changedAt: z.string() });
export const locationCountDataSchema = z.object({
  location: z.object({ locationCode: z.string(), areaCode: s, shelfCode: s, columnNumber: z.number().nullable(), floorNumber: z.number().nullable(), positionNumber: z.number().nullable(), description: s }).nullable(),
  batches: z.array(z.object({ batchId: z.number(), materialId: s, materialName: s, systemQuantity: z.number(), unit: s, locationCode: s, changedAt: d })),
});
export const countLocationBatchResultSchema = z.object({ locationCode: z.string(), batchId: z.number(), transactionDocumentId: z.number(), previousQuantity: z.number(), actualQuantity: z.number(), differenceQuantity: z.number(), changedAt: z.string() });
const locationBatchSchema = z.object({ batchId: z.number(), materialId: s, materialName: s, quantity: z.number(), unit: s, warehouseCode: s, locationCode: s, changedAt: d });
export const locationWorklistSchema = z.object({
  items: z.array(locationBatchSchema),
  locations: z.array(z.object({ locationCode: z.string(), areaCode: s, shelfCode: s, columnNumber: z.number().nullable(), floorNumber: z.number().nullable(), positionNumber: z.number().nullable(), description: s })),
  totalCount: z.number(), page: z.number(), pageSize: z.number(),
});
export const batchLocationResultSchema = z.object({ locationCode: s, batchCount: z.number(), changedAt: z.string() });

