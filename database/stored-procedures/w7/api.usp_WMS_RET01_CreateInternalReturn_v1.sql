CREATE OR ALTER PROCEDURE api.usp_WMS_RET01_CreateInternalReturn_v1
    @UserId nvarchar(50), @DestinationBravoCode nvarchar(50), @QualityCode nvarchar(20),
    @ReturnAt datetime, @Note nvarchar(max) = NULL, @Items api.InternalReturnItem_v1 READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @DestinationBravoCode = NULLIF(LTRIM(RTRIM(@DestinationBravoCode)), N'');
    SET @QualityCode = NULLIF(LTRIM(RTRIM(@QualityCode)), N'');
    SET @Note = NULLIF(LTRIM(RTRIM(@Note)), N'');
    IF @DestinationBravoCode IS NULL OR @QualityCode NOT IN (N'1', N'2') OR @ReturnAt IS NULL
        THROW 51002, N'Don vi tra, phan loai chat luong va ngay tra la bat buoc.', 1;
    IF NOT EXISTS (SELECT 1 FROM @Items) OR EXISTS (SELECT 1 FROM @Items WHERE Quantity <= 0 OR NULLIF(LTRIM(RTRIM(MaterialId)), N'') IS NULL OR NULLIF(LTRIM(RTRIM(Note)), N'') IS NULL)
        THROW 51002, N'Phieu phai co vat tu, so luong va ly do hop le.', 1;
    IF EXISTS (SELECT MaterialId FROM @Items GROUP BY MaterialId HAVING COUNT(*) > 1)
        THROW 51002, N'Khong duoc trung vat tu tren cung phieu.', 1;
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode = N'scr_phieutra_noibo')
        THROW 51001, N'Khong co quyen lap phieu tra noi bo.', 1;
    DECLARE @DepartmentCode nvarchar(50), @RequesterName nvarchar(50), @DestinationName nvarchar(50),
        @ReturnId int, @Now datetime = GETDATE();
    SELECT @DepartmentCode = ma_bophan, @RequesterName = ho_ten_nv
    FROM dbo.tbl_dm_user WHERE user_n = @UserId AND ISNULL(status_active, 0) = 1;
    IF @DepartmentCode IS NULL THROW 51001, N'Tai khoan khong co bo phan.', 1;
    SELECT @DestinationName = ten_bravo_bophan FROM dbo.tbl_sx_bravo
    WHERE ma_ql = @DepartmentCode AND ma_bravo = @DestinationBravoCode;
    IF @DestinationName IS NULL THROW 51022, N'Don vi tra khong thuoc pham vi cua nguoi dung.', 1;
    IF EXISTS (SELECT 1 FROM @Items AS item LEFT JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = item.MaterialId WHERE material.id_vattu IS NULL)
        THROW 51022, N'Phieu co ma vat tu khong ton tai.', 1;
    BEGIN TRY
        BEGIN TRANSACTION;
        INSERT dbo.tbl_phieu_nhap_noibo
            (ma_kho, ma_bravo_bophan, ten_bravo_bophan, phan_loai_tra, nhap_kho,
             ghi_chu, user_cre, time_tra, time_cre, status_phieu, bo_phan)
        VALUES (N'20020100', @DestinationBravoCode, @DestinationName, @QualityCode, N'2',
            @Note, @RequesterName, @ReturnAt, @Now, N'1', @DepartmentCode);
        SET @ReturnId = CONVERT(int, SCOPE_IDENTITY());
        INSERT dbo.tbl_chitiet_nhap_noibo
            (id_phieu_noibo, id_vattu, id_bravo, ten_vattu, unit, so_luong, ghi_chu, time_cre)
        SELECT @ReturnId, item.MaterialId, COALESCE(item.BravoId, material.id_bravo),
            LEFT(COALESCE(item.MaterialName, material.ten_vattu), 255),
            COALESCE(item.Unit, material.unit), CONVERT(float, item.Quantity), item.Note, @Now
        FROM @Items AS item INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = item.MaterialId;
        COMMIT TRANSACTION;
        SELECT ReturnId = @ReturnId, StatusCode = N'1', CreatedAt = @Now;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
