import React, { useState, useId } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Building2, 
  Phone, 
  MapPin, 
  CreditCard, 
  Copy, 
  Check, 
  Lock,
  ExternalLink
} from 'lucide-react';
import { Supplier, SheetPermission, UserRole } from '../types/inventory';

interface SupplierSheetProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  currentUserRole: UserRole;
  sheetPermission?: SheetPermission;
}

export const SupplierSheet: React.FC<SupplierSheetProps> = ({
  suppliers,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  sheetPermission
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [tenNCC, setTenNCC] = useState('');
  const [nguoiLienHe, setNguoiLienHe] = useState('');
  const [sdt, setSdt] = useState('');
  const [diaChi, setDiaChi] = useState('');
  const [thongTinNCC, setThongTinNCC] = useState('');
  const [tenNganHang, setTenNganHang] = useState('');
  const [stkNganHang, setStkNganHang] = useState('');
  const [ghiChu, setGhiChu] = useState('');

  const uniqueId = useId();

  const canEdit = sheetPermission?.access === 'edit';
  const isStkHidden = sheetPermission?.columns?.stkNganHang === 'hidden';

  const openAddModal = () => {
    setEditingSupplier(null);
    setTenNCC('');
    setNguoiLienHe('');
    setSdt('');
    setDiaChi('');
    setThongTinNCC('');
    setTenNganHang('');
    setStkNganHang('');
    setGhiChu('');
    setShowModal(true);
  };

  const openEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setTenNCC(sup.tenNCC);
    setNguoiLienHe(sup.nguoiLienHe);
    setSdt(sup.sdt);
    setDiaChi(sup.diaChi);
    setThongTinNCC(sup.thongTinNCC);
    setTenNganHang(sup.tenNganHang);
    setStkNganHang(sup.stkNganHang);
    setGhiChu(sup.ghiChu || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenNCC.trim()) {
      alert('Vui lòng nhập Tên Nhà Cung Cấp');
      return;
    }

    if (editingSupplier) {
      onUpdateSupplier({
        ...editingSupplier,
        tenNCC: tenNCC.trim(),
        nguoiLienHe: nguoiLienHe.trim(),
        sdt: sdt.trim(),
        diaChi: diaChi.trim(),
        thongTinNCC: thongTinNCC.trim(),
        tenNganHang: tenNganHang.trim(),
        stkNganHang: stkNganHang.trim(),
        ghiChu: ghiChu.trim() || undefined
      });
    } else {
      const newSup: Supplier = {
        id: `ncc-${Date.now()}`,
        tenNCC: tenNCC.trim(),
        nguoiLienHe: nguoiLienHe.trim(),
        sdt: sdt.trim(),
        diaChi: diaChi.trim(),
        thongTinNCC: thongTinNCC.trim(),
        tenNganHang: tenNganHang.trim(),
        stkNganHang: stkNganHang.trim(),
        ghiChu: ghiChu.trim() || undefined
      };
      onAddSupplier(newSup);
    }

    setShowModal(false);
  };

  const handleCopyStk = (stk: string, id: string) => {
    navigator.clipboard.writeText(stk);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSuppliers = suppliers.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.tenNCC.toLowerCase().includes(q) ||
      item.nguoiLienHe.toLowerCase().includes(q) ||
      item.sdt.toLowerCase().includes(q) ||
      item.diaChi.toLowerCase().includes(q) ||
      item.thongTinNCC.toLowerCase().includes(q) ||
      item.tenNganHang.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Info & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">6. Sheet Data NCC: Danh Bạ Nhà Cung Cấp</h2>
            <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
              {suppliers.length} đối tác
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Đầy đủ 8 trường thông tin chuẩn hóa &bull; Dữ liệu nguồn để chọn NCC tự động trên Sheet Nhập hàng
          </p>
        </div>

        {canEdit && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm Nhà Cung Cấp Mới
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm kiếm Nhà cung cấp theo Tên, Người liên hệ, SĐT, Địa chỉ, Ngân hàng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
        />
      </div>

      {/* Table Data NCC */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3 px-3.5 border-b border-slate-800 whitespace-nowrap">Tên NCC</th>
                <th className="py-3 px-3.5 border-b border-slate-800 whitespace-nowrap">Người liên hệ</th>
                <th className="py-3 px-3.5 border-b border-slate-800 whitespace-nowrap">Sđt</th>
                <th className="py-3 px-3.5 border-b border-slate-800 whitespace-nowrap">Địa chỉ</th>
                <th className="py-3 px-3.5 border-b border-slate-800 whitespace-nowrap">Thông tin NCC</th>
                <th className="py-3 px-3.5 border-b border-slate-800 whitespace-nowrap">Tên Ngân hàng</th>
                <th className="py-3 px-3.5 border-b border-slate-800 whitespace-nowrap">
                  {isStkHidden ? (
                    <span className="inline-flex items-center text-slate-400">
                      <Lock className="w-3 h-3 mr-1" /> Stk Ngân hàng
                    </span>
                  ) : (
                    'Stk Ngân hàng'
                  )}
                </th>
                <th className="py-3 px-3.5 border-b border-slate-800 whitespace-nowrap">Ghi chú</th>
                {canEdit && <th className="py-3 px-3 border-b border-slate-800 text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Không tìm thấy nhà cung cấp nào.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap flex items-center">
                      <Building2 className="w-3.5 h-3.5 mr-1.5 text-teal-600 shrink-0" />
                      {item.tenNCC}
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap font-medium">
                      {item.nguoiLienHe}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <a
                        href={`tel:${item.sdt}`}
                        className="inline-flex items-center text-teal-700 hover:text-teal-900 font-mono"
                      >
                        <Phone className="w-3 h-3 mr-1 text-teal-500" />
                        {item.sdt}
                      </a>
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 max-w-xs truncate" title={item.diaChi}>
                      <span className="inline-flex items-center">
                        <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                        {item.diaChi}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 max-w-xs truncate" title={item.thongTinNCC}>
                      {item.thongTinNCC}
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap">
                      {item.tenNganHang}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {isStkHidden ? (
                        <span className="text-slate-400 italic">*** Đã ẩn</span>
                      ) : (
                        <div className="inline-flex items-center space-x-1 font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          <span>{item.stkNganHang}</span>
                          <button
                            onClick={() => handleCopyStk(item.stkNganHang, item.id)}
                            className="text-slate-400 hover:text-teal-600 ml-1 p-0.5"
                            title="Sao chép số tài khoản"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 text-[11px] max-w-xs truncate" title={item.ghiChu}>
                      {item.ghiChu || '---'}
                    </td>
                    {canEdit && (
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1 text-slate-400 hover:text-teal-600 rounded transition-colors"
                            title="Sửa thông tin NCC"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Xóa nhà cung cấp "${item.tenNCC}" khỏi danh bạ?`)) {
                                onDeleteSupplier(item.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Xóa NCC"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Sửa NCC */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-teal-600" />
                {editingSupplier ? 'Chỉnh Sửa Thông Tin Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor={`${uniqueId}-tenncc`} className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên NCC <span className="text-rose-500">*</span>
                </label>
                <input
                  id={`${uniqueId}-tenncc`}
                  type="text"
                  value={tenNCC}
                  onChange={(e) => setTenNCC(e.target.value)}
                  placeholder="Công ty CP / TNHH..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${uniqueId}-nguoilh`} className="block text-xs font-semibold text-slate-700 mb-1">
                    Người Liên Hệ
                  </label>
                  <input
                    id={`${uniqueId}-nguoilh`}
                    type="text"
                    value={nguoiLienHe}
                    onChange={(e) => setNguoiLienHe(e.target.value)}
                    placeholder="Họ và tên..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label htmlFor={`${uniqueId}-sdt`} className="block text-xs font-semibold text-slate-700 mb-1">
                    Sđt
                  </label>
                  <input
                    id={`${uniqueId}-sdt`}
                    type="text"
                    value={sdt}
                    onChange={(e) => setSdt(e.target.value)}
                    placeholder="09xx xxx xxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`${uniqueId}-diachi`} className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa Chỉ
                </label>
                <input
                  id={`${uniqueId}-diachi`}
                  type="text"
                  value={diaChi}
                  onChange={(e) => setDiaChi(e.target.value)}
                  placeholder="Khu công nghiệp, Quận/Huyện, Tỉnh/TP..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor={`${uniqueId}-thongtin`} className="block text-xs font-semibold text-slate-700 mb-1">
                  Thông Tin NCC
                </label>
                <input
                  id={`${uniqueId}-thongtin`}
                  type="text"
                  value={thongTinNCC}
                  onChange={(e) => setThongTinNCC(e.target.value)}
                  placeholder="Lĩnh vực kinh doanh, nguyên vật liệu cung ứng chủ đạo..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${uniqueId}-tennh`} className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên Ngân Hàng
                  </label>
                  <input
                    id={`${uniqueId}-tennh`}
                    type="text"
                    value={tenNganHang}
                    onChange={(e) => setTenNganHang(e.target.value)}
                    placeholder="Vietcombank, BIDV, Techcombank..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label htmlFor={`${uniqueId}-stknh`} className="block text-xs font-semibold text-slate-700 mb-1">
                    Stk Ngân Hàng
                  </label>
                  <input
                    id={`${uniqueId}-stknh`}
                    type="text"
                    value={stkNganHang}
                    onChange={(e) => setStkNganHang(e.target.value)}
                    placeholder="Số tài khoản..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`${uniqueId}-ghichu`} className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi Chú
                </label>
                <textarea
                  id={`${uniqueId}-ghichu`}
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                  placeholder="Chính sách chiết khấu, thời hạn thanh toán..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                >
                  {editingSupplier ? 'Lưu Thay Đổi' : 'Thêm Nhà Cung Cấp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
