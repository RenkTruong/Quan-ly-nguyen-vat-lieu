import React, { useState, useId } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Lock,
  Filter,
  PackageCheck
} from 'lucide-react';
import { ImportRecord, Supplier, SheetPermission, UserRole } from '../types/inventory';
import { generateProductCode, formatDateTime, formatVND, checkExpiryStatus, formatNumber } from '../utils/codeGenerator';

interface ImportSheetProps {
  imports: ImportRecord[];
  suppliers: Supplier[];
  onAddImport: (newRecord: ImportRecord) => void;
  onDeleteImport: (id: string) => void;
  currentUserRole: UserRole;
  sheetPermission?: SheetPermission;
  onSelectSupplierForReorder?: (nccName: string) => void;
}

export const ImportSheet: React.FC<ImportSheetProps> = ({
  imports,
  suppliers,
  onAddImport,
  onDeleteImport,
  currentUserRole,
  sheetPermission
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [tenHangHoa, setTenHangHoa] = useState('');
  const [autoCode, setAutoCode] = useState('LL-BG-0001');
  const [donViTinh, setDonViTinh] = useState('Bao 25kg');
  const [soLuongNhap, setSoLuongNhap] = useState<number | ''>(100);
  const [donGiaNhap, setDonGiaNhap] = useState<number | ''>(250000);
  const [hanSuDung, setHanSuDung] = useState('');
  const [ncc, setNcc] = useState(suppliers[0]?.tenNCC || '');

  const uniqueId = useId();

  // Kiểm tra quyền: edit = toàn quyền, create = chỉ thêm mới (không sửa/xóa)
  const canEdit = sheetPermission?.access === 'edit';
  const canCreate = sheetPermission?.access === 'edit' || sheetPermission?.access === 'create';
  // Quyền bảo mật dữ liệu cấp Cột: Ẩn cột đơn giá & thành tiền theo phân quyền tài khoản chỉ định
  const isDonGiaHidden = sheetPermission?.columns?.donGiaNhap === 'hidden';
  const isThanhTienHidden = sheetPermission?.columns?.thanhTien === 'hidden';

  // Khi người dùng gõ Tên hàng hóa -> Tự động sinh mã hàng hóa theo quy ước
  const handleTenHangHoaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTenHangHoa(val);
    const existingCodes = imports.map((i) => i.maHangHoa);
    const generated = generateProductCode(val, existingCodes);
    setAutoCode(generated);
  };

  // Tính Thành tiền tự động = Số lượng * Đơn giá
  const thanhTien = (typeof soLuongNhap === 'number' && typeof donGiaNhap === 'number') 
    ? soLuongNhap * donGiaNhap 
    : 0;

  // Tính trạng thái Còn sử dụng tự động
  const conSuDung = checkExpiryStatus(hanSuDung);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      alert('Tài khoản của bạn không có quyền thêm phiếu nhập!');
      return;
    }
    if (!tenHangHoa.trim()) {
      alert('Vui lòng nhập Tên hàng hóa');
      return;
    }
    if (!soLuongNhap || soLuongNhap <= 0) {
      alert('Số lượng nhập phải lớn hơn 0');
      return;
    }

    const newRecord: ImportRecord = {
      id: `imp-${Date.now()}`,
      maHangHoa: autoCode,
      tenHangHoa: tenHangHoa.trim(),
      donViTinh: donViTinh.trim() || 'Cái',
      soLuongNhap: Number(soLuongNhap),
      donGiaNhap: Number(donGiaNhap || 0),
      thanhTien: Number(soLuongNhap) * Number(donGiaNhap || 0),
      thoiGianNhap: formatDateTime(new Date()), // Tự động chạy theo thời gian thực tế hh:mm dd/mm/yyyy
      hanSuDung: hanSuDung || undefined,
      conSuDung: conSuDung,
      ncc: ncc || (suppliers[0]?.tenNCC ?? 'NCC Mặc định'),
      nguoiNhap: currentUserRole.email // Chạy ra user nhập liệu
    };

    onAddImport(newRecord);
    setTenHangHoa('');
    setSoLuongNhap(100);
    setDonGiaNhap(250000);
    setHanSuDung('');
    setShowAddForm(false);
  };

  const filteredImports = imports.filter((item) => {
    const matchSearch =
      item.maHangHoa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tenHangHoa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ncc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nguoiNhap.toLowerCase().includes(searchTerm.toLowerCase());
    const matchNcc = !filterSupplier || item.ncc === filterSupplier;
    return matchSearch && matchNcc;
  });

  return (
    <div className="space-y-6">
      {/* Header Info & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">1. Sheet Nhập: Lịch Sử Nhập Hàng</h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
              {imports.length} phiếu nhập
            </span>
            {sheetPermission?.access === 'create' && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                Quyền: Chỉ thêm mới (Không sửa / xóa phiếu đã tạo)
              </span>
            )}
            {(isDonGiaHidden || isThanhTienHidden) && (
              <span className="bg-rose-100 text-rose-800 border border-rose-300 text-xs px-2.5 py-0.5 rounded-full font-semibold inline-flex items-center">
                <Lock className="w-3 h-3 mr-1 text-rose-600" />
                Bảo mật: Đã ẩn Đơn giá &amp; Thành tiền
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Quy chuẩn mã <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-700 font-semibold font-mono text-xs">LL-[2 chữ cái đầu]-[4 số]</code> (Vd: Bột giặt Omo &rarr; LL-BG-0001) &bull; Tự động thời gian &amp; user nhập
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showAddForm ? 'Đóng biểu mẫu' : 'Thêm Phiếu Nhập Mới'}
          </button>
        )}
      </div>

      {/* Form Thêm Phiếu Nhập */}
      {showAddForm && canCreate && (
        <form
          onSubmit={handleSubmit}
          className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div className="flex items-center space-x-2 text-emerald-900 font-bold">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>Nhập Nguyên Vật Liệu Mới Vào Kho</span>
            </div>
            <span className="text-xs text-emerald-700 font-medium bg-emerald-100/70 px-2.5 py-1 rounded-full">
              Người nhập: {currentUserRole.email} ({currentUserRole.fullName})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Tên hàng hóa */}
            <div className="md:col-span-2">
              <label htmlFor={`${uniqueId}-ten`} className="block text-xs font-semibold text-slate-700 mb-1">
                Tên Hàng Hóa <span className="text-rose-500">*</span>
              </label>
              <input
                id={`${uniqueId}-ten`}
                type="text"
                value={tenHangHoa}
                onChange={handleTenHangHoaChange}
                placeholder="VD: Bột giặt Omo, Xi măng Hà Tiên, Hạt nhựa PP..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Mã hàng hóa tự động sinh */}
            <div>
              <label htmlFor={`${uniqueId}-ma`} className="block text-xs font-semibold text-slate-700 mb-1">
                Mã Hàng Hóa (Tự Động Quy Ước)
              </label>
              <div className="relative">
                <input
                  id={`${uniqueId}-ma`}
                  type="text"
                  value={autoCode}
                  onChange={(e) => setAutoCode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-100/50 text-emerald-900 font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <span className="absolute right-2.5 top-2 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-200/80 px-1.5 py-0.5 rounded">
                  4 Chữ - 4 Số
                </span>
              </div>
            </div>

            {/* Đơn vị tính */}
            <div>
              <label htmlFor={`${uniqueId}-dvt`} className="block text-xs font-semibold text-slate-700 mb-1">
                Đơn Vị Tính
              </label>
              <input
                id={`${uniqueId}-dvt`}
                type="text"
                value={donViTinh}
                onChange={(e) => setDonViTinh(e.target.value)}
                placeholder="Bao 25kg, Tấn, Phuy, Can..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Số lượng nhập (Chỉ cho nhập số) */}
            <div>
              <label htmlFor={`${uniqueId}-sl`} className="block text-xs font-semibold text-slate-700 mb-1">
                Số Lượng Nhập (Số) <span className="text-rose-500">*</span>
              </label>
              <input
                id={`${uniqueId}-sl`}
                type="number"
                min="1"
                step="any"
                value={soLuongNhap}
                onChange={(e) => setSoLuongNhap(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="Chỉ nhập số..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Đơn giá nhập */}
            {!isDonGiaHidden ? (
              <div>
                <label htmlFor={`${uniqueId}-dg`} className="block text-xs font-semibold text-slate-700 mb-1">
                  Đơn Giá Nhập (VNĐ)
                </label>
                <input
                  id={`${uniqueId}-dg`}
                  type="number"
                  min="0"
                  step="1000"
                  value={donGiaNhap}
                  onChange={(e) => setDonGiaNhap(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="Đơn giá..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Đơn Giá Nhập
                </label>
                <div className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 font-mono text-xs flex items-center justify-between">
                  <span>***</span>
                  <span className="text-[10px] text-slate-400 italic">Bảo mật tài khoản</span>
                </div>
              </div>
            )}

            {/* Thành tiền (Số lượng * Đơn giá) */}
            {!isThanhTienHidden ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thành Tiền (Tự Tính SL * ĐG)
                </label>
                <div className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-800 font-bold text-sm">
                  {formatVND(thanhTien)}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Thành Tiền
                </label>
                <div className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 font-mono text-xs flex items-center justify-between">
                  <span>***</span>
                  <span className="text-[10px] text-slate-400 italic">Bảo mật tài khoản</span>
                </div>
              </div>
            )}

            {/* Nhà cung cấp (Chọn từ Sheet Data NCC) */}
            <div>
              <label htmlFor={`${uniqueId}-ncc`} className="block text-xs font-semibold text-slate-700 mb-1">
                Nhà Cung Cấp (Dựa trên Sheet Data NCC)
              </label>
              <select
                id={`${uniqueId}-ncc`}
                value={ncc}
                onChange={(e) => setNcc(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.tenNCC}>
                    {s.tenNCC}
                  </option>
                ))}
              </select>
            </div>

            {/* Hạn sử dụng */}
            <div>
              <label htmlFor={`${uniqueId}-hsd`} className="block text-xs font-semibold text-slate-700 mb-1">
                Hạn Sử Dụng (Nếu có)
              </label>
              <input
                id={`${uniqueId}-hsd`}
                type="date"
                value={hanSuDung}
                onChange={(e) => setHanSuDung(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Trạng thái Còn sử dụng */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Còn Sử Dụng (Dựa vào HSD)
              </label>
              <div className="flex items-center h-[38px]">
                {conSuDung === 'Còn sử dụng' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Còn sử dụng
                  </span>
                )}
                {conSuDung === 'Hết hạn sử dụng' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    Hết hạn sử dụng
                  </span>
                )}
                {conSuDung === 'Không thời hạn' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    Không thời hạn
                  </span>
                )}
              </div>
            </div>

            {/* Thời gian nhập tự động */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thời Gian Nhập
              </label>
              <div className="flex items-center text-xs text-slate-600 bg-slate-100 px-3 py-2.5 rounded-xl border border-slate-200 font-mono">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                {formatDateTime(new Date())} (Tự động)
              </div>
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
              className="inline-flex items-center px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors cursor-pointer"
            >
              <PackageCheck className="w-4 h-4 mr-1.5" />
              Lưu Phiếu Nhập Kho
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Mã hàng hóa, Tên nguyên vật liệu, NCC, Người nhập..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>
        <div className="sm:w-64 relative">
          <Filter className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="">Tất cả Nhà Cung Cấp</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.tenNCC}>
                {s.tenNCC}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Lịch Sử Nhập Hàng */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3 px-3.5 border-b border-slate-800 whitespace-nowrap">Mã hàng hóa</th>
                <th className="py-3 px-3.5 border-b border-slate-800 whitespace-nowrap">Tên hàng hóa</th>
                <th className="py-3 px-3 border-b border-slate-800 whitespace-nowrap text-center">ĐVT</th>
                <th className="py-3 px-3.5 border-b border-slate-800 whitespace-nowrap text-right">SL Nhập</th>
                <th className="py-3 px-3.5 border-b border-slate-800 whitespace-nowrap text-right">
                  {isDonGiaHidden ? (
                    <span className="inline-flex items-center text-slate-400">
                      <Lock className="w-3 h-3 mr-1" /> Đơn giá
                    </span>
                  ) : (
                    'Đơn giá nhập'
                  )}
                </th>
                <th className="py-3 px-3.5 border-b border-slate-800 whitespace-nowrap text-right">
                  {isThanhTienHidden ? (
                    <span className="inline-flex items-center text-slate-400">
                      <Lock className="w-3 h-3 mr-1" /> Thành tiền
                    </span>
                  ) : (
                    'Thành tiền (SL*ĐG)'
                  )}
                </th>
                <th className="py-3 px-3.5 border-b border-slate-800 whitespace-nowrap">Thời gian nhập</th>
                <th className="py-3 px-3.5 border-b border-slate-800 whitespace-nowrap">Hạn sử dụng</th>
                <th className="py-3 px-3.5 border-b border-slate-800 whitespace-nowrap text-center">Còn sử dụng</th>
                <th className="py-3 px-3.5 border-b border-slate-800 whitespace-nowrap">Nhà cung cấp</th>
                <th className="py-3 px-3.5 border-b border-slate-800 whitespace-nowrap">Người nhập</th>
                {canEdit && <th className="py-3 px-3 border-b border-slate-800 text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredImports.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    Không tìm thấy phiếu nhập nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredImports.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-emerald-800 whitespace-nowrap">
                      {item.maHangHoa}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      {item.tenHangHoa}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 whitespace-nowrap">
                      {item.donViTinh}
                    </td>
                    <td className="py-3 px-3.5 text-right font-bold text-slate-800 whitespace-nowrap">
                      {formatNumber(item.soLuongNhap)}
                    </td>
                    <td className="py-3 px-3.5 text-right text-slate-700 whitespace-nowrap">
                      {isDonGiaHidden ? (
                        <span className="text-slate-400 italic">*** Đã ẩn</span>
                      ) : (
                        formatVND(item.donGiaNhap)
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right font-bold text-emerald-700 whitespace-nowrap">
                      {isThanhTienHidden ? (
                        <span className="text-slate-400 italic">*** Đã ẩn</span>
                      ) : (
                        formatVND(item.thanhTien)
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      {item.thoiGianNhap}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                      {item.hanSuDung ? (
                        <span className="inline-flex items-center text-xs">
                          <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                          {item.hanSuDung}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Không có HSD</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      {item.conSuDung === 'Còn sử dụng' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Còn sử dụng
                        </span>
                      ) : item.conSuDung === 'Hết hạn sử dụng' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Hết hạn sử dụng
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Vô thời hạn</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 max-w-xs truncate" title={item.ncc}>
                      {item.ncc}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 text-[11px] font-mono whitespace-nowrap">
                      {item.nguoiNhap}
                    </td>
                    {canEdit && (
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`Xóa phiếu nhập hàng ${item.maHangHoa} (${item.tenHangHoa})?`)) {
                              onDeleteImport(item.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Xóa phiếu nhập"
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
