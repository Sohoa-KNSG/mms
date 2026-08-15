import { z } from 'zod';

const nullableString = z.string().nullable(); const nullableNumber = z.number().nullable(); const nullableDate = z.string().nullable();
export const returnCatalogSchema = z.object({
  materials: z.array(z.object({ materialId: z.string(), bravoId: nullableString, materialName: nullableString, unit: nullableString })),
  destinations: z.array(z.object({ destinationBravoCode: z.string(), destinationName: nullableString })),
});
export const createdReturnSchema = z.object({ returnId: z.number(), statusCode: z.string(), createdAt: z.string() });
export const returnQueueItemSchema = z.object({
  returnId: z.number(), warehouseCode: nullableString, destinationBravoCode: nullableString, destinationName: nullableString,
  qualityCode: nullableString, warehouseResultCode: nullableString, note: nullableString, createdBy: nullableString,
  returnAt: nullableDate, createdAt: nullableDate, statusCode: nullableString, departmentCode: nullableString,
  lineCount: z.number(), totalQuantity: z.number(),
});
export const returnQueueSchema = z.object({ items: z.array(returnQueueItemSchema), totalCount: z.number(), page: z.number(), pageSize: z.number() });
export const returnHeaderSchema = returnQueueItemSchema.omit({ lineCount: true, totalQuantity: true }).extend({ canConfirm: z.boolean() });
export const returnLineSchema = z.object({ lineId: z.number(), materialId: nullableString, bravoId: nullableString, materialName: nullableString, unit: nullableString, quantity: z.number(), note: nullableString });
export const returnDetailSchema = z.object({ header: returnHeaderSchema, lines: z.array(returnLineSchema) });
export const confirmedReturnSchema = z.object({ returnId: z.number(), resultCode: z.number(), statusCode: z.string(), warehouseResultCode: nullableString, transactionDocumentId: nullableNumber, createdBatchCount: z.number(), changedAt: z.string() });
export const returnDocumentSchema = z.object({ transactionDocumentId: z.number(), returnId: nullableNumber, destinationCode: nullableString, destinationName: nullableString, createdAt: nullableDate, statusCode: nullableString, batchCount: z.number(), totalQuantity: z.number() });
export const returnDocumentsSchema = z.array(returnDocumentSchema);
export const returnBatchSchema = z.object({ transactionId: z.number(), batchId: z.number(), materialId: nullableString, bravoId: nullableString, materialName: nullableString, quantity: z.number(), unit: nullableString, inventoryStatusCode: nullableString, locationCode: nullableString, createdAt: nullableDate, changedAt: nullableDate });
export const returnBatchesSchema = z.array(returnBatchSchema);
export const splitReturnBatchSchema = z.object({ transactionDocumentId: z.number(), sourceBatchId: z.number(), newBatchId: z.number(), sourceQuantity: z.number(), newQuantity: z.number(), changedAt: z.string() });
export type ReturnMaterial = z.infer<typeof returnCatalogSchema>['materials'][number];
export type ReturnBatch = z.infer<typeof returnBatchSchema>;
