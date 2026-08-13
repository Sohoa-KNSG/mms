SET XACT_ABORT ON;
GO

IF TYPE_ID(N'api.InternalReturnItem_v1') IS NULL
    EXEC(N'CREATE TYPE api.InternalReturnItem_v1 AS TABLE
    (
        MaterialId nvarchar(50) NOT NULL,
        BravoId nvarchar(50) NULL,
        MaterialName nvarchar(255) NULL,
        Quantity decimal(19,4) NOT NULL,
        Unit nvarchar(20) NULL,
        Note nvarchar(max) NULL
    );');
GO
