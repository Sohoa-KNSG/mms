CREATE OR ALTER PROCEDURE api.usp_WMS_OUT05_DecideRequest_v1
    @UserId nvarchar(50), @RequestId int, @ApprovalRunId int,
    @Decision nvarchar(20), @Note nvarchar(max) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @Decision = LOWER(NULLIF(LTRIM(RTRIM(@Decision)), N''));
    SET @Note = NULLIF(LTRIM(RTRIM(@Note)), N'');
    IF @Decision NOT IN (N'approve', N'reject') THROW 51022, N'Quyết định chỉ nhận approve hoặc reject.', 1;
    IF @Decision = N'reject' AND @Note IS NULL THROW 51002, N'Lý do từ chối là bắt buộc.', 1;
    DECLARE @EmployeeCode nvarchar(50), @ApproverName nvarchar(50), @Now datetime = GETDATE();
    SELECT @EmployeeCode = CONVERT(nvarchar(50), msnv), @ApproverName = ho_ten_nv
    FROM dbo.tbl_dm_user WHERE user_n = @UserId AND ISNULL(status_active, 0) = 1;
    IF @EmployeeCode IS NULL THROW 51001, N'Tài khoản không có mã nhân viên phê duyệt.', 1;
    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId
          AND ScreenCode IN (N'scr_denghi_xuatkho_log', N'scr_mob_denghi_xuatkho_log')
    ) THROW 51001, N'Không có quyền phê duyệt đề nghị.', 1;

    DECLARE @CurrentStep int, @TotalSteps int, @FlowId int, @AssignedEmployee nvarchar(50), @CurrentDecision nvarchar(50);
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM dbo.tbl_phieu_yeucau WITH (UPDLOCK, HOLDLOCK)
            WHERE id_phieu_yeucau = @RequestId AND ISNULL(trang_thai_phieu, N'0') = N'1')
            THROW 51004, N'Không tìm thấy phiếu đang hoạt động.', 1;
        SELECT @CurrentStep = id_lan_pheduyet, @TotalSteps = tong_buoc_duyet,
            @FlowId = id_flow_pheduyet, @AssignedEmployee = ma_ql_pheduyet,
            @CurrentDecision = trangthai_pheduyet
        FROM dbo.tbl_his_pheduyet WITH (UPDLOCK, HOLDLOCK)
        WHERE id_run = @ApprovalRunId AND id_phieu_yeucau = @RequestId;
        IF @CurrentStep IS NULL THROW 51004, N'Không tìm thấy bước phê duyệt.', 1;
        IF @CurrentDecision IS NOT NULL THROW 51009, N'Bước phê duyệt đã được xử lý.', 1;
        IF @AssignedEmployee <> @EmployeeCode THROW 51001, N'Phiếu không được giao cho người dùng hiện tại.', 1;

        UPDATE dbo.tbl_his_pheduyet SET trangthai_pheduyet = @Decision,
            time_duyet = @Now, ghi_chu = @Note WHERE id_run = @ApprovalRunId;
        INSERT dbo.tbl_his_status_pheduyet
            (id_phieu_yeucau, ma_ql_pheduyet, trang_thai_phieu, lan_pheduyet, time_duyet)
        VALUES (@RequestId, @EmployeeCode, @Decision, CONVERT(nvarchar(50), @CurrentStep), @Now);

        IF @Decision = N'reject'
        BEGIN
            UPDATE dbo.tbl_phieu_yeucau SET nguoi_duyet = @ApproverName, time_duyet = @Now,
                ghi_chu_huy = LEFT(@Note, 255), status_soanhang = NULL, time_cre = @Now
            WHERE id_phieu_yeucau = @RequestId;
        END
        ELSE IF @CurrentStep >= @TotalSteps
        BEGIN
            UPDATE dbo.tbl_phieu_yeucau SET nguoi_duyet = @ApproverName, time_duyet = @Now,
                trang_thai_phieu = N'4', status_soanhang = N'0', time_cre = @Now
            WHERE id_phieu_yeucau = @RequestId;
        END
        ELSE
        BEGIN
            INSERT dbo.tbl_his_pheduyet
            (
                id_lan_pheduyet, tong_buoc_duyet, id_flow_pheduyet, id_phieu_yeucau,
                ma_ql_pheduyet, ten_ql_pheduyet, mail_ql_pheduyet, capbac_pheduyet
            )
            SELECT TOP (1) @CurrentStep + 1, @TotalSteps, @FlowId, @RequestId,
                approval.msnv_ql_pheduyet, approval.ten_ql_pheduyet,
                approval.mail_ql_pheduyet, approval.capbac_pheduyet
            FROM dbo.tbl_pheduyet_process AS approval
            WHERE approval.id_flow = @FlowId AND approval.buoc_pheduyet = @CurrentStep + 1
              AND ISNULL(approval.status_active, 0) = 1 ORDER BY approval.id_pheduyet;
            IF @@ROWCOUNT = 0 THROW 51022, N'Quy trình thiếu người duyệt ở bước tiếp theo.', 1;
            UPDATE dbo.tbl_phieu_yeucau SET time_cre = @Now WHERE id_phieu_yeucau = @RequestId;
        END;
        DECLARE @NextRunId int = CASE WHEN @Decision = N'approve' AND @CurrentStep < @TotalSteps
            THEN CONVERT(int, SCOPE_IDENTITY()) END;
        COMMIT TRANSACTION;
        SELECT RequestId = @RequestId, Decision = @Decision, DecidedStep = @CurrentStep,
            TotalApprovalSteps = @TotalSteps, NextApprovalRunId = @NextRunId,
            IsFinal = CONVERT(bit, CASE WHEN @Decision = N'reject' OR @CurrentStep >= @TotalSteps THEN 1 ELSE 0 END),
            ChangedAt = @Now;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
