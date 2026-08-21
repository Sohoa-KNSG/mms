CREATE OR ALTER PROCEDURE api.usp_WMS_OUT05_GetRequestQueue_v1
    @UserId nvarchar(50), 
    @Search nvarchar(200) = NULL, 
    @Status nvarchar(20) = NULL,
    @FromDate datetime = NULL,
    @ToDate datetime = NULL,
    @Page int = 1, 
    @PageSize int = 100
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
    ) THROW 51001, N'Không có quyền theo dõi đề nghị.', 1;
    IF EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId
        AND ScreenCode IN (N'scr_admin_chinhsua_denghi', N'scr_chinhsua_denghi_baobi')) SET @IsAdmin = 1;
    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    SET @Status = LOWER(NULLIF(LTRIM(RTRIM(@Status)), N''));
    SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 100 WHEN @PageSize > 1000 THEN 1000 ELSE @PageSize END;

    CREATE TABLE #Queue
    (
        RequestId int NOT NULL PRIMARY KEY, DepartmentCode nvarchar(50) NULL, RequesterName nvarchar(50) NULL,
        CreatedAt datetime NULL, ChangedAt datetime NULL, FlowId int NULL, Classification nvarchar(50) NULL,
        PlanningUnit nvarchar(50) NULL, NeededAt datetime NULL, DestinationBravoCode nvarchar(50) NULL,
        DestinationName nvarchar(50) NULL, RequestStatusCode nvarchar(20) NULL, PickingStatusCode nvarchar(20) NULL,
        ApprovalStatus nvarchar(20) NOT NULL, CurrentApprovalStep int NULL, TotalApprovalSteps int NULL,
        LineCount int NOT NULL, TotalQuantity decimal(19,4) NOT NULL, CanEdit bit NOT NULL,
        CanCancel bit NOT NULL, CanApprove bit NOT NULL
    );
    INSERT #Queue
    SELECT request.id_phieu_yeucau, request.bo_phan, request.nguoi_lap_phieu,
        COALESCE(request.time_lap_phieu, request.time_cre), COALESCE(request.time_cre, request.time_lap_phieu),
        TRY_CONVERT(int, request.id_flow_pheduyet), flow.phan_loai, flow.donvi_kehoach,
        request.thoi_gian_can, request.ma_bravo_bophan, request.ten_bravo_bophan,
        request.trang_thai_phieu, request.status_soanhang,
        CASE WHEN ISNULL(request.trang_thai_phieu, N'0') = N'0' THEN N'cancelled'
             WHEN approval.RejectedCount > 0 THEN N'reject'
             WHEN approval.ApprovedCount >= ISNULL(flow.tong_buoc_duyet, 0) AND ISNULL(flow.tong_buoc_duyet, 0) > 0 THEN N'approve'
             ELSE N'pending' END,
        pendingStep.id_lan_pheduyet, flow.tong_buoc_duyet,
        ISNULL(lines.LineCount, 0), CONVERT(decimal(19,4), ISNULL(lines.TotalQuantity, 0)),
        CONVERT(bit, CASE WHEN (@IsAdmin = 1 OR request.bo_phan = @DepartmentCode)
            AND ISNULL(request.trang_thai_phieu, N'0') = N'1'
            AND ISNULL(request.status_soanhang, N'0') IN (N'0', N'')
            AND approval.DecidedCount = 0 THEN 1 ELSE 0 END),
        CONVERT(bit, CASE WHEN (@IsAdmin = 1 OR request.bo_phan = @DepartmentCode)
            AND ISNULL(request.trang_thai_phieu, N'0') = N'1'
            AND ISNULL(request.status_soanhang, N'0') NOT IN (N'1', N'2') THEN 1 ELSE 0 END),
        CONVERT(bit, CASE WHEN pendingStep.ma_ql_pheduyet = @EmployeeCode
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
        FROM dbo.tbl_his_pheduyet AS history WHERE history.id_phieu_yeucau = request.id_phieu_yeucau
          AND history.trangthai_pheduyet IS NULL ORDER BY history.id_lan_pheduyet, history.id_run
    ) AS pendingStep
    OUTER APPLY
    (
        SELECT LineCount = COUNT(*), TotalQuantity = SUM(ISNULL(line.so_luong, 0))
        FROM dbo.tbl_phieu_yeucau_chitiet AS line WHERE line.id_phieu_yeucau = request.id_phieu_yeucau
    ) AS lines
    WHERE @IsAdmin = 1 OR request.bo_phan = @DepartmentCode
       OR EXISTS (SELECT 1 FROM dbo.tbl_his_pheduyet AS history
          WHERE history.id_phieu_yeucau = request.id_phieu_yeucau AND history.ma_ql_pheduyet = @EmployeeCode);

    SELECT * FROM #Queue
    WHERE (@Search IS NULL OR CONVERT(nvarchar(20), RequestId) LIKE N'%' + @Search + N'%'
        OR RequesterName LIKE N'%' + @Search + N'%' OR DestinationName LIKE N'%' + @Search + N'%')
      AND (@FromDate IS NULL OR COALESCE(CreatedAt, NeededAt, ChangedAt) >= @FromDate)
      AND (@ToDate IS NULL OR COALESCE(CreatedAt, NeededAt, ChangedAt) <= @ToDate)
      AND (
          @Status IS NULL 
          OR (@Status IN (N'received', N'3') AND (PickingStatusCode = N'3' OR RequestStatusCode = N'3'))
          OR (@Status IN (N'issued', N'2', N'4') AND (PickingStatusCode = N'2' OR RequestStatusCode = N'4'))
          OR (@Status IN (N'picking', N'1') AND PickingStatusCode = N'1')
          OR (@Status IN (N'pending', N'pending_approval', N'0') AND (ApprovalStatus = N'pending' OR RequestStatusCode = N'0'))
          OR ApprovalStatus = @Status 
          OR LOWER(ISNULL(PickingStatusCode, N'')) = @Status
      )
    ORDER BY ChangedAt DESC, RequestId DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
    SELECT TotalCount = COUNT_BIG(1) FROM #Queue
    WHERE (@Search IS NULL OR CONVERT(nvarchar(20), RequestId) LIKE N'%' + @Search + N'%'
        OR RequesterName LIKE N'%' + @Search + N'%' OR DestinationName LIKE N'%' + @Search + N'%')
      AND (@FromDate IS NULL OR COALESCE(CreatedAt, NeededAt, ChangedAt) >= @FromDate)
      AND (@ToDate IS NULL OR COALESCE(CreatedAt, NeededAt, ChangedAt) <= @ToDate)
      AND (
          @Status IS NULL 
          OR (@Status IN (N'received', N'3') AND (PickingStatusCode = N'3' OR RequestStatusCode = N'3'))
          OR (@Status IN (N'issued', N'2', N'4') AND (PickingStatusCode = N'2' OR RequestStatusCode = N'4'))
          OR (@Status IN (N'picking', N'1') AND PickingStatusCode = N'1')
          OR (@Status IN (N'pending', N'pending_approval', N'0') AND (ApprovalStatus = N'pending' OR RequestStatusCode = N'0'))
          OR ApprovalStatus = @Status 
          OR LOWER(ISNULL(PickingStatusCode, N'')) = @Status
      );
END;
