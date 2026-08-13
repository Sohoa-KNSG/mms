namespace Mms.Api.Modules.Quality;

public sealed record QcGroup(string GroupCode, string? GroupName, DateTime? ChangedAt);
public sealed record QcCheckConfiguration(
    int CheckId,
    int? DeclarationLevel,
    string? MaterialId,
    string? QcGroupCode,
    string? QcGroupName,
    string? MaterialGroupCode,
    DateTime? ChangedAt);
public sealed record QcCriterion(
    int CriterionId,
    int? CheckId,
    string? CriterionCode,
    string? CriterionName,
    string? Specification,
    string? SampleImage,
    DateTime? ChangedAt);
public sealed record QcCriterionDefinition(
    int DefinitionId,
    string? CriterionCode,
    string? CriterionName,
    bool IsActive,
    DateTime? ChangedAt);
public sealed record QcConfigurationModel(
    IReadOnlyList<QcGroup> Groups,
    IReadOnlyList<QcCheckConfiguration> Checks,
    IReadOnlyList<QcCriterion> Criteria,
    IReadOnlyList<QcCriterionDefinition> Definitions);

public sealed record QcCriterionInput(
    int? CriterionId,
    string CriterionCode,
    string CriterionName,
    string? Specification,
    string? SampleImage);
public sealed record SaveQcConfigurationRequest(
    int? CheckId,
    string QcGroupCode,
    string QcGroupName,
    int DeclarationLevel,
    string? MaterialGroupCode,
    string? MaterialId,
    DateTime? ExpectedChangedAt,
    IReadOnlyList<QcCriterionInput> Criteria);
public sealed record SaveQcConfigurationResult(
    int CheckId,
    string QcGroupCode,
    int DeclarationLevel,
    string? MaterialGroupCode,
    string? MaterialId,
    DateTime ChangedAt,
    int CriterionCount);

public sealed record MaterialQcAssignment(
    string MaterialId,
    string? BravoId,
    string? MaterialName,
    string? Unit,
    string? MaterialGroupCode,
    int? CheckId,
    string? QcGroupCode,
    string? QcGroupName);
public sealed record QcCheckOption(
    int CheckId,
    int? DeclarationLevel,
    string? MaterialId,
    string? QcGroupCode,
    string? QcGroupName);
public sealed record MaterialAssignmentPage(
    IReadOnlyList<MaterialQcAssignment> Items,
    long TotalCount,
    int Page,
    int PageSize,
    IReadOnlyList<QcCheckOption> Checks);
public sealed record AssignMaterialCheckRequest(
    string Scope,
    string TargetCode,
    int? CheckId,
    int? ExpectedCheckId);
public sealed record AssignMaterialCheckResult(
    string Scope,
    string TargetCode,
    int? CheckId,
    int AffectedMaterialCount,
    DateTime ChangedAt);

public sealed record InspectionCandidate(
    int ReceiptId,
    string? PurchaseOrder,
    string? CustomerName,
    string? WarehouseCode,
    string? ReceiptStatus,
    DateTime? ReceivedAt,
    int PendingMaterialCount);
public sealed record InspectionCandidateLine(
    int ReceivingLineId,
    int? ReceiptId,
    string? MaterialId,
    string? MaterialName,
    decimal QuantityReceived,
    string? Unit,
    int? CheckId,
    string? QcGroupCode,
    string? QcGroupName);
public sealed record InspectionCandidates(
    IReadOnlyList<InspectionCandidate> Items,
    long TotalCount,
    int Page,
    int PageSize,
    IReadOnlyList<InspectionCandidateLine> Lines);
public sealed record CreateInspectionRequest(int ReceiptId, string? Note);
public sealed record CreateInspectionResult(
    int InspectionId,
    int ReceiptId,
    DateTime? CreatedAt,
    bool IsExisting);

