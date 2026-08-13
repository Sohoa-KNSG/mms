using System.Security.Claims;

namespace Mms.Api.Modules.Quality;

public static class QualityEndpoints
{
    public static IEndpointRouteBuilder MapQualityEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/quality")
            .RequireAuthorization()
            .WithTags("Quality");

        group.MapGet("/configuration", async (
            ClaimsPrincipal principal,
            QualityGateway gateway,
            int? checkId,
            CancellationToken cancellationToken) =>
            Results.Ok(await gateway.GetConfigurationAsync(
                GetUserId(principal), PositiveOrNull(checkId), cancellationToken)))
            .WithName("QC-01_GetConfiguration");

        group.MapPut("/configuration", async (
            ClaimsPrincipal principal,
            QualityGateway gateway,
            SaveQcConfigurationRequest request,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.QcGroupCode)
                || string.IsNullOrWhiteSpace(request.QcGroupName)
                || request.Criteria.Count is < 1 or > 200
                || request.Criteria.Any(item =>
                    string.IsNullOrWhiteSpace(item.CriterionCode)
                    || string.IsNullOrWhiteSpace(item.CriterionName)))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["configuration"] = ["Nhóm QC và 1-200 tiêu chí hợp lệ là bắt buộc."],
                });
            }

            return Results.Ok(await gateway.SaveConfigurationAsync(
                GetUserId(principal), request, cancellationToken));
        }).WithName("QC-01_SaveCriteria");

        group.MapGet("/material-assignments", async (
            ClaimsPrincipal principal,
            QualityGateway gateway,
            string? search,
            int? page,
            int? pageSize,
            CancellationToken cancellationToken) =>
        {
            var paging = NormalizePaging(page, pageSize);
            return Results.Ok(await gateway.GetMaterialAssignmentsAsync(
                GetUserId(principal), search, paging.Page, paging.PageSize, cancellationToken));
        }).WithName("QC-02_GetMaterialAssignments");

        group.MapPut("/material-assignments", async (
            ClaimsPrincipal principal,
            QualityGateway gateway,
            AssignMaterialCheckRequest request,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.Scope)
                || string.IsNullOrWhiteSpace(request.TargetCode)
                || request.TargetCode.Length > 50)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["assignment"] = ["Phạm vi và mã đối tượng gán QC là bắt buộc."],
                });
            }

            return Results.Ok(await gateway.AssignMaterialCheckAsync(
                GetUserId(principal), request, cancellationToken));
        }).WithName("QC-02_AssignMaterialCheck");

        group.MapGet("/inspection-candidates", async (
            ClaimsPrincipal principal,
            QualityGateway gateway,
            string? search,
            int? receiptId,
            int? page,
            int? pageSize,
            CancellationToken cancellationToken) =>
        {
            var paging = NormalizePaging(page, pageSize);
            return Results.Ok(await gateway.GetInspectionCandidatesAsync(
                GetUserId(principal), search, PositiveOrNull(receiptId),
                paging.Page, paging.PageSize, cancellationToken));
        }).WithName("QC-03_GetInspectionCandidates");

        group.MapPost("/inspections", async (
            ClaimsPrincipal principal,
            QualityGateway gateway,
            CreateInspectionRequest request,
            CancellationToken cancellationToken) =>
        {
            if (request.ReceiptId <= 0)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["receiptId"] = ["Mã phiếu nhận phải lớn hơn 0."],
                });
            }

            var result = await gateway.CreateInspectionAsync(
                GetUserId(principal), request, cancellationToken);
            return Results.Created($"/api/v1/quality/inspections/{result.InspectionId}", result);
        }).WithName("QC-03_CreateInspection");

        group.MapGet("/inspections/{inspectionId:int}/evaluation", async (
            ClaimsPrincipal principal,
            QualityGateway gateway,
            int inspectionId,
            int? receivingLineId,
            CancellationToken cancellationToken) =>
        {
            if (inspectionId <= 0)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["inspectionId"] = ["Mã phiếu kiểm phải lớn hơn 0."],
                });
            }

            var result = await gateway.GetEvaluationAsync(
                GetUserId(principal), inspectionId, PositiveOrNull(receivingLineId), cancellationToken);
            return result.Inspection is null ? Results.NotFound() : Results.Ok(result);
        }).WithName("QC-04_GetEvaluation");

        group.MapPost("/inspections/{inspectionId:int}/evaluation", async (
            ClaimsPrincipal principal,
            QualityGateway gateway,
            int inspectionId,
            EvaluateMaterialRequest request,
            CancellationToken cancellationToken) =>
        {
            if (inspectionId <= 0 || request.ReceivingLineId <= 0
                || request.Results.Count is < 1 or > 200)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["evaluation"] = ["Phiếu kiểm, dòng nhận và 1-200 kết quả tiêu chí là bắt buộc."],
                });
            }

            return Results.Ok(await gateway.EvaluateMaterialAsync(
                GetUserId(principal), inspectionId, request, cancellationToken));
        }).WithName("QC-04_EvaluateMaterial");

        group.MapGet("/inspections/history", async (
            ClaimsPrincipal principal,
            QualityGateway gateway,
            string? search,
            int? inspectionId,
            int? page,
            int? pageSize,
            CancellationToken cancellationToken) =>
        {
            var paging = NormalizePaging(page, pageSize);
            return Results.Ok(await gateway.GetInspectionHistoryAsync(
                GetUserId(principal), search, PositiveOrNull(inspectionId),
                paging.Page, paging.PageSize, cancellationToken));
        }).WithName("QC-05_GetInspectionHistory");

        group.MapPut("/inspection-results/{qcResultId:int}", async (
            ClaimsPrincipal principal,
            QualityGateway gateway,
            int qcResultId,
            UpdateInspectionResultRequest request,
            CancellationToken cancellationToken) =>
        {
            if (qcResultId <= 0)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["qcResultId"] = ["Mã kết quả QC phải lớn hơn 0."],
                });
            }

            return Results.Ok(await gateway.UpdateInspectionResultAsync(
                GetUserId(principal), qcResultId, request, cancellationToken));
        }).WithName("QC-05_UpdateInspectionResult");

        group.MapGet("/inspections/{inspectionId:int}/print", async (
            ClaimsPrincipal principal,
            QualityGateway gateway,
            int inspectionId,
            CancellationToken cancellationToken) =>
        {
            if (inspectionId <= 0)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["inspectionId"] = ["Mã phiếu kiểm phải lớn hơn 0."],
                });
            }

            return Results.Ok(await gateway.GetInspectionPrintDataAsync(
                GetUserId(principal), inspectionId, cancellationToken));
        }).WithName("QC-06_GetInspectionPrintData");

        return endpoints;
    }

    private static string GetUserId(ClaimsPrincipal principal) =>
        principal.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? principal.Identity?.Name
        ?? throw new UnauthorizedAccessException("Không có user identity.");

    private static int? PositiveOrNull(int? value) => value is > 0 ? value : null;

    private static (int Page, int PageSize) NormalizePaging(int? page, int? pageSize) =>
        (Math.Max(page ?? 1, 1), Math.Clamp(pageSize ?? 50, 1, 200));
}

