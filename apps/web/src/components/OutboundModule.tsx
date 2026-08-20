import React, { useState, useMemo } from 'react';
import {
  ArrowUpFromLine,
  Truck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  FileText,
  Boxes,
  AlertTriangle,
  UserCheck,
  CheckSquare,
  Sparkles,
  Layers,
  ChevronRight,
  User,
  Building2,
  Calendar,
  Layers3,
  ShieldCheck,
  X,
  Info,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useWarehouse } from '../services/warehouseStore';
import { outboundService, OutboundRequestDetail } from '../services/outboundService';
import { IssueRequest, IssueRequestType, IssueRequestStatus } from '../types';
import { getTodayUtc7String, getNowUtc7String, formatDate, formatDateTime } from '../utils/dateUtils';

// Danh mục Tổ / Đơn vị Kế hoạch sản xuất Kềm Nghĩa
interface PlanningUnitConfig {
  code: string;
  name: string;
  bravoDeptCode: string;
  bravoDeptName: string;
  defaultManager: string;
}

const PLANNING_UNITS: PlanningUnitConfig[] = [
  {
    code: 'KH_TO_DAP',
    name: 'Kế Hoạch Tổ Rèn & Dập Phôi',
    bravoDeptCode: 'PX01_DAP',
    bravoDeptName: '[PX01] Phân xưởng Rèn Dập Phôi',
    defaultManager: 'Nguyễn Văn Dập (Quản đốc Xưởng 1)'
  },
  {
    code: 'KH_TO_CAT',
    name: 'Kế Hoạch Tổ Cơ Khí & Cắt Dây CNC',
    bravoDeptCode: 'PX02_CAT',
    bravoDeptName: '[PX02] Phân xưởng Gia Công Cơ Khí & Cắt Dây',
    defaultManager: 'Lê Văn Cắt (Quản đốc Xưởng 2)'
  },
  {
    code: 'KH_TO_MAI',
    name: 'Kế Hoạch Tổ Mài & Tinh Chỉnh Kềm',
    bravoDeptCode: 'PX04_MAI',
    bravoDeptName: '[PX04] Phân xưởng Mài & Lắp Ráp Kềm',
    defaultManager: 'Phạm Thị Mài (Trưởng Ca Mài)'
  },
  {
    code: 'KH_TO_XIMA',
    name: 'Kế Hoạch Tổ Xi Mạ & Xử Lý Bề Mặt',
    bravoDeptCode: 'PX05_XIMA',
    bravoDeptName: '[PX05] Phân xưởng Xi Mạ & Đánh Bóng',
    defaultManager: 'Hoàng Văn Mạ (Kỹ sư Trưởng Xi Mạ)'
  },
  {
    code: 'KH_TO_DONGGOI',
    name: 'Kế Hoạch Tổ Bao Bì & Đóng Gói Xuất Khẩu',
    bravoDeptCode: 'PX06_DONGGOI',
    bravoDeptName: '[PX06] Phân xưởng Đóng Gói & Xuất Khẩu',
    defaultManager: 'Võ Thị Gói (Trưởng Bộ Phận Bao Bì)'
  },
  {
    code: 'KH_BAOTRI',
    name: 'Kế Hoạch Tổ Bảo Trì Cơ Điện & Thiết Bị',
    bravoDeptCode: 'PB_BAOTRI',
    bravoDeptName: '[PB07] Phòng Bảo Trì & Hạ Tầng Máy',
    defaultManager: 'Đặng Văn Điện (Trưởng Phòng Bảo Trì)'
  }
];

// Danh mục Kế hoạch & Định mức BOM Tháng theo từng Tổ Sản Xuất Kềm Nghĩa
export interface MonthlyPlanItem {
  id: string;
  planCode: string;
  planTitle: string;
  planningUnit: string;
  category: 'RAW_MATERIAL' | 'CHEMICAL' | 'TOOLING' | 'CONSUMABLE' | 'PACKAGING' | 'SPARE_PART';
  categoryLabel: string;
  materialId: string;
  materialCode: string;
  bravoId: string;
  materialName: string;
  unit: string;
  bomLimit: number;
  bomUsed: number;
  remainingLimit: number;
  warehouseStock: number;
  defaultIssueQty: number;
}

