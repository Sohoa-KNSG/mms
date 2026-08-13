using System.Data;
using Microsoft.Data.SqlClient;
using Mms.Api.Infrastructure.Sql;

namespace Mms.Api.Modules.Quality;

public sealed partial class QualityGateway
{
    public async Task<QcConfigurationModel> GetConfigurationAsync(
        string userId,
        int? checkId,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_QC_QC01_GetConfiguration_v1");
        AddUser(command, userId);
        command.Parameters.Add("@CheckId", SqlDbType.Int).Value = DbValue(checkId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var groups = new List<QcGroup>();
        while (await reader.ReadAsync(cancellationToken))
        {
            groups.Add(new QcGroup(
                reader.GetRequiredString("GroupCode"),
                reader.GetNullableString("GroupName"),
                reader.GetNullableDateTime("ChangedAt")));
        }

        var checks = new List<QcCheckConfiguration>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                checks.Add(new QcCheckConfiguration(
                    reader.GetRequiredInt32("CheckId"),
                    reader.GetNullableInt32("DeclarationLevel"),
                    reader.GetNullableString("MaterialId"),
                    reader.GetNullableString("QcGroupCode"),
                    reader.GetNullableString("QcGroupName"),
                    reader.GetNullableString("MaterialGroupCode"),
                    reader.GetNullableDateTime("ChangedAt")));
            }
        }

        var criteria = new List<QcCriterion>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                criteria.Add(new QcCriterion(
                    reader.GetRequiredInt32("CriterionId"),
                    reader.GetNullableInt32("CheckId"),
                    reader.GetNullableString("CriterionCode"),
                    reader.GetNullableString("CriterionName"),
                    reader.GetNullableString("Specification"),
                    reader.GetNullableString("SampleImage"),
                    reader.GetNullableDateTime("ChangedAt")));
            }
        }

        var definitions = new List<QcCriterionDefinition>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                definitions.Add(new QcCriterionDefinition(
                    reader.GetRequiredInt32("DefinitionId"),
                    reader.GetNullableString("CriterionCode"),
                    reader.GetNullableString("CriterionName"),
                    reader.GetBoolean(reader.GetOrdinal("IsActive")),
                    reader.GetNullableDateTime("ChangedAt")));
            }
        }

        return new QcConfigurationModel(groups, checks, criteria, definitions);
    }

    public async Task<SaveQcConfigurationResult> SaveConfigurationAsync(
        string userId,
        SaveQcConfigurationRequest request,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_QC_QC01_SaveCriteria_v1");
        AddUser(command, userId);
        command.Parameters.Add("@CheckId", SqlDbType.Int).Value = DbValue(request.CheckId);
        command.Parameters.Add("@QcGroupCode", SqlDbType.NVarChar, 50).Value = request.QcGroupCode;
        command.Parameters.Add("@QcGroupName", SqlDbType.NVarChar, 100).Value = request.QcGroupName;
        command.Parameters.Add("@DeclarationLevel", SqlDbType.Int).Value = request.DeclarationLevel;
        command.Parameters.Add("@MaterialGroupCode", SqlDbType.NVarChar, 50).Value = DbValue(request.MaterialGroupCode);
        command.Parameters.Add("@MaterialId", SqlDbType.NVarChar, 50).Value = DbValue(request.MaterialId);
        command.Parameters.Add("@ExpectedChangedAt", SqlDbType.DateTime2).Value = DbValue(request.ExpectedChangedAt);
        command.Parameters.Add(new SqlParameter("@Criteria", SqlDbType.Structured)
        {
            TypeName = "api.QcCriterionItem_v1",
            Value = CreateCriterionTable(request.Criteria),
        });

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new InvalidOperationException("SP QC-01 không trả kết quả lưu cấu hình.");
        }

        return new SaveQcConfigurationResult(
            reader.GetRequiredInt32("CheckId"),
            reader.GetRequiredString("QcGroupCode"),
            reader.GetRequiredInt32("DeclarationLevel"),
            reader.GetNullableString("MaterialGroupCode"),
            reader.GetNullableString("MaterialId"),
            reader.GetDateTime(reader.GetOrdinal("ChangedAt")),
            reader.GetRequiredInt32("CriterionCount"));
    }

    public async Task<MaterialAssignmentPage> GetMaterialAssignmentsAsync(
        string userId,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_QC_QC02_GetMaterialAssignments_v1");
        AddUser(command, userId);
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        command.Parameters.Add("@Page", SqlDbType.Int).Value = page;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var items = new List<MaterialQcAssignment>();
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new MaterialQcAssignment(
                reader.GetRequiredString("MaterialId"),
                reader.GetNullableString("BravoId"),
                reader.GetNullableString("MaterialName"),
                reader.GetNullableString("Unit"),
                reader.GetNullableString("MaterialGroupCode"),
                reader.GetNullableInt32("CheckId"),
                reader.GetNullableString("QcGroupCode"),
                reader.GetNullableString("QcGroupName")));
        }

        var totalCount = await ReadTotalCountAsync(reader, cancellationToken);
        var checks = new List<QcCheckOption>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                checks.Add(new QcCheckOption(
                    reader.GetRequiredInt32("CheckId"),
                    reader.GetNullableInt32("DeclarationLevel"),
                    reader.GetNullableString("MaterialId"),
                    reader.GetNullableString("QcGroupCode"),
                    reader.GetNullableString("QcGroupName")));
            }
        }

        return new MaterialAssignmentPage(items, totalCount, page, pageSize, checks);
    }

    public async Task<AssignMaterialCheckResult> AssignMaterialCheckAsync(
        string userId,
        AssignMaterialCheckRequest request,
        CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_QC_QC02_AssignMaterialCheck_v1");
        AddUser(command, userId);
        command.Parameters.Add("@Scope", SqlDbType.NVarChar, 20).Value = request.Scope;
        command.Parameters.Add("@TargetCode", SqlDbType.NVarChar, 50).Value = request.TargetCode;
        command.Parameters.Add("@CheckId", SqlDbType.Int).Value = DbValue(request.CheckId);
        command.Parameters.Add("@ExpectedCheckId", SqlDbType.Int).Value = DbValue(request.ExpectedCheckId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new InvalidOperationException("SP QC-02 không trả kết quả gán cấu hình.");
        }

        return new AssignMaterialCheckResult(
            reader.GetRequiredString("Scope"),
            reader.GetRequiredString("TargetCode"),
            reader.GetNullableInt32("CheckId"),
            reader.GetRequiredInt32("AffectedMaterialCount"),
            reader.GetDateTime(reader.GetOrdinal("ChangedAt")));
    }
}

