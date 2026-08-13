import { z } from 'zod';

const nullableString = z.string().nullable();
const nullableNumber = z.number().nullable();
const nullableDate = z.string().nullable();

export const outboundCatalogSchema = z.object({
  items: z.array(z.object({
    planId: nullableNumber, planningUnit: nullableString, materialId: z.string(), bravoId: nullableString,
    materialName: nullableString, unit: nullableString, limitQuantity: nullableNumber,
    usedQuantity: z.number(), remainingQuantity: nullableNumber, planMonth: nullableString,
    planYear: nullableString, note: nullableString,
  })),
  planningUnits: z.array(z.object({ planningUnit: z.string(), planningUnitName: nullableString })),
  destinations: z.array(z.object({ planningUnit: nullableString, destinationBravoCode: z.string(), destinationName: nullableString })),
  totalCount: z.number(), page: z.number(), pageSize: z.number(),
});
export const createdOutboundRequestSchema = z.object({
  requestId: z.number(), flowId: z.number(), classification: z.string(), approvalRunId: z.number(),
  currentApprovalStep: z.number(), totalApprovalSteps: z.number(), createdAt: z.string(),
});
export const outboundRequestHeaderSchema = z.object({
  requestId: z.number(), departmentCode: nullableString, requesterName: nullableString,
  createdAt: nullableDate, changedAt: nullableDate, flowId: nullableNumber, classification: nullableString,
  planningUnit: nullableString, neededAt: nullableDate, destinationBravoCode: nullableString,
  destinationName: nullableString, requestStatusCode: nullableString, pickingStatusCode: nullableString,
  approvalStatus: z.string(), currentApprovalStep: nullableNumber, totalApprovalSteps: nullableNumber,
  canEdit: z.boolean(), canCancel: z.boolean(), canApprove: z.boolean(),
});
export const outboundRequestLineSchema = z.object({
  lineId: z.number(), planId: nullableNumber, materialId: nullableString, bravoId: nullableString,
  materialName: nullableString, quantity: z.number(), unit: nullableString, neededAt: nullableDate,
  note: nullableString, destinationBravoCode: nullableString,
});
export const approvalHistorySchema = z.object({
  approvalRunId: z.number(), approvalStep: nullableNumber, totalApprovalSteps: nullableNumber,
  approverEmployeeCode: nullableString, approverName: nullableString, approverMail: nullableString,
  approverRank: nullableString, decision: nullableString, decidedAt: nullableDate, note: nullableString,
});
export const outboundRequestDetailSchema = z.object({
  header: outboundRequestHeaderSchema,
  lines: z.array(outboundRequestLineSchema),
  approvals: z.array(approvalHistorySchema),
});
export const changedOutboundRequestSchema = z.object({ requestId: z.number(), changedAt: z.string() });
export const requestQueueItemSchema = outboundRequestHeaderSchema.extend({ lineCount: z.number(), totalQuantity: z.number() });
export const requestQueueSchema = z.object({ items: z.array(requestQueueItemSchema), totalCount: z.number(), page: z.number(), pageSize: z.number() });
export const decidedOutboundRequestSchema = z.object({
  requestId: z.number(), decision: z.string(), decidedStep: z.number(), totalApprovalSteps: z.number(),
  nextApprovalRunId: nullableNumber, isFinal: z.boolean(), changedAt: z.string(),
});

export type OutboundCatalogItem = z.infer<typeof outboundCatalogSchema>['items'][number];
export type OutboundRequestLine = z.infer<typeof outboundRequestLineSchema>;
