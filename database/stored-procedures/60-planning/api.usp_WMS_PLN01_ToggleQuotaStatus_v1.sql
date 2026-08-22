CREATE OR ALTER PROCEDURE api.usp_WMS_PLN01_ToggleQuotaStatus_v1
    @UserId nvarchar(50),
    @PlanId int,
    @IsActive int
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @PlanId <= 0 THROW 51009, N'Mã định mức không hợp lệ.', 1;

    DECLARE @Now datetime = GETDATE();

    UPDATE dbo.tbl_dinhmuc
    SET is_active = CASE WHEN @IsActive = 1 THEN 1 ELSE 0 END,
        user_up = @UserId,
        time_up = @Now
    WHERE id_kehoach = @PlanId;

    IF @@ROWCOUNT = 0 THROW 51009, N'Không tìm thấy dòng định mức cần cập nhật.', 1;

    SELECT 
        PlanId = @PlanId,
        IsActive = CASE WHEN @IsActive = 1 THEN 1 ELSE 0 END,
        UpdatedAt = @Now;
END;
