import { z } from 'zod';

const nullableString = z.string().nullable();
const nullableDate = z.string().nullable();

export const purchaseOrderPageSchema = z.object({
  items: z.array(z.object({
    purchaseOrder: z.string(), customerCode: nullableString, orderDate: nullableDate,
    deliveryDate: nullableDate, remainingQuantity: z.number(),
  })),
  lines: z.array(z.object({
    purchaseOrder: z.string(), purchaseOrderKey: z.string(), materialId: nullableString,
    bravoId: nullableString, materialName: nullableString, orderedQuantity: z.number(),
    receivedQuantity: z.number(), remainingQuantity: z.number(), unit: nullableString,
    deliveryDate: nullableDate,
  })),
  totalCount: z.number(), page: z.number(), pageSize: z.number(),
});

export const materialOptionPageSchema = z.object({
  items: z.array(z.object({
    materialId: z.string(), bravoId: nullableString, materialName: nullableString,
    unit: nullableString, supplierCode: nullableString, materialGroupCode: nullableString,
  })),
  totalCount: z.number(), page: z.number(), pageSize: z.number(),
});

export const receiptCommandResultSchema = z.object({
  receiptId: z.number(), statusCode: z.string(), lineCount: z.number(), changedAt: z.string(),
});

const receiptLineSchema = z.object({
  receivingLineId: z.number(), receiptId: z.number(), purchaseOrderKey: nullableString,
  materialId: nullableString, materialName: nullableString, documentQuantity: z.number(),
  receivedQuantity: z.number(), unit: nullableString, deliveryDate: nullableDate,
  lineStatusCode: nullableString, qcResultCode: nullableString,
});

export const receiptDetailSchema = z.object({
  header: z.object({
    receiptId: z.number(), warehouseCode: nullableString, customerName: nullableString,
    purchaseOrder: nullableString, statusCode: nullableString, createdBy: nullableString,
    createdAt: nullableDate, canEdit: z.boolean(), changedAt: nullableDate,
  }).nullable(),
  lines: z.array(receiptLineSchema),
  images: z.array(z.object({ imageId: z.number(), category: nullableString, imageLink: nullableString, createdAt: nullableDate })),
});

export const unmatchedReceiptPageSchema = z.object({
  items: z.array(z.object({
    receiptId: z.number(), warehouseCode: nullableString, customerName: nullableString,
    statusCode: nullableString, createdBy: nullableString, createdAt: nullableDate, lineCount: z.number(),
  })),
  lines: z.array(z.object({
    receivingLineId: z.number(), receiptId: z.number(), materialId: nullableString,
    materialName: nullableString, receivedQuantity: z.number(), unit: nullableString,
  })),
  totalCount: z.number(), page: z.number(), pageSize: z.number(),
});

export const attachPurchaseOrderResultSchema = z.object({
  receiptId: z.number(), purchaseOrder: z.string(), assignmentCount: z.number(), changedAt: z.string(),
});

export const purchaseOrderMatchesSchema = z.object({
  lines: z.array(z.object({
    receivingLineId: z.number(), materialId: nullableString, materialName: nullableString,
    receivedQuantity: z.number(), unit: nullableString,
  })),
  matches: z.array(z.object({
    receivingLineId: z.number(), purchaseOrder: z.string(), purchaseOrderKey: z.string(),
    customerCode: nullableString, materialId: nullableString, materialName: nullableString,
    unit: nullableString, remainingQuantity: z.number(), deliveryDate: nullableDate,
  })),
});

export const warehouseQueuePageSchema = z.object({
  items: z.array(z.object({
    receiptId: z.number(), warehouseCode: nullableString, customerName: nullableString,
    purchaseOrder: nullableString, statusCode: nullableString, receivedAt: nullableDate,
    pendingLineCount: z.number(),
  })),
  lines: z.array(z.object({
    receivingLineId: z.number(), receiptId: z.number(), materialId: nullableString,
    bravoId: nullableString, materialName: nullableString, receivedQuantity: z.number(),
    batchedQuantity: z.number(), remainingQuantity: z.number(), unit: nullableString,
    lineStatusCode: nullableString, qcResultCode: nullableString,
  })),
  totalCount: z.number(), page: z.number(), pageSize: z.number(),
});

export const processWarehouseReceiptResultSchema = z.object({
  receiptId: z.number(), transactionDocumentId: z.number(), statusCode: z.string(),
  batchCount: z.number(), processedAt: z.string(),
  batches: z.array(z.object({ receivingLineId: z.number(), batchId: z.number() })),
});

export const batchLabelDataSchema = z.object({
  headers: z.array(z.object({
    receiptId: z.number(), purchaseOrder: nullableString, customerName: nullableString,
    warehouseCode: nullableString, receiptStatusCode: nullableString,
    transactionDocumentId: z.number(), transactionStatusCode: nullableString, printedAt: z.string(),
  })),
  labels: z.array(z.object({
    batchId: z.number(), barcodeValue: z.string(), receiptId: z.number(),
    transactionDocumentId: z.number(), materialId: nullableString, bravoId: nullableString,
    materialName: nullableString, quantity: z.number(), unit: nullableString,
    warehouseCode: nullableString, locationCode: nullableString, inventoryStatusCode: nullableString,
    createdBy: nullableString, createdAt: nullableDate,
  })),
});

export type PurchaseOrderPage = z.infer<typeof purchaseOrderPageSchema>;
export type MaterialOptionPage = z.infer<typeof materialOptionPageSchema>;
export type ReceiptDetail = z.infer<typeof receiptDetailSchema>;
export type UnmatchedReceiptPage = z.infer<typeof unmatchedReceiptPageSchema>;
export type PurchaseOrderMatches = z.infer<typeof purchaseOrderMatchesSchema>;
export type WarehouseQueuePage = z.infer<typeof warehouseQueuePageSchema>;
export type BatchLabelData = z.infer<typeof batchLabelDataSchema>;

