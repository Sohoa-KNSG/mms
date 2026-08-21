-- ============================================================================
-- SP: PHÊ DUYỆT SỐ LỆCH & CÂN ĐỐI TỒN KHO BATCH (TRƯỞNG PHÒNG KHO - UC-18 / INV-06)
-- CÓ GHI CHÚ LÝ DO GIẢI TRÌNH & SINH GIAO DỊCH ADJ_UP / ADJ_DWN
-- ============================================================================

USE [MMS];
GO

SET XACT_ABORT ON;
GO

CREATE OR ALTER PROCEDURE api.usp_WMS_INV06_ApproveBatchVariance_v1
    @UserId                  NVARCHAR(50),
    @PlanId                  INT,
    @ApprovalNote            NVARCHAR(1000),      -- Ghi chú lý do giải trình chung của Trưởng phòng
    @VarianceExplanationsJson NVARCHAR(MAX) = NULL -- JSON Array: [{"DetailId": 1, "VarianceReason": "Lý do..."}]
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Kiểm tra quyền Trưởng phòng kho / Admin
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode IN (N'scr_kiemke_batch', N'scr_kiemke_batch_pheduyet', N'scr_admin_role_app'))
        THROW 51001, N'Chỉ Trưởng phòng kho hoặc Quản trị viên mới có quyền phê duyệt chốt số lệch kiểm kê!', 1;

    SET @ApprovalNote = NULLIF(LTRIM(RTRIM(@ApprovalNote)), N'');
    IF @ApprovalNote IS NULL
        THROW 51002, N'Bắt buộc phải nhập ý kiến / ghi chú lý do giải trình chốt kiểm kê của Trưởng phòng kho!', 1;

    -- 2. Kiểm tra trạng thái kế hoạch
    DECLARE @PlanStatus INT;
    SELECT @PlanStatus = trang_thai FROM dbo.tbl_kiemke_batch_kh WHERE id_kh_batch = @PlanId;

    IF @PlanStatus IS NULL
        THROW 51003, N'Kế hoạch kiểm kê batch không tồn tại!', 1;

    IF @PlanStatus <> 1
        THROW 51004, N'Kế hoạch này không ở trạng thái đang kiểm (đã được chốt hoặc bị hủy trước đó)!', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @Now DATETIME = GETDATE();

        -- 3. Cập nhật giải trình từng dòng chi tiết nếu có truyền JSON
        IF @VarianceExplanationsJson IS NOT NULL AND LTRIM(RTRIM(@VarianceExplanationsJson)) <> ''
        BEGIN
            UPDATE d
            SET d.ly_do_lech = j.VarianceReason
            FROM dbo.tbl_kiemke_batch_chitiet d
            INNER JOIN OPENJSON(@VarianceExplanationsJson)
            WITH (
                DetailId INT '$.DetailId',
                VarianceReason NVARCHAR(500) '$.VarianceReason'
            ) j ON d.id_chitiet = j.DetailId
            WHERE d.id_kh_batch = @PlanId;
        END;

        -- 4. Tạo Phiếu giao dịch điều chỉnh kho (tbl_phieu_transaction) để liên kết audit trail
        DECLARE @PhieuTransId INT;
        INSERT INTO dbo.tbl_phieu_transaction (
            nghiep_vu, ma_kho_from, ma_kho_to, user_cre, time_cre, trang_thai_phieu
        )
        VALUES (
            N'KIEM_KE_BATCH', N'20020100', N'20020100', @UserId, @Now, N'1'
        );
        SET @PhieuTransId = SCOPE_IDENTITY();

        -- 5. Xử lý cân đối từng Lô có phát sinh chênh lệch (soluong_thucte IS NOT NULL và chenh_lech <> 0)
        DECLARE @Adjustments TABLE (
            DetailId INT,
            BatchId INT,
            MaterialId NVARCHAR(50),
            BravoId NVARCHAR(50),
            MaterialName NVARCHAR(255),
            Unit NVARCHAR(50),
            DiffQty FLOAT,
            LocationCode NVARCHAR(50),
            VarianceReason NVARCHAR(500)
        );

        INSERT INTO @Adjustments (DetailId, BatchId, MaterialId, BravoId, MaterialName, Unit, DiffQty, LocationCode, VarianceReason)
        SELECT 
            d.id_chitiet, d.id_batch, d.id_vattu, d.id_bravo, d.ten_vattu, d.unit,
            d.chenh_lech, COALESCE(d.location_thucte, d.location_snapshot), d.ly_do_lech
        FROM dbo.tbl_kiemke_batch_chitiet d
        WHERE d.id_kh_batch = @PlanId
          AND d.soluong_thucte IS NOT NULL
          AND ABS(ISNULL(d.chenh_lech, 0)) > 0.0001;

        -- 5.1. Xử lý Lô LỆCH THỪA (DiffQty > 0): Tăng tồn lô bằng ADJ_UP
        -- A. Cập nhật tồn tbl_batch_inv
        UPDATE b
        SET 
            b.so_luong = b.so_luong + a.DiffQty,
            b.location = COALESCE(a.LocationCode, b.location),
            b.time_up = @Now,
            b.user_up = @UserId,
            b.ma_event_up = N'5'
        FROM dbo.tbl_batch_inv b
        INNER JOIN @Adjustments a ON b.id_batch = a.BatchId
        WHERE a.DiffQty > 0;

        -- B. Ghi tbl_transaction ADJ_UP
        INSERT INTO dbo.tbl_transaction (
            id_batch, id_phieu_trans, nghiep_vu, id_vattu, id_bravo,
            ten_vattu, so_luong, unit, time_cre, trang_thai
        )
        SELECT 
            a.BatchId, @PhieuTransId, N'ADJ_UP', a.MaterialId, a.BravoId,
            a.MaterialName, a.DiffQty, a.Unit, @Now, N'1'
        FROM @Adjustments a
        WHERE a.DiffQty > 0;

        -- C. Ghi tbl_batch_event
        INSERT INTO dbo.tbl_batch_event (
            id_batch, ma_event, id_vattu, so_luong, unit, time_up, user_up, trang_thai_ton
        )
        SELECT 
            a.BatchId, 5, a.MaterialId, b.so_luong, a.Unit, @Now, @UserId, b.trang_thai_ton
        FROM @Adjustments a
        INNER JOIN dbo.tbl_batch_inv b ON b.id_batch = a.BatchId
        WHERE a.DiffQty > 0;

        -- 5.2. Xử lý Lô LỆCH THIẾU (DiffQty < 0): Giảm tồn lô bằng ADJ_DWN
        -- A. Cập nhật tồn tbl_batch_inv
        UPDATE b
        SET 
            b.so_luong = CASE WHEN b.so_luong + a.DiffQty < 0 THEN 0 ELSE b.so_luong + a.DiffQty END,
            b.location = COALESCE(a.LocationCode, b.location),
            b.time_up = @Now,
            b.user_up = @UserId,
            b.ma_event_up = N'5',
            b.trang_thai_ton = CASE WHEN b.so_luong + a.DiffQty <= 0 THEN N'0' ELSE b.trang_thai_ton END
        FROM dbo.tbl_batch_inv b
        INNER JOIN @Adjustments a ON b.id_batch = a.BatchId
        WHERE a.DiffQty < 0;

        -- B. Ghi tbl_transaction ADJ_DWN (Số lượng lưu số dương)
        INSERT INTO dbo.tbl_transaction (
            id_batch, id_phieu_trans, nghiep_vu, id_vattu, id_bravo,
            ten_vattu, so_luong, unit, time_cre, trang_thai
        )
        SELECT 
            a.BatchId, @PhieuTransId, N'ADJ_DWN', a.MaterialId, a.BravoId,
            a.MaterialName, ABS(a.DiffQty), a.Unit, @Now, N'1'
        FROM @Adjustments a
        WHERE a.DiffQty < 0;

        -- C. Ghi tbl_batch_event
        INSERT INTO dbo.tbl_batch_event (
            id_batch, ma_event, id_vattu, so_luong, unit, time_up, user_up, trang_thai_ton
        )
        SELECT 
            a.BatchId, 5, a.MaterialId, b.so_luong, a.Unit, @Now, @UserId, b.trang_thai_ton
        FROM @Adjustments a
        INNER JOIN dbo.tbl_batch_inv b ON b.id_batch = a.BatchId
        WHERE a.DiffQty < 0;

        -- 6. Khóa sổ kế hoạch (Chuyển trang_thai = 2)
        UPDATE dbo.tbl_kiemke_batch_kh
        SET 
            trang_thai = 2, -- 2: Đã phê duyệt hoàn tất
            user_approve = @UserId,
            time_approve = @Now,
            ghi_chu_duyet = @ApprovalNote
        WHERE id_kh_batch = @PlanId;

        COMMIT TRANSACTION;

        SELECT 
            PlanId = @PlanId,
            TransactionDocumentId = @PhieuTransId,
            AdjustedBatchCount = (SELECT COUNT(*) FROM @Adjustments),
            ApprovedBy = @UserId,
            ApprovedAt = @Now,
            Message = N'Kế hoạch kiểm kê đã được Trưởng phòng kho phê duyệt và cân đối tồn kho thành công.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
