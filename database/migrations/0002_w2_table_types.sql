/* Table-valued contracts for W2. Existing business tables remain unchanged. */
IF TYPE_ID(N'api.RolePermissionItem_v1') IS NULL
    EXEC(N'CREATE TYPE api.RolePermissionItem_v1 AS TABLE
    (
        ScreenCode nvarchar(50) NOT NULL PRIMARY KEY,
        ScreenLabel nvarchar(50) NULL,
        AccessMode nvarchar(10) NULL
    );');
GO

IF TYPE_ID(N'api.QcCriterionItem_v1') IS NULL
    EXEC(N'CREATE TYPE api.QcCriterionItem_v1 AS TABLE
    (
        CriterionId int NULL,
        CriterionCode nvarchar(100) NOT NULL,
        CriterionName nvarchar(100) NOT NULL,
        Specification nvarchar(255) NULL,
        SampleImage nvarchar(255) NULL
    );');
GO

IF TYPE_ID(N'api.QcEvaluationItem_v1') IS NULL
    EXEC(N'CREATE TYPE api.QcEvaluationItem_v1 AS TABLE
    (
        CriterionId int NOT NULL PRIMARY KEY,
        ResultCode nvarchar(50) NOT NULL,
        DefectNote nvarchar(max) NULL
    );');
GO

