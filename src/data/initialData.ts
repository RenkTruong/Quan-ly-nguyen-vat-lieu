import { ImportRecord, ExportRecord, Supplier, UserRole, RoleDefinition } from '../types/inventory';

export const OWNER_EMAIL = 'trucgiau.truong@gmail.com';

export const INITIAL_ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: 'admin',
    name: 'Quản trị viên cấp cao',
    description: 'Toàn quyền cấu hình, quản lý người dùng, nhập/xuất và phân quyền',
    isSystem: true,
    defaultSheets: {
      nhap: { sheetId: 'nhap', sheetName: 'Lịch sử Nhập hàng', access: 'edit', columns: {} },
      xuat: { sheetId: 'xuat', sheetName: 'Lịch sử Xuất hàng', access: 'edit', columns: {} },
      tonKho: { sheetId: 'tonKho', sheetName: 'Báo cáo Tồn kho', access: 'edit', columns: {} },
      dashboard: { sheetId: 'dashboard', sheetName: 'Dashboard Phân tích', access: 'edit', columns: {} },
      phanQuyen: { sheetId: 'phanQuyen', sheetName: 'Phân quyền User', access: 'edit', columns: {} },
      ncc: { sheetId: 'ncc', sheetName: 'Danh bạ Nhà cung cấp', access: 'edit', columns: {} }
    }
  },
  {
    id: 'warehouse_manager',
    name: 'Quản lý Kho vận',
    description: 'Quản lý nhập xuất hàng, danh bạ nhà cung cấp và xem báo cáo',
    isSystem: true,
    defaultSheets: {
      nhap: { sheetId: 'nhap', sheetName: 'Lịch sử Nhập hàng', access: 'edit', columns: {} },
      xuat: { sheetId: 'xuat', sheetName: 'Lịch sử Xuất hàng', access: 'edit', columns: {} },
      tonKho: { sheetId: 'tonKho', sheetName: 'Báo cáo Tồn kho', access: 'edit', columns: {} },
      dashboard: { sheetId: 'dashboard', sheetName: 'Dashboard Phân tích', access: 'view', columns: {} },
      phanQuyen: { sheetId: 'phanQuyen', sheetName: 'Phân quyền User', access: 'view', columns: {} },
      ncc: { sheetId: 'ncc', sheetName: 'Danh bạ Nhà cung cấp', access: 'edit', columns: {} }
    }
  },
  {
    id: 'warehouse_staff',
    name: 'Thủ kho phụ trách Nhập / Xuất',
    description: 'Thao tác nhập xuất vật tư hàng ngày, ẩn cột giá nhập và chi phí',
    isSystem: true,
    defaultSheets: {
      nhap: { 
        sheetId: 'nhap', 
        sheetName: 'Lịch sử Nhập hàng', 
        access: 'edit', 
        columns: {
          donGiaNhap: 'hidden',
          thanhTien: 'hidden'
        } 
      },
      xuat: { sheetId: 'xuat', sheetName: 'Lịch sử Xuất hàng', access: 'edit', columns: {} },
      tonKho: { 
        sheetId: 'tonKho', 
        sheetName: 'Báo cáo Tồn kho', 
        access: 'view', 
        columns: {
          chiPhiNhap: 'hidden'
        } 
      },
      dashboard: { sheetId: 'dashboard', sheetName: 'Dashboard Phân tích', access: 'view', columns: {} },
      phanQuyen: { sheetId: 'phanQuyen', sheetName: 'Phân quyền User', access: 'hidden', columns: {} },
      ncc: { sheetId: 'ncc', sheetName: 'Danh bạ Nhà cung cấp', access: 'view', columns: { stkNganHang: 'hidden' } }
    }
  },
  {
    id: 'accountant',
    name: 'Kế toán Nguyên vật liệu',
    description: 'Theo dõi đơn giá, thành tiền, chi phí nhập và thông tin đối tác',
    isSystem: true,
    defaultSheets: {
      nhap: { sheetId: 'nhap', sheetName: 'Lịch sử Nhập hàng', access: 'view', columns: {} },
      xuat: { sheetId: 'xuat', sheetName: 'Lịch sử Xuất hàng', access: 'view', columns: {} },
      tonKho: { sheetId: 'tonKho', sheetName: 'Báo cáo Tồn kho', access: 'view', columns: {} },
      dashboard: { sheetId: 'dashboard', sheetName: 'Dashboard Phân tích', access: 'view', columns: {} },
      phanQuyen: { sheetId: 'phanQuyen', sheetName: 'Phân quyền User', access: 'hidden', columns: {} },
      ncc: { sheetId: 'ncc', sheetName: 'Danh bạ Nhà cung cấp', access: 'edit', columns: {} }
    }
  },
  {
    id: 'viewer',
    name: 'Nhân viên chỉ xem',
    description: 'Chỉ được xem các sheet nghiệp vụ cơ bản, không có quyền chỉnh sửa',
    isSystem: true,
    defaultSheets: {
      nhap: { sheetId: 'nhap', sheetName: 'Lịch sử Nhập hàng', access: 'view', columns: {} },
      xuat: { sheetId: 'xuat', sheetName: 'Lịch sử Xuất hàng', access: 'view', columns: {} },
      tonKho: { sheetId: 'tonKho', sheetName: 'Báo cáo Tồn kho', access: 'view', columns: {} },
      dashboard: { sheetId: 'dashboard', sheetName: 'Dashboard Phân tích', access: 'view', columns: {} },
      phanQuyen: { sheetId: 'phanQuyen', sheetName: 'Phân quyền User', access: 'hidden', columns: {} },
      ncc: { sheetId: 'ncc', sheetName: 'Danh bạ Nhà cung cấp', access: 'view', columns: {} }
    }
  },
  {
    id: 'guest',
    name: 'Khách (Chỉ xem Tồn kho)',
    description: 'Chỉ được phép xem duy nhất Sheet Tồn kho, hoàn toàn không được chỉnh sửa và không được truy cập các Sheet khác',
    isSystem: true,
    defaultSheets: {
      nhap: { sheetId: 'nhap', sheetName: 'Lịch sử Nhập hàng', access: 'hidden', columns: {} },
      xuat: { sheetId: 'xuat', sheetName: 'Lịch sử Xuất hàng', access: 'hidden', columns: {} },
      tonKho: { sheetId: 'tonKho', sheetName: 'Báo cáo Tồn kho', access: 'view', columns: {} },
      dashboard: { sheetId: 'dashboard', sheetName: 'Dashboard Phân tích', access: 'hidden', columns: {} },
      phanQuyen: { sheetId: 'phanQuyen', sheetName: 'Phân quyền User', access: 'hidden', columns: {} },
      ncc: { sheetId: 'ncc', sheetName: 'Danh bạ Nhà cung cấp', access: 'hidden', columns: {} }
    }
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'ncc-1',
    tenNCC: 'Công ty Cổ phần Hóa chất & Bột giặt LIX',
    nguoiLienHe: 'Nguyễn Văn Long',
    sdt: '0912 345 678',
    diaChi: 'KCN Tân Tạo, Q. Bình Tân, TP. Hồ Chí Minh',
    thongTinNCC: 'Chuyên cung cấp nguyên liệu tẩy rửa công nghiệp & phụ gia hoạt tính',
    tenNganHang: 'Vietcombank - CN Tân Bình',
    stkNganHang: '0071001234567',
    ghiChu: 'Chiết khấu 3% cho đơn hàng thanh toán trước hạn 15 ngày'
  },
  {
    id: 'ncc-2',
    tenNCC: 'Công ty TNHH Thép & Vật Liệu Việt Nhật',
    nguoiLienHe: 'Trần Thị Mai',
    sdt: '0987 654 321',
    diaChi: 'KCN Sóng Thần 1, Dĩ An, Bình Dương',
    thongTinNCC: 'Thép cuộn cán nóng, cán nguội, thanh ren và phụ kiện kim khí',
    tenNganHang: 'BIDV - CN Nam Bình Dương',
    stkNganHang: '6511000987654',
    ghiChu: 'Giao hàng tận kho trong vòng 24 giờ sau khi đặt'
  },
  {
    id: 'ncc-3',
    tenNCC: 'Công ty CP Bao Bì Ánh Sáng',
    nguoiLienHe: 'Lê Hoàng Nam',
    sdt: '0903 888 999',
    diaChi: '31A Đường số 17, P. Hiệp Bình Phước, TP. Thủ Đức, TP. HCM',
    thongTinNCC: 'Bao bì hạt nhựa PP, túi zipper công nghiệp, thùng carton 5 lớp',
    tenNganHang: 'Techcombank - CN Sài Gòn',
    stkNganHang: '1903456789012',
    ghiChu: 'Quy cách đóng gói theo pallet chuẩn xuất khẩu'
  },
  {
    id: 'ncc-4',
    tenNCC: 'Công ty TNHH Hóa Chất Miền Nam (SouthChem)',
    nguoiLienHe: 'Vũ Đức Trọng',
    sdt: '0934 112 233',
    diaChi: 'Lô B4, KCN Hiệp Phước, Nhà Bè, TP. Hồ Chí Minh',
    thongTinNCC: 'Cồn Ethanol 96%, Xút vảy NaOH 99%, LAS hoạt động bề mặt',
    tenNganHang: 'MB Bank - CN TP.HCM',
    stkNganHang: '0800112233445',
    ghiChu: 'Bắt buộc kèm phiếu kiểm định MSDS và CO/CQ khi nhập kho'
  }
];