export const MONTHLY_PLAN_CATALOG: MonthlyPlanItem[] = [
  // ==========================================
  // 1. TỔ RÈN & DẬP PHÔI (KH_TO_DAP)
  // ==========================================
  {
    id: 'PLN-DAP-01',
    planCode: 'KH-202608-DAP01',
    planTitle: 'Kế hoạch Phôi Thép Kềm Cắt Da Tháng 08/2026',
    planningUnit: 'KH_TO_DAP',
    category: 'RAW_MATERIAL',
    categoryLabel: 'Kim Loại & Phôi',
    materialId: 'MAT-006',
    materialCode: 'THEP-C45-D12',
    bravoId: 'VT-THEP-C45',
    materialName: 'Thép cuộn C45 phi 12mm cán nguội Kềm Nghĩa',
    unit: 'Kg',
    bomLimit: 12000,
    bomUsed: 4500,
    remainingLimit: 7500,
    warehouseStock: 9800,
    defaultIssueQty: 500
  },
  {
    id: 'PLN-DAP-02',
    planCode: 'KH-202608-DAP01',
    planTitle: 'Kế hoạch Phôi Inox Kềm Bấm Móng Tháng 08/2026',
    planningUnit: 'KH_TO_DAP',
    category: 'RAW_MATERIAL',
    categoryLabel: 'Kim Loại & Phôi',
    materialId: 'MAT-009',
    materialCode: 'THEP-SUS420J2',
    bravoId: 'VT-INOX-420',
    materialName: 'Thép tấm Inox SUS420J2 dày 3.0mm tôi cứng',
    unit: 'Kg',
    bomLimit: 6000,
    bomUsed: 2200,
    remainingLimit: 3800,
    warehouseStock: 5200,
    defaultIssueQty: 300
  },
  {
    id: 'PLN-DAP-03',
    planCode: 'KH-202608-DAP01',
    planTitle: 'Kế hoạch Thép Tròn Khuôn Dập T08/2026',
    planningUnit: 'KH_TO_DAP',
    category: 'RAW_MATERIAL',
    categoryLabel: 'Kim Loại & Phôi',
    materialId: 'MAT-SKD11-D30',
    materialCode: 'THEP-SKD11-D30',
    bravoId: 'VT-SKD11-D30',
    materialName: 'Thép tròn đặc SKD11 phi 30mm chế tạo khuôn',
    unit: 'Kg',
    bomLimit: 500,
    bomUsed: 150,
    remainingLimit: 350,
    warehouseStock: 600,
    defaultIssueQty: 50
  },
  {
    id: 'PLN-DAP-04',
    planCode: 'KH-202608-DAP02',
    planTitle: 'Kế hoạch Khuôn Dập Kềm D01 T08/2026',
    planningUnit: 'KH_TO_DAP',
    category: 'TOOLING',
    categoryLabel: 'Khuôn Gá & Đá Mài',
    materialId: 'MAT-010',
    materialCode: 'KHUON-DAP-D01',
    bravoId: 'VT-KHUON-D01',
    materialName: 'Khuôn dập kềm D01 thép SKD11 tôi chân không',
    unit: 'Bộ',
    bomLimit: 5,
    bomUsed: 2,
    remainingLimit: 3,
    warehouseStock: 6,
    defaultIssueQty: 1
  },
  {
    id: 'PLN-DAP-05',
    planCode: 'KH-202608-DAP02',
    planTitle: 'Kế hoạch Khuôn Dập Kềm D04 T08/2026',
    planningUnit: 'KH_TO_DAP',
    category: 'TOOLING',
    categoryLabel: 'Khuôn Gá & Đá Mài',
    materialId: 'MAT-KHUON-D04',
    materialCode: 'KHUON-DAP-D04',
    bravoId: 'VT-KHUON-D04',
    materialName: 'Khuôn dập kềm D04 cắt khóe thép Nhật',
    unit: 'Bộ',
    bomLimit: 4,
    bomUsed: 1,
    remainingLimit: 3,
    warehouseStock: 4,
    defaultIssueQty: 1
  },
  {
    id: 'PLN-DAP-06',
    planCode: 'KH-202608-DAP02',
    planTitle: 'Kế hoạch Khuôn Dập Kềm D08 T08/2026',
    planningUnit: 'KH_TO_DAP',
    category: 'TOOLING',
    categoryLabel: 'Khuôn Gá & Đá Mài',
    materialId: 'MAT-KHUON-D08',
    materialCode: 'KHUON-DAP-D08',
    bravoId: 'VT-KHUON-D08',
    materialName: 'Khuôn dập kềm D08 mũi bầu xuất khẩu Mỹ',
    unit: 'Bộ',
    bomLimit: 3,
    bomUsed: 0,
    remainingLimit: 3,
    warehouseStock: 5,
    defaultIssueQty: 1
  },
  {
    id: 'PLN-DAP-07',
    planCode: 'KH-202608-DAP03',
    planTitle: 'Kế hoạch Dầu Mỡ Bôi Trơn Máy Dập T08/2026',
    planningUnit: 'KH_TO_DAP',
    category: 'CONSUMABLE',
    categoryLabel: 'Vật Tư Tiêu Hao',
    materialId: 'MAT-MO-SKF-CHIU-NHIET',
    materialCode: 'MO-BO-CHIU-NHIET',
    bravoId: 'VT-MO-SKF',
    materialName: 'Mỡ bôi trơn chịu nhiệt máy dập trục khuỷu SKF LGHP 2',
    unit: 'Kg',
    bomLimit: 80,
    bomUsed: 30,
    remainingLimit: 50,
    warehouseStock: 120,
    defaultIssueQty: 10
  },
  {
    id: 'PLN-DAP-08',
    planCode: 'KH-202608-DAP03',
    planTitle: 'Kế hoạch Dầu Rèn Nóng T08/2026',
    planningUnit: 'KH_TO_DAP',
    category: 'CHEMICAL',
    categoryLabel: 'Hóa Chất & Dầu',
    materialId: 'MAT-DAU-REN-GRAPHITE',
    materialCode: 'DAU-REN-GRAPHITE',
    bravoId: 'VT-DAU-GRAPHITE',
    materialName: 'Dầu bôi trơn rèn dập nóng graphite chuyên dụng',
    unit: 'Lít',
    bomLimit: 150,
    bomUsed: 60,
    remainingLimit: 90,
    warehouseStock: 200,
    defaultIssueQty: 20
  },
  {
    id: 'PLN-DAP-09',
    planCode: 'KH-202608-DAP04',
    planTitle: 'Kế hoạch Chốt & Lò Xo Khuôn Dập T08/2026',
    planningUnit: 'KH_TO_DAP',
    category: 'SPARE_PART',
    categoryLabel: 'Phụ Tùng & Linh Kiện',
    materialId: 'MAT-CHOT-10',
    materialCode: 'CHOT-DINH-VI-10',
    bravoId: 'VT-CHOT-10',
    materialName: 'Chốt định vị khuôn dập phi 10x40mm tôi cứng',
    unit: 'Con',
    bomLimit: 100,
    bomUsed: 40,
    remainingLimit: 60,
    warehouseStock: 150,
    defaultIssueQty: 10
  },
  {
    id: 'PLN-DAP-10',
    planCode: 'KH-202608-DAP04',
    planTitle: 'Kế hoạch Chốt & Lò Xo Khuôn Dập T08/2026',
    planningUnit: 'KH_TO_DAP',
    category: 'SPARE_PART',
    categoryLabel: 'Phụ Tùng & Linh Kiện',
    materialId: 'MAT-LOXO-KHUON-VANG',
    materialCode: 'LOXO-DAY-KHUON',
    bravoId: 'VT-LOXO-KHUON',
    materialName: 'Lò xo đẩy phôi khuôn dập tải trọng nặng màu vàng',
    unit: 'Cái',
    bomLimit: 40,
    bomUsed: 15,
    remainingLimit: 25,
    warehouseStock: 60,
    defaultIssueQty: 5
  },

  // ==========================================
  // 2. TỔ CƠ KHÍ & CẮT DÂY CNC (KH_TO_CAT)
  // ==========================================
  {
    id: 'PLN-CAT-01',
    planCode: 'KH-202608-CAT01',
    planTitle: 'Kế hoạch Cắt Khớp Kềm CNC T08/2026',
    planningUnit: 'KH_TO_CAT',
    category: 'CONSUMABLE',
    categoryLabel: 'Vật Tư Tiêu Hao',
    materialId: 'MAT-011',
    materialCode: 'DAY-CAT-MOLY',
    bravoId: 'VT-MOLY-018',
    materialName: 'Dây cắt Molipden phi 0.18mm chuyên dụng máy CNC',
    unit: 'Cuộn',
    bomLimit: 30,
    bomUsed: 12,
    remainingLimit: 18,
    warehouseStock: 45,
    defaultIssueQty: 2
  },
  {
    id: 'PLN-CAT-02',
    planCode: 'KH-202608-CAT01',
    planTitle: 'Kế hoạch Cắt Dây Đồng EDM T08/2026',
    planningUnit: 'KH_TO_CAT',
    category: 'CONSUMABLE',
    categoryLabel: 'Vật Tư Tiêu Hao',
    materialId: 'MAT-DAY-DONG-025',
    materialCode: 'DAY-CAT-DONG-025',
    bravoId: 'VT-BRASS-WIRE',
    materialName: 'Dây cắt đồng thau Brass Wire phi 0.25mm EDM',
    unit: 'Cuộn',
    bomLimit: 20,
    bomUsed: 8,
    remainingLimit: 12,
    warehouseStock: 30,
    defaultIssueQty: 2
  },
  {
    id: 'PLN-CAT-03',
    planCode: 'KH-202608-CAT01',
    planTitle: 'Kế hoạch Dầu Làm Mát Cắt Dây T08/2026',
    planningUnit: 'KH_TO_CAT',
    category: 'CHEMICAL',
    categoryLabel: 'Hóa Chất & Dầu',
    materialId: 'MAT-012',
    materialCode: 'DAU-LAM-MAT-CNC',
    bravoId: 'VT-COOL-CNC',
    materialName: 'Dầu làm mát gia công cắt dây CNC pha nước cao cấp',
    unit: 'Lít',
    bomLimit: 250,
    bomUsed: 95,
    remainingLimit: 155,
    warehouseStock: 400,
    defaultIssueQty: 25
  },
  {
    id: 'PLN-CAT-04',
    planCode: 'KH-202608-CAT02',
    planTitle: 'Kế hoạch Gá Đỡ & Khung Nhôm CNC T08/2026',
    planningUnit: 'KH_TO_CAT',
    category: 'RAW_MATERIAL',
    categoryLabel: 'Kim Loại & Phôi',
    materialId: 'MAT-004',
    materialCode: 'ALU-6063-T5',
    bravoId: 'VT-NHOM-6063',
    materialName: 'Nhôm định hình 40x40 anodized bạc chuẩn khuôn',
    unit: 'Thanh 6m',
    bomLimit: 70,
    bomUsed: 28,
    remainingLimit: 42,
    warehouseStock: 65,
    defaultIssueQty: 5
  },
  {
    id: 'PLN-CAT-05',
    planCode: 'KH-202608-CAT02',
    planTitle: 'Kế hoạch Dao Phay Ngón Hợp Kim T08/2026',
    planningUnit: 'KH_TO_CAT',
    category: 'TOOLING',
    categoryLabel: 'Khuôn Gá & Đá Mài',
    materialId: 'MAT-DAO-PHAY-4',
    materialCode: 'DAO-PHAY-CARBIDE-4',
    bravoId: 'VT-ENDMILL-4',
    materialName: 'Dao phay ngón hợp kim Tungsten Carbide 4 me phi 4mm',
    unit: 'Cái',
    bomLimit: 50,
    bomUsed: 20,
    remainingLimit: 30,
    warehouseStock: 80,
    defaultIssueQty: 5
  },
  {
    id: 'PLN-CAT-06',
    planCode: 'KH-202608-CAT02',
    planTitle: 'Kế hoạch Mũi Khoan Tâm HSS-Co T08/2026',
    planningUnit: 'KH_TO_CAT',
    category: 'TOOLING',
    categoryLabel: 'Khuôn Gá & Đá Mài',
    materialId: 'MAT-MUI-KHOAN-25',
    materialCode: 'MUI-KHOAN-COBALT-25',
    bravoId: 'VT-DRILL-25',
    materialName: 'Mũi khoan tâm HSS-Co Cobalt 5% phi 2.5mm',
    unit: 'Mũi',
    bomLimit: 60,
    bomUsed: 25,
    remainingLimit: 35,
    warehouseStock: 90,
    defaultIssueQty: 10
  },
  {
    id: 'PLN-CAT-07',
    planCode: 'KH-202608-CAT03',
    planTitle: 'Kế hoạch Ống Đồng Dẫn Hướng CNC T08/2026',
    planningUnit: 'KH_TO_CAT',
    category: 'SPARE_PART',
    categoryLabel: 'Phụ Tùng & Linh Kiện',
    materialId: 'MAT-ONG-DONG-02',
    materialCode: 'ONG-DONG-DAN-HUONG',
    bravoId: 'VT-BRASS-TUBE',
    materialName: 'Ống đồng dẫn hướng dây máy cắt CNC phi 0.2mm',
    unit: 'Ống',
    bomLimit: 40,
    bomUsed: 15,
    remainingLimit: 25,
    warehouseStock: 55,
    defaultIssueQty: 5
  },
  {
    id: 'PLN-CAT-08',
    planCode: 'KH-202608-CAT03',
    planTitle: 'Kế hoạch Nước Khử Ion Làm Mát T08/2026',
    planningUnit: 'KH_TO_CAT',
    category: 'CHEMICAL',
    categoryLabel: 'Hóa Chất & Dầu',
    materialId: 'MAT-NUOC-DI-CAN',
    materialCode: 'NUOC-DI-CAN-20L',
    bravoId: 'VT-DI-CAN-20L',
    materialName: 'Nước cất khử ion DI làm mát buồng điện cực CNC',
    unit: 'Can 20L',
    bomLimit: 30,
    bomUsed: 12,
    remainingLimit: 18,
    warehouseStock: 45,
    defaultIssueQty: 2
  },
  {
    id: 'PLN-CAT-09',
    planCode: 'KH-202608-CAT03',
    planTitle: 'Kế hoạch Dung Dịch Chống Rỉ T08/2026',
    planningUnit: 'KH_TO_CAT',
    category: 'CHEMICAL',
    categoryLabel: 'Hóa Chất & Dầu',
    materialId: 'MAT-CHONG-RI-PHOI',
    materialCode: 'DUNG-DICH-CHONG-RI',
    bravoId: 'VT-ANTI-RUST',
    materialName: 'Dung dịch chống rỉ sét phôi kim loại sau cắt CNC',
    unit: 'Lít',
    bomLimit: 80,
    bomUsed: 30,
    remainingLimit: 50,
    warehouseStock: 110,
    defaultIssueQty: 10
  },
  {
    id: 'PLN-CAT-10',
    planCode: 'KH-202608-CAT04',
    planTitle: 'Kế hoạch Pulley Dẫn Dây CNC T08/2026',
    planningUnit: 'KH_TO_CAT',
    category: 'SPARE_PART',
    categoryLabel: 'Phụ Tùng & Linh Kiện',
    materialId: 'MAT-PULLEY-32',
    materialCode: 'PULLEY-DAN-DAY-CNC',
    bravoId: 'VT-PULLEY-32',
    materialName: 'Bánh xe Pulley dẫn dây máy CNC phi 32mm tôi cứng',
    unit: 'Cái',
    bomLimit: 25,
    bomUsed: 8,
    remainingLimit: 17,
    warehouseStock: 35,
    defaultIssueQty: 2
  },

  // ==========================================
  // 3. TỔ MÀI & TINH CHỈNH KỀM (KH_TO_MAI)
  // ==========================================
  {
    id: 'PLN-MAI-01',
    planCode: 'KH-202608-MAI01',
    planTitle: 'Kế hoạch Vít Vis LG M2.5 Kềm Xuất Khẩu T08/2026',
    planningUnit: 'KH_TO_MAI',
    category: 'SPARE_PART',
    categoryLabel: 'Phụ Tùng & Linh Kiện',
    materialId: 'MAT-003',
    materialCode: 'V254809S303',
    bravoId: 'VT-VIS-LG-M25',
    materialName: 'Vis LG (M2.5x4.8x0.9mm) V3 Inox S303 chống gỉ',
    unit: 'Con',
    bomLimit: 80000,
    bomUsed: 32000,
    remainingLimit: 48000,
    warehouseStock: 65000,
    defaultIssueQty: 2500
  },
  {
    id: 'PLN-MAI-02',
    planCode: 'KH-202608-MAI01',
    planTitle: 'Kế hoạch Lò Xo Kềm Cắt Da T08/2026',
    planningUnit: 'KH_TO_MAI',
    category: 'SPARE_PART',
    categoryLabel: 'Phụ Tùng & Linh Kiện',
    materialId: 'MAT-013',
    materialCode: 'LOXO-KEM-LX02',
    bravoId: 'VT-LX-02',
    materialName: 'Lò xo gập đôi kềm cắt da thép đàn hồi cao cấp',
    unit: 'Con',
    bomLimit: 50000,
    bomUsed: 22000,
    remainingLimit: 28000,
    warehouseStock: 42000,
    defaultIssueQty: 2000
  },
  {
    id: 'PLN-MAI-03',
    planCode: 'KH-202608-MAI01',
    planTitle: 'Kế hoạch Lò Xo Lá Kềm Bấm Móng T08/2026',
    planningUnit: 'KH_TO_MAI',
    category: 'SPARE_PART',
    categoryLabel: 'Phụ Tùng & Linh Kiện',
    materialId: 'MAT-LOXO-LA-01',
    materialCode: 'LOXO-LA-LX01',
    bravoId: 'VT-LX-01',
    materialName: 'Lò xo lá đơn kềm bấm móng Inox SUS301',
    unit: 'Con',
    bomLimit: 30000,
    bomUsed: 11000,
    remainingLimit: 19000,
    warehouseStock: 35000,
    defaultIssueQty: 1500
  },
  {
    id: 'PLN-MAI-04',
    planCode: 'KH-202608-MAI02',
    planTitle: 'Kế hoạch Đá Mài Tinh Lưỡi Kềm CBN T08/2026',
    planningUnit: 'KH_TO_MAI',
    category: 'TOOLING',
    categoryLabel: 'Khuôn Gá & Đá Mài',
    materialId: 'MAT-014',
    materialCode: 'DA-MAI-CBN',
    bravoId: 'VT-DA-MAI-CBN',
    materialName: 'Đá mài tinh CBN #400 biên dạng lưỡi kềm bén',
    unit: 'Viên',
    bomLimit: 25,
    bomUsed: 9,
    remainingLimit: 16,
    warehouseStock: 30,
    defaultIssueQty: 2
  },
  {
    id: 'PLN-MAI-05',
    planCode: 'KH-202608-MAI02',
    planTitle: 'Kế hoạch Đá Mài Phá Thô T08/2026',
    planningUnit: 'KH_TO_MAI',
    category: 'TOOLING',
    categoryLabel: 'Khuôn Gá & Đá Mài',
    materialId: 'MAT-DA-MAI-120',
    materialCode: 'DA-MAI-CORUNDUM-120',
    bravoId: 'VT-DA-CORUNDUM',
    materialName: 'Đá mài phá thô Corundum hồng #120 định hình',
    unit: 'Viên',
    bomLimit: 20,
    bomUsed: 7,
    remainingLimit: 13,
    warehouseStock: 25,
    defaultIssueQty: 2
  },
  {
    id: 'PLN-MAI-06',
    planCode: 'KH-202608-MAI02',
    planTitle: 'Kế hoạch Đá Mài Phẳng Ceramic T08/2026',
    planningUnit: 'KH_TO_MAI',
    category: 'TOOLING',
    categoryLabel: 'Khuôn Gá & Đá Mài',
    materialId: 'MAT-DA-MAI-600',
    materialCode: 'DA-MAI-CERAMIC-600',
    bravoId: 'VT-DA-CERAMIC',
    materialName: 'Đá mài phẳng Ceramic #600 hoàn thiện bề mặt',
    unit: 'Viên',
    bomLimit: 18,
    bomUsed: 6,
    remainingLimit: 12,
    warehouseStock: 22,
    defaultIssueQty: 2
  },
  {
    id: 'PLN-MAI-07',
    planCode: 'KH-202608-MAI03',
    planTitle: 'Kế hoạch Tán Đồng & Vis Dù T08/2026',
    planningUnit: 'KH_TO_MAI',
    category: 'SPARE_PART',
    categoryLabel: 'Phụ Tùng & Linh Kiện',
    materialId: 'MAT-TAN-DONG-25',
    materialCode: 'TAN-DONG-M25',
    bravoId: 'VT-TAN-DONG',
    materialName: 'Tán đồng đỏ phi 2.5mm tán khớp quay kềm',
    unit: 'Con',
    bomLimit: 40000,
    bomUsed: 15000,
    remainingLimit: 25000,
    warehouseStock: 48000,
    defaultIssueQty: 2000
  },
  {
    id: 'PLN-MAI-08',
    planCode: 'KH-202608-MAI03',
    planTitle: 'Kế hoạch Vis Dù Cốt Kềm T08/2026',
    planningUnit: 'KH_TO_MAI',
    category: 'SPARE_PART',
    categoryLabel: 'Phụ Tùng & Linh Kiện',
    materialId: 'MAT-VIS-DU-M2',
    materialCode: 'VIS-DU-M20',
    bravoId: 'VT-VIS-DU',
    materialName: 'Vis dù Inox M2.0x4mm liên kết cốt kềm cao cấp',
    unit: 'Con',
    bomLimit: 35000,
    bomUsed: 12000,
    remainingLimit: 23000,
    warehouseStock: 40000,
    defaultIssueQty: 1500
  },
  {
    id: 'PLN-MAI-09',
    planCode: 'KH-202608-MAI04',
    planTitle: 'Kế hoạch Dầu Tra Khớp Kềm T08/2026',
    planningUnit: 'KH_TO_MAI',
    category: 'CONSUMABLE',
    categoryLabel: 'Vật Tư Tiêu Hao',
    materialId: 'MAT-DAU-TRA-KHOP',
    materialCode: 'DAU-TRA-KHOP-KEM',
    bravoId: 'VT-OIL-JOINT',
    materialName: 'Dầu tra khớp kềm chống kẹt chuyên dụng Kềm Nghĩa',
    unit: 'Chai 100ml',
    bomLimit: 120,
    bomUsed: 45,
    remainingLimit: 75,
    warehouseStock: 180,
    defaultIssueQty: 10
  },
  {
    id: 'PLN-MAI-10',
    planCode: 'KH-202608-MAI04',
    planTitle: 'Kế hoạch Giấy Nhám Mài Bóng T08/2026',
    planningUnit: 'KH_TO_MAI',
    category: 'CONSUMABLE',
    categoryLabel: 'Vật Tư Tiêu Hao',
    materialId: 'MAT-GIAY-NHAM-1000',
    materialCode: 'GIAY-NHAM-P1000',
    bravoId: 'VT-SANDPAPER-1000',
    materialName: 'Giấy nhám nước Silicon Carbide P1000 mài bóng',
    unit: 'Tờ',
    bomLimit: 500,
    bomUsed: 210,
    remainingLimit: 290,
    warehouseStock: 700,
    defaultIssueQty: 50
  },
  {
    id: 'PLN-MAI-11',
    planCode: 'KH-202608-MAI04',
    planTitle: 'Kế hoạch Bánh Vải Đánh Bóng T08/2026',
    planningUnit: 'KH_TO_MAI',
    category: 'TOOLING',
    categoryLabel: 'Khuôn Gá & Đá Mài',
    materialId: 'MAT-BANH-VAI-BONG',
    materialCode: 'BANH-VAI-DANH-BONG',
    bravoId: 'VT-BUFF-WHEEL',
    materialName: 'Bánh vải cotton 40 lớp đánh bóng lưỡi kềm sắc nét',
    unit: 'Cái',
    bomLimit: 40,
    bomUsed: 14,
    remainingLimit: 26,
    warehouseStock: 60,
    defaultIssueQty: 5
  },

  // ==========================================
  // 4. TỔ XI MẠ & XỬ LÝ BỀ MẶT (KH_TO_XIMA)
  // ==========================================
  {
    id: 'PLN-XIMA-01',
    planCode: 'KH-202608-XIMA01',
    planTitle: 'Kế hoạch Dung Dịch Muối Niken T08/2026',
    planningUnit: 'KH_TO_XIMA',
    category: 'CHEMICAL',
    categoryLabel: 'Hóa Chất & Dầu',
    materialId: 'MAT-015',
    materialCode: 'HOA-CHAT-NI-XI',
    bravoId: 'VT-NICKEL-SOL',
    materialName: 'Dung dịch muối Niken Sunfat (NiSO4) xi bóng bề mặt',
    unit: 'Lít',
    bomLimit: 500,
    bomUsed: 190,
    remainingLimit: 310,
    warehouseStock: 550,
    defaultIssueQty: 30
  },
  {
    id: 'PLN-XIMA-02',
    planCode: 'KH-202608-XIMA01',
    planTitle: 'Kế hoạch Sáp Đánh Bóng Dialux T08/2026',
    planningUnit: 'KH_TO_XIMA',
    category: 'CONSUMABLE',
    categoryLabel: 'Vật Tư Tiêu Hao',
    materialId: 'MAT-016',
    materialCode: 'SAP-DANH-BONG',
    bravoId: 'VT-POLISH-PASTE',
    materialName: 'Sáp đánh bóng kim loại cao cấp Dialux xanh (Pháp)',
    unit: 'Hộp',
    bomLimit: 80,
    bomUsed: 28,
    remainingLimit: 52,
    warehouseStock: 100,
    defaultIssueQty: 5
  },
  {
    id: 'PLN-XIMA-03',
    planCode: 'KH-202608-XIMA01',
    planTitle: 'Kế hoạch Axit Sunfuric H2SO4 T08/2026',
    planningUnit: 'KH_TO_XIMA',
    category: 'CHEMICAL',
    categoryLabel: 'Hóa Chất & Dầu',
    materialId: 'MAT-H2SO4-98',
    materialCode: 'AXIT-SUNFURIC-H2SO4',
    bravoId: 'VT-H2SO4-98',
    materialName: 'Axit Sunfuric (H2SO4 98%) tẩy gỉ hoạt hóa kim loại',
    unit: 'Lít',
    bomLimit: 300,
    bomUsed: 110,
    remainingLimit: 190,
    warehouseStock: 400,
    defaultIssueQty: 20
  },
  {
    id: 'PLN-XIMA-04',
    planCode: 'KH-202608-XIMA01',
    planTitle: 'Kế hoạch Axit Clohydric HCl T08/2026',
    planningUnit: 'KH_TO_XIMA',
    category: 'CHEMICAL',
    categoryLabel: 'Hóa Chất & Dầu',
    materialId: 'MAT-HCL-32',
    materialCode: 'AXIT-CLOHYDRIC-HCL',
    bravoId: 'VT-HCL-32',
    materialName: 'Axit Clohydric (HCl 32%) tẩy dầu mỡ công nghiệp',
    unit: 'Lít',
    bomLimit: 250,
    bomUsed: 90,
    remainingLimit: 160,
    warehouseStock: 350,
    defaultIssueQty: 20
  },
  {
    id: 'PLN-XIMA-05',
    planCode: 'KH-202608-XIMA02',
    planTitle: 'Kế hoạch Xi Mạ Vàng 24K Nghệ Thuật T08/2026',
    planningUnit: 'KH_TO_XIMA',
    category: 'CHEMICAL',
    categoryLabel: 'Hóa Chất & Dầu',
    materialId: 'MAT-XI-VANG-24K',
    materialCode: 'HOA-CHAT-XI-VANG-24K',
    bravoId: 'VT-GOLD-SOL-24K',
    materialName: 'Hóa chất xi mạ vàng 24K trang trí kềm nghệ thuật',
    unit: 'Lít',
    bomLimit: 50,
    bomUsed: 18,
    remainingLimit: 32,
    warehouseStock: 60,
    defaultIssueQty: 5
  },
  {
    id: 'PLN-XIMA-06',
    planCode: 'KH-202608-XIMA02',
    planTitle: 'Kế hoạch Phụ Gia Mạ Crom Bóng T08/2026',
    planningUnit: 'KH_TO_XIMA',
    category: 'CHEMICAL',
    categoryLabel: 'Hóa Chất & Dầu',
    materialId: 'MAT-CROM-BONG',
    materialCode: 'HOA-CHAT-CROM-BONG',
    bravoId: 'VT-CHROME-SOL',
    materialName: 'Hóa chất phụ gia mạ Crom trang trí chống trầy xước',
    unit: 'Lít',
    bomLimit: 120,
    bomUsed: 40,
    remainingLimit: 80,
    warehouseStock: 160,
    defaultIssueQty: 10
  },
  {
    id: 'PLN-XIMA-07',
    planCode: 'KH-202608-XIMA02',
    planTitle: 'Kế hoạch Muối Đồng Sunfat CuSO4 T08/2026',
    planningUnit: 'KH_TO_XIMA',
    category: 'CHEMICAL',
    categoryLabel: 'Hóa Chất & Dầu',
    materialId: 'MAT-CUSO4',
    materialCode: 'MUOI-DONG-SUNFAT',
    bravoId: 'VT-CUSO4',
    materialName: 'Muối đồng Sunfat (CuSO4) mạ lót chân không',
    unit: 'Kg',
    bomLimit: 200,
    bomUsed: 70,
    remainingLimit: 130,
    warehouseStock: 280,
    defaultIssueQty: 15
  },
  {
    id: 'PLN-XIMA-08',
    planCode: 'KH-202608-XIMA03',
    planTitle: 'Kế hoạch Bột Tẩy Dầu Kiềm T08/2026',
    planningUnit: 'KH_TO_XIMA',
    category: 'CHEMICAL',
    categoryLabel: 'Hóa Chất & Dầu',
    materialId: 'MAT-TAY-DAU-KIEM',
    materialCode: 'BOT-TAY-DAU-KIEM',
    bravoId: 'VT-DEGREASE-POWDER',
    materialName: 'Bột tẩy dầu kiềm nóng siêu sạch bề mặt phôi kềm',
    unit: 'Kg',
    bomLimit: 350,
    bomUsed: 130,
    remainingLimit: 220,
    warehouseStock: 450,
    defaultIssueQty: 25
  },
  {
    id: 'PLN-XIMA-09',
    planCode: 'KH-202608-XIMA03',
    planTitle: 'Kế hoạch Nước Cất DI Khử Ion T08/2026',
    planningUnit: 'KH_TO_XIMA',
    category: 'CHEMICAL',
    categoryLabel: 'Hóa Chất & Dầu',
    materialId: 'MAT-DI-WATER-LIT',
    materialCode: 'NUOC-CAT-DI-WATER',
    bravoId: 'VT-DI-WATER',
    materialName: 'Nước cất khử ion (DI Water) tráng rửa bể mạ cao cấp',
    unit: 'Lít',
    bomLimit: 1000,
    bomUsed: 380,
    remainingLimit: 620,
    warehouseStock: 1500,
    defaultIssueQty: 50
  },
  {
    id: 'PLN-XIMA-10',
    planCode: 'KH-202608-XIMA04',
    planTitle: 'Kế hoạch Bánh Nỉ Xơ Dừa Đánh Bóng T08/2026',
    planningUnit: 'KH_TO_XIMA',
    category: 'CONSUMABLE',
    categoryLabel: 'Vật Tư Tiêu Hao',
    materialId: 'MAT-NI-XO-DUA',
    materialCode: 'BANH-NI-XO-DUA',
    bravoId: 'VT-SISAL-WHEEL',
    materialName: 'Bánh nỉ xơ dừa phi 200mm đánh bóng lưỡi và thân kềm',
    unit: 'Cái',
    bomLimit: 60,
    bomUsed: 22,
    remainingLimit: 38,
    warehouseStock: 90,
    defaultIssueQty: 5
  },
  {
    id: 'PLN-XIMA-11',
    planCode: 'KH-202608-XIMA04',
    planTitle: 'Kế hoạch Cực Anode Niken 99.9% T08/2026',
    planningUnit: 'KH_TO_XIMA',
    category: 'RAW_MATERIAL',
    categoryLabel: 'Kim Loại & Phôi',
    materialId: 'MAT-ANODE-NI-999',
    materialCode: 'ANODE-NIKEN-999',
    bravoId: 'VT-NICKEL-ANODE',
    materialName: 'Cực Anode Niken 99.9% nguyên chất cho bể mạ điện',
    unit: 'Thanh 50cm',
    bomLimit: 20,
    bomUsed: 6,
    remainingLimit: 14,
    warehouseStock: 25,
    defaultIssueQty: 2
  },
  {
    id: 'PLN-XIMA-12',
    planCode: 'KH-202608-XIMA04',
    planTitle: 'Kế hoạch Phụ Gia Trợ Bóng Gương T08/2026',
    planningUnit: 'KH_TO_XIMA',
    category: 'CHEMICAL',
    categoryLabel: 'Hóa Chất & Dầu',
    materialId: 'MAT-PHU-GIA-BONG',
    materialCode: 'PHU-GIA-BONG-NICKEL',
    bravoId: 'VT-BRIGHTENER',
    materialName: 'Phụ gia trợ bóng tạo gương mạ Niken Kềm Nghĩa',
    unit: 'Lít',
    bomLimit: 80,
    bomUsed: 26,
    remainingLimit: 54,
    warehouseStock: 110,
    defaultIssueQty: 5
  },

  // ==========================================
  // 5. TỔ BAO BÌ & ĐÓNG GÓI (KH_TO_DONGGOI)
  // ==========================================
  {
    id: 'PLN-DONGGOI-01',
    planCode: 'KH-202608-DG01',
    planTitle: 'Kế hoạch Thùng Carton 5 Lớp Xuất Khẩu T08/2026',
    planningUnit: 'KH_TO_DONGGOI',
    category: 'PACKAGING',
    categoryLabel: 'Bao Bì & Đóng Gói',
    materialId: 'MAT-007',
    materialCode: 'BOX-CARTON-M1',
    bravoId: 'VT-THUNG-CARTON',
    materialName: 'Thùng carton 5 lớp 400x300x250mm in logo Kềm Nghĩa',
    unit: 'Cái',
    bomLimit: 4000,
    bomUsed: 1500,
    remainingLimit: 2500,
    warehouseStock: 5200,
    defaultIssueQty: 200
  },
  {
    id: 'PLN-DONGGOI-02',
    planCode: 'KH-202608-DG01',
    planTitle: 'Kế hoạch Găng Tay Phòng Sạch ESD T08/2026',
    planningUnit: 'KH_TO_DONGGOI',
    category: 'CONSUMABLE',
    categoryLabel: 'Vật Tư Tiêu Hao',
    materialId: 'MAT-008',
    materialCode: 'ESD-GLOVE-M',
    bravoId: 'VT-GANG-TAY-ESD',
    materialName: 'Găng tay phủ PU đầu ngón chống tĩnh điện size M',
    unit: 'Đôi',
    bomLimit: 800,
    bomUsed: 320,
    remainingLimit: 480,
    warehouseStock: 1100,
    defaultIssueQty: 50
  },
  {
    id: 'PLN-DONGGOI-03',
    planCode: 'KH-202608-DG02',
    planTitle: 'Kế hoạch Vỉ Nhựa PVC Ép Kềm T08/2026',
    planningUnit: 'KH_TO_DONGGOI',
    category: 'PACKAGING',
    categoryLabel: 'Bao Bì & Đóng Gói',
    materialId: 'MAT-017',
    materialCode: 'VI-NHUA-BLISTER',
    bravoId: 'VT-BLISTER-KN',
    materialName: 'Vỉ nhựa PVC trong suốt ép định hình bao bì kềm',
    unit: 'Cái',
    bomLimit: 10000,
    bomUsed: 4200,
    remainingLimit: 5800,
    warehouseStock: 9500,
    defaultIssueQty: 500
  },
  {
    id: 'PLN-DONGGOI-04',
    planCode: 'KH-202608-DG02',
    planTitle: 'Kế hoạch Nắp Silicon Bảo Vệ Mũi Kềm T08/2026',
    planningUnit: 'KH_TO_DONGGOI',
    category: 'PACKAGING',
    categoryLabel: 'Bao Bì & Đóng Gói',
    materialId: 'MAT-NAP-SILICON',
    materialCode: 'NAP-SILICON-KEM',
    bravoId: 'VT-CAP-SILICON',
    materialName: 'Nắp đậy bảo vệ mũi kềm bằng silicon trong suốt',
    unit: 'Cái',
    bomLimit: 12000,
    bomUsed: 5100,
    remainingLimit: 6900,
    warehouseStock: 14000,
    defaultIssueQty: 1000
  },
  {
    id: 'PLN-DONGGOI-05',
    planCode: 'KH-202608-DG03',
    planTitle: 'Kế hoạch Túi Nilon Hút Chân Không T08/2026',
    planningUnit: 'KH_TO_DONGGOI',
    category: 'PACKAGING',
    categoryLabel: 'Bao Bì & Đóng Gói',
    materialId: 'MAT-TUI-PE-1015',
    materialCode: 'TUI-PE-HUT-CHAN-KHONG',
    bravoId: 'VT-PE-BAG',
    materialName: 'Túi nilon PE hút chân không chống ẩm 10x15cm',
    unit: 'Túi',
    bomLimit: 8000,
    bomUsed: 3100,
    remainingLimit: 4900,
    warehouseStock: 11000,
    defaultIssueQty: 500
  },
  {
    id: 'PLN-DONGGOI-06',
    planCode: 'KH-202608-DG03',
    planTitle: 'Kế hoạch Tem Decal Mã Vạch QR Code T08/2026',
    planningUnit: 'KH_TO_DONGGOI',
    category: 'PACKAGING',
    categoryLabel: 'Bao Bì & Đóng Gói',
    materialId: 'MAT-TEM-QR-CODE',
    materialCode: 'TEM-QR-CODE-KN',
    bravoId: 'VT-DECAL-QR',
    materialName: 'Tem nhãn decal mã vạch QR Code truy xuất nguồn gốc',
    unit: 'Cuộn (2000 tem)',
    bomLimit: 25,
    bomUsed: 10,
    remainingLimit: 15,
    warehouseStock: 35,
    defaultIssueQty: 2
  },
  {
    id: 'PLN-DONGGOI-07',
    planCode: 'KH-202608-DG04',
    planTitle: 'Kế hoạch Băng Keo Dán Thùng T08/2026',
    planningUnit: 'KH_TO_DONGGOI',
    category: 'PACKAGING',
    categoryLabel: 'Bao Bì & Đóng Gói',
    materialId: 'MAT-BANG-KEO-OPP',
    materialCode: 'BANG-KEO-OPP-TRONG',
    bravoId: 'VT-TAPE-OPP',
    materialName: 'Băng keo dán thùng OPP trong 4.8cm x 100yard',
    unit: 'Cuộn',
    bomLimit: 150,
    bomUsed: 55,
    remainingLimit: 95,
    warehouseStock: 220,
    defaultIssueQty: 10
  },
  {
    id: 'PLN-DONGGOI-08',
    planCode: 'KH-202608-DG04',
    planTitle: 'Kế hoạch Hạt Hút Ẩm Silica Gel T08/2026',
    planningUnit: 'KH_TO_DONGGOI',
    category: 'CONSUMABLE',
    categoryLabel: 'Vật Tư Tiêu Hao',
    materialId: 'MAT-GOI-HUT-AM-2G',
    materialCode: 'GOI-HUT-AM-2G',
    bravoId: 'VT-SILICA-2G',
    materialName: 'Gói hạt hút ẩm Silica Gel 2g chống oxy hóa kềm',
    unit: 'Gói',
    bomLimit: 15000,
    bomUsed: 6200,
    remainingLimit: 8800,
    warehouseStock: 20000,
    defaultIssueQty: 1000
  },
  {
    id: 'PLN-DONGGOI-09',
    planCode: 'KH-202608-DG05',
    planTitle: 'Kế hoạch Thẻ Bảo Hành In Màu T08/2026',
    planningUnit: 'KH_TO_DONGGOI',
    category: 'PACKAGING',
    categoryLabel: 'Bao Bì & Đóng Gói',
    materialId: 'MAT-THE-BAO-HANH',
    materialCode: 'THE-BAO-HANH-KN',
    bravoId: 'VT-WARRANTY-CARD',
    materialName: 'Thẻ bảo hành & hướng dẫn sử dụng kềm in 4 màu',
    unit: 'Tờ',
    bomLimit: 10000,
    bomUsed: 3900,
    remainingLimit: 6100,
    warehouseStock: 12500,
    defaultIssueQty: 500
  },
  {
    id: 'PLN-DONGGOI-10',
    planCode: 'KH-202608-DG05',
    planTitle: 'Kế hoạch Khay Xốp EVA Hộp Quà T08/2026',
    planningUnit: 'KH_TO_DONGGOI',
    category: 'PACKAGING',
    categoryLabel: 'Bao Bì & Đóng Gói',
    materialId: 'MAT-KHAY-XOP-EVA',
    materialCode: 'KHAY-XOP-EVA-CHONG-SOC',
    bravoId: 'VT-EVA-TRAY',
    materialName: 'Khay xốp EVA định hình hộp quà tặng kềm cao cấp',
    unit: 'Cái',
    bomLimit: 1500,
    bomUsed: 600,
    remainingLimit: 900,
    warehouseStock: 2100,
    defaultIssueQty: 100
  },
  {
    id: 'PLN-DONGGOI-11',
    planCode: 'KH-202608-DG05',
    planTitle: 'Kế hoạch Màng Co Nhiệt POF T08/2026',
    planningUnit: 'KH_TO_DONGGOI',
    category: 'PACKAGING',
    categoryLabel: 'Bao Bì & Đóng Gói',
    materialId: 'MAT-MANG-CO-POF',
    materialCode: 'MANG-CO-POF-CUON',
    bravoId: 'VT-POF-FILM',
    materialName: 'Màng co nhiệt POF bọc bảo vệ chống bụi hộp kềm',
    unit: 'Cuộn',
    bomLimit: 20,
    bomUsed: 7,
    remainingLimit: 13,
    warehouseStock: 28,
    defaultIssueQty: 2
  },

  // ==========================================
  // 6. TỔ BẢO TRÌ CƠ ĐIỆN (KH_BAOTRI)
  // ==========================================
  {
    id: 'PLN-BAOTRI-01',
    planCode: 'KH-202608-BT01',
    planTitle: 'Kế hoạch Dầu Thủy Lực Máy Dập T08/2026',
    planningUnit: 'KH_BAOTRI',
    category: 'CONSUMABLE',
    categoryLabel: 'Vật Tư Tiêu Hao',
    materialId: 'MAT-018',
    materialCode: 'DAU-THUY-LUC-68',
    bravoId: 'VT-OIL-HYD-68',
    materialName: 'Dầu thủy lực máy dập Castrol Hyspin VG 68',
    unit: 'Lít',
    bomLimit: 400,
    bomUsed: 120,
    remainingLimit: 280,
    warehouseStock: 550,
    defaultIssueQty: 20
  },
  {
    id: 'PLN-BAOTRI-02',
    planCode: 'KH-202608-BT01',
    planTitle: 'Kế hoạch Dầu Hộp Số Bánh Răng T08/2026',
    planningUnit: 'KH_BAOTRI',
    category: 'CONSUMABLE',
    categoryLabel: 'Vật Tư Tiêu Hao',
    materialId: 'MAT-DAU-BANH-RANG',
    materialCode: 'DAU-BANH-RANG-220',
    bravoId: 'VT-GEAR-OIL-220',
    materialName: 'Dầu nhớt bánh răng hộp số công nghiệp ISO VG 220',
    unit: 'Lít',
    bomLimit: 200,
    bomUsed: 65,
    remainingLimit: 135,
    warehouseStock: 300,
    defaultIssueQty: 20
  },
  {
    id: 'PLN-BAOTRI-03',
    planCode: 'KH-202608-BT01',
    planTitle: 'Kế hoạch Chiếu Sáng & Đèn LED Xưởng T08/2026',
    planningUnit: 'KH_BAOTRI',
    category: 'CONSUMABLE',
    categoryLabel: 'Vật Tư Tiêu Hao',
    materialId: 'MAT-019',
    materialCode: 'BONG-DEN-LED-T8',
    bravoId: 'VT-LED-T8-1M2',
    materialName: 'Bóng đèn LED xưởng 1m2 Rạng Đông 18W tiết kiệm điện',
    unit: 'Cái',
    bomLimit: 60,
    bomUsed: 18,
    remainingLimit: 42,
    warehouseStock: 85,
    defaultIssueQty: 5
  },
  {
    id: 'PLN-BAOTRI-04',
    planCode: 'KH-202608-BT02',
    planTitle: 'Kế hoạch Mỡ Bôi Trơn Vòng Bi SKF T08/2026',
    planningUnit: 'KH_BAOTRI',
    category: 'CONSUMABLE',
    categoryLabel: 'Vật Tư Tiêu Hao',
    materialId: 'MAT-MO-SKF-LGMT3',
    materialCode: 'MO-BO-SKF-LGMT3',
    bravoId: 'VT-SKF-LGMT3',
    materialName: 'Mỡ bò bôi trơn chịu nhiệt vòng bi SKF LGMT 3',
    unit: 'Hộp 1kg',
    bomLimit: 25,
    bomUsed: 8,
    remainingLimit: 17,
    warehouseStock: 40,
    defaultIssueQty: 2
  },
  {
    id: 'PLN-BAOTRI-05',
    planCode: 'KH-202608-BT02',
    planTitle: 'Kế hoạch Dây Curoa Truyền Động T08/2026',
    planningUnit: 'KH_BAOTRI',
    category: 'SPARE_PART',
    categoryLabel: 'Phụ Tùng & Linh Kiện',
    materialId: 'MAT-CUROA-B52',
    materialCode: 'DAY-CUROA-B52',
    bravoId: 'VT-BELT-B52',
    materialName: 'Dây curoa truyền động máy mài B52 Bando chính hãng',
    unit: 'Sợi',
    bomLimit: 30,
    bomUsed: 10,
    remainingLimit: 20,
    warehouseStock: 45,
    defaultIssueQty: 2
  },
  {
    id: 'PLN-BAOTRI-06',
    planCode: 'KH-202608-BT03',
    planTitle: 'Kế hoạch Khởi Động Từ Schneider T08/2026',
    planningUnit: 'KH_BAOTRI',
    category: 'SPARE_PART',
    categoryLabel: 'Phụ Tùng & Linh Kiện',
    materialId: 'MAT-CONTACTOR-18',
    materialCode: 'CONTACTOR-LC1D18',
    bravoId: 'VT-SCHNEIDER-18',
    materialName: 'Khởi động từ Schneider LC1D18M7 220V 18A tủ điện',
    unit: 'Cái',
    bomLimit: 15,
    bomUsed: 5,
    remainingLimit: 10,
    warehouseStock: 25,
    defaultIssueQty: 1
  },
  {
    id: 'PLN-BAOTRI-07',
    planCode: 'KH-202608-BT03',
    planTitle: 'Kế hoạch Cảm Biến Tiệm Cận Omron T08/2026',
    planningUnit: 'KH_BAOTRI',
    category: 'SPARE_PART',
    categoryLabel: 'Phụ Tùng & Linh Kiện',
    materialId: 'MAT-SENSOR-OMRON',
    materialCode: 'CAM-BIEN-E2E-X5',
    bravoId: 'VT-SENSOR-OMRON',
    materialName: 'Cảm biến tiệm cận hành trình Omron E2E-X5ME1',
    unit: 'Cái',
    bomLimit: 20,
    bomUsed: 6,
    remainingLimit: 14,
    warehouseStock: 30,
    defaultIssueQty: 2
  },
  {
    id: 'PLN-BAOTRI-08',
    planCode: 'KH-202608-BT03',
    planTitle: 'Kế hoạch Vòng Bi Máy Dập SKF T08/2026',
    planningUnit: 'KH_BAOTRI',
    category: 'SPARE_PART',
    categoryLabel: 'Phụ Tùng & Linh Kiện',
    materialId: 'MAT-VONG-BI-6205',
    materialCode: 'VONG-BI-SKF-6205',
    bravoId: 'VT-BEARING-6205',
    materialName: 'Vòng bi bạc đạn máy dập SKF 6205-2RS cao tốc',
    unit: 'Cái',
    bomLimit: 35,
    bomUsed: 12,
    remainingLimit: 23,
    warehouseStock: 50,
    defaultIssueQty: 4
  },
  {
    id: 'PLN-BAOTRI-09',
    planCode: 'KH-202608-BT04',
    planTitle: 'Kế hoạch Ống Khí Nén PU SMC T08/2026',
    planningUnit: 'KH_BAOTRI',
    category: 'SPARE_PART',
    categoryLabel: 'Phụ Tùng & Linh Kiện',
    materialId: 'MAT-ONG-KHI-PU8',
    materialCode: 'ONG-KHI-NEN-PU8',
    bravoId: 'VT-PU-TUBE-8',
    materialName: 'Ống khí nén PU phi 8mm chịu áp 10 bar SMC Nhật Bản',
    unit: 'Cuộn (100m)',
    bomLimit: 10,
    bomUsed: 3,
    remainingLimit: 7,
    warehouseStock: 18,
    defaultIssueQty: 1
  },
  {
    id: 'PLN-BAOTRI-10',
    planCode: 'KH-202608-BT04',
    planTitle: 'Kế hoạch Van Điện Từ Khí Nén Airtac T08/2026',
    planningUnit: 'KH_BAOTRI',
    category: 'SPARE_PART',
    categoryLabel: 'Phụ Tùng & Linh Kiện',
    materialId: 'MAT-VAN-AIRTAC',
    materialCode: 'VAN-DIEN-TU-4V210',
    bravoId: 'VT-SOLENOID-VALVE',
    materialName: 'Van điện từ khí nén Airtac 4V210-08 24VDC',
    unit: 'Cái',
    bomLimit: 15,
    bomUsed: 4,
    remainingLimit: 11,
    warehouseStock: 22,
    defaultIssueQty: 1
  },
  {
    id: 'PLN-BAOTRI-11',
    planCode: 'KH-202608-BT04',
    planTitle: 'Kế hoạch Phớt Chặn Dầu Xilanh T08/2026',
    planningUnit: 'KH_BAOTRI',
    category: 'SPARE_PART',
    categoryLabel: 'Phụ Tùng & Linh Kiện',
    materialId: 'MAT-PHOT-XILANH-60',
    materialCode: 'PHOT-CHAN-DAU-60',
    bravoId: 'VT-OIL-SEAL-60',
    materialName: 'Phớt chặn dầu xilanh thủy lực máy dập phi 60mm NOK',
    unit: 'Bộ',
    bomLimit: 20,
    bomUsed: 7,
    remainingLimit: 13,
    warehouseStock: 30,
    defaultIssueQty: 2
  }
];

