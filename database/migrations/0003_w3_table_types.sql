SET XACT_ABORT ON;
GO

IF TYPE_ID(N'api.ReceivingLineItem_v1') IS NULL
    EXEC(N'CREATE TYPE api.ReceivingLineItem_v1 AS TABLE
    (
        ReceivingLineId int NULL,
        PurchaseOrderKey nvarchar(150) NULL,
        MaterialId nvarchar(50) NOT NULL,
        DocumentQuantity decimal(19,4) NOT NULL,
        ReceivedQuantity decimal(19,4) NOT NULL,
        Unit nvarchar(20) NULL,
        DeliveryDate date NULL
    );');
GO

IF TYPE_ID(N'api.ReceiptImageItem_v1') IS NULL
    EXEC(N'CREATE TYPE api.ReceiptImageItem_v1 AS TABLE
    (
        Category nvarchar(50) NOT NULL,
        ImageLink nvarchar(max) NOT NULL
    );');
GO

IF TYPE_ID(N'api.ReceiptPoAssignmentItem_v1') IS NULL
    EXEC(N'CREATE TYPE api.ReceiptPoAssignmentItem_v1 AS TABLE
    (
        ReceivingLineId int NOT NULL PRIMARY KEY,
        PurchaseOrderKey nvarchar(150) NOT NULL,
        ReceivedQuantity decimal(19,4) NOT NULL
    );');
GO

IF TYPE_ID(N'api.WarehouseReceiptItem_v1') IS NULL
    EXEC(N'CREATE TYPE api.WarehouseReceiptItem_v1 AS TABLE
    (
        ReceivingLineId int NOT NULL PRIMARY KEY,
        Quantity decimal(19,4) NOT NULL
    );');
GO
