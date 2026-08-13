using System.Data;
using Mms.Api.Infrastructure.Sql;

namespace Mms.Api.Modules.Receiving;

public sealed partial class ReceivingGateway
{
    public async Task<ReceiptCommandResult> CreateReceiptWithPoAsync(
        string userId, CreateReceiptWithPoRequest request, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INB01_CreateReceiptWithPo_v1");
        AddUser(command, userId);
        command.Parameters.Add("@PurchaseOrder", SqlDbType.NVarChar, 50).Value = request.PurchaseOrder;
        command.Parameters.Add("@WarehouseCode", SqlDbType.NVarChar, 50).Value = request.WarehouseCode;
        command.Parameters.Add(Structured("@Lines", "api.ReceivingLineItem_v1", CreateReceivingLineTable(request.Lines)));
        command.Parameters.Add(Structured("@Images", "api.ReceiptImageItem_v1", CreateImageTable(request.Images)));
        return await ReadReceiptCommandResultAsync(command, "CreatedAt", cancellationToken);
    }

    public async Task<ReceiptCommandResult> CreateReceiptWithoutPoAsync(
        string userId, CreateReceiptWithoutPoRequest request, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INB02_CreateReceiptWithoutPo_v1");
        AddUser(command, userId);
        command.Parameters.Add("@SupplierName", SqlDbType.NVarChar, 50).Value = request.SupplierName;
        command.Parameters.Add("@WarehouseCode", SqlDbType.NVarChar, 50).Value = request.WarehouseCode;
        command.Parameters.Add(Structured("@Lines", "api.ReceivingLineItem_v1", CreateReceivingLineTable(request.Lines)));
        command.Parameters.Add(Structured("@Images", "api.ReceiptImageItem_v1", CreateImageTable(request.Images)));
        return await ReadReceiptCommandResultAsync(command, "CreatedAt", cancellationToken);
    }

    public async Task<ReceiptCommandResult> SaveReceiptAsync(
        string userId, int receiptId, SaveReceiptRequest request, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INB03_SaveReceipt_v1");
        AddUser(command, userId);
        command.Parameters.Add("@ReceiptId", SqlDbType.Int).Value = receiptId;
        command.Parameters.Add("@WarehouseCode", SqlDbType.NVarChar, 50).Value = request.WarehouseCode;
        command.Parameters.Add("@CustomerName", SqlDbType.NVarChar, 50).Value = request.CustomerName;
        command.Parameters.Add("@PurchaseOrder", SqlDbType.NVarChar, 50).Value = request.PurchaseOrder;
        command.Parameters.Add("@Action", SqlDbType.NVarChar, 20).Value = request.Action;
        command.Parameters.Add("@ExpectedStatus", SqlDbType.NVarChar, 50).Value = request.ExpectedStatus;
        command.Parameters.Add(Structured("@Lines", "api.ReceivingLineItem_v1", CreateReceivingLineTable(request.Lines)));
        command.Parameters.Add(Structured("@Images", "api.ReceiptImageItem_v1", CreateImageTable(request.Images)));
        return await ReadReceiptCommandResultAsync(command, "ChangedAt", cancellationToken);
    }

    public Task<AttachPurchaseOrderResult> AttachPurchaseOrderAsync(
        string userId, int receiptId, AttachPurchaseOrderRequest request, CancellationToken cancellationToken) =>
        AttachAsync("api.usp_WMS_INB05_AttachPurchaseOrder_v1", userId, receiptId,
            request.PurchaseOrder, request.ExpectedStatus, request.Assignments, cancellationToken);

    public Task<AttachPurchaseOrderResult> AttachMultiplePurchaseOrdersAsync(
        string userId, int receiptId, AttachMultiplePurchaseOrdersRequest request, CancellationToken cancellationToken) =>
        AttachAsync("api.usp_WMS_INB06_AttachMultiplePurchaseOrders_v1", userId, receiptId,
            null, request.ExpectedStatus, request.Assignments, cancellationToken);

    public async Task<ProcessWarehouseReceiptResult> ProcessWarehouseReceiptAsync(
        string userId, int receiptId, ProcessWarehouseReceiptRequest request, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INB07_ProcessWarehouseReceipt_v1");
        AddUser(command, userId);
        command.Parameters.Add("@ReceiptId", SqlDbType.Int).Value = receiptId;
        command.Parameters.Add("@ExpectedStatus", SqlDbType.NVarChar, 50).Value = request.ExpectedStatus;
        command.Parameters.Add(Structured("@Items", "api.WarehouseReceiptItem_v1", CreateWarehouseReceiptTable(request.Items)));
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new InvalidOperationException("SP INB-07 không trả kết quả nhập kho.");
        }

        var resultReceiptId = reader.GetRequiredInt32("ReceiptId");
        var transactionDocumentId = reader.GetRequiredInt32("TransactionDocumentId");
        var statusCode = reader.GetRequiredString("StatusCode");
        var batchCount = reader.GetRequiredInt32("BatchCount");
        var processedAt = reader.GetDateTime(reader.GetOrdinal("ProcessedAt"));
        var batches = new List<CreatedBatch>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                batches.Add(new CreatedBatch(reader.GetRequiredInt32("ReceivingLineId"), reader.GetRequiredInt32("BatchId")));
            }
        }
        return new ProcessWarehouseReceiptResult(resultReceiptId, transactionDocumentId, statusCode,
            batchCount, processedAt, batches);
    }

    private async Task<ReceiptCommandResult> ReadReceiptCommandResultAsync(
        Microsoft.Data.SqlClient.SqlCommand command, string changedAtColumn, CancellationToken cancellationToken)
    {
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new InvalidOperationException("SP nhận hàng không trả kết quả.");
        }
        return new ReceiptCommandResult(reader.GetRequiredInt32("ReceiptId"),
            reader.GetRequiredString("StatusCode"), reader.GetRequiredInt32("LineCount"),
            reader.GetDateTime(reader.GetOrdinal(changedAtColumn)));
    }

    private async Task<AttachPurchaseOrderResult> AttachAsync(
        string procedure, string userId, int receiptId, string? purchaseOrder,
        string expectedStatus, IReadOnlyList<PoAssignmentInput> assignments, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, procedure);
        AddUser(command, userId);
        command.Parameters.Add("@ReceiptId", SqlDbType.Int).Value = receiptId;
        if (purchaseOrder is not null)
        {
            command.Parameters.Add("@PurchaseOrder", SqlDbType.NVarChar, 50).Value = purchaseOrder;
        }
        command.Parameters.Add("@ExpectedStatus", SqlDbType.NVarChar, 50).Value = expectedStatus;
        command.Parameters.Add(Structured("@Assignments", "api.ReceiptPoAssignmentItem_v1", CreatePoAssignmentTable(assignments)));
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new InvalidOperationException("SP cập nhật PO không trả kết quả.");
        }
        return new AttachPurchaseOrderResult(reader.GetRequiredInt32("ReceiptId"),
            reader.GetRequiredString("PurchaseOrder"), reader.GetRequiredInt32("AssignmentCount"),
            reader.GetDateTime(reader.GetOrdinal("ChangedAt")));
    }
}

