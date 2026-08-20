import {
  User,
  MaterialCategory,
  Material,
  WarehouseLocation,
  ReceivingOrder,
  QCTicket,
  QCCriterion,
  BatchInventory,
  IssueRequest,
  WarehouseTransaction,
  InventoryAuditTicket,
  WarehouseOperationCatalogItem
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-001',
    username: 'admin',
    fullName: 'Nguyễn Văn Quản Trị',
    email: 'admin@mms-factory.vn',
    role: 'ADMIN',
    department: 'Ban Giám Đốc / IT',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'ql_kiemke',
    username: 'ql_kiemke',
    fullName: 'Nguyễn Văn Kiểm Kê',
    email: 'kiemke@mms-factory.vn',
    role: 'ql_kiemke',
    department: 'Kho Vật Tư KNSG',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-002',
    username: 'thukho.nam',
    fullName: 'Trần Văn Nam',
    email: 'nam.tv@mms-factory.vn',
    role: 'THUKHO',
    department: 'Bộ phận Kho Vật tư',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-003',
    username: 'qc.lan',
    fullName: 'Lê Thị Mai Lan',
    email: 'lan.ltm@mms-factory.vn',
    role: 'QC',
    department: 'Phòng Quản lý Chất lượng (QA/QC)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-004',
    username: 'sx.tuan',
    fullName: 'Phạm Minh Tuấn',
    email: 'tuan.pm@mms-factory.vn',
    role: 'SANXUAT',
    department: 'Xưởng Sản xuất 1',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-005',
    username: 'ketoan.hoa',
    fullName: 'Đỗ Thu Hoa',
    email: 'hoa.dt@mms-factory.vn',
    role: 'KETOAN',
    department: 'Phòng Kế toán Tài chính',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_CATEGORIES: MaterialCategory[] = [
  { id: 'CAT-01', code: 'LINHKIEN', name: 'Linh kiện Điện tử', description: 'Vi mạch, IC, Chip, Điện trở, Tụ điện, Sensor', qcRequired: true },
  { id: 'CAT-02', code: 'COKHI', name: 'Vật tư Cơ khí & Kim loại', description: 'Thanh nhôm, Bu lông, Ốc vít, Bản lề, Trục quay', qcRequired: true },
  { id: 'CAT-03', code: 'HOACHAT', name: 'Hoá chất & Keo dán', description: 'Keo dán công nghiệp, Dầu mỡ bôi trơn, Sơn phủ', qcRequired: true },
  { id: 'CAT-04', code: 'BAOBI', name: 'Bao bì & Đóng gói', description: 'Thùng carton, Màng co, Khay xốp, Băng dính', qcRequired: false },
  { id: 'CAT-05', code: 'PHULIEU', name: 'Phụ liệu Tiêu hao', description: 'Găng tay, Khăn lau phòng sạch, Dây thít nhựa', qcRequired: false }
];

export const INITIAL_MATERIALS: Material[] = [
  {
    id: 'MAT-001',
    code: 'IC-STM32F4',
    name: 'Vi điều khiển STM32F407VGT6 ARM Cortex-M4',
    categoryId: 'CAT-01',
    categoryName: 'Linh kiện Điện tử',
    unit: 'Con',
    minStock: 200,
    maxStock: 2500,
    standardPrice: 165000,
    specification: 'LQFP-100, 168MHz, 1MB Flash',
    supplier: 'STMicroelectronics Corp',
    storageCondition: 'Kho lạnh 20-25°C, Độ ẩm <40%'
  },
  {
    id: 'MAT-002',
    code: 'RES-0805-10K',
    name: 'Điện trở dán SMD 0805 10K Ohm 1%',
    categoryId: 'CAT-01',
    categoryName: 'Linh kiện Điện tử',
    unit: 'Cuộn (5000 con)',
    minStock: 10,
    maxStock: 100,
    standardPrice: 95000,
    specification: 'SMD 0805, Sai số ±1%, Cuộn 5000pcs',
    supplier: 'Yageo Corporation',
    storageCondition: 'Chống tĩnh điện ESD, độ ẩm thường'
  },
  {
    id: 'MAT-003',
    code: 'CAP-100UF-50V',
    name: 'Tụ hóa SMD 100uF 50V Low ESR',
    categoryId: 'CAT-01',
    categoryName: 'Linh kiện Điện tử',
    unit: 'Cuộn (1000 con)',
    minStock: 15,
    maxStock: 120,
    standardPrice: 280000,
    specification: 'SMD 8x10.5mm, 105°C, 2000hrs',
    supplier: 'Nichicon Corp',
    storageCondition: 'Nhiệt độ phòng <30°C'
  },
  {
    id: 'MAT-004',
    code: 'ALU-6063-T5',
    name: 'Nhôm định hình 40x40 anodized bạc',
    categoryId: 'CAT-02',
    categoryName: 'Vật tư Cơ khí & Kim loại',
    unit: 'Thanh 6m',
    minStock: 50,
    maxStock: 500,
    standardPrice: 320000,
    specification: 'Hợp kim Al-6063-T5, rãnh 8mm, dài 6 mét',
    supplier: 'Công ty Nhôm Định Hình Kim Phát',
    storageCondition: 'Giá đỡ cơ khí nằm ngang khô ráo'
  },
  {
    id: 'MAT-005',
    code: 'BOLT-M4-16SS',
    name: 'Bu lông lục giác chìm Inox 304 M4x16',
    categoryId: 'CAT-02',
    categoryName: 'Vật tư Cơ khí & Kim loại',
    unit: 'Hộp (500 con)',
    minStock: 20,
    maxStock: 200,
    standardPrice: 125000,
    specification: 'DIN 912 Inox 304, ren M4 dài 16mm',
    supplier: 'Bulong Ốc Vít Hoàng Cường',
    storageCondition: 'Nơi khô ráo tránh ẩm'
  },
  {
    id: 'MAT-006',
    code: 'EPOXY-DP420',
    name: 'Keo kết cấu 3M Scotch-Weld Epoxy DP420',
    categoryId: 'CAT-03',
    categoryName: 'Hoá chất & Keo dán',
    unit: 'Tuýp 50ml',
    minStock: 25,
    maxStock: 150,
    standardPrice: 420000,
    specification: 'Tỉ lệ trộn 2:1, thời gian khô 20 phút',
    supplier: '3M Vietnam Official Distributor',
    storageCondition: 'Tủ mát chuyên dụng 15-20°C'
  },
  {
    id: 'MAT-007',
    code: 'BOX-CARTON-M1',
    name: 'Thùng carton 5 lớp 400x300x250mm chịu lực',
    categoryId: 'CAT-04',
    categoryName: 'Bao bì & Đóng gói',
    unit: 'Cái',
    minStock: 500,
    maxStock: 5000,
    standardPrice: 18500,
    specification: 'Sóng BC 5 lớp, phủ màng chống ẩm',
    supplier: 'Bao Bì Giấy Toàn Thắng',
    storageCondition: 'Kệ pallet cao, tránh ẩm và nắng'
  },
  {
    id: 'MAT-008',
    code: 'ESD-GLOVE-M',
    name: 'Găng tay phủ PU đầu ngón chống tĩnh điện size M',
    categoryId: 'CAT-05',
    categoryName: 'Phụ liệu Tiêu hao',
    unit: 'Đôi',
    minStock: 200,
    maxStock: 2000,
    standardPrice: 8500,
    specification: 'Điện trở bề mặt 10^6 - 10^9 Ohm',
    supplier: 'Bảo Hộ Lao Động An Toàn Việt',
    storageCondition: 'Bảo quản nguyên bao'
  }
];

export const INITIAL_LOCATIONS: WarehouseLocation[] = [
  // Kho A
  { id: 'LOC-A-K01-T1-01', code: 'A-K01-T1-01', warehouse: 'Kho A - Linh kiện điện tử', rack: 'K01', tier: 'T1', bin: '01', capacity: 1000, occupied: 650, status: 'PARTIAL' },
  { id: 'LOC-A-K01-T1-02', code: 'A-K01-T1-02', warehouse: 'Kho A - Linh kiện điện tử', rack: 'K01', tier: 'T1', bin: '02', capacity: 1000, occupied: 800, status: 'PARTIAL' },
  { id: 'LOC-A-K01-T2-01', code: 'A-K01-T2-01', warehouse: 'Kho A - Linh kiện điện tử', rack: 'K01', tier: 'T2', bin: '01', capacity: 1000, occupied: 1000, status: 'FULL' },
  { id: 'LOC-A-K01-T2-02', code: 'A-K01-T2-02', warehouse: 'Kho A - Linh kiện điện tử', rack: 'K01', tier: 'T2', bin: '02', capacity: 1000, occupied: 0, status: 'EMPTY' },
  { id: 'LOC-A-K02-T1-01', code: 'A-K02-T1-01', warehouse: 'Kho A - Linh kiện điện tử', rack: 'K02', tier: 'T1', bin: '01', capacity: 1000, occupied: 450, status: 'PARTIAL' },
  { id: 'LOC-A-K02-T1-02', code: 'A-K02-T1-02', warehouse: 'Kho A - Linh kiện điện tử', rack: 'K02', tier: 'T1', bin: '02', capacity: 1000, occupied: 0, status: 'EMPTY' },
  { id: 'LOC-A-K02-T2-01', code: 'A-K02-T2-01', warehouse: 'Kho A - Linh kiện điện tử', rack: 'K02', tier: 'T2', bin: '01', capacity: 1000, occupied: 320, status: 'PARTIAL' },
  { id: 'LOC-A-K02-T2-02', code: 'A-K02-T2-02', warehouse: 'Kho A - Linh kiện điện tử', rack: 'K02', tier: 'T2', bin: '02', capacity: 1000, occupied: 0, status: 'EMPTY' },

  // Kho B
  { id: 'LOC-B-K01-T1-01', code: 'B-K01-T1-01', warehouse: 'Kho B - Cơ khí & Hoá chất', rack: 'K01', tier: 'T1', bin: '01', capacity: 500, occupied: 420, status: 'PARTIAL' },
  { id: 'LOC-B-K01-T1-02', code: 'B-K01-T1-02', warehouse: 'Kho B - Cơ khí & Hoá chất', rack: 'K01', tier: 'T1', bin: '02', capacity: 500, occupied: 180, status: 'PARTIAL' },
  { id: 'LOC-B-K01-T2-01', code: 'B-K01-T2-01', warehouse: 'Kho B - Cơ khí & Hoá chất', rack: 'K01', tier: 'T2', bin: '01', capacity: 500, occupied: 500, status: 'FULL' },
  { id: 'LOC-B-K01-T2-02', code: 'B-K01-T2-02', warehouse: 'Kho B - Cơ khí & Hoá chất', rack: 'K01', tier: 'T2', bin: '02', capacity: 500, occupied: 0, status: 'EMPTY' },
  { id: 'LOC-B-K02-T1-01', code: 'B-K02-T1-01', warehouse: 'Kho B - Cơ khí & Hoá chất', rack: 'K02', tier: 'T1', bin: '01', capacity: 500, occupied: 350, status: 'PARTIAL' },
  { id: 'LOC-B-K02-T2-01', code: 'B-K02-T2-01', warehouse: 'Kho B - Cơ khí & Hoá chất', rack: 'K02', tier: 'T2', bin: '01', capacity: 500, occupied: 90, status: 'PARTIAL' },

  // Kho C
  { id: 'LOC-C-K01-T1-01', code: 'C-K01-T1-01', warehouse: 'Kho C - Bao bì & Phụ liệu', rack: 'K01', tier: 'T1', bin: '01', capacity: 2000, occupied: 1800, status: 'PARTIAL' },
  { id: 'LOC-C-K01-T2-01', code: 'C-K01-T2-01', warehouse: 'Kho C - Bao bì & Phụ liệu', rack: 'K01', tier: 'T2', bin: '01', capacity: 2000, occupied: 1200, status: 'PARTIAL' },
  { id: 'LOC-C-K02-T1-01', code: 'C-K02-T1-01', warehouse: 'Kho C - Bao bì & Phụ liệu', rack: 'K02', tier: 'T1', bin: '01', capacity: 2000, occupied: 0, status: 'EMPTY' }
];

export const INITIAL_BATCHES: BatchInventory[] = [
  {
    id: 'BAT-2026-0801-01',
    batchNumber: 'BAT-20260801-01',
    materialId: 'MAT-001',
    materialCode: 'IC-STM32F4',
    materialName: 'Vi điều khiển STM32F407VGT6 ARM Cortex-M4',
    unit: 'Con',
    quantity: 650,
    initialQuantity: 1000,
    locationId: 'LOC-A-K01-T1-01',
    locationCode: 'A-K01-T1-01',
    warehouse: 'Kho A - Linh kiện điện tử',
    manufactureDate: '2026-06-15',
    expiryDate: '2028-06-15',
    status: 'AVAILABLE',
    poNumber: 'PO-2026-0708',
    receivingOrderCode: 'PNH-20260801-001',
    qcCode: 'QC-20260801-001',
    unitCost: 165000,
    createdAt: '2026-08-01 09:30'
  },
  {
    id: 'BAT-2026-0802-02',
    batchNumber: 'BAT-20260802-02',
    materialId: 'MAT-002',
    materialCode: 'RES-0805-10K',
    materialName: 'Điện trở dán SMD 0805 10K Ohm 1%',
    unit: 'Cuộn (5000 con)',
    quantity: 45,
    initialQuantity: 50,
    locationId: 'LOC-A-K01-T1-02',
    locationCode: 'A-K01-T1-02',
    warehouse: 'Kho A - Linh kiện điện tử',
    manufactureDate: '2026-05-10',
    expiryDate: '2029-05-10',
    status: 'AVAILABLE',
    poNumber: 'PO-2026-0715',
    receivingOrderCode: 'PNH-20260802-001',
    qcCode: 'QC-20260802-001',
    unitCost: 95000,
    createdAt: '2026-08-02 14:15'
  },
  {
    id: 'BAT-2026-0805-03',
    batchNumber: 'BAT-20260805-03',
    materialId: 'MAT-003',
    materialCode: 'CAP-100UF-50V',
    materialName: 'Tụ hóa SMD 100uF 50V Low ESR',
    unit: 'Cuộn (1000 con)',
    quantity: 32,
    initialQuantity: 40,
    locationId: 'LOC-A-K02-T2-01',
    locationCode: 'A-K02-T2-01',
    warehouse: 'Kho A - Linh kiện điện tử',
    manufactureDate: '2026-04-20',
    expiryDate: '2028-04-20',
    status: 'AVAILABLE',
    poNumber: 'PO-2026-0720',
    receivingOrderCode: 'PNH-20260805-001',
    qcCode: 'QC-20260805-001',
    unitCost: 280000,
    createdAt: '2026-08-05 11:00'
  },
  {
    id: 'BAT-2026-0807-04',
    batchNumber: 'BAT-20260807-04',
    materialId: 'MAT-004',
    materialCode: 'ALU-6063-T5',
    materialName: 'Nhôm định hình 40x40 anodized bạc',
    unit: 'Thanh 6m',
    quantity: 210,
    initialQuantity: 250,
    locationId: 'LOC-B-K01-T1-01',
    locationCode: 'B-K01-T1-01',
    warehouse: 'Kho B - Cơ khí & Hoá chất',
    manufactureDate: '2026-07-01',
    expiryDate: '2036-07-01',
    status: 'AVAILABLE',
    poNumber: 'PO-2026-0728',
    receivingOrderCode: 'PNH-20260807-001',
    qcCode: 'QC-20260807-001',
    unitCost: 320000,
    createdAt: '2026-08-07 10:20'
  },
  {
    id: 'BAT-2026-0808-05',
    batchNumber: 'BAT-20260808-05',
    materialId: 'MAT-005',
    materialCode: 'BOLT-M4-16SS',
    materialName: 'Bu lông lục giác chìm Inox 304 M4x16',
    unit: 'Hộp (500 con)',
    quantity: 75,
    initialQuantity: 80,
    locationId: 'LOC-B-K02-T1-01',
    locationCode: 'B-K02-T1-01',
    warehouse: 'Kho B - Cơ khí & Hoá chất',
    manufactureDate: '2026-06-01',
    expiryDate: '2031-06-01',
    status: 'AVAILABLE',
    poNumber: 'PO-2026-0730',
    receivingOrderCode: 'PNH-20260808-001',
    qcCode: 'QC-20260808-001',
    unitCost: 125000,
    createdAt: '2026-08-08 16:45'
  },
  {
    id: 'BAT-2026-0810-06',
    batchNumber: 'BAT-20260810-06',
    materialId: 'MAT-006',
    materialCode: 'EPOXY-DP420',
    materialName: 'Keo kết cấu 3M Scotch-Weld Epoxy DP420',
    unit: 'Tuýp 50ml',
    quantity: 48,
    initialQuantity: 60,
    locationId: 'LOC-B-K01-T1-02',
    locationCode: 'B-K01-T1-02',
    warehouse: 'Kho B - Cơ khí & Hoá chất',
    manufactureDate: '2026-07-15',
    expiryDate: '2027-01-15',
    status: 'AVAILABLE',
    poNumber: 'PO-2026-0801',
    receivingOrderCode: 'PNH-20260810-001',
    qcCode: 'QC-20260810-001',
    unitCost: 420000,
    createdAt: '2026-08-10 13:00'
  },
  {
    id: 'BAT-2026-0812-07',
    batchNumber: 'BAT-20260812-07',
    materialId: 'MAT-007',
    materialCode: 'BOX-CARTON-M1',
    materialName: 'Thùng carton 5 lớp 400x300x250mm chịu lực',
    unit: 'Cái',
    quantity: 1800,
    initialQuantity: 2000,
    locationId: 'LOC-C-K01-T1-01',
    locationCode: 'C-K01-T1-01',
    warehouse: 'Kho C - Bao bì & Phụ liệu',
    manufactureDate: '2026-08-01',
    expiryDate: '2028-08-01',
    status: 'AVAILABLE',
    poNumber: 'PO-2026-0803',
    receivingOrderCode: 'PNH-20260812-001',
    qcCode: 'QC-20260812-001',
    unitCost: 18500,
    createdAt: '2026-08-12 08:30'
  },
  {
    id: 'BAT-2026-0814-08',
    batchNumber: 'BAT-20260814-08',
    materialId: 'MAT-008',
    materialCode: 'ESD-GLOVE-M',
    materialName: 'Găng tay phủ PU đầu ngón chống tĩnh điện size M',
    unit: 'Đôi',
    quantity: 1200,
    initialQuantity: 1200,
    locationId: 'LOC-C-K01-T2-01',
    locationCode: 'C-K01-T2-01',
    warehouse: 'Kho C - Bao bì & Phụ liệu',
    manufactureDate: '2026-07-20',
    expiryDate: '2028-07-20',
    status: 'AVAILABLE',
    poNumber: 'PO-2026-0805',
    receivingOrderCode: 'PNH-20260814-001',
    qcCode: 'QC-20260814-001',
    unitCost: 8500,
    createdAt: '2026-08-14 09:00'
  }
];

export const INITIAL_QC_CRITERIA: QCCriterion[] = [
  { id: 'CRI-01', name: 'Kiểm tra Ngoại quan & Đóng gói', standardValue: 'Bao bì nguyên vẹn, không móp méo, có tem nhãn rõ ràng', testMethod: 'Quan sát mắt thường', importance: 'CRITICAL' },
  { id: 'CRI-02', name: 'Kiểm tra Chứng chỉ CO/CQ', standardValue: 'Đầy đủ chứng nhận xuất xứ & chất lượng từ nhà sản xuất', testMethod: 'Đối chiếu hồ sơ', importance: 'CRITICAL' },
  { id: 'CRI-03', name: 'Đo kích thước hình học & Dung sai', standardValue: 'Đúng bản vẽ kỹ thuật trong khoảng sai số cho phép ±0.05mm', testMethod: 'Thước cặp điện tử / Panme', importance: 'MAJOR' },
  { id: 'CRI-04', name: 'Kiểm tra Hạn sử dụng & Bảo quản', standardValue: 'Hạn dùng còn tối thiểu 80% thời hạn tính từ ngày giao', testMethod: 'Kiểm tra in date', importance: 'MAJOR' },
  { id: 'CRI-05', name: 'Kiểm tra Điện áp / Trở kháng / Chức năng', standardValue: 'Hoạt động ổn định trong dải điện áp định mức', testMethod: 'Máy đo LCR / Oscilloscope', importance: 'CRITICAL' }
];

export const INITIAL_RECEIVING_ORDERS: ReceivingOrder[] = [
  {
    id: 'REC-001',
    code: 'PNH-20260814-001',
    type: 'PO',
    poNumber: 'PO-2026-0810',
    supplier: 'STMicroelectronics Singapore',
    receivedDate: '2026-08-14 08:30',
    receiver: 'Trần Văn Nam',
    status: 'QC_IN_PROGRESS',
    notes: 'Hàng nhập khẩu đường hàng không, 2 kiện niêm phong nguyên vẹn',
    items: [
      {
        id: 'RI-001',
        materialId: 'MAT-001',
        materialCode: 'IC-STM32F4',
        materialName: 'Vi điều khiển STM32F407VGT6 ARM Cortex-M4',
        unit: 'Con',
        poQuantity: 1000,
        receivedQuantity: 1000,
        batchNumber: 'BAT-20260814-01',
        expiryDate: '2028-08-14',
        manufactureDate: '2026-07-10',
        note: 'Đóng gói khay chống ẩm ESD'
      }
    ]
  },
  {
    id: 'REC-002',
    code: 'PNH-20260814-002',
    type: 'PO',
    poNumber: 'PO-2026-0812',
    supplier: '3M Vietnam Official Distributor',
    receivedDate: '2026-08-14 10:15',
    receiver: 'Trần Văn Nam',
    status: 'WAITING_QC',
    notes: 'Keo kết cấu DP420 cho dây chuyền sản xuất bo mạch',
    items: [
      {
        id: 'RI-002',
        materialId: 'MAT-006',
        materialCode: 'EPOXY-DP420',
        materialName: 'Keo kết cấu 3M Scotch-Weld Epoxy DP420',
        unit: 'Tuýp 50ml',
        poQuantity: 100,
        receivedQuantity: 100,
        batchNumber: 'BAT-20260814-02',
        expiryDate: '2027-02-14',
        manufactureDate: '2026-08-01',
        note: 'Bảo quản thùng xốp giữ nhiệt'
      }
    ]
  },
  {
    id: 'REC-003',
    code: 'PNH-20260813-001',
    type: 'INTERNAL_RETURN',
    poNumber: 'TRA-XUONG1-089',
    supplier: 'Xưởng Sản xuất 1 (Chuyền SMT 2)',
    receivedDate: '2026-08-13 16:20',
    receiver: 'Trần Văn Nam',
    status: 'QC_PASSED',
    notes: 'Thu hồi linh kiện và bulong dư sau khi hoàn thành lô hàng SX-880',
    items: [
      {
        id: 'RI-003',
        materialId: 'MAT-005',
        materialCode: 'BOLT-M4-16SS',
        materialName: 'Bu lông lục giác chìm Inox 304 M4x16',
        unit: 'Hộp (500 con)',
        poQuantity: 10,
        receivedQuantity: 10,
        batchNumber: 'BAT-20260813-RET',
        expiryDate: '2031-06-01',
        manufactureDate: '2026-06-01',
        note: 'Còn nguyên hộp niêm phong'
      }
    ]
  }
];

export const INITIAL_QC_TICKETS: QCTicket[] = [
  {
    id: 'QC-20260814-001',
    code: 'QC-20260814-001',
    receivingOrderId: 'REC-001',
    receivingOrderCode: 'PNH-20260814-001',
    materialId: 'MAT-001',
    materialCode: 'IC-STM32F4',
    materialName: 'Vi điều khiển STM32F407VGT6 ARM Cortex-M4',
    batchNumber: 'BAT-20260814-01',
    sampleQuantity: 32,
    lotQuantity: 1000,
    inspector: 'Lê Thị Mai Lan',
    inspectionDate: '2026-08-14 09:30',
    evaluation: 'PENDING',
    notes: 'Đang tiến hành test điện trở chân và đọc ID qua ST-Link',
    checkDetails: [
      { criterionId: 'CRI-01', criterionName: 'Kiểm tra Ngoại quan & Đóng gói', standardValue: 'Bao bì nguyên vẹn, túi hút chân không có hạt chống ẩm', actualValue: 'Túi hút chân không đạt chuẩn, tem hãng sắc nét', passed: true },
      { criterionId: 'CRI-02', criterionName: 'Kiểm tra Chứng chỉ CO/CQ', standardValue: 'Có chứng nhận xuất xứ Singapore STMicroelectronics', actualValue: 'Đầy đủ CO/CQ bản gốc scan', passed: true },
      { criterionId: 'CRI-04', criterionName: 'Kiểm tra Hạn sử dụng & Date Code', standardValue: 'Date code sản xuất tuần 28/2026', actualValue: 'Date code 2628 đạt', passed: true },
      { criterionId: 'CRI-05', criterionName: 'Kiểm tra Điện áp / Trở kháng / Chức năng', standardValue: 'Vdd = 3.3V, dòng tĩnh < 15uA, nạp firmware demo OK', actualValue: 'Đang đo mẫu 32 con (đã pass 16/32)', passed: true }
    ]
  },
  {
    id: 'QC-20260812-001',
    code: 'QC-20260812-001',
    receivingOrderId: 'REC-000',
    receivingOrderCode: 'PNH-20260812-001',
    materialId: 'MAT-007',
    materialCode: 'BOX-CARTON-M1',
    materialName: 'Thùng carton 5 lớp 400x300x250mm chịu lực',
    batchNumber: 'BAT-20260812-07',
    sampleQuantity: 20,
    lotQuantity: 2000,
    inspector: 'Lê Thị Mai Lan',
    inspectionDate: '2026-08-12 10:00',
    evaluation: 'PASS',
    releasedQuantity: 2000,
    notes: 'Đạt tiêu chuẩn độ nén ECT và chống ẩm',
    checkDetails: [
      { criterionId: 'CRI-01', criterionName: 'Kiểm tra Ngoại quan & Đóng gói', standardValue: 'Không rách, in ấn đúng logo nhà máy', actualValue: 'Đạt, màu in sắc nét', passed: true },
      { criterionId: 'CRI-03', criterionName: 'Đo kích thước hình học & Dung sai', standardValue: '400x300x250mm (±2mm)', actualValue: '401x300x250mm (Đạt)', passed: true }
    ]
  }
];

export const INITIAL_ISSUE_REQUESTS: IssueRequest[] = [
  {
    id: 'REQ-001',
    code: 'DNXK-20260814-001',
    type: 'PLANNING',
    department: 'Xưởng Sản xuất 1',
    requester: 'Phạm Minh Tuấn',
    purpose: 'Xuất linh kiện phục vụ đơn hàng SX Controller IoT Lô 08',
    productionOrder: 'LSX-2026-08-012',
    createdAt: '2026-08-14 08:00',
    requiredDate: '2026-08-14 15:00',
    status: 'APPROVED',
    approver: 'Nguyễn Văn Quản Trị',
    approvalDate: '2026-08-14 09:15',
    approvalComment: 'Đã duyệt theo đúng định mức kế hoạch sản xuất tháng 8',
    items: [
      {
        id: 'II-001',
        materialId: 'MAT-001',
        materialCode: 'IC-STM32F4',
        materialName: 'Vi điều khiển STM32F407VGT6 ARM Cortex-M4',
        unit: 'Con',
        requestedQuantity: 150,
        approvedQuantity: 150,
        issuedQuantity: 0,
        allocatedBatches: [
          { batchId: 'BAT-2026-0801-01', batchNumber: 'BAT-20260801-01', locationCode: 'A-K01-T1-01', quantity: 150 }
        ]
      },
      {
        id: 'II-002',
        materialId: 'MAT-002',
        materialCode: 'RES-0805-10K',
        materialName: 'Điện trở dán SMD 0805 10K Ohm 1%',
        unit: 'Cuộn (5000 con)',
        requestedQuantity: 2,
        approvedQuantity: 2,
        issuedQuantity: 0,
        allocatedBatches: [
          { batchId: 'BAT-2026-0802-02', batchNumber: 'BAT-20260802-02', locationCode: 'A-K01-T1-02', quantity: 2 }
        ]
      }
    ]
  },
  {
    id: 'REQ-002',
    code: 'DNXK-20260814-002',
    type: 'OVER_PLANNING',
    department: 'Xưởng Cơ khí & Lắp ráp khung',
    requester: 'Hoàng Đình Bách',
    purpose: 'Xuất thêm nhôm định hình do khách hàng yêu cầu gia cố khung máy',
    productionOrder: 'LSX-2026-08-009',
    createdAt: '2026-08-14 10:30',
    requiredDate: '2026-08-15 09:00',
    status: 'PENDING_APPROVAL',
    items: [
      {
        id: 'II-003',
        materialId: 'MAT-004',
        materialCode: 'ALU-6063-T5',
        materialName: 'Nhôm định hình 40x40 anodized bạc',
        unit: 'Thanh 6m',
        requestedQuantity: 15,
        approvedQuantity: 0,
        issuedQuantity: 0,
        notes: 'Phát sinh ngoài BOM chuẩn theo đề xuất kỹ thuật số TK-44'
      }
    ]
  },
  {
    id: 'REQ-003',
    code: 'DNXK-20260813-001',
    type: 'PLANNING',
    department: 'Xưởng Đóng gói Hoàn thiện',
    requester: 'Nguyễn Thị Bích',
    purpose: 'Xuất thùng carton và găng tay đóng gói sản phẩm hoàn thiện',
    productionOrder: 'LSX-2026-08-005',
    createdAt: '2026-08-13 11:00',
    requiredDate: '2026-08-13 14:00',
    status: 'ISSUED',
    approver: 'Nguyễn Văn Quản Trị',
    approvalDate: '2026-08-13 11:30',
    deliveryNoteNumber: 'PXK-20260813-001',
    issuedDate: '2026-08-13 13:45',
    issuer: 'Trần Văn Nam',
    items: [
      {
        id: 'II-004',
        materialId: 'MAT-007',
        materialCode: 'BOX-CARTON-M1',
        materialName: 'Thùng carton 5 lớp 400x300x250mm chịu lực',
        unit: 'Cái',
        requestedQuantity: 200,
        approvedQuantity: 200,
        issuedQuantity: 200
      },
      {
        id: 'II-005',
        materialId: 'MAT-008',
        materialCode: 'ESD-GLOVE-M',
        materialName: 'Găng tay phủ PU đầu ngón chống tĩnh điện size M',
        unit: 'Đôi',
        requestedQuantity: 50,
        approvedQuantity: 50,
        issuedQuantity: 50
      }
    ]
  },
  {
    id: 'REQ-004',
    code: 'DNXK-20260818-004',
    type: 'PLANNING',
    department: 'Tổ Mài & Tinh Chỉnh Kềm',
    requester: 'Phạm Thị Mài',
    purpose: 'Xuất vít LG M2.5 và lò xo kềm phục vụ lắp ráp ca sáng',
    productionOrder: 'LSX-KN-202608-018',
    createdAt: '2026-08-18 08:30',
    requiredDate: '2026-08-18 10:00',
    status: 'PICKING',
    approver: 'Nguyễn Văn Quản Trị',
    approvalDate: '2026-08-18 08:45',
    items: [
      {
        id: 'II-006',
        materialId: 'MAT-003',
        materialCode: 'V254809S303',
        materialName: 'Vis LG (M2.5x4.8x0.9mm) V3 Inox S303',
        unit: 'Con',
        requestedQuantity: 500,
        approvedQuantity: 500,
        issuedQuantity: 0
      }
    ]
  },
  {
    id: 'REQ-005',
    code: 'DNXK-20260817-005',
    type: 'PLANNING',
    department: 'Tổ Rèn & Dập Phôi',
    requester: 'Nguyễn Văn Dập',
    purpose: 'Xuất thép C45 rèn phôi kềm cắt da 5000 cây',
    productionOrder: 'LSX-KN-202608-015',
    createdAt: '2026-08-17 07:30',
    requiredDate: '2026-08-17 09:00',
    status: 'RECEIVED',
    approver: 'Nguyễn Văn Quản Trị',
    approvalDate: '2026-08-17 08:00',
    deliveryNoteNumber: 'PXK-20260817-003',
    issuedDate: '2026-08-17 08:45',
    issuer: 'Trần Văn Nam',
    items: [
      {
        id: 'II-007',
        materialId: 'MAT-006',
        materialCode: 'THEP-C45-D12',
        materialName: 'Thép cuộn C45 phi 12mm',
        unit: 'Kg',
        requestedQuantity: 1200,
        approvedQuantity: 1200,
        issuedQuantity: 1200
      }
    ]
  }
];

export const WAREHOUSE_OPERATIONS_CATALOG: WarehouseOperationCatalogItem[] = [
  { group: 'Nội Bộ', code: 'ADJ_DWN', name: 'Điều Chỉnh Giảm', description: 'Ghi nhận giảm tồn kho sau kiểm kê phát hiện thiếu, thất thoát', logic: -1 },
  { group: 'Nội Bộ', code: 'ADJ_UP', name: 'Điều Chỉnh Tăng', description: 'Ghi nhận tăng tồn kho sau kiểm kê phát hiện thừa', logic: 1 },
  { group: 'Nhập Kho', code: 'IN_OTH', name: 'Nhập Khác', description: 'Nhập hàng mẫu, hàng biếu tặng, hoặc các trường hợp khác', logic: 1 },
  { group: 'Nhập Kho', code: 'IN_PO', name: 'Nhập Mua Hàng', description: 'Ghi nhận hàng từ Nhà cung cấp theo đơn mua hàng (PO)', logic: 1 },
  { group: 'Nhập Kho', code: 'IN_PROD', name: 'Nhập Sản Xuất Trả', description: 'Ghi nhận vật tư từ dây chuyền sản xuất vào kho', logic: 1 },
  { group: 'Nhập Kho', code: 'IN_RTN', name: 'Nhập Hàng Trả', description: 'Ghi nhận hàng khách hàng trả lại', logic: 1 },
  { group: 'Nhập Kho', code: 'IN_TRN', name: 'Nhập Chuyển Kho', description: 'Ghi nhận hàng từ một kho khác trong cùng công ty chuyển đến', logic: 1 },
  { group: 'Nội Bộ', code: 'INV_CNT', name: 'Kiểm Kê Kho', description: 'Nghiệp vụ ghi nhận số lượng thực tế tại một thời điểm, dùng làm cơ sở cho điều chỉnh', logic: 0 },
  { group: 'Nội Bộ', code: 'MOV_BIN', name: 'Chuyển Vị Trí', description: 'Di chuyển hàng hóa từ vị trí này sang vị trí khác trong cùng một kho', logic: 0 },
  { group: 'Xuất Kho', code: 'OUT_CON', name: 'Xuất Cho Sản Xuất', description: 'Xuất nguyên vật liệu cho lệnh sản xuất', logic: -1 },
  { group: 'Xuất Kho', code: 'OUT_OTH', name: 'Xuất Khác', description: 'Xuất hàng mẫu, cho tặng, sử dụng nội bộ', logic: -1 },
  { group: 'Xuất Kho', code: 'OUT_SCR', name: 'Xuất Hủy', description: 'Ghi nhận hàng hóa bị hỏng, hết hạn sử dụng và tiến hành hủy', logic: -1 },
  { group: 'Xuất Kho', code: 'OUT_SO', name: 'Xuất Bán Hàng', description: 'Xuất hàng giao cho khách theo đơn bán hàng (SO)', logic: -1 },
  { group: 'Xuất Kho', code: 'OUT_TRN', name: 'Xuất Chuyển Kho', description: 'Xuất hàng đi đến một kho khác trong cùng công ty', logic: -1 },
  { group: 'Xuất Kho', code: 'OUT_VEN', name: 'Xuất Trả NCC', description: 'Xuất hàng trả lại cho Nhà cung cấp do lỗi, sai quy cách', logic: -1 },
  { group: 'Nội Bộ', code: 'SPLIT_OUT', name: 'Giảm Lô Cha Sau Tách', description: 'Giảm số lượng trên Lô gốc sau khi tách ra các Lô con', logic: -1 },
  { group: 'Nội Bộ', code: 'SPLIT_IN', name: 'Nhập Lô Con Tách Mới', description: 'Ghi nhận số lượng trên Lô con mới được tách ra', logic: 1 },
  { group: 'Nội Bộ', code: 'CC_ADJ_OUT', name: 'Điều Chỉnh Giảm Kiểm Kê', description: 'Ghi nhận giảm số lượng cặn dư sau kiểm kê', logic: -1 },
  { group: 'Nội Bộ', code: 'CC_ADJ_IN', name: 'Điều Chỉnh Tăng Kiểm Kê', description: 'Ghi nhận tăng số lượng phát hiện thừa trong kiểm kê', logic: 1 },
  { group: 'Chất Lượng', code: 'STS_DMG', name: 'Ghi Nhận Hàng Hỏng', description: 'Chuyển trạng thái hàng tốt sang hàng hỏng (ví dụ: bị rơi vỡ trong kho)', logic: 0 },
  { group: 'Chất Lượng', code: 'STS_HLD', name: 'Phong Tỏa / Tạm Giữ', description: 'Thay đổi trạng thái của hàng hóa thành "Tạm giữ" để chờ kiểm tra chất lượng', logic: 0 },
  { group: 'Chất Lượng', code: 'STS_RLS', name: 'Giải Tỏa', description: 'Thay đổi trạng thái của hàng hóa từ "Tạm giữ" về "Sẵn sàng"', logic: 0 }
];

export const INITIAL_TRANSACTIONS: WarehouseTransaction[] = [
  {
    id: 'TRX-001',
    code: 'GD-20260814-001',
    date: '2026-08-14 09:00',
    type: 'IN_PO',
    operationCode: 'IN_PO',
    logic: 1,
    typeLabel: 'Nhập Mua Hàng (PO)',
    materialId: 'MAT-008',
    materialCode: 'ESD-GLOVE-M',
    materialName: 'Găng tay phủ PU đầu ngón chống tĩnh điện size M',
    batchNumber: 'BAT-20260814-08',
    quantity: 1200,
    unit: 'Đôi',
    destinationLocation: 'C-K01-T2-01',
    referenceDoc: 'PNH-20260814-001',
    performer: 'Trần Văn Nam',
    note: 'Nhập kho chính thức sau khi QC Pass'
  },
  {
    id: 'TRX-002',
    code: 'GD-20260813-001',
    date: '2026-08-13 13:45',
    type: 'OUT_CON',
    operationCode: 'OUT_CON',
    logic: -1,
    typeLabel: 'Xuất Cho Sản Xuất',
    materialId: 'MAT-007',
    materialCode: 'BOX-CARTON-M1',
    materialName: 'Thùng carton 5 lớp 400x300x250mm chịu lực',
    batchNumber: 'BAT-20260812-07',
    quantity: 200,
    unit: 'Cái',
    sourceLocation: 'C-K01-T1-01',
    referenceDoc: 'PXK-20260813-001',
    performer: 'Trần Văn Nam',
    note: 'Xuất cho Xưởng Đóng gói theo phiếu DNXK-20260813-001'
  },
  {
    id: 'TRX-003',
    code: 'GD-20260813-002',
    date: '2026-08-13 13:45',
    type: 'OUT_CON',
    operationCode: 'OUT_CON',
    logic: -1,
    typeLabel: 'Xuất Cho Sản Xuất',
    materialId: 'MAT-008',
    materialCode: 'ESD-GLOVE-M',
    materialName: 'Găng tay phủ PU đầu ngón chống tĩnh điện size M',
    batchNumber: 'BAT-20260814-08',
    quantity: 50,
    unit: 'Đôi',
    sourceLocation: 'C-K01-T2-01',
    referenceDoc: 'PXK-20260813-001',
    performer: 'Trần Văn Nam',
    note: 'Xuất cho Xưởng Đóng gói'
  },
  {
    id: 'TRX-004',
    code: 'GD-20260812-001',
    date: '2026-08-12 11:30',
    type: 'IN_PO',
    operationCode: 'IN_PO',
    logic: 1,
    typeLabel: 'Nhập Mua Hàng (PO)',
    materialId: 'MAT-007',
    materialCode: 'BOX-CARTON-M1',
    materialName: 'Thùng carton 5 lớp 400x300x250mm chịu lực',
    batchNumber: 'BAT-20260812-07',
    quantity: 2000,
    unit: 'Cái',
    destinationLocation: 'C-K01-T1-01',
    referenceDoc: 'PNH-20260812-001',
    performer: 'Trần Văn Nam',
    note: 'Nhập kho lô hàng bao bì PO-2026-0803'
  }
];

export const INITIAL_AUDIT_TICKETS: InventoryAuditTicket[] = [
  {
    id: 'AUD-001',
    code: 'KK-20260810-001',
    title: 'Kiểm kê định kỳ Kho A - Linh kiện điện tử',
    date: '2026-08-10',
    warehouse: 'Kho A - Linh kiện điện tử',
    auditor: 'Trần Văn Nam & Đỗ Thu Hoa',
    status: 'COMPLETED',
    notes: 'Kiểm tra 100% các batch IC và Tụ điện trước kỳ quyết toán tháng',
    items: [
      {
        id: 'AI-001',
        materialId: 'MAT-001',
        materialCode: 'IC-STM32F4',
        materialName: 'Vi điều khiển STM32F407VGT6 ARM Cortex-M4',
        batchNumber: 'BAT-20260801-01',
        locationCode: 'A-K01-T1-01',
        systemQuantity: 650,
        actualQuantity: 650,
        difference: 0,
        status: 'MATCH'
      },
      {
        id: 'AI-002',
        materialId: 'MAT-002',
        materialCode: 'RES-0805-10K',
        materialName: 'Điện trở dán SMD 0805 10K Ohm 1%',
        batchNumber: 'BAT-20260802-02',
        locationCode: 'A-K01-T1-02',
        systemQuantity: 45,
        actualQuantity: 45,
        difference: 0,
        status: 'MATCH'
      }
    ]
  }
];
