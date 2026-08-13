using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using Mms.Api.Configuration;
using Mms.Api.Infrastructure.Sql;

namespace Mms.Api.Modules.Receiving;

public sealed partial class ReceivingGateway(
    ISqlConnectionFactory connectionFactory,
    IOptions<SqlOptions> options)
{
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

    private static DataTable CreateReceivingLineTable(IReadOnlyList<ReceivingLineInput> lines)
    {
        var table = new DataTable();
        table.Columns.Add("ReceivingLineId", typeof(int));
        table.Columns.Add("PurchaseOrderKey", typeof(string));
        table.Columns.Add("MaterialId", typeof(string));
        table.Columns.Add("DocumentQuantity", typeof(decimal));
        table.Columns.Add("ReceivedQuantity", typeof(decimal));
        table.Columns.Add("Unit", typeof(string));
        table.Columns.Add("DeliveryDate", typeof(DateTime));
        foreach (var line in lines)
        {
            table.Rows.Add(DbValue(line.ReceivingLineId), DbValue(line.PurchaseOrderKey), line.MaterialId,
                line.DocumentQuantity, line.ReceivedQuantity, DbValue(line.Unit), DbValue(line.DeliveryDate));
        }
        return table;
    }

    private static DataTable CreateImageTable(IReadOnlyList<ReceiptImageInput> images)
    {
        var table = new DataTable();
        table.Columns.Add("Category", typeof(string));
        table.Columns.Add("ImageLink", typeof(string));
        foreach (var image in images)
        {
            table.Rows.Add(image.Category, image.ImageLink);
        }
        return table;
    }

    private static DataTable CreatePoAssignmentTable(IReadOnlyList<PoAssignmentInput> assignments)
    {
        var table = new DataTable();
        table.Columns.Add("ReceivingLineId", typeof(int));
        table.Columns.Add("PurchaseOrderKey", typeof(string));
        table.Columns.Add("ReceivedQuantity", typeof(decimal));
        foreach (var assignment in assignments)
        {
            table.Rows.Add(assignment.ReceivingLineId, assignment.PurchaseOrderKey, assignment.ReceivedQuantity);
        }
        return table;
    }

    private static DataTable CreateWarehouseReceiptTable(IReadOnlyList<WarehouseReceiptInput> items)
    {
        var table = new DataTable();
        table.Columns.Add("ReceivingLineId", typeof(int));
        table.Columns.Add("Quantity", typeof(decimal));
        foreach (var item in items)
        {
            table.Rows.Add(item.ReceivingLineId, item.Quantity);
        }
        return table;
    }

    private static SqlParameter Structured(string name, string typeName, DataTable value) => new(name, SqlDbType.Structured)
    {
        TypeName = typeName,
        Value = value,
    };
}