export const OutboundModule: React.FC = () => {
  const {
    issueRequests,
    materials,
    batches,
    createIssueRequest,
    approveIssueRequest,
    issueGoods,
    confirmReceivedIssueRequest,
    currentUser,
    refreshIssueRequests
  } = useWarehouse();

  const [activeTab, setActiveTab] = useState<'requests' | 'create' | 'picking' | 'print'>('requests');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [planSearchQuery, setPlanSearchQuery] = useState('');
  const [planCategoryFilter, setPlanCategoryFilter] = useState<string>('ALL');
  const [planQuotaFilter, setPlanQuotaFilter] = useState<'ALL' | 'AVAILABLE' | 'EXHAUSTED'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selected request for approval, picking, or printing
  const [selectedRequest, setSelectedRequest] = useState<IssueRequest | null>(null);
  const [requestDetail, setRequestDetail] = useState<OutboundRequestDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await refreshIssueRequests();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenDetailOrApproval = async (req: IssueRequest) => {
    setSelectedRequest(req);
    const reqNum = parseInt(req.id);
    if (!isNaN(reqNum)) {
      setIsLoadingDetail(true);
      try {
        const detail = await outboundService.getRequestDetail(reqNum);
        setRequestDetail(detail);
      } catch (err) {
        console.warn('Could not fetch request detail from MMS1:', err);
      } finally {
        setIsLoadingDetail(false);
      }
    }
  };

  // Create Request State
  const [reqType, setReqType] = useState<IssueRequestType>('PLANNING');
  const [selectedPlanningUnit, setSelectedPlanningUnit] = useState<string>(PLANNING_UNITS[0].code);
  const [destinationBravoCode, setDestinationBravoCode] = useState<string>(PLANNING_UNITS[0].bravoDeptCode);
  const [purpose, setPurpose] = useState('');
  const [productionOrder, setProductionOrder] = useState('');
  const [overQuotaReason, setOverQuotaReason] = useState('');
  const [requiredDate, setRequiredDate] = useState(
    `${getTodayUtc7String(1)} 08:00`
  );

  // Selected Request items (Click-to-Pick from Plan Catalog)
  const [requestItems, setRequestItems] = useState<{
    materialId: string;
    materialCode: string;
    materialName: string;
    bravoId?: string;
    unit: string;
    quantity: number;
    notes: string;
    bomLimit: number;
    bomUsed: number;
    remainingLimit: number;
    warehouseStock: number;
  }[]>([
    {
      materialId: MONTHLY_PLAN_CATALOG[0].materialId,
      materialCode: MONTHLY_PLAN_CATALOG[0].materialCode,
      materialName: MONTHLY_PLAN_CATALOG[0].materialName,
      bravoId: MONTHLY_PLAN_CATALOG[0].bravoId,
      unit: MONTHLY_PLAN_CATALOG[0].unit,
      quantity: MONTHLY_PLAN_CATALOG[0].defaultIssueQty,
      notes: 'Phục vụ ca sản xuất dập phôi kềm',
      bomLimit: MONTHLY_PLAN_CATALOG[0].bomLimit,
      bomUsed: MONTHLY_PLAN_CATALOG[0].bomUsed,
      remainingLimit: MONTHLY_PLAN_CATALOG[0].remainingLimit,
      warehouseStock: MONTHLY_PLAN_CATALOG[0].warehouseStock
    }
  ]);

  // Picking allocation state
  const [pickingDetails, setPickingDetails] = useState<{
    itemId: string;
    batchId: string;
    quantity: number;
  }[]>([]);

  // Active planning unit config object
  const activePlanConfig = useMemo(() => {
    return PLANNING_UNITS.find(p => p.code === selectedPlanningUnit) || PLANNING_UNITS[0];
  }, [selectedPlanningUnit]);

  // All Plan Catalog items of current Unit
  const unitAllPlanItems = useMemo(() => {
    return MONTHLY_PLAN_CATALOG.filter(p => p.planningUnit === selectedPlanningUnit);
  }, [selectedPlanningUnit]);

  // Current Unit Plan Catalog items with filters
  const currentUnitPlanItems = useMemo(() => {
    let items = unitAllPlanItems;
    if (planCategoryFilter !== 'ALL') {
      items = items.filter(p => p.category === planCategoryFilter);
    }
    if (planQuotaFilter === 'AVAILABLE') {
      items = items.filter(p => p.remainingLimit > 0);
    } else if (planQuotaFilter === 'EXHAUSTED') {
      items = items.filter(p => p.remainingLimit <= 0);
    }
    if (planSearchQuery.trim()) {
      const q = planSearchQuery.toLowerCase();
      items = items.filter(
        p =>
          p.materialCode.toLowerCase().includes(q) ||
          p.materialName.toLowerCase().includes(q) ||
          p.bravoId.toLowerCase().includes(q) ||
          p.planCode.toLowerCase().includes(q)
      );
    }
    return items;
  }, [unitAllPlanItems, planCategoryFilter, planQuotaFilter, planSearchQuery]);

  // Handle unit selection change
  const handlePlanningUnitChange = (unitCode: string) => {
    setSelectedPlanningUnit(unitCode);
    const target = PLANNING_UNITS.find(p => p.code === unitCode);
    if (target) {
      setDestinationBravoCode(target.bravoDeptCode);
    }
    // Auto load first item of new unit
    const unitPlans = MONTHLY_PLAN_CATALOG.filter(p => p.planningUnit === unitCode);
    if (unitPlans.length > 0) {
      const first = unitPlans[0];
      setRequestItems([
        {
          materialId: first.materialId,
          materialCode: first.materialCode,
          materialName: first.materialName,
          bravoId: first.bravoId,
          unit: first.unit,
          quantity: first.defaultIssueQty,
          notes: '',
          bomLimit: first.bomLimit,
          bomUsed: first.bomUsed,
          remainingLimit: first.remainingLimit,
          warehouseStock: first.warehouseStock
        }
      ]);
    } else {
      setRequestItems([]);
    }
  };

  // Toggle select plan item into request cart (Click-to-Pick)
  const handleToggleSelectPlanItem = (planItem: MonthlyPlanItem) => {
    const existsIndex = requestItems.findIndex(it => it.materialId === planItem.materialId);
    if (existsIndex >= 0) {
      setRequestItems(requestItems.filter((_, idx) => idx !== existsIndex));
    } else {
      setRequestItems([
        ...requestItems,
        {
          materialId: planItem.materialId,
          materialCode: planItem.materialCode,
          materialName: planItem.materialName,
          bravoId: planItem.bravoId,
          unit: planItem.unit,
          quantity: Math.min(planItem.remainingLimit, planItem.defaultIssueQty),
          notes: '',
          bomLimit: planItem.bomLimit,
          bomUsed: planItem.bomUsed,
          remainingLimit: planItem.remainingLimit,
          warehouseStock: planItem.warehouseStock
        }
      ]);
    }
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (requestItems.length === 0) {
      alert('Vui lòng click chọn ít nhất 1 vật tư trong bảng kế hoạch định mức tháng ở trên!');
      return;
    }

    if (!purpose.trim()) {
      alert('Vui lòng nhập mục đích xuất kho!');
      return;
    }

    if (reqType === 'OVER_PLANNING' && !overQuotaReason.trim()) {
      alert('Vui lòng nhập lý do xuất vượt định mức BOM để Ban Giám Đốc xem xét phê duyệt!');
      return;
    }

    const fullPurpose = reqType === 'OVER_PLANNING' 
      ? `[VƯỢT ĐỊNH MỨC] ${purpose.trim()} (Lý do: ${overQuotaReason.trim()})`
      : purpose.trim();

    const newReq = createIssueRequest({
      type: reqType,
      department: activePlanConfig.name,
      purpose: fullPurpose,
      productionOrder: productionOrder.trim() || undefined,
      requiredDate,
      items: requestItems.map(item => ({
        materialId: item.materialId,
        quantity: item.quantity,
        notes: item.notes
      }))
    });

    alert(`Đã tạo Đề nghị xuất kho ${newReq.code} thành công!\nĐơn vị: ${activePlanConfig.name}\nĐiểm đến Bravo: ${activePlanConfig.bravoDeptName}\nSố loại vật tư: ${requestItems.length}\nĐang chuyển sang hàng chờ phê duyệt.`);
    setActiveTab('requests');
    setSelectedRequest(newReq);
  };

  const handleApprove = (approved: boolean) => {
    if (!selectedRequest) return;
    approveIssueRequest(selectedRequest.id, approved, approvalComment);
    alert(approved ? 'Đã phê duyệt đề nghị xuất kho!' : 'Đã từ chối đề nghị xuất kho!');
    setSelectedRequest(null);
    setApprovalComment('');
  };

  const handleStartPicking = (req: IssueRequest) => {
    setSelectedRequest(req);
    const initialPicks: { itemId: string; batchId: string; quantity: number }[] = [];

    req.items.forEach(item => {
      const availableBatches = batches
        .filter(b => b.materialId === item.materialId && b.quantity > 0)
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

      let needed = item.approvedQuantity || item.requestedQuantity;
      for (const b of availableBatches) {
        if (needed <= 0) break;
        const take = Math.min(b.quantity, needed);
        initialPicks.push({
          itemId: item.id,
          batchId: b.id,
          quantity: take
        });
        needed -= take;
      }
    });

    setPickingDetails(initialPicks);
    setActiveTab('picking');
  };

  const handleExecuteIssue = () => {
    if (!selectedRequest) return;
    issueGoods(selectedRequest.id, pickingDetails);
    alert(`Đã hoàn tất thủ tục xuất kho cho phiếu ${selectedRequest.code}! Số lượng tồn kho đã được trừ dứt điểm.`);
    setActiveTab('requests');
    setSelectedRequest(null);
  };

  const stats = useMemo(() => {
    const total = issueRequests.length;
    const pending = issueRequests.filter(r => r.status === 'PENDING_APPROVAL').length;
    const picking = issueRequests.filter(r => r.status === 'APPROVED' || r.status === 'PICKING').length;
    const issued = issueRequests.filter(r => r.status === 'ISSUED').length;
    const received = issueRequests.filter(r => r.status === 'RECEIVED').length;
    return { total, pending, picking, issued, received };
  }, [issueRequests]);

  const filteredRequests = issueRequests.filter(r => {
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'PICKING') {
        if (r.status !== 'PICKING' && r.status !== 'APPROVED') return false;
      } else if (r.status !== filterStatus) {
        return false;
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.code.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q) ||
        r.productionOrder?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: IssueRequestStatus) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" /> Chờ Phê Duyệt
          </span>
        );
      case 'APPROVED':
      case 'PICKING':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
            <Boxes className="w-3 h-3 text-blue-600" /> Đang Soạn Hàng
          </span>
        );
      case 'ISSUED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-[#007D3C] border border-emerald-300 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#007D3C]" /> Đã Soạn / Xuất
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-300 inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-teal-600" /> Đã Nhận Hàng
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" /> Từ Chối
          </span>
        );
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Cockpit Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-[#007D3C] text-xs font-bold uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" /> KỀM NGHĨA OUTBOUND LOGISTICS (OUT-01 / OUT-02 / OUT-03)
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Đăng Ký & Quản Lý Đề Nghị Xuất Kho Sản Xuất
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kiểm soát định mức BOM theo từng phân xưởng, đối soát hạn mức Bravo ERP, duyệt đa cấp và soạn hàng FIFO.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-[#007D3C] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Hàng Chờ Đề Nghị ({issueRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-[#007D3C] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> + Đăng Ký Yêu Cầu Mới
          </button>
        </div>
      </div>

      {/* Tab 1: Create Issue Request - Revamped Form */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateRequest} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          {/* Header Title & User Identity Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                Phiếu Đăng Ký Nhu Cầu Xuất Kho Vật Tư
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cung cấp vật tư, phụ tùng và bao bì cho các đơn vị xưởng sản xuất Kềm Nghĩa.
              </p>
            </div>

            {/* Requester Identity Info Badge */}
            <div className="p-2.5 px-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3 text-xs">
              <div className="w-8 h-8 rounded-lg bg-[#007D3C] text-white flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">
                  {currentUser.fullName} <span className="text-slate-400 font-normal">({currentUser.username})</span>
                </div>
                <div className="text-[11px] text-[#007D3C] font-semibold">
                  Tổ Đăng Ký: {activePlanConfig.name}
                </div>
              </div>
            </div>
          </div>

          {/* 1. Chọn Luồng Nghiệp Vụ (3 Loại Đề Nghị) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Phân Loại Nhu Cầu Xuất Kho:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  type: 'PLANNING' as IssueRequestType,
                  code: 'OUT-01',
                  label: 'Theo Kế Hoạch Định Mức (BOM)',
                  desc: 'Xuất theo lệnh sản xuất tháng, so chiếu hạn mức BOM còn lại.'
                },
                {
                  type: 'OVER_PLANNING' as IssueRequestType,
                  code: 'OUT-03',
                  label: 'Xuất Vượt Định Mức (Over-Plan)',
                  desc: 'Bù hao hụt phôi, gãy khuôn gá, yêu cầu Quản đốc & BGĐ duyệt.'
                },
                {
                  type: 'UNPLANNED' as IssueRequestType,
                  code: 'OUT-02',
                  label: 'Ngoài Kế Hoạch (Đột Xuất)',
                  desc: 'Hóa chất, keo, dầu mỡ bảo dưỡng, mẫu R&D thử nghiệm.'
                }
              ].map(t => (
                <button
                  type="button"
                  key={t.type}
                  onClick={() => setReqType(t.type)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    reqType === t.type
                      ? 'border-[#007D3C] bg-emerald-50/40 ring-2 ring-[#007D3C]/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{t.label}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                      reqType === t.type ? 'bg-[#007D3C] text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {t.code}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Thông Tin Đơn Vị Kế Hoạch & Phân Xưởng Nhận Hàng Bravo */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#007D3C]" /> 2. Đơn Vị Kế Hoạch & Điểm Nhận Hàng Bravo ERP:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Đơn vị kế hoạch */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Đơn Vị Kế Hoạch (Planning Unit) *
                </label>
                <select
                  value={selectedPlanningUnit}
                  onChange={e => handlePlanningUnitChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-[#007D3C]/20 font-medium"
                >
                  {PLANNING_UNITS.map(unit => (
                    <option key={unit.code} value={unit.code}>
                      [{unit.code}] - {unit.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phân xưởng đích đến Bravo */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Phân Xưởng Đích Bravo (Destination) *
                </label>
                <input
                  type="text"
                  readOnly
                  value={activePlanConfig.bravoDeptName}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-100 text-slate-700 font-bold"
                />
              </div>

              {/* Quản đốc phụ trách duyệt */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Quản Đốc / Người Duyệt Dự Kiến
                </label>
                <input
                  type="text"
                  readOnly
                  value={activePlanConfig.defaultManager}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-100 text-slate-600 italic"
                />
              </div>

              {/* Lệnh sản xuất LSX */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Mã Lệnh Sản Xuất (LSX No.)
                </label>
                <input
                  type="text"
                  value={productionOrder}
                  onChange={e => setProductionOrder(e.target.value)}
                  placeholder="e.g. LSX-KN-202608-019"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-mono focus:outline-hidden focus:ring-2 focus:ring-[#007D3C]/20"
                />
              </div>

              {/* Thời gian cần hàng */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Thời Gian Cần Hàng Tại Xưởng *
                </label>
                <input
                  type="text"
                  value={requiredDate}
                  onChange={e => setRequiredDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-mono focus:outline-hidden focus:ring-2 focus:ring-[#007D3C]/20"
                />
              </div>

              {/* Mục đích sử dụng */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Mục Đích Xuất Kho *
                </label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="e.g. Cấp thép rèn phôi kềm cắt da 5000 cây..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-[#007D3C]/20"
                />
              </div>
            </div>

            {/* Input bổ sung nếu là Xuất Vượt Định Mức */}
            {reqType === 'OVER_PLANNING' && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  YÊU CẦU GIẢI TRÌNH XUẤT VƯỢT ĐỊNH MỨC BOM:
                </div>
                <input
                  type="text"
                  required
                  value={overQuotaReason}
                  onChange={e => setOverQuotaReason(e.target.value)}
                  placeholder="Nhập chi tiết nguyên nhân phát sinh (VD: Lỗi công đoạn dập lệch 2%, gãy gá nhiệt luyện...)"
                  className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            )}
          </div>

          {/* 3. Danh Mục Kế Hoạch Định Mức Tháng (Click-to-Pick) & Giỏ Vật Tư Xuất Kho */}
          <div className="space-y-5">
            {/* 3.1: BẢNG DANH MỤC KẾ HOẠCH ĐỊNH MỨC THÁNG */}
            <div className="p-4.5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#007D3C]" />
                    3. Danh Mục Kế Hoạch Định Mức Tháng 08/2026 - [{activePlanConfig.name}]:
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hiển thị <strong>{currentUnitPlanItems.length}/{unitAllPlanItems.length}</strong> vật tư định mức kế hoạch. Click trực tiếp vào dòng vật tư hoặc bấm nút <strong className="text-[#007D3C] font-bold">+ Chọn Xuất</strong> để đưa vào phiếu đề nghị.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={planSearchQuery}
                      onChange={e => setPlanSearchQuery(e.target.value)}
                      placeholder="Tìm theo tên, SKU, Bravo..."
                      className="pl-7 pr-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg w-52 focus:outline-hidden focus:ring-2 focus:ring-[#007D3C]/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const allItems = currentUnitPlanItems.filter(p => p.remainingLimit > 0);
                      setRequestItems(
                        allItems.map(p => ({
                          materialId: p.materialId,
                          materialCode: p.materialCode,
                          materialName: p.materialName,
                          bravoId: p.bravoId,
                          unit: p.unit,
                          quantity: Math.min(p.remainingLimit, p.defaultIssueQty),
                          notes: '',
                          bomLimit: p.bomLimit,
                          bomUsed: p.bomUsed,
                          remainingLimit: p.remainingLimit,
                          warehouseStock: p.warehouseStock
                        }))
                      );
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-[#007D3C] hover:bg-emerald-100/70 border border-[#007D3C]/40 rounded-lg cursor-pointer transition-colors whitespace-nowrap"
                  >
                    + Chọn Tất Cả ({currentUnitPlanItems.filter(p => p.remainingLimit > 0).length})
                  </button>
                </div>
              </div>

              {/* Category Filter Chips & Quota Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-emerald-200/60">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Nhóm vật tư:</span>
                  {[
                    { key: 'ALL', label: 'Tất Cả' },
                    { key: 'CHEMICAL', label: 'Hóa Chất & Dầu' },
                    { key: 'RAW_MATERIAL', label: 'Kim Loại & Phôi' },
                    { key: 'TOOLING', label: 'Khuôn Gá & Đá Mài' },
                    { key: 'SPARE_PART', label: 'Phụ Tùng & Linh Kiện' },
                    { key: 'PACKAGING', label: 'Bao Bì & Đóng Gói' },
                    { key: 'CONSUMABLE', label: 'Vật Tư Tiêu Hao' }
                  ].map(tab => {
                    const count = tab.key === 'ALL' 
                      ? unitAllPlanItems.length 
                      : unitAllPlanItems.filter(p => p.category === tab.key).length;
                    if (count === 0 && tab.key !== 'ALL') return null;

                    const isActive = planCategoryFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setPlanCategoryFilter(tab.key)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#007D3C] text-white shadow-2xs'
                            : 'bg-white text-slate-600 hover:bg-emerald-100/60 border border-slate-200'
                        }`}
                      >
                        {tab.label} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPlanQuotaFilter('ALL')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      planQuotaFilter === 'ALL' ? 'bg-[#007D3C] text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanQuotaFilter('AVAILABLE')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      planQuotaFilter === 'AVAILABLE' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Còn hạn mức
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanQuotaFilter('EXHAUSTED')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      planQuotaFilter === 'EXHAUSTED' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hết hạn mức
                  </button>
                </div>
              </div>

              {/* Table of Monthly Plan Catalog */}
              <div className="border border-emerald-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-emerald-50/70 text-slate-700 font-bold border-b border-emerald-200 uppercase text-[10px]">
                    <tr>
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3">Mã & Tên Vật Tư (SKU / Bravo)</th>
                      <th className="p-3">Nhóm / Kế Hoạch</th>
                      <th className="p-3 text-right">Định Mức BOM</th>
                      <th className="p-3 text-right">Đã Xuất Lũy Kế</th>
                      <th className="p-3 text-right">Hạn Mức Còn Lại</th>
                      <th className="p-3 text-right">Tồn Kho MMS1</th>
                      <th className="p-3 w-28 text-center">Tiến Độ</th>
                      <th className="p-3 text-center w-32">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentUnitPlanItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-slate-400 text-xs">
                          Không tìm thấy vật tư nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm.
                        </td>
                      </tr>
                    ) : (
                      currentUnitPlanItems.map((planItem, idx) => {
                        const isSelected = requestItems.some(it => it.materialId === planItem.materialId);
                        const usedPercent = Math.min(100, Math.round((planItem.bomUsed / planItem.bomLimit) * 100));

                        return (
                          <tr
                            key={planItem.id}
                            onClick={() => handleToggleSelectPlanItem(planItem)}
                            className={`transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50/80 hover:bg-emerald-100/70'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{planItem.materialName}</div>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                                  SKU: {planItem.materialCode}
                                </span>
                                <span className="font-mono text-[10px] bg-emerald-100 text-[#007D3C] px-1.5 py-0.5 rounded font-semibold">
                                  Bravo: {planItem.bravoId}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">({planItem.unit})</span>
                              </div>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-600">
                              <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-sans font-semibold mb-0.5">
                                {planItem.categoryLabel}
                              </span>
                              <div className="font-semibold text-slate-800">{planItem.planCode}</div>
                              <div className="text-[10px] text-slate-400 font-sans">{planItem.planTitle}</div>
                            </td>
                            <td className="p-3 text-right font-mono font-semibold text-slate-800">
                              {planItem.bomLimit.toLocaleString()} {planItem.unit}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-500">
                              {planItem.bomUsed.toLocaleString()} {planItem.unit}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-[#007D3C] text-sm">
                              {planItem.remainingLimit.toLocaleString()} {planItem.unit}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-600">
                              {planItem.warehouseStock.toLocaleString()} {planItem.unit}
                            </td>
                            <td className="p-3">
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    usedPercent >= 90
                                      ? 'bg-rose-500'
                                      : usedPercent >= 70
                                      ? 'bg-amber-500'
                                      : 'bg-[#007D3C]'
                                  }`}
                                  style={{ width: `${usedPercent}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-slate-500 text-center mt-0.5 font-mono font-semibold">
                                {usedPercent}% định mức
                              </div>
                            </td>
                            <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleToggleSelectPlanItem(planItem)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                                  isSelected
                                    ? 'bg-[#007D3C] text-white shadow-2xs hover:bg-[#009647]'
                                    : 'bg-emerald-50 text-[#007D3C] hover:bg-emerald-100 border border-emerald-300'
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã Chọn
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" /> + Chọn Xuất
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3.2: GIỎ VẬT TƯ ĐĂNG KÝ XUẤT KHO */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-[#007D3C]" /> 4. Giỏ Vật Tư Đăng Ký Xuất Kho ({requestItems.length} Mặt Hàng Đã Chọn):
                </span>
                {requestItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRequestItems([])}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Xóa toàn bộ giỏ
                  </button>
                )}
              </div>

              {requestItems.length === 0 ? (
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">
                  <Boxes className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <div className="text-xs font-bold text-slate-700">Chưa có vật tư nào được chọn xuất</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Vui lòng click trực tiếp vào dòng vật tư hoặc bấm nút <strong>"+ Chọn Xuất"</strong> trên bảng kế hoạch tháng ở trên để thêm vật tư vào phiếu đề nghị.
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                      <tr>
                        <th className="p-3 w-10 text-center">#</th>
                        <th className="p-3 min-w-[220px]">Mã & Tên Vật Tư Được Chọn</th>
                        <th className="p-3 text-right">Định Mức BOM</th>
                        <th className="p-3 text-right">Đã Dùng</th>
                        <th className="p-3 text-right">Hạn Mức Còn</th>
                        <th className="p-3 text-right w-40">SL Đề Nghị Xuất *</th>
                        <th className="p-3">Ghi Chú Công Đoạn / Khuôn Gá</th>
                        <th className="p-3 w-10 text-center">Bỏ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requestItems.map((item, idx) => {
                        const isOver = item.quantity > item.remainingLimit && reqType === 'PLANNING';

                        return (
                          <tr key={idx} className={`hover:bg-slate-50/80 ${isOver ? 'bg-rose-50/30' : ''}`}>
                            <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{item.materialName}</div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                                <span className="font-mono bg-slate-100 px-1 rounded text-slate-600">SKU: {item.materialCode}</span>
                                {item.bravoId && <span className="font-mono bg-emerald-50 px-1 rounded text-[#007D3C] font-semibold">Bravo: {item.bravoId}</span>}
                              </div>
                            </td>
                            <td className="p-3 text-right font-mono text-slate-600">
                              {item.bomLimit.toLocaleString()} {item.unit}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-500">
                              {item.bomUsed.toLocaleString()} {item.unit}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-[#007D3C]">
                              {item.remainingLimit.toLocaleString()} {item.unit}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={e => {
                                    const updated = [...requestItems];
                                    updated[idx].quantity = Math.max(1, Number(e.target.value));
                                    setRequestItems(updated);
                                  }}
                                  className={`w-full px-2.5 py-1 text-xs border rounded-lg font-mono font-bold text-right ${
                                    isOver
                                      ? 'border-rose-300 bg-rose-50 text-rose-700 focus:ring-rose-400'
                                      : 'border-slate-200 text-[#007D3C] focus:ring-[#007D3C]/20'
                                  }`}
                                />
                                <span className="text-[11px] text-slate-500 shrink-0 font-medium">{item.unit}</span>
                              </div>
                              {isOver && (
                                <span className="text-[10px] text-rose-600 block mt-0.5 text-right font-medium">
                                  Vượt hạn mức {(item.quantity - item.remainingLimit).toLocaleString()} {item.unit}!
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={item.notes}
                                onChange={e => {
                                  const updated = [...requestItems];
                                  updated[idx].notes = e.target.value;
                                  setRequestItems(updated);
                                }}
                                placeholder="Ghi chú khuôn dập / máy số..."
                                className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => setRequestItems(requestItems.filter((_, i) => i !== idx))}
                                className="text-slate-400 hover:text-rose-600 cursor-pointer text-base"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-[#007D3C]" />
              Hệ thống sẽ tự động gán Flow duyệt theo mã tổ <strong>{activePlanConfig.code}</strong>.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-[#007D3C] hover:bg-[#009647] active:scale-95 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Gửi Đề Nghị Xuất Kho
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Requests Queue View */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* 5-Card Visual KPI Status Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Card 1: Tổng Đề Nghị */}
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-slate-700 text-white border-slate-700 shadow-md ring-2 ring-slate-700/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">1. Tổng Yêu Cầu</span>
                <Layers3 className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold font-mono mt-1">{stats.total}</div>
              <div className="text-[10px] opacity-70 mt-0.5">Tất cả đề nghị xuất kho</div>
            </button>

            {/* Card 2: Chờ Phê Duyệt */}
            <button
              type="button"
              onClick={() => setFilterStatus('PENDING_APPROVAL')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                filterStatus === 'PENDING_APPROVAL'
                  ? 'bg-[#F7941D] text-white border-[#F7941D] shadow-md ring-2 ring-[#F7941D]/20'
                  : 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-200 text-amber-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider">2. Chờ Duyệt</span>
                <Clock className={`w-4 h-4 ${filterStatus === 'PENDING_APPROVAL' ? 'text-white' : 'text-amber-600'}`} />
              </div>
              <div className={`text-2xl font-extrabold font-mono mt-1 ${filterStatus === 'PENDING_APPROVAL' ? 'text-white' : 'text-amber-900'}`}>{stats.pending}</div>
              <div className={`text-[10px] mt-0.5 ${filterStatus === 'PENDING_APPROVAL' ? 'text-amber-100' : 'text-amber-700'}`}>Quản đốc / BGĐ duyệt</div>
            </button>

            {/* Card 3: Đang Soạn Hàng */}
            <button
              type="button"
              onClick={() => setFilterStatus('PICKING')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                filterStatus === 'PICKING'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/20'
                  : 'bg-blue-50/70 hover:bg-blue-100/70 border-blue-200 text-blue-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider">3. Đang Soạn</span>
                <Boxes className={`w-4 h-4 ${filterStatus === 'PICKING' ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <div className={`text-2xl font-extrabold font-mono mt-1 ${filterStatus === 'PICKING' ? 'text-white' : 'text-blue-900'}`}>{stats.picking}</div>
              <div className={`text-[10px] mt-0.5 ${filterStatus === 'PICKING' ? 'text-blue-100' : 'text-blue-700'}`}>Đã duyệt, thủ kho lấy</div>
            </button>

            {/* Card 4: Đã Soạn / Đã Xuất */}
            <button
              type="button"
              onClick={() => setFilterStatus('ISSUED')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                filterStatus === 'ISSUED'
                  ? 'bg-[#007D3C] text-white border-[#007D3C] shadow-md ring-2 ring-[#007D3C]/20'
                  : 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200 text-[#007D3C] shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider">4. Đã Soạn / Xuất</span>
                <Truck className={`w-4 h-4 ${filterStatus === 'ISSUED' ? 'text-white' : 'text-[#007D3C]'}`} />
              </div>
              <div className={`text-2xl font-extrabold font-mono mt-1 ${filterStatus === 'ISSUED' ? 'text-white' : 'text-[#007D3C]'}`}>{stats.issued}</div>
              <div className={`text-[10px] mt-0.5 ${filterStatus === 'ISSUED' ? 'text-emerald-100' : 'text-emerald-700'}`}>Đã trừ tồn & in PXK</div>
            </button>

            {/* Card 5: Đã Nhận Hàng */}
            <button
              type="button"
              onClick={() => setFilterStatus('RECEIVED')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                filterStatus === 'RECEIVED'
                  ? 'bg-teal-700 text-white border-teal-700 shadow-md ring-2 ring-teal-700/20'
                  : 'bg-teal-50/70 hover:bg-teal-100/70 border-teal-200 text-teal-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider">5. Đã Nhận Hàng</span>
                <ShieldCheck className={`w-4 h-4 ${filterStatus === 'RECEIVED' ? 'text-white' : 'text-teal-600'}`} />
              </div>
              <div className={`text-2xl font-extrabold font-mono mt-1 ${filterStatus === 'RECEIVED' ? 'text-white' : 'text-teal-900'}`}>{stats.received}</div>
              <div className={`text-[10px] mt-0.5 ${filterStatus === 'RECEIVED' ? 'text-teal-100' : 'text-teal-700'}`}>Xưởng đã nhận vật tư</div>
            </button>
          </div>

          {/* Search & Status Filter Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm mã đề nghị, xưởng, LSX..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-64 focus:outline-hidden focus:ring-2 focus:ring-[#007D3C]/20 font-medium"
                />
              </div>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-medium text-slate-700"
              >
                <option value="ALL">Tất cả trạng thái ({stats.total})</option>
                <option value="PENDING_APPROVAL">Chờ phê duyệt ({stats.pending})</option>
                <option value="PICKING">Đang soạn hàng ({stats.picking})</option>
                <option value="ISSUED">Đã xuất kho ({stats.issued})</option>
                <option value="RECEIVED">Đã nhận hàng tại xưởng ({stats.received})</option>
                <option value="REJECTED">Từ chối</option>
              </select>

              {/* Live MMS1 Database Refresh Button */}
              <button
                type="button"
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                title="Tải lại số liệu thực tế từ CSDL MMS1 (dbo.tbl_phieu_yeucau)"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#007D3C] ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Đang tải MMS1...' : 'Làm Mới (MMS1)'}</span>
              </button>
            </div>

            <span className="text-xs text-slate-500">
              Hiển thị <strong>{filteredRequests.length}</strong> / <strong>{issueRequests.length}</strong> phiếu đề nghị
            </span>
          </div>

          {/* Requests Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Mã Đề Nghị</th>
                    <th className="p-3.5">Loại</th>
                    <th className="p-3.5">Phân Xưởng / Người Yêu Cầu</th>
                    <th className="p-3.5">Lệnh SX (LSX)</th>
                    <th className="p-3.5">Mục Đích Xuất</th>
                    <th className="p-3.5">Thời Gian Cần</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#007D3C]">{req.code}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                          {req.type === 'PLANNING' ? 'Định Mức' : req.type === 'OVER_PLANNING' ? 'Vượt Mức' : 'Đột Xuất'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{req.department}</div>
                        <div className="text-[11px] text-slate-400">{req.requester}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-800">{req.productionOrder || '—'}</td>
                      <td className="p-3.5 text-slate-700 max-w-[220px] truncate">{req.purpose}</td>
                      <td className="p-3.5 font-mono text-slate-500">{req.requiredDate}</td>
                      <td className="p-3.5">{getStatusBadge(req.status)}</td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {req.status === 'PENDING_APPROVAL' && (
                          <button
                            type="button"
                            onClick={() => handleOpenDetailOrApproval(req)}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-[#007D3C] hover:bg-emerald-100 rounded-lg cursor-pointer transition-colors"
                          >
                            Phê Duyệt
                          </button>
                        )}
                        {(req.status === 'APPROVED' || req.status === 'PICKING') && (
                          <button
                            type="button"
                            onClick={() => handleStartPicking(req)}
                            className="px-2.5 py-1 text-xs font-semibold bg-[#007D3C] hover:bg-[#009647] text-white rounded-lg cursor-pointer transition-colors"
                          >
                            Soạn Hàng FIFO
                          </button>
                        )}
                        {req.status === 'ISSUED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRequest(req);
                                setActiveTab('print');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 inline-flex cursor-pointer transition-colors"
                            >
                              <Printer className="w-3 h-3" /> Phiếu Xuất
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                confirmReceivedIssueRequest(req.id);
                                alert(`Đã xác nhận phân xưởng [${req.department}] đã nhận đủ vật tư cho phiếu ${req.code}!`);
                              }}
                              className="px-2.5 py-1 text-xs font-bold bg-teal-50 text-teal-800 hover:bg-teal-100 rounded-lg flex items-center gap-1 inline-flex cursor-pointer transition-colors"
                            >
                              <ShieldCheck className="w-3 h-3 text-teal-600" /> Nhận Hàng
                            </button>
                          </>
                        )}
                        {req.status === 'RECEIVED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRequest(req);
                              setActiveTab('print');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 inline-flex cursor-pointer transition-colors"
                          >
                            <Printer className="w-3 h-3" /> Phiếu Xuất
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Picking Wizard with FIFO Recommendations */}
      {activeTab === 'picking' && selectedRequest && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#007D3C]" />
                <h3 className="font-bold text-slate-900 text-base">
                  Trợ Lý Soạn Hàng Thông Minh (Smart Picking FIFO / FEFO)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Phiếu: <strong>{selectedRequest.code}</strong> • Đơn vị: {selectedRequest.department}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('requests')}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Quay Lại
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Lô Hàng Được Hệ Thống Gợi Ý Lấy Theo Thứ Tự Nhập Trước (FIFO):
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Mã SKU</th>
                    <th className="p-3">Tên Vật Tư</th>
                    <th className="p-3">Mã Lô Được Chọn</th>
                    <th className="p-3">📍 Vị Trí Kệ Kho</th>
                    <th className="p-3">Hạn Dùng (EXP)</th>
                    <th className="p-3">Ưu Tiên</th>
                    <th className="p-3 text-right">SL Cần Lấy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pickingDetails.map((pick, idx) => {
                    const batch = batches.find(b => b.id === pick.batchId);
                    return (
                      <tr key={idx} className={`hover:bg-slate-50/50 ${idx === 0 ? 'bg-emerald-50/30' : ''}`}>
                        <td className="p-3 font-mono font-bold text-slate-900">{batch?.materialCode}</td>
                        <td className="p-3 font-medium text-slate-800">{batch?.materialName}</td>
                        <td className="p-3 font-mono font-bold text-[#007D3C]">{batch?.batchNumber}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#007D3C] border border-emerald-200 text-[11px] font-bold font-mono">
                            📍 {batch?.locationCode}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-rose-600">{batch?.expiryDate}</td>
                        <td className="p-3">
                          {idx === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#007D3C] text-white">
                              ⭐ Ưu tiên #1
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">#{idx + 1}</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-[#007D3C] text-sm">
                          {pick.quantity} {batch?.unit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
            <span className="text-emerald-900">
              Khi bấm <strong>"Xác Nhận Xuất Kho"</strong>, hệ thống sẽ trừ số dư các lô trên và cập nhật CSDL MMS1 tức thời.
            </span>
            <button
              onClick={handleExecuteIssue}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#007D3C] hover:bg-[#009647] active:scale-95 rounded-xl shadow-xs cursor-pointer transition-all"
            >
              Xác Nhận Xuất Kho & Cập Nhật Tồn
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Printable 20-Line Delivery Note (Phiếu Xuất Kho Chuẩn Kềm Nghĩa) */}
      {activeTab === 'print' && selectedRequest && (
        <div className="space-y-4">
          <div className="flex justify-end gap-3 no-print">
            <button
              onClick={() => setActiveTab('requests')}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
            >
              Quay Lại
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2 text-xs font-bold text-white bg-[#007D3C] hover:bg-[#009647] rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" /> In Phiếu Xuất Kho Chuẩn (Print)
            </button>
          </div>

          {/* Standard printable invoice sheet */}
          <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm max-w-4xl mx-auto text-slate-900 print:border-none print:shadow-none print:p-0">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-6">
              <div>
                <h4 className="font-extrabold text-sm uppercase text-[#007D3C]">CÔNG TY CỔ PHẦN KỀM NGHĨA</h4>
                <p className="text-[11px] text-slate-600">Lô B1-7, Đường N2, KCN Tây Bắc Củ Chi, TP. Hồ Chí Minh</p>
                <p className="text-[11px] text-slate-600">Hệ Thống Quản Lý Kho MMS • Hotline: (028) 3974 0651</p>
              </div>
              <div className="text-right text-[11px]">
                <div className="font-bold">Mẫu số: 02 - VT</div>
                <div className="text-slate-500">(Ban hành theo TT 200/2014/TT-BTC)</div>
                <div className="font-mono font-bold text-slate-900 mt-1">Số: {selectedRequest.deliveryNoteNumber || 'PXK-20260819-001'}</div>
              </div>
            </div>

            <div className="text-center my-6">
              <h2 className="text-xl font-extrabold uppercase tracking-wide">PHIẾU XUẤT KHO VẬT TƯ SẢN XUẤT</h2>
              <p className="text-xs text-slate-500 italic mt-1">
                Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
              </p>
            </div>

            {/* Beneficiary Info */}
            <div className="grid grid-cols-2 gap-y-2 text-xs mb-6">
              <div>- Họ tên người nhận hàng: <span className="font-bold">{selectedRequest.requester}</span></div>
              <div>- Đơn vị / Phân xưởng: <span className="font-bold">{selectedRequest.department}</span></div>
              <div>- Lý do xuất kho: <span className="font-medium">{selectedRequest.purpose}</span></div>
              <div>- Xuất tại kho: <span className="font-bold">Kho Tổng Vật Tư MMS1 (20020100)</span></div>
              <div>- Theo đề nghị số: <span className="font-mono font-semibold">{selectedRequest.code}</span></div>
              <div>- Lệnh sản xuất (LSX): <span className="font-mono font-semibold">{selectedRequest.productionOrder || 'N/A'}</span></div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-slate-400 text-xs mb-8">
              <thead>
                <tr className="bg-slate-100 text-center font-bold">
                  <th className="border border-slate-400 p-2 w-10">STT</th>
                  <th className="border border-slate-400 p-2">Tên, nhãn hiệu, quy cách vật tư</th>
                  <th className="border border-slate-400 p-2 w-24">Mã số (SKU)</th>
                  <th className="border border-slate-400 p-2 w-16">ĐVT</th>
                  <th className="border border-slate-400 p-2 w-20">Yêu cầu</th>
                  <th className="border border-slate-400 p-2 w-20">Thực xuất</th>
                  <th className="border border-slate-400 p-2 w-28">Đơn giá (đ)</th>
                  <th className="border border-slate-400 p-2 w-32">Thành tiền (đ)</th>
                </tr>
              </thead>
              <tbody>
                {selectedRequest.items.map((item, idx) => {
                  const mat = materials.find(m => m.id === item.materialId);
                  const price = mat?.standardPrice || 100000;
                  const total = item.issuedQuantity * price;
                  return (
                    <tr key={idx}>
                      <td className="border border-slate-400 p-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-400 p-2 font-medium">{item.materialName}</td>
                      <td className="border border-slate-400 p-2 text-center font-mono font-semibold">{item.materialCode}</td>
                      <td className="border border-slate-400 p-2 text-center">{item.unit}</td>
                      <td className="border border-slate-400 p-2 text-right font-mono">{item.requestedQuantity}</td>
                      <td className="border border-slate-400 p-2 text-right font-mono font-bold text-[#007D3C]">{item.issuedQuantity}</td>
                      <td className="border border-slate-400 p-2 text-right font-mono">{price.toLocaleString('vi-VN')}</td>
                      <td className="border border-slate-400 p-2 text-right font-mono font-bold">{total.toLocaleString('vi-VN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Signature blocks */}
            <div className="grid grid-cols-4 gap-4 text-center text-xs mt-12 pt-6">
              <div>
                <div className="font-bold uppercase">Người Lập Phiếu</div>
                <div className="text-[10px] text-slate-400 italic">(Ký, họ tên)</div>
                <div className="mt-16 font-semibold text-slate-800">{currentUser.fullName}</div>
              </div>
              <div>
                <div className="font-bold uppercase">Người Nhận Hàng</div>
                <div className="text-[10px] text-slate-400 italic">(Ký, họ tên)</div>
                <div className="mt-16 font-semibold text-slate-800">{selectedRequest.requester}</div>
              </div>
              <div>
                <div className="font-bold uppercase">Thủ Kho</div>
                <div className="text-[10px] text-slate-400 italic">(Ký, họ tên)</div>
                <div className="mt-16 font-semibold text-slate-800">Thủ Kho MMS1</div>
              </div>
              <div>
                <div className="font-bold uppercase">Giám Đốc Duyệt</div>
                <div className="text-[10px] text-slate-400 italic">(Ký, họ tên)</div>
                <div className="mt-16 font-semibold text-slate-800">Ban Giám Đốc Sản Xuất</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {selectedRequest && activeTab === 'requests' && selectedRequest.status === 'PENDING_APPROVAL' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Phê Duyệt Đề Nghị Xuất Kho: {selectedRequest.code}
              </h3>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div>- Bộ phận: <strong className="text-slate-900">{selectedRequest.department}</strong></div>
              <div>- Người lập: <strong className="text-slate-900">{selectedRequest.requester}</strong></div>
              <div>- Mục đích: <span className="text-slate-800">{selectedRequest.purpose}</span></div>
              <div>- Thời gian cần: <span className="font-mono text-slate-700">{selectedRequest.requiredDate}</span></div>
              <div>- Lệnh SX: <span className="font-mono font-semibold">{selectedRequest.productionOrder || 'N/A'}</span></div>
            </div>

            {/* Danh sách vật tư thực tế từ CSDL MMS1 (dbo.tbl_phieu_yeucau_chitiet) */}
            {isLoadingDetail ? (
              <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2 bg-slate-50 rounded-xl border border-slate-200">
                <Loader2 className="w-4 h-4 animate-spin text-[#007D3C]" /> Đang tải danh sách vật tư chi tiết từ CSDL MMS1...
              </div>
            ) : requestDetail && requestDetail.lines && requestDetail.lines.length > 0 ? (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Chi Tiết Vật Tư Yêu Cầu ({requestDetail.lines.length} món):</span>
                  <span className="text-emerald-700 font-mono text-[10px]">MMS1 LIVE</span>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
                  {requestDetail.lines.map((ln, idx) => (
                    <div key={ln.lineId || idx} className="p-2.5 text-xs flex items-center justify-between hover:bg-slate-50/80">
                      <div>
                        <div className="font-bold text-slate-900">{ln.materialName || ln.materialId}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Mã VT: {ln.materialId} {ln.bravoId ? `• Bravo: ${ln.bravoId}` : ''}
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-[#007D3C]">
                        {ln.quantity.toLocaleString('vi-VN')} {ln.unit || 'ĐVT'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ý Kiến Phê Duyệt / Ghi Chú:</label>
              <textarea
                rows={2}
                value={approvalComment}
                onChange={e => setApprovalComment(e.target.value)}
                placeholder="Đồng ý xuất theo định mức sản xuất..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#007D3C]/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => handleApprove(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Từ Chối
              </button>
              <button
                onClick={() => handleApprove(true)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#007D3C] hover:bg-[#009647] rounded-lg cursor-pointer shadow-xs"
              >
                Đồng Ý Phê Duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