public sealed record InspectionHeader(
    int InspectionId,
    int? ReceiptId,
    int Status,
    string? Note,
    string? CreatedBy,
    DateTime? CreatedAt,
    string? PurchaseOrder,
    string? CustomerName);
public sealed record EvaluationMaterial(
    int ReceivingLineId,
    string? MaterialId,
    string? MaterialName,
    decimal QuantityReceived,
    string? Unit,
    string? OverallResultCode,
    int? CheckId);
public sealed record EvaluationCriterion(
    int ReceivingLineId,
    int CriterionId,
    string? CriterionCode,
    string? CriterionName,
    string? Specification,
    string? SampleImage,
    string? ResultCode,
    string? DefectNote);
public sealed record InspectionEvaluation(
    InspectionHeader? Inspection,
    IReadOnlyList<EvaluationMaterial> Materials,
    IReadOnlyList<EvaluationCriterion> Criteria);
public sealed record QcEvaluationInput(int CriterionId, string ResultCode, string? DefectNote);
public sealed record EvaluateMaterialRequest(
    int ReceivingLineId,
    string InspectionType,
    decimal InspectedQuantity,
    decimal FailedQuantity,
    string OverallResultCode,
    IReadOnlyList<QcEvaluationInput> Results);
public sealed record EvaluateMaterialResult(
    int InspectionId,
    int ReceivingLineId,
    string OverallResultCode,
    int ResultCount,
    DateTime EvaluatedAt);

public sealed record InspectionHistoryItem(
    int InspectionId,
    int? ReceiptId,
    string? PurchaseOrder,
    string? CustomerName,
    int Status,
    string? Note,
    string? CreatedBy,
    DateTime? CreatedAt,
    int EvaluatedMaterialCount,
    int ResultRowCount);
public sealed record InspectionResultDetail(
    int QcResultId,
    int? InspectionId,
    int? ReceivingLineId,
    string? MaterialId,
    string? MaterialName,
    int? CriterionId,
    string? CriterionCode,
    string? CriterionName,
    string? InspectionType,
    decimal? InspectedQuantity,
    decimal? FailedQuantity,
    string? ResultCode,
    string? OverallResultCode,
    string? DefectNote,
    string? Unit,
    string? ActorId,
    DateTime? ChangedAt,
    bool IsLocked);
public sealed record InspectionHistoryPage(
    IReadOnlyList<InspectionHistoryItem> Items,
    long TotalCount,
    int Page,
    int PageSize,
    IReadOnlyList<InspectionResultDetail> Details);
public sealed record UpdateInspectionResultRequest(
    string InspectionType,
    decimal InspectedQuantity,
    decimal FailedQuantity,
    string ResultCode,
    string OverallResultCode,
    string? DefectNote,
    DateTime ExpectedChangedAt);
public sealed record UpdateInspectionResultResult(
    int QcResultId,
    int InspectionId,
    int ReceivingLineId,
    DateTime ChangedAt);

public sealed record InspectionPrintHeader(
    int InspectionId,
    int? ReceiptId,
    string? PurchaseOrder,
    string? CustomerName,
    string? WarehouseCode,
    string? Note,
    string? CreatedBy,
    string? CreatedByName,
    DateTime? CreatedAt,
    DateTime PrintedAt);
public sealed record InspectionPrintMaterial(
    int ReceivingLineId,
    string? MaterialId,
    string? MaterialName,
    decimal QuantityReceived,
    string? Unit,
    string? OverallResultCode,
    string? OverallResultLabel,
    string? InspectionType,
    decimal? InspectedQuantity,
    decimal? FailedQuantity);
public sealed record InspectionPrintCriterion(
    int? ReceivingLineId,
    int? CriterionId,
    string? CriterionCode,
    string? CriterionName,
    string? Specification,
    string? ResultCode,
    string? DefectNote);
public sealed record InspectionPrintData(
    InspectionPrintHeader Header,
    IReadOnlyList<InspectionPrintMaterial> Materials,
    IReadOnlyList<InspectionPrintCriterion> Criteria);

