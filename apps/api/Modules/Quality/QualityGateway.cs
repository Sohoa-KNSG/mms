using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using Mms.Api.Configuration;
using Mms.Api.Infrastructure.Sql;

namespace Mms.Api.Modules.Quality;

public sealed partial class QualityGateway
{
    private readonly ISqlConnectionFactory connectionFactory;
    private readonly IOptions<SqlOptions> options;

    public QualityGateway(ISqlConnectionFactory connectionFactory, IOptions<SqlOptions> options)
    {
        this.connectionFactory = connectionFactory;
        this.options = options;
    }

    private SqlCommand CreateCommand(SqlConnection connection, string procedure) => new(procedure, connection)
    {
        CommandType = CommandType.StoredProcedure,
        CommandTimeout = options.Value.CommandTimeoutSeconds,
    };

    private static void AddUser(SqlCommand command, string userId) =>
        command.Parameters.Add("@UserId", SqlDbType.NVarChar, 50).Value = userId;

    private static object DbValue(string? value) =>
        string.IsNullOrWhiteSpace(value) ? DBNull.Value : value.Trim();

    private static object DbValue(int? value) => value.HasValue ? value.Value : DBNull.Value;

    private static object DbValue(DateTime? value) => value.HasValue ? value.Value : DBNull.Value;

    private static SqlParameter DecimalParameter(string name, decimal value)
    {
        return new SqlParameter(name, SqlDbType.Decimal)
        {
            Precision = 19,
            Scale = 4,
            Value = value,
        };
    }

    private static DataTable CreateCriterionTable(IReadOnlyList<QcCriterionInput> criteria)
    {
        var table = new DataTable();
        table.Columns.Add("CriterionId", typeof(int));
        table.Columns.Add("CriterionCode", typeof(string));
        table.Columns.Add("CriterionName", typeof(string));
        table.Columns.Add("Specification", typeof(string));
        table.Columns.Add("SampleImage", typeof(string));
        foreach (var criterion in criteria)
        {
            table.Rows.Add(
                DbValue(criterion.CriterionId),
                criterion.CriterionCode,
                criterion.CriterionName,
                DbValue(criterion.Specification),
                DbValue(criterion.SampleImage));
        }
        return table;
    }

    private static DataTable CreateEvaluationTable(IReadOnlyList<QcEvaluationInput> results)
    {
        var table = new DataTable();
        table.Columns.Add("CriterionId", typeof(int));
        table.Columns.Add("ResultCode", typeof(string));
        table.Columns.Add("DefectNote", typeof(string));
        foreach (var result in results)
        {
            table.Rows.Add(result.CriterionId, result.ResultCode, DbValue(result.DefectNote));
        }
        return table;
    }

    private static async Task<long> ReadTotalCountAsync(
        SqlDataReader reader,
        CancellationToken cancellationToken)
    {
        if (!await reader.NextResultAsync(cancellationToken) || !await reader.ReadAsync(cancellationToken))
        {
            return 0;
        }
        return reader.GetRequiredInt64("TotalCount");
    }
}

