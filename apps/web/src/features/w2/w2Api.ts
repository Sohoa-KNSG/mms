import { apiGet, apiPost, apiPut } from '../../shared/api/client';
import {
  assignMaterialCheckResultSchema,
  configurationItemsSchema,
  createInspectionResultSchema,
  evaluateMaterialResultSchema,
  inspectionCandidatesSchema,
  inspectionEvaluationSchema,
  inspectionHistorySchema,
  inspectionPrintSchema,
  materialAssignmentPageSchema,
  qcConfigurationSchema,
  roleMatrixSchema,
  saveConfigurationResultSchema,
  saveQcConfigurationResultSchema,
  saveRoleResultSchema,
  updateInspectionResultSchema,
} from './contracts';

export interface PermissionInput {
  screenCode: string;
  screenLabel: string | null;
  accessMode: string | null;
}

export interface SaveRoleRequest {
  roleName: string;
  expectedChangedAt: string | null;
  permissions: PermissionInput[];
}

export interface SaveCatalogRequest {
  name: string;
  description: string | null;
  logicValue: string | null;
  displayValue: string | null;
  expectedChangedAt: string | null;
}

export interface QcCriterionInput {
  criterionId: number | null;
  criterionCode: string;
  criterionName: string;
  specification: string | null;
  sampleImage: string | null;
}

export interface SaveQcConfigurationRequest {
  checkId: number | null;
  qcGroupCode: string;
  qcGroupName: string;
  declarationLevel: number;
  materialGroupCode: string | null;
  materialId: string | null;
  expectedChangedAt: string | null;
  criteria: QcCriterionInput[];
}

export interface AssignMaterialCheckRequest {
  scope: 'MATERIAL' | 'MATERIAL_GROUP';
  targetCode: string;
  checkId: number | null;
  expectedCheckId: number | null;
}

export interface EvaluateMaterialRequest {
  receivingLineId: number;
  inspectionType: 'AQL' | '100%';
  inspectedQuantity: number;
  failedQuantity: number;
  overallResultCode: '1' | '2' | '3';
  results: Array<{
    criterionId: number;
    resultCode: 'Đạt' | 'Không Đạt' | 'Không Kiểm';
    defectNote: string | null;
  }>;
}

export interface UpdateInspectionResultRequest {
  inspectionType: 'AQL' | '100%';
  inspectedQuantity: number;
  failedQuantity: number;
  resultCode: 'Đạt' | 'Không Đạt' | 'Không Kiểm';
  overallResultCode: '1' | '2' | '3';
  defectNote: string | null;
  expectedChangedAt: string;
}

export const w2Api = {
  getRoleMatrix: (roleCode: string | null, signal?: AbortSignal) =>
    apiGet(
      `/administration/roles${roleCode ? `?roleCode=${encodeURIComponent(roleCode)}` : ''}`,
      roleMatrixSchema,
      signal,
    ),
  saveRole: (roleCode: string, request: SaveRoleRequest, signal?: AbortSignal) =>
    apiPut(`/administration/roles/${encodeURIComponent(roleCode)}`, request, saveRoleResultSchema, signal),
  getCatalog: (catalogCode: string, signal?: AbortSignal) =>
    apiGet(`/administration/catalogs/${encodeURIComponent(catalogCode)}`, configurationItemsSchema, signal),
  saveCatalogItem: (
    catalogCode: string,
    keyCode: string,
    request: SaveCatalogRequest,
    signal?: AbortSignal,
  ) => apiPut(
    `/administration/catalogs/${encodeURIComponent(catalogCode)}/${encodeURIComponent(keyCode)}`,
    request,
    saveConfigurationResultSchema,
    signal,
  ),
  getQcConfiguration: (checkId: number | null, signal?: AbortSignal) =>
    apiGet(`/quality/configuration${checkId ? `?checkId=${checkId}` : ''}`, qcConfigurationSchema, signal),
  saveQcConfiguration: (request: SaveQcConfigurationRequest, signal?: AbortSignal) =>
    apiPut('/quality/configuration', request, saveQcConfigurationResultSchema, signal),
  getMaterialAssignments: (search: string, signal?: AbortSignal) =>
    apiGet(
      `/quality/material-assignments?search=${encodeURIComponent(search)}&page=1&pageSize=50`,
      materialAssignmentPageSchema,
      signal,
    ),
  assignMaterialCheck: (request: AssignMaterialCheckRequest, signal?: AbortSignal) =>
    apiPut('/quality/material-assignments', request, assignMaterialCheckResultSchema, signal),
  getInspectionCandidates: (search: string, receiptId: number | null, signal?: AbortSignal) => {
    const query = new URLSearchParams({ search, page: '1', pageSize: '50' });
    if (receiptId !== null) query.set('receiptId', String(receiptId));
    return apiGet(`/quality/inspection-candidates?${query.toString()}`, inspectionCandidatesSchema, signal);
  },
  createInspection: (receiptId: number, note: string | null, signal?: AbortSignal) =>
    apiPost('/quality/inspections', { receiptId, note }, createInspectionResultSchema, signal),
  getEvaluation: (inspectionId: number, receivingLineId: number | null, signal?: AbortSignal) =>
    apiGet(
      `/quality/inspections/${inspectionId}/evaluation${receivingLineId ? `?receivingLineId=${receivingLineId}` : ''}`,
      inspectionEvaluationSchema,
      signal,
    ),
  evaluateMaterial: (inspectionId: number, request: EvaluateMaterialRequest, signal?: AbortSignal) =>
    apiPost(`/quality/inspections/${inspectionId}/evaluation`, request, evaluateMaterialResultSchema, signal),
  getInspectionHistory: (search: string, inspectionId: number | null, signal?: AbortSignal) => {
    const query = new URLSearchParams({ search, page: '1', pageSize: '50' });
    if (inspectionId !== null) query.set('inspectionId', String(inspectionId));
    return apiGet(`/quality/inspections/history?${query.toString()}`, inspectionHistorySchema, signal);
  },
  updateInspectionResult: (
    qcResultId: number,
    request: UpdateInspectionResultRequest,
    signal?: AbortSignal,
  ) => apiPut(`/quality/inspection-results/${qcResultId}`, request, updateInspectionResultSchema, signal),
  getInspectionPrintData: (inspectionId: number, signal?: AbortSignal) =>
    apiGet(`/quality/inspections/${inspectionId}/print`, inspectionPrintSchema, signal),
};

