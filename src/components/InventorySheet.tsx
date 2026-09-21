import React, { useState, useId } from 'react';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  ShoppingBag, 
  Lock, 
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { ImportRecord, ExportRecord, SheetPermission, UserRole } from '../types/inventory';
import { formatVND, formatNumber } from '../utils/codeGenerator';

interface InventorySheetProps {
  imports: ImportRecord[];
  exports: ExportRecord[];
  minStocks: Record<string, number>;
  onUpdateMinStock: (maHangHoa: string, newMin: number) => void;
  currentUserRole: UserRole;
  sheetPermission?: SheetPermission;
  onNavigateToImportWithItem?: (maHangHoa: string, tenHangHoa: string) => void;
}

export const InventorySheet: React.FC<InventorySheetProps> = ({
  imports,
  exports,
  minStocks,
  onUpdateMinStock,
  currentUserRole,
  sheetPermission,
  onNavigateToImportWithItem
}) => {
  // Bộ lọc Từ ngày -> Đến ngày (Mặc định cả tháng 9/2026 hoặc toàn bộ thời gian)
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-30');
  const [filterStatus, setFilterStatus] = useState<'all' | 'reorder' | 'safe'>('all');
  const [editingMinCode, setEditingMinCode] = useState<string | null>(null);
  const [tempMinVal, setTempMinVal] = useState<number>(10);

  const uniqueId = useId();

  // Quyền chỉnh sửa: vai trò khách hoặc không có quyền edit thì CHỈ ĐƯỢC XEM, không được chỉnh sửa
  const isGuest = !currentUserRole || currentUserRole.role === 'guest' || currentUserRole.role === 'viewer';
  const canEdit = !isGuest && sheetPermission?.access === 'edit';

  // Kiểm tra quyền truy cập cột Chi phí nhập
  const isChiPhiHidden = sheetPermission?.columns?.chiPhiNhap === 'hidden';

  // Helper parse string date hh:mm dd/mm/yyyy -> Date object
  const parseRecordDate = (dateStr: string): Date | null => {
    try {
      const parts = dateStr.split(' ');
      const datePart = parts.length > 1 ? parts[1] : parts[0];
      const [d, m, y] = datePart.split('/').map(Number);
      return new Date(y, m - 1, d);
    } catch {
      return null;
    }
  };

  const startObj = startDate ? new Date(startDate) : null;
  const endObj = endDate ? new Date(endDate) : null;
  if (startObj) startObj.setHours(0, 0, 0, 0);
  if (endObj) endObj.setHours(23, 59, 59, 999);

  // Lấy danh sách Mã hàng hóa DUY NHẤT, KHÔNG TRÙNG LẶP
  const uniqueItemsMap = new Map<string, { ten: string; dvt: string; hsd?: string; conSuDung?: string }>();
  imports.forEach((item) => {
    if (!uniqueItemsMap.has(item.maHangHoa)) {
      uniqueItemsMap.set(item.maHangHoa, {
        ten: item.tenHangHoa,
        dvt: item.donViTinh,
        hsd: item.hanSuDung,
        conSuDung: item.conSuDung
      });
    }
  });

  // Tính toán Tồn kho động theo khoảng ngày đã chọn
  const inventoryList = Array.from(uniqueItemsMap.entries()).map(([maHangHoa, info]) => {
    // 1. Tổng nhập chạy theo ngày
    const filteredImports = imports.filter((imp) => {
      if (imp.maHangHoa !== maHangHoa) return false;
      if (!startObj && !endObj) return true;
      const recDate = parseRecordDate(imp.thoiGianNhap);
      if (!recDate) return true;
      if (startObj && recDate < startObj) return false;
      if (endObj && recDate > endObj) return false;
      return true;
    });

    const tongNhap = filteredImports.reduce((sum, item) => sum + item.soLuongNhap, 0);
    const chiPhiNhap = filteredImports.reduce((sum, item) => sum + item.thanhTien, 0);

    // 2. Tổng xuất chạy theo ngày
    const filteredExports = exports.filter((exp) => {
      if (exp.maHangHoa !== maHangHoa) return false;
      if (!startObj && !endObj) return true;
      const recDate = parseRecordDate(exp.ngayXuat);
      if (!recDate) return true;
      if (startObj && recDate < startObj) return false;
      if (endObj && recDate > endObj) return false;
      return true;
    });

    const tongXuat = filteredExports.reduce((sum, item) => sum + item.soLuongXuat, 0);

    // 3. Tồn kho = Tổng nhập - Tổng xuất
    const tonKho = tongNhap - tongXuat;
    const tonToiThieu = minStocks[maHangHoa] ?? 10;

    // 4. Nhập mới: Tồn kho <= tồn tối thiểu thì cần nhập hàng, Tồn kho > tồn tối thiểu thì tồn kho ở mức ổn
    const nhapMoi: 'Cần nhập hàng' | 'Tồn kho ở mức ổn' = 
      tonKho <= tonToiThieu ? 'Cần nhập hàng' : 'Tồn kho ở mức ổn';

    return {
      maHangHoa,
      tenHangHoa: info.ten,
      donViTinh: info.dvt,
      tongNhap,
      tongXuat,
      chiPhiNhap,
      tonKho,
      tonToiThieu,
      nhapMoi,
      hsd: info.hsd,
      conSuDung: info.conSuDung
    };
  });

  // Filter theo trạng thái Nhập mới
  const displayedInventory = inventoryList.filter((item) => {
    if (filterStatus === 'reorder') return item.nhapMoi === 'Cần nhập hàng';
    if (filterStatus === 'safe') return item.nhapMoi === 'Tồn kho ở mức ổn';
    return true;
  });

  const totalNhapCount = displayedInventory.reduce((acc, cur) => acc + cur.tongNhap, 0);
  const totalXuatCount = displayedInventory.reduce((acc, cur) => acc + cur.tongXuat, 0);
  const totalTonCount = displayedInventory.reduce((acc, cur) => acc + cur.tonKho, 0);
  const totalChiPhi = displayedInventory.reduce((acc, cur) => acc + cur.chiPhiNhap, 0);
  const needReorderCount = displayedInventory.filter((i) => i.nhapMoi === 'Cần nhập hàng').length;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">3. Sheet Tồn Kho: Báo Cáo Tồn Kho Theo Ngày</h2>
              <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
                {displayedInventory.length} mã nguyên vật liệu
              </span>
              {!canEdit && (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-2.5 py-0.5 rounded-full font-semibold inline-flex items-center">
                  <Lock className="w-3 h-3 mr-1 text-amber-700" />
                  Chỉ xem (Không có quyền chỉnh sửa)
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Mã hàng hóa duy nhất &bull; Tổng nhập, Tổng xuất, Chi phí chạy theo ngày &bull; Tồn kho = Nhập - Xuất &bull; Tự động cảnh báo Nhập mới
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
            <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
              Tổng tồn: <span className="font-bold text-slate-900">{formatNumber(totalTonCount)}</span>
            </div>
            <div className={`px-2.5 py-1 rounded-lg border font-semibold ${
              needReorderCount > 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              {needReorderCount > 0 ? `Cần nhập: ${needReorderCount} mã` : 'Tất cả đạt định mức an toàn'}
            </div>
          </div>
        </div>

        {/* BỘ LỌC TỪ NGÀY ĐẾN NGÀY */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-700">Bộ lọc thời gian:</span>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor={`${uniqueId}-tu-ngay`} className="text-slate-500">Từ ngày:</label>
            <input
              id={`${uniqueId}-tu-ngay`}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor={`${uniqueId}-den-ngay`} className="text-slate-500">Đến ngày:</label>
            <input
              id={`${uniqueId}-den-ngay`}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => {
                setStartDate('2026-09-01');
                setEndDate('2026-09-30');
              }}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Tháng 9/2026
            </button>
            <button
              onClick={() => {
                setStartDate('2026-01-01');
                setEndDate('2026-12-31');
              }}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Cả năm 2026
            </button>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Toàn bộ thời gian
            </button>
          </div>

          {/* Filter Status Switcher */}
          <div className="ml-auto flex items-center bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({inventoryList.length})
            </button>
            <button
              onClick={() => setFilterStatus('reorder')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filterStatus === 'reorder' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              Cần nhập hàng ({inventoryList.filter((i) => i.nhapMoi === 'Cần nhập hàng').length})
            </button>
            <button
              onClick={() => setFilterStatus('safe')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filterStatus === 'safe' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              Mức ổn ({inventoryList.filter((i) => i.nhapMoi === 'Tồn kho ở mức ổn').length})
            </button>
          </div>
        </div>
      </div>

      {/* Table Tồn Kho */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3.5 px-4 border-b border-slate-800 whitespace-nowrap">Mã hàng hóa (Duy nhất)</th>
                <th className="py-3.5 px-4 border-b border-slate-800 whitespace-nowrap">Tên hàng hóa</th>
                <th className="py-3.5 px-3 border-b border-slate-800 whitespace-nowrap text-center">ĐVT</th>
                <th className="py-3.5 px-4 border-b border-slate-800 whitespace-nowrap text-right">Tổng nhập (Theo ngày)</th>
                <th className="py-3.5 px-4 border-b border-slate-800 whitespace-nowrap text-right">Tổng xuất (Theo ngày)</th>
                <th className="py-3.5 px-4 border-b border-slate-800 whitespace-nowrap text-right">
                  {isChiPhiHidden ? (
                    <span className="inline-flex items-center text-slate-400">
                      <Lock className="w-3 h-3 mr-1" /> Chi phí nhập
                    </span>
                  ) : (
                    'Chi phí nhập (Theo ngày)'
                  )}
                </th>
                <th className="py-3.5 px-4 border-b border-slate-800 whitespace-nowrap text-right font-bold text-emerald-400">
                  Tồn kho (Nhập - Xuất)
                </th>
                <th className="py-3.5 px-4 border-b border-slate-800 whitespace-nowrap text-right">Tồn tối thiểu</th>
                <th className="py-3.5 px-4 border-b border-slate-800 whitespace-nowrap text-center">Nhập mới (Cảnh báo)</th>
                <th className="py-3.5 px-4 border-b border-slate-800 whitespace-nowrap text-center">Hạn sử dụng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedInventory.map((item) => {
                const isReorder = item.nhapMoi === 'Cần nhập hàng';
                const isEditingMin = editingMinCode === item.maHangHoa;

                return (
                  <tr 
                    key={item.maHangHoa} 
                    className={`transition-colors ${isReorder ? 'bg-rose-50/30 hover:bg-rose-50/60' : 'hover:bg-slate-50'}`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {item.maHangHoa}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {item.tenHangHoa}
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-600 whitespace-nowrap">
                      {item.donViTinh}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-700 whitespace-nowrap font-medium">
                      {formatNumber(item.tongNhap)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-700 whitespace-nowrap font-medium">
                      {formatNumber(item.tongXuat)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-700 whitespace-nowrap font-medium">
                      {isChiPhiHidden ? (
                        <span className="text-slate-400 italic">*** Đã ẩn</span>
                      ) : (
                        formatVND(item.chiPhiNhap)
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className={`font-extrabold text-sm ${isReorder ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {formatNumber(item.tonKho)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {canEdit ? (
                        isEditingMin ? (
                          <div className="inline-flex items-center space-x-1">
                            <input
                              type="number"
                              value={tempMinVal}
                              onChange={(e) => setTempMinVal(Number(e.target.value))}
                              className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-right text-xs"
                            />
                            <button
                              onClick={() => {
                                onUpdateMinStock(item.maHangHoa, tempMinVal);
                                setEditingMinCode(null);
                              }}
                              className="text-emerald-600 hover:text-emerald-700 font-bold px-1"
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingMinCode(item.maHangHoa);
                              setTempMinVal(item.tonToiThieu);
                            }}
                            className="group inline-flex items-center text-slate-700 hover:text-blue-600 cursor-pointer"
                            title="Bấm để sửa định mức tồn tối thiểu"
                          >
                            <span>{formatNumber(item.tonToiThieu)}</span>
                            <SlidersHorizontal className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
                          </button>
                        )
                      ) : (
                        <span className="font-medium text-slate-700">{formatNumber(item.tonToiThieu)}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isReorder ? (
                        <div className="inline-flex items-center space-x-1.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600 animate-pulse" />
                            Cần nhập hàng
                          </span>
                          {canEdit && onNavigateToImportWithItem && (
                            <button
                              onClick={() => onNavigateToImportWithItem(item.maHangHoa, item.tenHangHoa)}
                              className="p-1 text-rose-600 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                              title="Tạo phiếu nhập hàng ngay"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Tồn kho ở mức ổn
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {item.conSuDung === 'Hết hạn sử dụng' ? (
                        <span className="text-rose-600 font-bold bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                          Hết hạn ({item.hsd})
                        </span>
                      ) : item.hsd ? (
                        <span className="text-slate-600 text-[11px]">{item.hsd}</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Không có</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Tổng kết dòng cuối */}
            <tfoot>
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <td colSpan={3} className="py-3 px-4 uppercase text-xs tracking-wider">
                  Tổng cộng ({displayedInventory.length} mã)
                </td>
                <td className="py-3 px-4 text-right text-xs">{formatNumber(totalNhapCount)}</td>
                <td className="py-3 px-4 text-right text-xs">{formatNumber(totalXuatCount)}</td>
                <td className="py-3 px-4 text-right text-xs text-emerald-800">
                  {isChiPhiHidden ? '***' : formatVND(totalChiPhi)}
                </td>
                <td className="py-3 px-4 text-right text-sm text-emerald-700">{formatNumber(totalTonCount)}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
