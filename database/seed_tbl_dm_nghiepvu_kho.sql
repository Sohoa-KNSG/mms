USE MMS1;
GO

-- ============================================================================
-- SCRIPT: Khởi tạo & Đồng bộ Danh mục Nghiệp Vụ Kho (tbl_dm_nghiepvu_kho)
-- MỤC ĐÍCH: Chuẩn hóa 18 mã nghiệp vụ kho cốt lõi của hệ thống MMS WMS
-- NGUYÊN TẮC: 
--   1. tbl_transaction.so_luong luôn lưu SỐ DƯƠNG (> 0).
--   2. Dấu biến động (+1: Tăng, -1: Giảm, 0: Không đổi) do cột [logic] quy định.
--   3. Tồn sổ cái (Ledger Balance) = SUM(t.so_luong * nv.logic).
-- ============================================================================

-- 1. Đảm bảo bảng tbl_dm_nghiepvu_kho tồn tại với cấu trúc chuẩn
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'tbl_dm_nghiepvu_kho')
BEGIN
    CREATE TABLE dbo.tbl_dm_nghiepvu_kho (
        id_nghiepvu INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        nhom_nghiepvu NVARCHAR(50) NOT NULL,
        ma_nghiepvu NVARCHAR(50) NOT NULL UNIQUE,
        ten_nghiepvu NVARCHAR(255) NOT NULL,
        mo_ta_ton_kho NVARCHAR(500) NULL,
        logic INT NOT NULL DEFAULT 0, -- 1: Tăng, -1: Giảm, 0: Không đổi
        time_cre DATETIME NOT NULL DEFAULT GETDATE(),
        time_up DATETIME NULL,
        user_up NVARCHAR(100) NULL
    );
END
GO

-- 2. Đồng bộ 18 mã nghiệp vụ chuẩn vào bảng tbl_dm_nghiepvu_kho
MERGE dbo.tbl_dm_nghiepvu_kho AS target
USING (
    VALUES
        (N'Nội Bộ',    N'ADJ_DWN',  N'Điều Chỉnh Giảm',      N'Ghi nhận giảm tồn kho sau kiểm kê phát hiện thiếu, thất thoát', -1),
        (N'Nội Bộ',    N'ADJ_UP',   N'Điều Chỉnh Tăng',      N'Ghi nhận tăng tồn kho sau kiểm kê phát hiện thừa',               1),
        (N'Nhập Kho',  N'IN_OTH',   N'Nhập Khác',            N'Nhập hàng mẫu, hàng biếu tặng, hoặc các trường hợp khác',        1),
        (N'Nhập Kho',  N'IN_PO',    N'Nhập Mua Hàng',        N'Ghi nhận hàng từ Nhà cung cấp theo đơn mua hàng (PO)',           1),
        (N'Nhập Kho',  N'IN_PROD',  N'Nhập Sản Xuất Trả',    N'Ghi nhận vật tư từ dây chuyền sản xuất vào kho',                 1),
        (N'Nhập Kho',  N'IN_RTN',   N'Nhập Hàng Trả',        N'Ghi nhận hàng khách hàng trả lại',                               1),
        (N'Nhập Kho',  N'IN_TRN',   N'Nhập Chuyển Kho',      N'Ghi nhận hàng từ một kho khác trong cùng công ty chuyển đến',    1),
        (N'Nội Bộ',    N'INV_CNT',  N'Kiểm Kê Kho',          N'Nghiệp vụ ghi nhận số lượng thực tế tại một thời điểm, dùng làm cơ sở cho điều chỉnh', 0),
        (N'Nội Bộ',    N'MOV_BIN',  N'Chuyển Vị Trí',        N'Di chuyển hàng hóa từ vị trí này sang vị trí khác trong cùng một kho', 0),
        (N'Xuất Kho',  N'OUT_CON',  N'Xuất Cho Sản Xuất',    N'Xuất nguyên vật liệu cho lệnh sản xuất',                        -1),
        (N'Xuất Kho',  N'OUT_OTH',  N'Xuất Khác',            N'Xuất hàng mẫu, cho tặng, sử dụng nội bộ',                       -1),
        (N'Xuất Kho',  N'OUT_SCR',  N'Xuất Hủy',             N'Ghi nhận hàng hóa bị hỏng, hết hạn sử dụng và tiến hành hủy',   -1),
        (N'Xuất Kho',  N'OUT_SO',   N'Xuất Bán Hàng',        N'Xuất hàng giao cho khách theo đơn bán hàng (SO)',               -1),
        (N'Xuất Kho',  N'OUT_TRN',  N'Xuất Chuyển Kho',      N'Xuất hàng đi đến một kho khác trong cùng công ty',              -1),
        (N'Xuất Kho',  N'OUT_VEN',  N'Xuất Trả NCC',         N'Xuất hàng trả lại cho Nhà cung cấp do lỗi, sai quy cách',       -1),
        (N'Chất Lượng', N'STS_DMG', N'Ghi Nhận Hàng Hỏng',   N'Chuyển trạng thái hàng tốt sang hàng hỏng (ví dụ: bị rơi vỡ trong kho)', 0),
        (N'Chất Lượng', N'STS_HLD', N'Phong Tỏa / Tạm Giữ',  N'Thay đổi trạng thái của hàng hóa thành "Tạm giữ" để chờ kiểm tra chất lượng', 0),
        (N'Chất Lượng', N'STS_RLS', N'Giải Tỏa',             N'Thay đổi trạng thái của hàng hóa từ "Tạm giữ" về "Sẵn sàng"',     0)
) AS source (nhom_nghiepvu, ma_nghiepvu, ten_nghiepvu, mo_ta_ton_kho, logic)
ON target.ma_nghiepvu = source.ma_nghiepvu
WHEN MATCHED THEN
    UPDATE SET 
        target.nhom_nghiepvu = source.nhom_nghiepvu,
        target.ten_nghiepvu  = source.ten_nghiepvu,
        target.mo_ta_ton_kho = source.mo_ta_ton_kho,
        target.logic         = source.logic,
        target.time_up       = GETDATE()
WHEN NOT MATCHED THEN
    INSERT (nhom_nghiepvu, ma_nghiepvu, ten_nghiepvu, mo_ta_ton_kho, logic, time_cre)
    VALUES (source.nhom_nghiepvu, source.ma_nghiepvu, source.ten_nghiepvu, source.mo_ta_ton_kho, source.logic, GETDATE());
GO

PRINT N'✅ Đã đồng bộ thành công 18 mã nghiệp vụ kho vào tbl_dm_nghiepvu_kho!';
GO
