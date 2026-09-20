import React, { useState, useId } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight,
  Boxes
} from 'lucide-react';
import { ExportRecord, ImportRecord, SheetPermission, UserRole } from '../types/inventory';
import { formatDateTime, formatNumber } from '../utils/codeGenerator';

interface ExportSheetProps {
  exports: ExportRecord[];
  imports: ImportRecord[];
  onAddExport: (record: ExportRecord) => void;
  onDeleteExport: (id: string) => void;
  currentUserRole: UserRole;
  sheetPermission?: SheetPermission;
  inventoryMap: Map<string, { ten: string; dvt: string; tonKho: number }>;
}

export const ExportSheet: React.FC<ExportSheetProps> = ({
  exports,
  imports,
  onAddExport,
  onDeleteExport,
  currentUserRole,
  sheetPermission,
  inventoryMap
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Lấy danh sách mã hàng hóa duy nhất từ Sheet Nhập để tạo Dropdown
  const uniqueImportedCodes = Array.from(new Set(imports.map((i) => i.maHangHoa)));

  // Form State
  const [selectedCode, setSelectedCode] = useState(uniqueImportedCodes[0] || '');
  const [soLuongXuat, setSoLuongXuat] = useState<number | ''>(10);
  const [ghiChu, setGhiChu] = useState('');

  const uniqueId = useId();

  // Tự động truy xuất Tên hàng hóa và Đơn vị tính dựa vào Mã hàng hóa đã chọn
  const matchingItem = imports.find((i) => i.maHangHoa === selectedCode);
  const tenHangHoa = matchingItem?.tenHangHoa || '';
  const donViTinh = matchingItem?.donViTinh || '';
  const tonKhoHienTai = inventoryMap.get(selectedCode)?.tonKho ?? 0;

  const canEdit = sheetPermission?.access === 'edit';

  const isOverStock = typeof soLuongXuat === 'number' && soLuongXuat > tonKhoHienTai;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCode) {
      alert('Vui lòng chọn Mã hàng hóa từ danh sách đã nhập');
      return;
    }
    if (!soLuongXuat || soLuongXuat <= 0) {
      alert('Số lượng xuất phải lớn hơn 0');
      return;
    }
    if (isOverStock) {
      if (!window.confirm(`Cảnh báo: Số lượng xuất (${soLuongXuat}) vượt quá lượng tồn khả dụng (${tonKhoHienTai}). Bạn có chắc chắn muốn xuất kho?`)) {
        return;
      }
    }

    const newExport: ExportRecord = {
      id: `exp-${Date.now()}`,
      maHangHoa: selectedCode,
      tenHangHoa: tenHangHoa, // Dựa vào mã hàng hóa truy xuất ra
      donViTinh: donViTinh,   // Dựa vào mã hàng hóa truy xuất ra
      soLuongXuat: Number(soLuongXuat),
      ngayXuat: formatDateTime(new Date()), // Chạy tự động Theo thời gian hh:mm dd/mm/yyyy nhập liệu thực tế
      nguoiXuat: currentUserRole.email,     // Chạy ra user nhập liệu
      ghiChu: ghiChu.trim() || undefined
    };

    onAddExport(newExport);
    setGhiChu('');
    setSoLuongXuat(10);
    setShowAddForm(false);
  };

  const filteredExports = exports.filter((item) => {
    return (
      item.maHangHoa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tenHangHoa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nguoiXuat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.ghiChu && item.ghiChu.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Info & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">2. Sheet Xuất: Lịch Sử Xuất Hàng</h2>
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
              {exports.length} phiếu xuất
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Dropdown Mã hàng hóa từ Sheet Nhập &bull; Tự động truy xuất Tên hàng hóa &amp; ĐVT qua công thức &bull; Tự động thời gian &amp; người xuất
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showAddForm ? 'Đóng biểu mẫu' : 'Tạo Phiếu Xuất Kho'}
          </button>
        )}
      </div>

      {/* Form Tạo Phiếu Xuất */}
      {showAddForm && canEdit && (
        <form
          onSubmit={handleSubmit}
          className="bg-amber-50/40 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div className="flex items-center space-x-2 text-amber-900 font-bold">
              <ArrowUpRight className="w-5 h-5 text-amber-600" />
              <span>Xuất Nguyên Vật Liệu Ra Khỏi Kho</span>
            </div>
            <span className="text-xs text-amber-800 font-medium bg-amber-100 px-2.5 py-1 rounded-full">
              Người xuất: {currentUserRole.email}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mã hàng hóa Dropdown từ Sheet Nhập */}
            <div>
              <label htmlFor={`${uniqueId}-ma-xuat`} className="block text-xs font-semibold text-slate-700 mb-1">
                Mã Hàng Hóa (Dropdown từ Sheet Nhập) <span className="text-rose-500">*</span>
              </label>
              <select
                id={`${uniqueId}-ma-xuat`}
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-white font-mono font-bold text-amber-900 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                required
              >
                {uniqueImportedCodes.length === 0 && (
                  <option value="">Chưa có hàng hóa trong Sheet Nhập</option>
                )}
                {uniqueImportedCodes.map((code) => {
                  const item = imports.find((i) => i.maHangHoa === code);
                  return (
                    <option key={code} value={code}>
                      {code} - {item?.tenHangHoa}
                    </option>
                  );
                })}
              </select>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 px-1">
                <span>Tồn kho hiện tại:</span>
                <span className={`font-bold ${tonKhoHienTai <= 10 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {formatNumber(tonKhoHienTai)} {donViTinh}
                </span>
              </div>
            </div>

            {/* Tên hàng hóa (Tự động truy xuất) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên Hàng Hóa (Truy Xuất Tự Động)
              </label>
              <div className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-900 font-semibold text-sm">
                {tenHangHoa || '--- Chưa chọn mã ---'}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 italic">
                Công thức: =VLOOKUP(A_row, '1. Nhập hàng'!$A:$C, 2, FALSE)
              </p>
            </div>

            {/* Đơn vị tính (Tự động truy xuất) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Đơn Vị Tính (Truy Xuất Tự Động)
              </label>
              <div className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-sm">
                {donViTinh || '---'}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 italic">
                Công thức: =VLOOKUP(A_row, '1. Nhập hàng'!$A:$C, 3, FALSE)
              </p>
            </div>

            {/* Số lượng xuất (Chỉ cho nhập số) */}
            <div>
              <label htmlFor={`${uniqueId}-sl-xuat`} className="block text-xs font-semibold text-slate-700 mb-1">
                Số Lượng Xuất (Số) <span className="text-rose-500">*</span>
              </label>
              <input
                id={`${uniqueId}-sl-xuat`}
                type="number"
                min="1"
                step="any"
                value={soLuongXuat}
                onChange={(e) => setSoLuongXuat(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="Nhập số lượng..."
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-hidden ${
                  isOverStock 
                    ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-500 text-rose-900' 
                    : 'border-slate-300 bg-white focus:ring-2 focus:ring-amber-500'
                }`}
                required
              />
              {isOverStock && (
                <div className="flex items-center text-xs text-rose-600 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  Số lượng xuất vượt quá tồn kho khả dụng ({tonKhoHienTai})!
                </div>
              )}
            </div>

            {/* Ngày xuất tự động */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày Xuất (Tự Động)
              </label>
              <div className="flex items-center text-xs text-slate-600 bg-slate-100 px-3 py-2.5 rounded-xl border border-slate-200 font-mono">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                {formatDateTime(new Date())}
              </div>
            </div>

            {/* Ghi chú mục đích xuất */}
            <div>
              <label htmlFor={`${uniqueId}-ghi-chu`} className="block text-xs font-semibold text-slate-700 mb-1">
                Ghi Chú / Mục Đích Xuất
              </label>
              <input
                id={`${uniqueId}-ghi-chu`}
                type="text"
                value={ghiChu}
                onChange={(e) => setGhiChu(e.target.value)}
                placeholder="VD: Cấp phân xưởng 1, Đóng gói xuất khẩu..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors cursor-pointer"
            >
              <Boxes className="w-4 h-4 mr-1.5" />
              Lưu Phiếu Xuất Kho
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm theo Mã hàng hóa, Tên hàng, Người xuất, Ghi chú xuất..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
        />
      </div>

      {/* Table Lịch Sử Xuất Hàng */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3 px-4 border-b border-slate-800 whitespace-nowrap">Mã hàng hóa</th>
                <th className="py-3 px-4 border-b border-slate-800 whitespace-nowrap">Tên hàng hóa (VLOOKUP)</th>
                <th className="py-3 px-3 border-b border-slate-800 whitespace-nowrap text-center">ĐVT</th>
                <th className="py-3 px-4 border-b border-slate-800 whitespace-nowrap text-right">Số lượng xuất</th>
                <th className="py-3 px-4 border-b border-slate-800 whitespace-nowrap">Ngày xuất (Tự động)</th>
                <th className="py-3 px-4 border-b border-slate-800 whitespace-nowrap">Người xuất</th>
                <th className="py-3 px-4 border-b border-slate-800 whitespace-nowrap">Ghi chú</th>
                {canEdit && <th className="py-3 px-3 border-b border-slate-800 text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không tìm thấy phiếu xuất nào.
                  </td>
                </tr>
              ) : (
                filteredExports.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-800 whitespace-nowrap">
                      {item.maHangHoa}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {item.tenHangHoa}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 whitespace-nowrap">
                      {item.donViTinh}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-700 whitespace-nowrap">
                      {formatNumber(item.soLuongXuat)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      {item.ngayXuat}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] font-mono whitespace-nowrap">
                      {item.nguoiXuat}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {item.ghiChu || '---'}
                    </td>
                    {canEdit && (
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`Xóa phiếu xuất hàng ${item.maHangHoa} (${item.tenHangHoa})?`)) {
                              onDeleteExport(item.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Xóa phiếu xuất"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
