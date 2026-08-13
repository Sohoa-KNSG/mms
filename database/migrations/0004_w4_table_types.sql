SET XACT_ABORT ON;
GO

IF TYPE_ID(N'api.InventoryDeclarationItem_v1') IS NULL
    EXEC(N'CREATE TYPE api.InventoryDeclarationItem_v1 AS TABLE
    (
        MaterialId nvarchar(50) NOT NULL PRIMARY KEY,
        Quantity decimal(19,4) NOT NULL,
        Unit nvarchar(20) NULL,
        LocationCode nvarchar(50) NULL
    );');
GO

IF TYPE_ID(N'api.BatchLocationItem_v1') IS NULL
    EXEC(N'CREATE TYPE api.BatchLocationItem_v1 AS TABLE
    (
        BatchId int NOT NULL PRIMARY KEY,
        ExpectedLocationCode nvarchar(50) NULL
    );');
GO