export const INITIAL_IMPORTS: ImportRecord[] = [
  {
    id: 'imp-1',
    maHangHoa: 'LL-BG-0001',
    tenHangHoa: 'Bột giặt Omo',
    donViTinh: 'Bao 25kg',
    soLuongNhap: 200,
    donGiaNhap: 350000,
    thanhTien: 70000000,
    thoiGianNhap: '08:30 10/09/2026',
    hanSuDung: '2027-09-10',
    conSuDung: 'Còn sử dụng',
    ncc: 'Công ty Cổ phần Hóa chất & Bột giặt LIX',
    nguoiNhap: 'trucgiau.truong@gmail.com'
  },
  {
    id: 'imp-2',
    maHangHoa: 'LL-XM-0001',
    tenHangHoa: 'Xi măng Hà Tiên',
    donViTinh: 'Tấn',
    soLuongNhap: 50,
    donGiaNhap: 1650000,
    thanhTien: 82500000,
    thoiGianNhap: '09:15 12/09/2026',
    hanSuDung: '2026-12-15',
    conSuDung: 'Còn sử dụng',
    ncc: 'Công ty TNHH Thép & Vật Liệu Việt Nhật',
    nguoiNhap: 'trucgiau.truong@gmail.com'
  },
  {
    id: 'imp-3',
    maHangHoa: 'LL-CE-0001',
    tenHangHoa: 'Cồn Ethanol 96%',
    donViTinh: 'Phuy 200L',
    soLuongNhap: 30,
    donGiaNhap: 4800000,
    thanhTien: 144000000,
    thoiGianNhap: '14:00 14/09/2026',
    hanSuDung: '2027-08-20',
    conSuDung: 'Còn sử dụng',
    ncc: 'Công ty TNHH Hóa Chất Miền Nam (SouthChem)',
    nguoiNhap: 'nguyenvana@gmail.com'
  },
  {
    id: 'imp-4',
    maHangHoa: 'LL-HN-0001',
    tenHangHoa: 'Hạt nhựa PP',
    donViTinh: 'Tấn',
    soLuongNhap: 40,
    donGiaNhap: 28000000,
    thanhTien: 1120000000,
    thoiGianNhap: '10:45 15/09/2026',
    hanSuDung: '2028-01-01',
    conSuDung: 'Còn sử dụng',
    ncc: 'Công ty CP Bao Bì Ánh Sáng',
    nguoiNhap: 'trucgiau.truong@gmail.com'
  },
  {
    id: 'imp-5',
    maHangHoa: 'LL-TC-0001',
    tenHangHoa: 'Thép cán nguội',
    donViTinh: 'Tấn',
    soLuongNhap: 20,
    donGiaNhap: 17500000,
    thanhTien: 350000000,
    thoiGianNhap: '11:20 16/09/2026',
    hanSuDung: '',
    conSuDung: 'Không thời hạn',
    ncc: 'Công ty TNHH Thép & Vật Liệu Việt Nhật',
    nguoiNhap: 'lethib@gmail.com'
  },
  {
    id: 'imp-6',
    maHangHoa: 'LL-HL-0001',
    tenHangHoa: 'Hương liệu Chanh tự nhiên',
    donViTinh: 'Can 20L',
    soLuongNhap: 25,
    donGiaNhap: 2100000,
    thanhTien: 52500000,
    thoiGianNhap: '15:30 18/09/2026',
    hanSuDung: '2026-08-01',
    conSuDung: 'Hết hạn sử dụng',
    ncc: 'Công ty TNHH Hóa Chất Miền Nam (SouthChem)',
    nguoiNhap: 'nguyenvana@gmail.com'
  }
];

