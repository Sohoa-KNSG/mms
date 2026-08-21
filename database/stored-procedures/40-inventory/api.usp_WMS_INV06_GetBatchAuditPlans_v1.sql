-- ============================================================================
-- SP: LẤY DANH SÁCH KẾ HOẠCH KIỂM KÊ THEO BATCH (UC-18 / INV-06)
-- ============================================================================

USE [MMS];
GO

SET XACT_ABORT ON;
GO

CREATE OR ALTER PROCEDURE api.usp_WMS_INV06_GetBatchAuditPlans_v1
    @UserId          NVARCHAR(50),
    @Search          NVARCHAR(200) = NULL,
    @StatusCode      INT = NULL, -- 1: Đang kiểm, 2: Đã chốt, 0: Đã hủy
    @Page            INT = 1,
    @PageSize        INT = 50
AS
BEGIN
    SET NOCOUNT ON;

    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 50 WHEN @PageSize > 200 THEN 200 ELSE @PageSize END;

    SELECT
        PlanId = k.id_kh_batch,
        PlanName = k.ten_kehoach,
        WarehouseCode = k.ma_kho,
        AuditType = k.loai_kiemke,
        StatusCode = k.trang_thai,
        TotalBatches = k.tong_so_batch,
        CountedBatches = k.so_batch_da_kiem,
        DiscrepantBatches = k.so_batch_lech,
        TotalSnapshotQuantity = CONVERT(decimal(19,4), k.tong_snapshot_qty),
        TotalActualQuantity = CONVERT(decimal(19,4), k.tong_thucte_qty),
        TotalDifferenceQuantity = CONVERT(decimal(19,4), k.tong_lech_qty),
        CreatedBy = k.user_cre,
        CreatedAt = k.time_cre,
        ApprovedBy = k.user_approve,
        ApprovedAt = k.time_approve,
        ApprovalNote = k.ghi_chu_duyet,
        Note = k.ghi_chu
    FROM dbo.tbl_kiemke_batch_kh k
    WHERE (@StatusCode IS NULL OR k.trang_thai = @StatusCode)
      AND (@Search IS NULL 
           OR k.ten_kehoach LIKE N'%' + @Search + N'%'
           OR CONVERT(NVARCHAR(50), k.id_kh_batch) LIKE N'%' + @Search + N'%'
           OR k.user_cre LIKE N'%' + @Search + N'%')
    ORDER BY k.time_cre DESC, k.id_kh_batch DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT TotalCount = COUNT_BIG(1)
    FROM dbo.tbl_kiemke_batch_kh k
    WHERE (@StatusCode IS NULL OR k.trang_thai = @StatusCode)
      AND (@Search IS NULL 
           OR k.ten_kehoach LIKE N'%' + @Search + N'%'
           OR CONVERT(NVARCHAR(50), k.id_kh_batch) LIKE N'%' + @Search + N'%'
           OR k.user_cre LIKE N'%' + @Search + N'%');
END;
GO
