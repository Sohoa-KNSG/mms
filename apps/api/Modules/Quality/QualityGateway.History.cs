using System.Data;
using Mms.Api.Infrastructure.Sql;

namespace Mms.Api.Modules.Quality;

public sealed partial class QualityGateway
{
    public async Task<InspectionHistoryPage> GetInspectionHistoryAsync(
        string userId,
        string? search,
        int? inspectionId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_QC_QC05_GetInspectionHistory_v1");
        AddUser(command, userId);
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        command.Parameters.Add("@InspectionId", SqlDbType.Int).Value = DbValue(inspectionId);
        command.Parameters.Add("@Page", SqlDbType.Int).Value = page;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var items = new List<InspectionHistoryItem>();
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new InspectionHistoryItem(
                reader.GetRequiredInt32("InspectionId"),
                reader.GetNullableInt32("ReceiptId"),
                reader.GetNullableString("PurchaseOrder"),
                reader.GetNullableString("CustomerName"),
                reader.GetRequiredInt32("Status"),
                reader.GetNullableString("Note"),
                reader.GetNullableString("CreatedBy"),
                reader.GetNullableDateTime("CreatedAt"),
                reader.GetRequiredInt32("EvaluatedMaterialCount"),
                reader.GetRequiredInt32("ResultRowCount")));
        }

        var totalCount = await ReadTotalCountAsync(reader, cancellationToken);
        var details = new List<InspectionResultDetail>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                details.Add(new InspectionResultDetail(
                    reader.GetRequiredInt32("QcResultId"),
                    reader.GetNullableInt32("InspectionId"),
                    reader.GetNullableInt32("ReceivingLineId"),
                    reader.GetNullableString("MaterialId"),
                    reader.GetNullableString("MaterialName"),
                    reader.GetNullableInt32("CriterionId"),
                    reader.GetNullableString("CriterionCode"),
                    reader.GetNullableString("CriterionName"),
                    reader.GetNullableString("InspectionType"),
                    reader.GetNullableDecimal("InspectedQuantity"),
                    reader.GetNullableDecimal("FailedQuantity"),
                    reader.GetNullableString("ResultCode"),
                    reader.GetNullableString("OverallResultCode"),
                    reader.GetNullableString("DefectNote"),
                    reader.GetNullableString("Unit"),
                    reader.GetNullableString("ActorId"),
                    reader.GetNullableDateTime("ChangedAt"),
                    reader.GetBoolean(reader.GetOrdinal("IsLocked"))));
            }
        }

        return new InspectionHistoryPage(items, totalCount, page, pageSize, details);
    }

    public async Task<UpdateInspectionResultResult> UpdateInspectionResultAsync(
        string userId,
        int qcResultId,
        UpdateInspectionResultRequest request,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_QC_QC05_UpdateInspectionResult_v1");
        AddUser(command, userId);
        command.Parameters.Add("@QcResultId", SqlDbType.Int).Value = qcResultId;
        command.Parameters.Add("@InspectionType", SqlDbType.NVarChar, 50).Value = request.InspectionType;
        command.Parameters.Add(DecimalParameter("@InspectedQuantity", request.InspectedQuantity));
        command.Parameters.Add(DecimalParameter("@FailedQuantity", request.FailedQuantity));
        command.Parameters.Add("@ResultCode", SqlDbType.NVarChar, 50).Value = request.ResultCode;
        command.Parameters.Add("@OverallResultCode", SqlDbType.NVarChar, 50).Value = request.OverallResultCode;
        command.Parameters.Add("@DefectNote", SqlDbType.NVarChar, -1).Value = DbValue(request.DefectNote);
        command.Parameters.Add("@ExpectedChangedAt", SqlDbType.DateTime2).Value = request.ExpectedChangedAt;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new InvalidOperationException("SP QC-05 không trả kết quả hiệu chỉnh.");
        }

        return new UpdateInspectionResultResult(
            reader.GetRequiredInt32("QcResultId"),
            reader.GetRequiredInt32("InspectionId"),
            reader.GetRequiredInt32("ReceivingLineId"),
            reader.GetDateTime(reader.GetOrdinal("ChangedAt")));
    }

    public async Task<InspectionPrintData> GetInspectionPrintDataAsync(
        string userId,
        int inspectionId,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_QC_QC06_GetInspectionPrintData_v1");
        AddUser(command, userId);
        command.Parameters.Add("@InspectionId", SqlDbType.Int).Value = inspectionId;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new InvalidOperationException("SP QC-06 không trả phần đầu phiếu in.");
        }

        var header = new InspectionPrintHeader(
            reader.GetRequiredInt32("InspectionId"),
            reader.GetNullableInt32("ReceiptId"),
            reader.GetNullableString("PurchaseOrder"),
            reader.GetNullableString("CustomerName"),
            reader.GetNullableString("WarehouseCode"),
            reader.GetNullableString("Note"),
            reader.GetNullableString("CreatedBy"),
            reader.GetNullableString("CreatedByName"),
            reader.GetNullableDateTime("CreatedAt"),
            reader.GetDateTime(reader.GetOrdinal("PrintedAt")));

        var materials = new List<InspectionPrintMaterial>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                materials.Add(new InspectionPrintMaterial(
                    reader.GetRequiredInt32("ReceivingLineId"),
                    reader.GetNullableString("MaterialId"),
                    reader.GetNullableString("MaterialName"),
                    reader.GetRequiredDecimal("QuantityReceived"),
                    reader.GetNullableString("Unit"),
                    reader.GetNullableString("OverallResultCode"),
                    reader.GetNullableString("OverallResultLabel"),
                    reader.GetNullableString("InspectionType"),
                    reader.GetNullableDecimal("InspectedQuantity"),
                    reader.GetNullableDecimal("FailedQuantity")));
            }
        }

        var criteria = new List<InspectionPrintCriterion>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                criteria.Add(new InspectionPrintCriterion(
                    reader.GetNullableInt32("ReceivingLineId"),
                    reader.GetNullableInt32("CriterionId"),
                    reader.GetNullableString("CriterionCode"),
                    reader.GetNullableString("CriterionName"),
                    reader.GetNullableString("Specification"),
                    reader.GetNullableString("ResultCode"),
                    reader.GetNullableString("DefectNote")));
            }
        }

        return new InspectionPrintData(header, materials, criteria);
    }
}

