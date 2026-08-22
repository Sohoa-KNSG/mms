CREATE OR ALTER PROCEDURE api.usp_WMS_OUT05_CancelRequest_v1
    @UserId nvarchar(50), @RequestId int, @Reason nvarchar(255), @ExpectedChangedAt datetime
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @Reason = NULLIF(LTRIM(RTRIM(@Reason)), N'');
    IF @Reason IS NULL OR @ExpectedChangedAt IS NULL THROW 51002, N'Lý do và phiên bản phiếu là bắt buộc.', 1;
    DECLARE @DepartmentCode nvarchar(50), @IsAdmin bit = 0, @Now datetime = GETDATE();
    SELECT @DepartmentCode = ma_bophan FROM dbo.tbl_dm_user WHERE user_n = @UserId AND ISNULL(status_active, 0) = 1;
    IF @DepartmentCode IS NULL THROW 51001, N'Tài khoản không hoạt động.', 1;
    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId
          AND ScreenCode IN
          (
              N'scr_denghi_xuatkho_log', N'scr_mob_denghi_xuatkho_log',
              N'scr_admin_chinhsua_denghi', N'scr_chinhsua_denghi_baobi'
          )
    ) THROW 51001, N'Không có quyền hủy đề nghị.', 1;
    IF EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId
        AND ScreenCode IN (N'scr_admin_chinhsua_denghi', N'scr_chinhsua_denghi_baobi')) SET @IsAdmin = 1;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @OwnerDepartment nvarchar(50), @Status nvarchar(20), @PickingStatus nvarchar(20), @ChangedAt datetime;
        SELECT @OwnerDepartment = bo_phan, @Status = trang_thai_phieu, @PickingStatus = status_soanhang,
            @ChangedAt = COALESCE(time_cre, time_lap_phieu)
        FROM dbo.tbl_phieu_yeucau WITH (UPDLOCK, HOLDLOCK) WHERE id_phieu_yeucau = @RequestId;
        IF @OwnerDepartment IS NULL THROW 51004, N'Không tìm thấy phiếu.', 1;
        IF @IsAdmin = 0 AND @OwnerDepartment <> @DepartmentCode THROW 51001, N'Không có quyền hủy phiếu.', 1;
        IF @Status <> N'1' THROW 51009, N'Phiếu không còn hoạt động.', 1;
        IF ISNULL(@PickingStatus, N'0') IN (N'1', N'2') THROW 51022, N'Không được hủy phiếu đang soạn hoặc đã hoàn thành.', 1;
        IF @ChangedAt <> @ExpectedChangedAt THROW 51009, N'Phiếu đã thay đổi. Hãy tải lại.', 1;
        UPDATE dbo.tbl_phieu_yeucau SET trang_thai_phieu = N'0', ghi_chu_huy = @Reason
        WHERE id_phieu_yeucau = @RequestId;
        COMMIT TRANSACTION;
        SELECT RequestId = @RequestId, ChangedAt = @Now;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