export const INITIAL_EXPORTS: ExportRecord[] = [
  {
    id: 'exp-1',
    maHangHoa: 'LL-BG-0001',
    tenHangHoa: 'Bột giặt Omo',
    donViTinh: 'Bao 25kg',
    soLuongXuat: 140,
    ngayXuat: '14:20 13/09/2026',
    nguoiXuat: 'nguyenvana@gmail.com',
    ghiChu: 'Cấp cho phân xưởng đóng gói số 2'
  },
  {
    id: 'exp-2',
    maHangHoa: 'LL-XM-0001',
    tenHangHoa: 'Xi măng Hà Tiên',
    donViTinh: 'Tấn',
    soLuongXuat: 45,
    ngayXuat: '16:00 15/09/2026',
    nguoiXuat: 'trucgiau.truong@gmail.com',
    ghiChu: 'Xuất công trình xưởng giai đoạn 2'
  },
  {
    id: 'exp-3',
    maHangHoa: 'LL-CE-0001',
    tenHangHoa: 'Cồn Ethanol 96%',
    donViTinh: 'Phuy 200L',
    soLuongXuat: 10,
    ngayXuat: '09:00 17/09/2026',
    nguoiXuat: 'lethib@gmail.com',
    ghiChu: 'Pha chế mẻ dung dịch sát khuẩn K09'
  },
  {
    id: 'exp-4',
    maHangHoa: 'LL-HN-0001',
    tenHangHoa: 'Hạt nhựa PP',
    donViTinh: 'Tấn',
    soLuongXuat: 36,
    ngayXuat: '10:30 18/09/2026',
    nguoiXuat: 'nguyenvana@gmail.com',
    ghiChu: 'Ép đùn thổi màng bọc'
  },
  {
    id: 'exp-5',
    maHangHoa: 'LL-HL-0001',
    tenHangHoa: 'Hương liệu Chanh tự nhiên',
    donViTinh: 'Can 20L',
    soLuongXuat: 5,
    ngayXuat: '11:15 19/09/2026',
    nguoiXuat: 'trucgiau.truong@gmail.com',
    ghiChu: 'Thử nghiệm phòng R&D'
  }
];

