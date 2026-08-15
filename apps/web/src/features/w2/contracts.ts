import { z } from 'zod';

const nullableString = z.string().nullable();
const nullableNumber = z.number().nullable();
const nullableDate = z.string().nullable();

export const roleMatrixSchema = z.object({
  roles: z.array(z.object({ roleCode: z.string(), roleName: nullableString, changedAt: nullableDate })),
  screens: z.array(z.object({
    screenCode: z.string(),
    screenLabel: nullableString,
    accessMode: nullableString,
    isGranted: z.boolean(),
  })),
});

export const saveRoleResultSchema = z.object({
  roleCode: z.string(),
  roleName: z.string(),
  changedAt: z.string(),
  permissionCount: z.number(),
});

export const configurationItemsSchema = z.array(z.object({
  keyCode: z.string(),
  name: nullableString,
  description: nullableString,
  logicValue: nullableString,
  displayValue: nullableString,
  changedAt: nullableDate,
}));

export const saveConfigurationResultSchema = z.object({
  catalogCode: z.string(),
  keyCode: z.string(),
  name: z.string(),
  description: nullableString,
  logicValue: nullableString,
  displayValue: nullableString,
  changedAt: z.string(),
});

export const qcConfigurationSchema = z.object({
  groups: z.array(z.object({ groupCode: z.string(), groupName: nullableString, changedAt: nullableDate })),
  checks: z.array(z.object({
    checkId: z.number(),
    declarationLevel: nullableNumber,
    materialId: nullableString,
    qcGroupCode: nullableString,
    qcGroupName: nullableString,
    materialGroupCode: nullableString,
    changedAt: nullableDate,
  })),
  criteria: z.array(z.object({
    criterionId: z.number(),
    checkId: nullableNumber,
    criterionCode: nullableString,
    criterionName: nullableString,
    specification: nullableString,
    sampleImage: nullableString,
    changedAt: nullableDate,
  })),
  definitions: z.array(z.object({
    definitionId: z.number(),
    criterionCode: nullableString,
    criterionName: nullableString,
    isActive: z.boolean(),
    changedAt: nullableDate,
  })),
});

export const saveQcConfigurationResultSchema = z.object({
  checkId: z.number(),
  qcGroupCode: z.string(),
  declarationLevel: z.number(),
  materialGroupCode: nullableString,
  materialId: nullableString,
  changedAt: z.string(),
  criterionCount: z.number(),
});

export const materialAssignmentPageSchema = z.object({
  items: z.array(z.object({
    materialId: z.string(),
    bravoId: nullableString,
    materialName: nullableString,
    unit: nullableString,
    materialGroupCode: nullableString,
    checkId: nullableNumber,
    qcGroupCode: nullableString,
    qcGroupName: nullableString,
  })),
  totalCount: z.number(),
  page: z.number(),
  pageSize: z.number(),
  checks: z.array(z.object({
    checkId: z.number(),
    declarationLevel: nullableNumber,
    materialId: nullableString,
    qcGroupCode: nullableString,
    qcGroupName: nullableString,
  })),
});

export const assignMaterialCheckResultSchema = z.object({
  scope: z.string(),
  targetCode: z.string(),
  checkId: nullableNumber,
  affectedMaterialCount: z.number(),
  changedAt: z.string(),
});

export const inspectionCandidatesSchema = z.object({
  items: z.array(z.object({
    receiptId: z.number(),
    purchaseOrder: nullableString,
    customerName: nullableString,
    warehouseCode: nullableString,
    receiptStatus: nullableString,
    receivedAt: nullableDate,
    pendingMaterialCount: z.number(),
  })),
  totalCount: z.number(),
  page: z.number(),
  pageSize: z.number(),
  lines: z.array(z.object({
    receivingLineId: z.number(),
    receiptId: nullableNumber,
    materialId: nullableString,
    materialName: nullableString,
    quantityReceived: z.number(),
    unit: nullableString,
    checkId: nullableNumber,
    qcGroupCode: nullableString,
    qcGroupName: nullableString,
  })),
});

