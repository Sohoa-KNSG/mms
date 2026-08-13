using System.Data;
using Mms.Api.Infrastructure.Sql;

namespace Mms.Api.Modules.Receiving;

public sealed partial class ReceivingGateway
{
    public async Task<PurchaseOrderPage> GetPurchaseOrdersAsync(
        string userId, string? search, int page, int pageSize, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INB01_GetPurchaseOrders_v1");
        AddUser(command, userId);
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        command.Parameters.Add("@Page", SqlDbType.Int).Value = page;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var items = new List<PurchaseOrderSummary>();
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new PurchaseOrderSummary(
                reader.GetRequiredString("PurchaseOrder"), reader.GetNullableString("CustomerCode"),
                reader.GetNullableDateTime("OrderDate"), reader.GetNullableDateTime("DeliveryDate"),
                reader.GetRequiredDecimal("RemainingQuantity")));
        }

        var lines = new List<PurchaseOrderLine>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                lines.Add(new PurchaseOrderLine(
                    reader.GetRequiredString("PurchaseOrder"), reader.GetRequiredString("PurchaseOrderKey"),
                    reader.GetNullableString("MaterialId"), reader.GetNullableString("BravoId"),
                    reader.GetNullableString("MaterialName"), reader.GetRequiredDecimal("OrderedQuantity"),
                    reader.GetRequiredDecimal("ReceivedQuantity"), reader.GetRequiredDecimal("RemainingQuantity"),
                    reader.GetNullableString("Unit"), reader.GetNullableDateTime("DeliveryDate")));
            }
        }

        long totalCount = 0;
        if (await reader.NextResultAsync(cancellationToken) && await reader.ReadAsync(cancellationToken))
        {
            totalCount = reader.GetRequiredInt64("TotalCount");
        }
        return new PurchaseOrderPage(items, lines, totalCount, page, pageSize);
    }

    public async Task<MaterialOptionPage> GetMaterialsAsync(
        string userId, string? search, int page, int pageSize, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INB02_GetMaterials_v1");
        AddUser(command, userId);
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        command.Parameters.Add("@Page", SqlDbType.Int).Value = page;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var items = new List<MaterialOption>();
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new MaterialOption(reader.GetRequiredString("MaterialId"),
                reader.GetNullableString("BravoId"), reader.GetNullableString("MaterialName"),
                reader.GetNullableString("Unit"), reader.GetNullableString("SupplierCode"),
                reader.GetNullableString("MaterialGroupCode")));
        }
        long totalCount = 0;
        if (await reader.NextResultAsync(cancellationToken) && await reader.ReadAsync(cancellationToken))
        {
            totalCount = reader.GetRequiredInt64("TotalCount");
        }
        return new MaterialOptionPage(items, totalCount, page, pageSize);
    }

    public async Task<ReceiptDetail> GetReceiptAsync(string userId, int receiptId, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INB03_GetReceipt_v1");
        AddUser(command, userId);
        command.Parameters.Add("@ReceiptId", SqlDbType.Int).Value = receiptId;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        ReceiptHeader? header = null;
        if (await reader.ReadAsync(cancellationToken))
        {
            header = new ReceiptHeader(reader.GetRequiredInt32("ReceiptId"), reader.GetNullableString("WarehouseCode"),
                reader.GetNullableString("CustomerName"), reader.GetNullableString("PurchaseOrder"),
                reader.GetNullableString("StatusCode"), reader.GetNullableString("CreatedBy"),
                reader.GetNullableDateTime("CreatedAt"), reader.GetBoolean(reader.GetOrdinal("CanEdit")),
                reader.GetNullableDateTime("ChangedAt"));
        }

        var lines = new List<ReceiptLine>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                lines.Add(new ReceiptLine(reader.GetRequiredInt32("ReceivingLineId"), reader.GetRequiredInt32("ReceiptId"),
                    reader.GetNullableString("PurchaseOrderKey"), reader.GetNullableString("MaterialId"),
                    reader.GetNullableString("MaterialName"), reader.GetRequiredDecimal("DocumentQuantity"),
                    reader.GetRequiredDecimal("ReceivedQuantity"), reader.GetNullableString("Unit"),
                    reader.GetNullableDateTime("DeliveryDate"), reader.GetNullableString("LineStatusCode"),
                    reader.GetNullableString("QcResultCode")));
            }
        }

        var images = new List<ReceiptImage>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                images.Add(new ReceiptImage(reader.GetRequiredInt32("ImageId"), reader.GetNullableString("Category"),
                    reader.GetNullableString("ImageLink"), reader.GetNullableDateTime("CreatedAt")));
            }
        }
        return new ReceiptDetail(header, lines, images);
    }

    public async Task<UnmatchedReceiptPage> GetUnmatchedReceiptsAsync(
        string userId, string? search, int page, int pageSize, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INB05_GetUnmatchedReceipts_v1");
        AddUser(command, userId);
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        command.Parameters.Add("@Page", SqlDbType.Int).Value = page;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var items = new List<UnmatchedReceipt>();
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new UnmatchedReceipt(reader.GetRequiredInt32("ReceiptId"), reader.GetNullableString("WarehouseCode"),
                reader.GetNullableString("CustomerName"), reader.GetNullableString("StatusCode"),
                reader.GetNullableString("CreatedBy"), reader.GetNullableDateTime("CreatedAt"),
                reader.GetRequiredInt32("LineCount")));
        }
        var lines = new List<UnmatchedReceiptLine>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                lines.Add(new UnmatchedReceiptLine(reader.GetRequiredInt32("ReceivingLineId"),
                    reader.GetRequiredInt32("ReceiptId"), reader.GetNullableString("MaterialId"),
                    reader.GetNullableString("MaterialName"), reader.GetRequiredDecimal("ReceivedQuantity"),
                    reader.GetNullableString("Unit")));
            }
        }
        long totalCount = 0;
        if (await reader.NextResultAsync(cancellationToken) && await reader.ReadAsync(cancellationToken))
        {
            totalCount = reader.GetRequiredInt64("TotalCount");
        }
        return new UnmatchedReceiptPage(items, lines, totalCount, page, pageSize);
    }

    public async Task<PurchaseOrderMatches> GetPurchaseOrderMatchesAsync(
        string userId, int receiptId, string? search, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INB06_GetPurchaseOrderMatches_v1");
        AddUser(command, userId);
        command.Parameters.Add("@ReceiptId", SqlDbType.Int).Value = receiptId;
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var lines = new List<ReceiptLineToMatch>();
        while (await reader.ReadAsync(cancellationToken))
        {
            lines.Add(new ReceiptLineToMatch(reader.GetRequiredInt32("ReceivingLineId"),
                reader.GetNullableString("MaterialId"), reader.GetNullableString("MaterialName"),
                reader.GetRequiredDecimal("ReceivedQuantity"), reader.GetNullableString("Unit")));
        }
        var matches = new List<PurchaseOrderMatch>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                matches.Add(new PurchaseOrderMatch(reader.GetRequiredInt32("ReceivingLineId"),
                    reader.GetRequiredString("PurchaseOrder"), reader.GetRequiredString("PurchaseOrderKey"),
                    reader.GetNullableString("CustomerCode"), reader.GetNullableString("MaterialId"),
                    reader.GetNullableString("MaterialName"), reader.GetNullableString("Unit"),
                    reader.GetRequiredDecimal("RemainingQuantity"), reader.GetNullableDateTime("DeliveryDate")));
            }
        }
        return new PurchaseOrderMatches(lines, matches);
    }

    public async Task<WarehouseQueuePage> GetWarehouseQueueAsync(
        string userId, string? search, int? receiptId, int page, int pageSize, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INB07_GetWarehouseReceiptQueue_v1");
        AddUser(command, userId);
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        command.Parameters.Add("@ReceiptId", SqlDbType.Int).Value = DbValue(receiptId);
        command.Parameters.Add("@Page", SqlDbType.Int).Value = page;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var items = new List<WarehouseQueueReceipt>();
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new WarehouseQueueReceipt(reader.GetRequiredInt32("ReceiptId"),
                reader.GetNullableString("WarehouseCode"), reader.GetNullableString("CustomerName"),
                reader.GetNullableString("PurchaseOrder"), reader.GetNullableString("StatusCode"),
                reader.GetNullableDateTime("ReceivedAt"), reader.GetRequiredInt32("PendingLineCount")));
        }
        var lines = new List<WarehouseQueueLine>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                lines.Add(new WarehouseQueueLine(reader.GetRequiredInt32("ReceivingLineId"),
                    reader.GetRequiredInt32("ReceiptId"), reader.GetNullableString("MaterialId"),
                    reader.GetNullableString("BravoId"), reader.GetNullableString("MaterialName"),
                    reader.GetRequiredDecimal("ReceivedQuantity"), reader.GetRequiredDecimal("BatchedQuantity"),
                    reader.GetRequiredDecimal("RemainingQuantity"), reader.GetNullableString("Unit"),
                    reader.GetNullableString("LineStatusCode"), reader.GetNullableString("QcResultCode")));
            }
        }
        long totalCount = 0;
        if (await reader.NextResultAsync(cancellationToken) && await reader.ReadAsync(cancellationToken))
        {
            totalCount = reader.GetRequiredInt64("TotalCount");
        }
        return new WarehouseQueuePage(items, lines, totalCount, page, pageSize);
    }

    public async Task<BatchLabelData> GetBatchLabelsAsync(
        string userId, int? receiptId, int? transactionDocumentId, int? batchId, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INB08_GetBatchLabels_v1");
        AddUser(command, userId);
        command.Parameters.Add("@ReceiptId", SqlDbType.Int).Value = DbValue(receiptId);
        command.Parameters.Add("@TransactionDocumentId", SqlDbType.Int).Value = DbValue(transactionDocumentId);
        command.Parameters.Add("@BatchId", SqlDbType.Int).Value = DbValue(batchId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var headers = new List<BatchLabelHeader>();
        while (await reader.ReadAsync(cancellationToken))
        {
            headers.Add(new BatchLabelHeader(reader.GetRequiredInt32("ReceiptId"),
                reader.GetNullableString("PurchaseOrder"), reader.GetNullableString("CustomerName"),
                reader.GetNullableString("WarehouseCode"), reader.GetNullableString("ReceiptStatusCode"),
                reader.GetRequiredInt32("TransactionDocumentId"), reader.GetNullableString("TransactionStatusCode"),
                reader.GetDateTime(reader.GetOrdinal("PrintedAt"))));
        }
        var labels = new List<BatchLabel>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                labels.Add(new BatchLabel(reader.GetRequiredInt32("BatchId"), reader.GetRequiredString("BarcodeValue"),
                    reader.GetRequiredInt32("ReceiptId"), reader.GetRequiredInt32("TransactionDocumentId"),
                    reader.GetNullableString("MaterialId"), reader.GetNullableString("BravoId"),
                    reader.GetNullableString("MaterialName"), reader.GetRequiredDecimal("Quantity"),
                    reader.GetNullableString("Unit"), reader.GetNullableString("WarehouseCode"),
                    reader.GetNullableString("LocationCode"), reader.GetNullableString("InventoryStatusCode"),
                    reader.GetNullableString("CreatedBy"), reader.GetNullableDateTime("CreatedAt")));
            }
        }
        return new BatchLabelData(headers, labels);
    }
}