// Định mức tồn kho tối thiểu mặc định theo mã
export const INITIAL_MIN_STOCKS: Record<string, number> = {
  'LL-BG-0001': 50,  // Bột giặt: Tồn = 200 - 140 = 60 > 50 -> Ổn
  'LL-XM-0001': 10,  // Xi măng: Tồn = 50 - 45 = 5 <= 10 -> CẦN NHẬP HÀNG!
  'LL-CE-0001': 10,  // Cồn: Tồn = 30 - 10 = 20 > 10 -> Ổn
  'LL-HN-0001': 10,  // Hạt nhựa: Tồn = 40 - 36 = 4 <= 10 -> CẦN NHẬP HÀNG!
  'LL-TC-0001': 5,   // Thép: Tồn = 20 - 0 = 20 > 5 -> Ổn
  'LL-HL-0001': 10   // Hương liệu: Tồn = 25 - 5 = 20 > 10 -> Ổn nhưng hết hạn!
};

export const INITIAL_USERS: UserRole[] = [
  {
    email: 'trucgiau.truong@gmail.com',
    fullName: 'Trúc Giàu Trương (Chủ tài khoản / Admin)',
    role: 'admin',
    roleName: 'Quản trị viên cấp cao',
    sheets: {
      nhap: { sheetId: 'nhap', sheetName: 'Lịch sử Nhập hàng', access: 'edit', columns: {} },
      xuat: { sheetId: 'xuat', sheetName: 'Lịch sử Xuất hàng', access: 'edit', columns: {} },
      tonKho: { sheetId: 'tonKho', sheetName: 'Báo cáo Tồn kho', access: 'edit', columns: {} },
      dashboard: { sheetId: 'dashboard', sheetName: 'Dashboard Phân tích', access: 'edit', columns: {} },
      phanQuyen: { sheetId: 'phanQuyen', sheetName: 'Phân quyền User', access: 'edit', columns: {} },
      ncc: { sheetId: 'ncc', sheetName: 'Danh bạ Nhà cung cấp', access: 'edit', columns: {} }
    }
  },
  {
    email: 'quanlykho@congty.com',
    fullName: 'Trần Văn Hoàng (Quản lý kho)',
    role: 'warehouse_manager',
    roleName: 'Quản lý Kho vận',
    sheets: {
      nhap: { sheetId: 'nhap', sheetName: 'Lịch sử Nhập hàng', access: 'edit', columns: {} },
      xuat: { sheetId: 'xuat', sheetName: 'Lịch sử Xuất hàng', access: 'edit', columns: {} },
      tonKho: { sheetId: 'tonKho', sheetName: 'Báo cáo Tồn kho', access: 'edit', columns: {} },
      dashboard: { sheetId: 'dashboard', sheetName: 'Dashboard Phân tích', access: 'view', columns: {} },
      phanQuyen: { sheetId: 'phanQuyen', sheetName: 'Phân quyền User', access: 'view', columns: {} },
      ncc: { sheetId: 'ncc', sheetName: 'Danh bạ Nhà cung cấp', access: 'edit', columns: {} }
    }
  },
  {
    email: 'nguyenvana@gmail.com',
    fullName: 'Nguyễn Văn A (Thủ kho)',
    role: 'warehouse_staff',
    roleName: 'Thủ kho phụ trách Nhập / Xuất',
    sheets: {
      nhap: { 
        sheetId: 'nhap', 
        sheetName: 'Lịch sử Nhập hàng', 
        access: 'edit', 
        columns: {
          donGiaNhap: 'hidden',
          thanhTien: 'hidden'
        } 
      },
      xuat: { sheetId: 'xuat', sheetName: 'Lịch sử Xuất hàng', access: 'edit', columns: {} },
      tonKho: { 
        sheetId: 'tonKho', 
        sheetName: 'Báo cáo Tồn kho', 
        access: 'view', 
        columns: {
          chiPhiNhap: 'hidden'
        } 
      },
      dashboard: { sheetId: 'dashboard', sheetName: 'Dashboard Phân tích', access: 'view', columns: {} },
      phanQuyen: { sheetId: 'phanQuyen', sheetName: 'Phân quyền User', access: 'hidden', columns: {} },
      ncc: { sheetId: 'ncc', sheetName: 'Danh bạ Nhà cung cấp', access: 'view', columns: { stkNganHang: 'hidden' } }
    }
  },
  {
    email: 'lethib@gmail.com',
    fullName: 'Lê Thị B (Kế toán chi phí)',
    role: 'accountant',
    roleName: 'Kế toán Nguyên vật liệu',
    sheets: {
      nhap: { sheetId: 'nhap', sheetName: 'Lịch sử Nhập hàng', access: 'view', columns: {} },
      xuat: { sheetId: 'xuat', sheetName: 'Lịch sử Xuất hàng', access: 'view', columns: {} },
      tonKho: { sheetId: 'tonKho', sheetName: 'Báo cáo Tồn kho', access: 'view', columns: {} },
      dashboard: { sheetId: 'dashboard', sheetName: 'Dashboard Phân tích', access: 'view', columns: {} },
      phanQuyen: { sheetId: 'phanQuyen', sheetName: 'Phân quyền User', access: 'hidden', columns: {} },
      ncc: { sheetId: 'ncc', sheetName: 'Danh bạ Nhà cung cấp', access: 'edit', columns: {} }
    }
  }
];

// Aliases
export const initialSuppliers = INITIAL_SUPPLIERS;
export const initialImports = INITIAL_IMPORTS;
export const initialExports = INITIAL_EXPORTS;
export const initialUsers = INITIAL_USERS;
export const initialMinStocks = INITIAL_MIN_STOCKS;
export const initialRoleDefinitions = INITIAL_ROLE_DEFINITIONS;
