CREATE OR ALTER PROCEDURE api.usp_WMS_OUT04_GetRequest_v1
    @UserId nvarchar(50),
    @RequestId int
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @DepartmentCode nvarchar(50), @EmployeeCode nvarchar(50), @IsAdmin bit = 0, @UserExists bit = 0;
    SELECT @DepartmentCode = ma_bophan, @EmployeeCode = CONVERT(nvarchar(50), msnv)
    FROM dbo.tbl_dm_user WHERE user_n = @UserId AND ISNULL(status_active, 0) = 1;
    IF @EmployeeCode IS NOT NULL SET @UserExists = 1;
    IF @UserExists = 0 AND EXISTS (SELECT 1 FROM dbo.tbl_user_ql WHERE user_ql = @UserId)
    BEGIN
        SET @EmployeeCode = @UserId;
        SET @UserExists = 1;
    END;
    IF @UserExists = 0 THROW 51001, N'Tài khoản không hoạt động.', 1;
    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId
          AND ScreenCode IN
          (
              N'scr_denghi_xuatkho_log', N'scr_mob_denghi_xuatkho_log',
              N'scr_admin_chinhsua_denghi', N'scr_chinhsua_denghi_baobi'
          )
    ) THROW 51001, N'Không có quyền xem đề nghị xuất kho.', 1;
    IF EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode IN (N'scr_admin_chinhsua_denghi', N'scr_chinhsua_denghi_baobi')
    ) SET @IsAdmin = 1;
    IF NOT EXISTS
    (
        SELECT 1 FROM dbo.tbl_phieu_yeucau AS request
        WHERE request.id_phieu_yeucau = @RequestId
          AND
          (
              request.bo_phan = @DepartmentCode OR @IsAdmin = 1 OR EXISTS
              (
                  SELECT 1 FROM dbo.tbl_his_pheduyet AS history
                  WHERE history.id_phieu_yeucau = request.id_phieu_yeucau
                    AND history.ma_ql_pheduyet = @EmployeeCode
              )
          )
    ) THROW 51004, N'Không tìm thấy phiếu hoặc không có quyền xem.', 1;

    SELECT RequestId = request.id_phieu_yeucau, DepartmentCode = request.bo_phan,
        RequesterName = request.nguoi_lap_phieu, CreatedAt = COALESCE(request.time_lap_phieu, request.time_cre),
        ChangedAt = COALESCE(request.time_cre, request.time_lap_phieu),
        FlowId = TRY_CONVERT(int, request.id_flow_pheduyet), Classification = flow.phan_loai,
        PlanningUnit = flow.donvi_kehoach, NeededAt = request.thoi_gian_can,
        DestinationBravoCode = request.ma_bravo_bophan, DestinationName = request.ten_bravo_bophan,
        RequestStatusCode = request.trang_thai_phieu, PickingStatusCode = request.status_soanhang,
        ApprovalStatus = CASE WHEN approval.RejectedCount > 0 THEN N'reject'
            WHEN approval.ApprovedCount >= ISNULL(flow.tong_buoc_duyet, 0) AND ISNULL(flow.tong_buoc_duyet, 0) > 0 THEN N'approve'
            ELSE N'pending' END,
        CurrentApprovalStep = pendingStep.id_lan_pheduyet,
        TotalApprovalSteps = flow.tong_buoc_duyet,
        CanEdit = CONVERT(bit, CASE WHEN (@IsAdmin = 1 OR request.bo_phan = @DepartmentCode)
            AND ISNULL(request.trang_thai_phieu, N'0') = N'1'
            AND ISNULL(request.status_soanhang, N'0') IN (N'0', N'')
            AND approval.DecidedCount = 0 THEN 1 ELSE 0 END),
        CanCancel = CONVERT(bit, CASE WHEN (@IsAdmin = 1 OR request.bo_phan = @DepartmentCode)
            AND ISNULL(request.trang_thai_phieu, N'0') = N'1'
            AND ISNULL(request.status_soanhang, N'0') NOT IN (N'1', N'2') THEN 1 ELSE 0 END),
        CanApprove = CONVERT(bit, CASE WHEN pendingStep.ma_ql_pheduyet = @EmployeeCode
            AND ISNULL(request.trang_thai_phieu, N'0') = N'1' THEN 1 ELSE 0 END)
    FROM dbo.tbl_phieu_yeucau AS request
    LEFT JOIN dbo.tbl_flow_pheduyet AS flow ON flow.id_flow = TRY_CONVERT(int, request.id_flow_pheduyet)
    OUTER APPLY
    (
        SELECT ApprovedCount = SUM(CASE WHEN LOWER(ISNULL(history.trangthai_pheduyet, N'')) = N'approve' THEN 1 ELSE 0 END),
            RejectedCount = SUM(CASE WHEN LOWER(ISNULL(history.trangthai_pheduyet, N'')) = N'reject' THEN 1 ELSE 0 END),
            DecidedCount = SUM(CASE WHEN history.trangthai_pheduyet IS NOT NULL THEN 1 ELSE 0 END)
        FROM dbo.tbl_his_pheduyet AS history WHERE history.id_phieu_yeucau = request.id_phieu_yeucau
    ) AS approval
    OUTER APPLY
    (
        SELECT TOP (1) history.id_lan_pheduyet, history.ma_ql_pheduyet
        FROM dbo.tbl_his_pheduyet AS history
        WHERE history.id_phieu_yeucau = request.id_phieu_yeucau AND history.trangthai_pheduyet IS NULL
        ORDER BY history.id_lan_pheduyet, history.id_run
    ) AS pendingStep
    WHERE request.id_phieu_yeucau = @RequestId;

    SELECT LineId = line.id_chitiet_phieu, PlanId = line.id_kehoach,
        MaterialId = line.id_vattu, BravoId = line.id_bravo, MaterialName = line.ten_vattu,
        Quantity = CONVERT(decimal(19,4), ISNULL(line.so_luong, 0)), Unit = line.unit,
        NeededAt = line.thoi_gian_can, Note = line.ghi_chu,
        DestinationBravoCode = line.bravo_bophan
    FROM dbo.tbl_phieu_yeucau_chitiet AS line
    WHERE line.id_phieu_yeucau = @RequestId ORDER BY line.id_chitiet_phieu;

    SELECT ApprovalRunId = history.id_run, ApprovalStep = history.id_lan_pheduyet,
        TotalApprovalSteps = history.tong_buoc_duyet, ApproverEmployeeCode = history.ma_ql_pheduyet,
        ApproverName = history.ten_ql_pheduyet, ApproverMail = history.mail_ql_pheduyet,
        ApproverRank = history.capbac_pheduyet, Decision = history.trangthai_pheduyet,
        DecidedAt = history.time_duyet, Note = history.ghi_chu
    FROM dbo.tbl_his_pheduyet AS history
    WHERE history.id_phieu_yeucau = @RequestId ORDER BY history.id_lan_pheduyet, history.id_run;
END;
