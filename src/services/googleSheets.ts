import { ImportRecord, ExportRecord, Supplier, UserRole } from '../types/inventory';

export interface CreateSheetResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

/**
 * Gọi Google Sheets API để tạo mới 1 bảng tính hoàn chỉnh với 6 Sheets theo đúng yêu cầu đề bài
 */
export async function createFullInventorySpreadsheet(
  accessToken: string,
  imports: ImportRecord[],
  exports: ExportRecord[],
  suppliers: Supplier[],
  users: UserRole[],
  minStocks: Record<string, number>
): Promise<CreateSheetResponse> {
  const spreadsheetResource = {
    properties: {
      title: `Quản Lý Nguyên Vật Liệu - ${new Date().toLocaleDateString('vi-VN')}`,
      locale: 'vi_VN',
      autoRecalc: 'ON_CHANGE'
    },
    sheets: [
      { properties: { title: '1. Nhập hàng', index: 0, gridProperties: { rowCount: 200, columnCount: 12, frozenRowCount: 1 } } },
      { properties: { title: '2. Xuất hàng', index: 1, gridProperties: { rowCount: 200, columnCount: 10, frozenRowCount: 1 } } },
      { properties: { title: '3. Tồn kho', index: 2, gridProperties: { rowCount: 100, columnCount: 12, frozenRowCount: 3 } } },
      { properties: { title: '4. Dashboard', index: 3, gridProperties: { rowCount: 60, columnCount: 10 } } },
      { properties: { title: '5. Phân quyền', index: 4, gridProperties: { rowCount: 50, columnCount: 12, frozenRowCount: 1 } } },
      { properties: { title: '6. Data NCC', index: 5, gridProperties: { rowCount: 100, columnCount: 10, frozenRowCount: 1 } } }
    ]
  };

  // 1. Tạo file Spreadsheet mới
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(spreadsheetResource)
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Không thể tạo file Google Sheet: ${errText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Điền dữ liệu và công thức vào từng Sheet qua batchUpdate Values
  const sheetTitles = sheetData.sheets?.map((s: any) => s.properties.title) || [];

  // Sheet 1: Nhập hàng
  const importHeaders = [
    'Mã hàng hóa',
    'Tên hàng hóa',
    'Đơn vị tính',
    'Số lượng nhập',
    'Đơn giá nhập (VNĐ)',
    'Thành tiền (VNĐ)',
    'Thời gian nhập',
    'Hạn sử dụng',
    'Còn sử dụng',
    'Nhà cung cấp',
    'Người nhập'
  ];

  const importRows = imports.map((item, idx) => {
    const rowNum = idx + 2;
    return [
      item.maHangHoa,
      item.tenHangHoa,
      item.donViTinh,
      item.soLuongNhap,
      item.donGiaNhap,
      `=D${rowNum}*E${rowNum}`, // Thành tiền = Số lượng * Đơn giá
      item.thoiGianNhap,
      item.hanSuDung || '',
      `=IF(ISBLANK(H${rowNum}), "Không thời hạn", IF(H${rowNum}>=TODAY(), "Còn sử dụng", "Hết hạn sử dụng"))`,
      item.ncc,
      item.nguoiNhap
    ];
  });

  // Sheet 2: Xuất hàng
  const exportHeaders = [
    'Mã hàng hóa',
    'Tên hàng hóa',
    'Đơn vị tính',
    'Số lượng xuất',
    'Ngày xuất',
    'Người xuất',
    'Ghi chú'
  ];

  const exportRows = exports.map((item, idx) => {
    const rowNum = idx + 2;
    return [
      item.maHangHoa,
      `=IFERROR(VLOOKUP(A${rowNum}, '1. Nhập hàng'!$A$2:$C$500, 2, FALSE), "${item.tenHangHoa}")`,
      `=IFERROR(VLOOKUP(A${rowNum}, '1. Nhập hàng'!$A$2:$C$500, 3, FALSE), "${item.donViTinh}")`,
      item.soLuongXuat,
      item.ngayXuat,
      item.nguoiXuat,
      item.ghiChu || ''
    ];
  });

  // Sheet 3: Tồn kho
  // Lấy danh sách mã hàng hóa duy nhất
  const uniqueItemsMap = new Map<string, { ten: string; dvt: string; hsd: string }>();
  imports.forEach((imp) => {
    if (!uniqueItemsMap.has(imp.maHangHoa)) {
      uniqueItemsMap.set(imp.maHangHoa, {
        ten: imp.tenHangHoa,
        dvt: imp.donViTinh,
        hsd: imp.hanSuDung || ''
      });
    }
  });

  const tonKhoHeaderRows = [
    ['BỘ LỌC THỜI GIAN:', 'Từ ngày:', '01/09/2026', 'Đến ngày:', '30/09/2026', '', '', '', ''],
    ['(Dữ liệu tổng nhập, tổng xuất và chi phí nhập tự động tính theo công thức liên kết)', '', '', '', '', '', '', '', ''],
    [
      'Mã hàng hóa',
      'Tên hàng hóa',
      'Đơn vị tính',
      'Tổng nhập',
      'Tổng xuất',
      'Chi phí nhập (VNĐ)',
      'Tồn kho',
      'Tồn tối thiểu',
      'Nhập mới (Cảnh báo)'
    ]
  ];

  let currRow = 4;
  const tonKhoDataRows: any[][] = [];
  uniqueItemsMap.forEach((val, code) => {
    const minStock = minStocks[code] ?? 10;
    tonKhoDataRows.push([
      code,
      `=IFERROR(VLOOKUP(A${currRow}, '1. Nhập hàng'!$A$2:$C$500, 2, FALSE), "${val.ten}")`,
      `=IFERROR(VLOOKUP(A${currRow}, '1. Nhập hàng'!$A$2:$C$500, 3, FALSE), "${val.dvt}")`,
      `=SUMIFS('1. Nhập hàng'!$D$2:$D$500, '1. Nhập hàng'!$A$2:$A$500, A${currRow})`,
      `=SUMIFS('2. Xuất hàng'!$D$2:$D$500, '2. Xuất hàng'!$A$2:$A$500, A${currRow})`,
      `=SUMIFS('1. Nhập hàng'!$F$2:$F$500, '1. Nhập hàng'!$A$2:$A$500, A${currRow})`,
      `=D${currRow}-E${currRow}`, // Tồn kho = Tổng nhập - Tổng xuất
      minStock,
      `=IF(G${currRow}<=H${currRow}, "Cần nhập hàng", "Tồn kho ở mức ổn")`
    ]);
    currRow++;
  });

  // Sheet 4: Dashboard
  const dashboardRows = [
    ['BẢNG ĐIỀU KHIỂN TỔNG QUAN NGUYÊN VẬT LIỆU (DASHBOARD)'],
    ['Chỉ số quan trọng', 'Giá trị', 'Đơn vị', 'Ghi chú đánh giá'],
    ['Tổng số loại mã NVL quản lý', '=COUNTA(\'3. Tồn kho\'!A4:A50)', 'Mặt hàng', 'Mã duy nhất chuẩn hóa'],
    ['Tổng giá trị chi phí nhập kho', '=SUM(\'3. Tồn kho\'!F4:F50)', 'VNĐ', 'Tổng chi phí mua NVL'],
    ['Số mặt hàng cần nhập hàng gấp', '=COUNTIF(\'3. Tồn kho\'!I4:I50, "Cần nhập hàng")', 'Mặt hàng', 'Tồn kho <= Tồn tối thiểu'],
    ['Số mặt hàng tồn kho ở mức an toàn', '=COUNTIF(\'3. Tồn kho\'!I4:I50, "Tồn kho ở mức ổn")', 'Mặt hàng', 'Tồn kho > Tồn tối thiểu'],
    [],
    ['CHÍNH SÁCH VÀ KHUYẾN NGHỊ TỐI ƯU KHO VẬT TƯ:'],
    ['1. Điểm đặt hàng lại (Reorder Point):', 'Khi cột "Nhập mới" báo "Cần nhập hàng", kích hoạt lệnh mua ngay với NCC tương ứng.'],
    ['2. Quy tắc xuất kho FIFO (First In First Out):', 'Ưu tiên xuất lô có Hạn sử dụng gần nhất để giảm thiểu hao hụt hết hạn.'],
    ['3. Đàm phán thanh toán & Chiết khấu:', 'Tận dụng chính sách chiết khấu 3% từ NCC LIX và kiểm tra nghiêm ngặt MSDS từ SouthChem.'],
    ['4. Kiểm soát mức tồn an toàn:', 'Xem biểu đồ trực tiếp trên Web App để theo dõi biến động nhập/xuất thời gian thực.']
  ];

  // Sheet 5: Phân quyền
  const phanQuyenHeaders = [
    'Email Người dùng',
    'Họ và tên',
    'Vai trò (Role)',
    '1. Nhập hàng',
    '2. Xuất hàng',
    '3. Tồn kho',
    '4. Dashboard',
    '5. Phân quyền',
    '6. Data NCC',
    'Quy định phân quyền cột'
  ];

  const phanQuyenRows = users.map((u) => [
    u.email,
    u.fullName,
    u.roleName,
    u.sheets.nhap?.access === 'edit' ? 'Xem & Chỉnh sửa' : u.sheets.nhap?.access === 'view' ? 'Chỉ xem' : 'Không được xem',
    u.sheets.xuat?.access === 'edit' ? 'Xem & Chỉnh sửa' : u.sheets.xuat?.access === 'view' ? 'Chỉ xem' : 'Không được xem',
    u.sheets.tonKho?.access === 'edit' ? 'Xem & Chỉnh sửa' : u.sheets.tonKho?.access === 'view' ? 'Chỉ xem' : 'Không được xem',
    u.sheets.dashboard?.access === 'edit' ? 'Xem & Chỉnh sửa' : u.sheets.dashboard?.access === 'view' ? 'Chỉ xem' : 'Không được xem',
    u.sheets.phanQuyen?.access === 'edit' ? 'Xem & Chỉnh sửa' : u.sheets.phanQuyen?.access === 'view' ? 'Chỉ xem' : 'Không được xem',
    u.sheets.ncc?.access === 'edit' ? 'Xem & Chỉnh sửa' : u.sheets.ncc?.access === 'view' ? 'Chỉ xem' : 'Không được xem',
    u.role === 'warehouse_staff' ? 'Ẩn Đơn giá, Thành tiền và STK Ngân hàng' : 'Đầy đủ tất cả các cột'
  ]);

  // Sheet 6: Data NCC
  const nccHeaders = [
    'Tên NCC',
    'Người liên hệ',
    'Sđt',
    'Địa chỉ',
    'Thông tin NCC',
    'Tên Ngân hàng',
    'Stk Ngân hàng',
    'Ghi chú'
  ];

  const nccRows = suppliers.map((s) => [
    s.tenNCC,
    s.nguoiLienHe,
    s.sdt,
    s.diaChi,
    s.thongTinNCC,
    s.tenNganHang,
    s.stkNganHang,
    s.ghiChu || ''
  ]);

  // Batch update values
  const valueData = [
    {
      range: "'1. Nhập hàng'!A1:K100",
      values: [importHeaders, ...importRows]
    },
    {
      range: "'2. Xuất hàng'!A1:G100",
      values: [exportHeaders, ...exportRows]
    },
    {
      range: "'3. Tồn kho'!A1:I100",
      values: [...tonKhoHeaderRows, ...tonKhoDataRows]
    },
    {
      range: "'4. Dashboard'!A1:D30",
      values: dashboardRows
    },
    {
      range: "'5. Phân quyền'!A1:J50",
      values: [phanQuyenHeaders, ...phanQuyenRows]
    },
    {
      range: "'6. Data NCC'!A1:H100",
      values: [nccHeaders, ...nccRows]
    }
  ];

  const valuesBatchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueData
      })
    }
  );

  if (!valuesBatchRes.ok) {
    console.warn('Lỗi ghi dữ liệu batch vào Google Sheets:', await valuesBatchRes.text());
  }

  // 3. Format visual header colors, cell borders, and column widths
  try {
    const sheetObjects = sheetData.sheets || [];
    const requests: any[] = [];

    sheetObjects.forEach((sh: any) => {
      const sId = sh.properties.sheetId;
      const title = sh.properties.title;

      // Header row styling
      let headerBg = { red: 0.1, green: 0.2, blue: 0.35 }; // Navy slate
      if (title.includes('Nhập')) {
        headerBg = { red: 0.08, green: 0.38, blue: 0.28 }; // Deep Emerald
      } else if (title.includes('Xuất')) {
        headerBg = { red: 0.6, green: 0.2, blue: 0.1 }; // Brick Warm
      } else if (title.includes('Tồn kho')) {
        headerBg = { red: 0.15, green: 0.28, blue: 0.5 }; // Steel Blue
      } else if (title.includes('Dashboard')) {
        headerBg = { red: 0.25, green: 0.18, blue: 0.45 }; // Deep Indigo
      }

      const startRow = title.includes('Tồn kho') ? 2 : 0;
      const endRow = title.includes('Tồn kho') ? 3 : 1;

      requests.push({
        repeatCell: {
          range: {
            sheetId: sId,
            startRowIndex: startRow,
            endRowIndex: endRow
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: headerBg,
              textFormat: {
                bold: true,
                foregroundColor: { red: 1, green: 1, blue: 1 },
                fontSize: 10
              },
              horizontalAlignment: 'CENTER',
              verticalAlignment: 'MIDDLE'
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
        }
      });

      // Auto resize columns
      requests.push({
        autoResizeDimensions: {
          dimensions: {
            sheetId: sId,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: 12
          }
        }
      });
    });

    if (requests.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });
    }
  } catch (fmtErr) {
    console.warn('Formatting warning:', fmtErr);
  }

  return {
    spreadsheetId,
    spreadsheetUrl
  };
}

/**
 * Đọc dữ liệu từ Google Spreadsheet đã tạo để đồng bộ về app
 */
export async function fetchSpreadsheetRange(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<any[][]> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!res.ok) {
    throw new Error(`Không thể đọc dữ liệu Google Sheet: ${await res.text()}`);
  }

  const json = await res.json();
  return json.values || [];
}
