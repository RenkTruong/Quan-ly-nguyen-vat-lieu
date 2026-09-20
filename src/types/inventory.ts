export interface ImportRecord {
  id: string;
  maHangHoa: string;     // LL-XX-0001
  tenHangHoa: string;
  donViTinh: string;
  soLuongNhap: number;   // number only
  donGiaNhap: number;
  thanhTien: number;     // soLuongNhap * donGiaNhap
  thoiGianNhap: string;  // hh:mm dd/mm/yyyy
  hanSuDung?: string;    // yyyy-mm-dd or dd/mm/yyyy
  conSuDung: 'Còn sử dụng' | 'Hết hạn sử dụng' | 'Không thời hạn';
  ncc: string;           // from Data NCC
  nguoiNhap: string;     // user
}

export interface ExportRecord {
  id: string;
  maHangHoa: string;     // dropdown from Sheet Nhập
  tenHangHoa: string;    // lookup by code
  donViTinh: string;     // lookup by code
  soLuongXuat: number;   // number only
  ngayXuat: string;      // hh:mm dd/mm/yyyy
  nguoiXuat: string;     // user
  ghiChu?: string;
}

export interface InventorySummary {
  maHangHoa: string;
  tenHangHoa: string;
  donViTinh: string;
  tongNhap: number;      // based on selected date range
  tongXuat: number;      // based on selected date range
  chiPhiNhap: number;    // based on selected date range
  tonKho: number;        // tongNhap - tongXuat
  tonToiThieu: number;
  nhapMoi: 'Cần nhập hàng' | 'Tồn kho ở mức ổn';
  hanSuDung?: string;
  trangThaiHsd?: string;
}

export interface Supplier {
  id: string;
  tenNCC: string;
  nguoiLienHe: string;
  sdt: string;
  diaChi: string;
  thongTinNCC: string;
  tenNganHang: string;
  stkNganHang: string;
  ghiChu?: string;
}

export type PermissionLevel = 'view' | 'edit' | 'hidden';

export type SheetId = 'nhap' | 'xuat' | 'tonKho' | 'dashboard' | 'phanQuyen' | 'ncc';

export interface ColumnPermission {
  columnId: string;
  columnName: string;
  access: PermissionLevel;
}

export interface SheetPermission {
  sheetId: 'nhap' | 'xuat' | 'tonKho' | 'dashboard' | 'phanQuyen' | 'ncc';
  sheetName: string;
  access: PermissionLevel; // 'edit' = xem & sửa, 'view' = chỉ xem, 'hidden' = không được xem
  columns: Record<string, PermissionLevel>;
}

export interface UserRole {
  email: string;
  fullName: string;
  role: 'admin' | 'warehouse_manager' | 'warehouse_staff' | 'accountant' | 'viewer';
  roleName: string;
  sheets: Record<string, SheetPermission>;
}

export interface GoogleSheetSyncState {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  spreadsheetTitle: string;
  lastSyncedAt: string | null;
  isSyncing: boolean;
}