export const createInspectionResultSchema = z.object({
  inspectionId: z.number(),
  receiptId: z.number(),
  createdAt: nullableDate,
  isExisting: z.boolean(),
});

export const inspectionEvaluationSchema = z.object({
  inspection: z.object({
    inspectionId: z.number(),
    receiptId: nullableNumber,
    status: z.number(),
    note: nullableString,
    createdBy: nullableString,
    createdAt: nullableDate,
    purchaseOrder: nullableString,
    customerName: nullableString,
  }).nullable(),
  materials: z.array(z.object({
    receivingLineId: z.number(),
    materialId: nullableString,
    materialName: nullableString,
    quantityReceived: z.number(),
    unit: nullableString,
    overallResultCode: nullableString,
    checkId: nullableNumber,
  })),
  criteria: z.array(z.object({
    receivingLineId: z.number(),
    criterionId: z.number(),
    criterionCode: nullableString,
    criterionName: nullableString,
    specification: nullableString,
    sampleImage: nullableString,
    resultCode: nullableString,
    defectNote: nullableString,
  })),
});

export const evaluateMaterialResultSchema = z.object({
  inspectionId: z.number(),
  receivingLineId: z.number(),
  overallResultCode: z.string(),
  resultCount: z.number(),
  evaluatedAt: z.string(),
});

export const inspectionHistorySchema = z.object({
  items: z.array(z.object({
    inspectionId: z.number(),
    receiptId: nullableNumber,
    purchaseOrder: nullableString,
    customerName: nullableString,
    status: z.number(),
    note: nullableString,
    createdBy: nullableString,
    createdAt: nullableDate,
    evaluatedMaterialCount: z.number(),
    resultRowCount: z.number(),
  })),
  totalCount: z.number(),
  page: z.number(),
  pageSize: z.number(),
  details: z.array(z.object({
    qcResultId: z.number(),
    inspectionId: nullableNumber,
    receivingLineId: nullableNumber,
    materialId: nullableString,
    materialName: nullableString,
    criterionId: nullableNumber,
    criterionCode: nullableString,
    criterionName: nullableString,
    inspectionType: nullableString,
    inspectedQuantity: nullableNumber,
    failedQuantity: nullableNumber,
    resultCode: nullableString,
    overallResultCode: nullableString,
    defectNote: nullableString,
    unit: nullableString,
    actorId: nullableString,
    changedAt: nullableDate,
    isLocked: z.boolean(),
  })),
});

export const updateInspectionResultSchema = z.object({
  qcResultId: z.number(),
  inspectionId: z.number(),
  receivingLineId: z.number(),
  changedAt: z.string(),
});

export const inspectionPrintSchema = z.object({
  header: z.object({
    inspectionId: z.number(),
    receiptId: nullableNumber,
    purchaseOrder: nullableString,
    customerName: nullableString,
    warehouseCode: nullableString,
    note: nullableString,
    createdBy: nullableString,
    createdByName: nullableString,
    createdAt: nullableDate,
    printedAt: z.string(),
  }),
  materials: z.array(z.object({
    receivingLineId: z.number(),
    materialId: nullableString,
    materialName: nullableString,
    quantityReceived: z.number(),
    unit: nullableString,
    overallResultCode: nullableString,
    overallResultLabel: nullableString,
    inspectionType: nullableString,
    inspectedQuantity: nullableNumber,
    failedQuantity: nullableNumber,
  })),
  criteria: z.array(z.object({
    receivingLineId: nullableNumber,
    criterionId: nullableNumber,
    criterionCode: nullableString,
    criterionName: nullableString,
    specification: nullableString,
    resultCode: nullableString,
    defectNote: nullableString,
  })),
});

export type RoleMatrix = z.infer<typeof roleMatrixSchema>;
export type QcConfiguration = z.infer<typeof qcConfigurationSchema>;
export type MaterialAssignmentPage = z.infer<typeof materialAssignmentPageSchema>;
export type InspectionEvaluation = z.infer<typeof inspectionEvaluationSchema>;
export type InspectionHistory = z.infer<typeof inspectionHistorySchema>;
export type InspectionPrintData = z.infer<typeof inspectionPrintSchema>;

