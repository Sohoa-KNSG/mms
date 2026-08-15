using System.Data;
using Microsoft.Data.SqlClient;
using Mms.Api.Infrastructure.Sql;

namespace Mms.Api.Modules.Quality;

public sealed partial class QualityGateway
{
    public async Task<InspectionCandidates> GetInspectionCandidatesAsync(
        string userId,
        string? search,
        int? receiptId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_QC_QC03_GetInspectionCandidates_v1");
        AddUser(command, userId);
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        command.Parameters.Add("@ReceiptId", SqlDbType.Int).Value = DbValue(receiptId);
        command.Parameters.Add("@Page", SqlDbType.Int).Value = page;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var items = new List<InspectionCandidate>();
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new InspectionCandidate(
                reader.GetRequiredInt32("ReceiptId"),
                reader.GetNullableString("PurchaseOrder"),
                reader.GetNullableString("CustomerName"),
                reader.GetNullableString("WarehouseCode"),
                reader.GetNullableString("ReceiptStatus"),
                reader.GetNullableDateTime("ReceivedAt"),
                reader.GetRequiredInt32("PendingMaterialCount")));
        }

        var totalCount = await ReadTotalCountAsync(reader, cancellationToken);
        var lines = new List<InspectionCandidateLine>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                lines.Add(new InspectionCandidateLine(
                    reader.GetRequiredInt32("ReceivingLineId"),
                    reader.GetNullableInt32("ReceiptId"),
                    reader.GetNullableString("MaterialId"),
                    reader.GetNullableString("MaterialName"),
                    reader.GetRequiredDecimal("QuantityReceived"),
                    reader.GetNullableString("Unit"),
                    reader.GetNullableInt32("CheckId"),
                    reader.GetNullableString("QcGroupCode"),
                    reader.GetNullableString("QcGroupName")));
            }
        }

        return new InspectionCandidates(items, totalCount, page, pageSize, lines);
    }

    public async Task<CreateInspectionResult> CreateInspectionAsync(
        string userId,
        CreateInspectionRequest request,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_QC_QC03_CreateInspection_v1");
        AddUser(command, userId);
        command.Parameters.Add("@ReceiptId", SqlDbType.Int).Value = request.ReceiptId;
        command.Parameters.Add("@Note", SqlDbType.NVarChar, -1).Value = DbValue(request.Note);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new InvalidOperationException("SP QC-03 không trả kết quả tạo phiếu kiểm.");
        }

        return new CreateInspectionResult(
            reader.GetRequiredInt32("InspectionId"),
            reader.GetRequiredInt32("ReceiptId"),
            reader.GetNullableDateTime("CreatedAt"),
            reader.GetBoolean(reader.GetOrdinal("IsExisting")));
    }

    public async Task<InspectionEvaluation> GetEvaluationAsync(
        string userId,
        int inspectionId,
        int? receivingLineId,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_QC_QC04_GetEvaluation_v1");
        AddUser(command, userId);
        command.Parameters.Add("@InspectionId", SqlDbType.Int).Value = inspectionId;
        command.Parameters.Add("@ReceivingLineId", SqlDbType.Int).Value = DbValue(receivingLineId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        InspectionHeader? header = null;
        if (await reader.ReadAsync(cancellationToken))
        {
            header = new InspectionHeader(
                reader.GetRequiredInt32("InspectionId"),
                reader.GetNullableInt32("ReceiptId"),
                reader.GetRequiredInt32("Status"),
                reader.GetNullableString("Note"),
                reader.GetNullableString("CreatedBy"),
                reader.GetNullableDateTime("CreatedAt"),
                reader.GetNullableString("PurchaseOrder"),
                reader.GetNullableString("CustomerName"));
        }

        var materials = new List<EvaluationMaterial>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                materials.Add(new EvaluationMaterial(
                    reader.GetRequiredInt32("ReceivingLineId"),
                    reader.GetNullableString("MaterialId"),
                    reader.GetNullableString("MaterialName"),
                    reader.GetRequiredDecimal("QuantityReceived"),
                    reader.GetNullableString("Unit"),
                    reader.GetNullableString("OverallResultCode"),
                    reader.GetNullableInt32("CheckId")));
            }
        }

        var criteria = new List<EvaluationCriterion>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                criteria.Add(new EvaluationCriterion(
                    reader.GetRequiredInt32("ReceivingLineId"),
                    reader.GetRequiredInt32("CriterionId"),
                    reader.GetNullableString("CriterionCode"),
                    reader.GetNullableString("CriterionName"),
                    reader.GetNullableString("Specification"),
                    reader.GetNullableString("SampleImage"),
                    reader.GetNullableString("ResultCode"),
                    reader.GetNullableString("DefectNote")));
            }
        }

        return new InspectionEvaluation(header, materials, criteria);
    }

    public async Task<EvaluateMaterialResult> EvaluateMaterialAsync(
        string userId,
        int inspectionId,
        EvaluateMaterialRequest request,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_QC_QC04_EvaluateMaterial_v1");
        AddUser(command, userId);
        command.Parameters.Add("@InspectionId", SqlDbType.Int).Value = inspectionId;
        command.Parameters.Add("@ReceivingLineId", SqlDbType.Int).Value = request.ReceivingLineId;
        command.Parameters.Add("@InspectionType", SqlDbType.NVarChar, 50).Value = request.InspectionType;
        command.Parameters.Add(DecimalParameter("@InspectedQuantity", request.InspectedQuantity));
        command.Parameters.Add(DecimalParameter("@FailedQuantity", request.FailedQuantity));
        command.Parameters.Add("@OverallResultCode", SqlDbType.NVarChar, 50).Value = request.OverallResultCode;
        command.Parameters.Add(new SqlParameter("@Results", SqlDbType.Structured)
        {
            TypeName = "api.QcEvaluationItem_v1",
            Value = CreateEvaluationTable(request.Results),
        });
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new InvalidOperationException("SP QC-04 không trả kết quả đánh giá.");
        }

        return new EvaluateMaterialResult(
            reader.GetRequiredInt32("InspectionId"),
            reader.GetRequiredInt32("ReceivingLineId"),
            reader.GetRequiredString("OverallResultCode"),
            reader.GetRequiredInt32("ResultCount"),
            reader.GetDateTime(reader.GetOrdinal("EvaluatedAt")));
    }
}

