import React, { useState, useId } from 'react';
import { 
  Users, 
  Shield, 
  Eye, 
  Edit3, 
  EyeOff, 
  UserCheck, 
  Plus, 
  Lock,
  Sparkles
} from 'lucide-react';
import { UserRole, PermissionLevel } from '../types/inventory';

interface PermissionsSheetProps {
  users: UserRole[];
  currentUserRole: UserRole;
  onUpdateUserRole: (updatedUser: UserRole) => void;
  onAddUser: (newUser: UserRole) => void;
  onSelectActiveRole: (role: UserRole) => void;
}

export const PermissionsSheet: React.FC<PermissionsSheetProps> = ({
  users,
  currentUserRole,
  onUpdateUserRole,
  onAddUser,
  onSelectActiveRole
}) => {
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>(users[0]?.email || '');
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Form add user
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'warehouse_manager' | 'warehouse_staff' | 'accountant' | 'viewer'>('warehouse_staff');

  const uniqueId = useId();

  const selectedUser = users.find((u) => u.email === selectedUserEmail) || users[0];
  const isAdmin = currentUserRole.role === 'admin';

  const sheetKeys = [
    { key: 'nhap', label: '1. Nhập hàng' },
    { key: 'xuat', label: '2. Xuất hàng' },
    { key: 'tonKho', label: '3. Tồn kho' },
    { key: 'dashboard', label: '4. Dashboard' },
    { key: 'phanQuyen', label: '5. Phân quyền' },
    { key: 'ncc', label: '6. Data NCC' }
  ];

  // Handler cập nhật quyền cấp Sheet
  const handleSheetAccessChange = (sheetKey: string, level: PermissionLevel) => {
    if (!selectedUser) return;
    const updatedUser: UserRole = {
      ...selectedUser,
      sheets: {
        ...selectedUser.sheets,
        [sheetKey]: {
          ...(selectedUser.sheets[sheetKey] || { sheetId: sheetKey, sheetName: sheetKey, columns: {} }),
          access: level
        }
      }
    };
    onUpdateUserRole(updatedUser);
  };

  // Handler cập nhật quyền cấp Cột
  const handleColumnAccessChange = (sheetKey: string, columnId: string, level: PermissionLevel) => {
    if (!selectedUser) return;
    const currentSheet = selectedUser.sheets[sheetKey] || {
      sheetId: sheetKey as any,
      sheetName: sheetKey,
      access: 'view',
      columns: {}
    };

    const updatedUser: UserRole = {
      ...selectedUser,
      sheets: {
        ...selectedUser.sheets,
        [sheetKey]: {
          ...currentSheet,
          columns: {
            ...currentSheet.columns,
            [columnId]: level
          }
        }
      }
    };
    onUpdateUserRole(updatedUser);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newFullName.trim()) return;

    const roleNames: Record<string, string> = {
      admin: 'Quản trị viên cấp cao',
      warehouse_manager: 'Quản lý kho vận',
      warehouse_staff: 'Thủ kho phụ trách Nhập/Xuất',
      accountant: 'Kế toán kho',
      viewer: 'Nhân viên chỉ xem'
    };

    const newUserObj: UserRole = {
      email: newEmail.trim(),
      fullName: newFullName.trim(),
      role: newRole,
      roleName: roleNames[newRole] || 'Nhân viên',
      sheets: {
        nhap: { sheetId: 'nhap', sheetName: 'Lịch sử Nhập hàng', access: newRole === 'viewer' ? 'view' : 'edit', columns: {} },
        xuat: { sheetId: 'xuat', sheetName: 'Lịch sử Xuất hàng', access: newRole === 'viewer' ? 'view' : 'edit', columns: {} },
        tonKho: { sheetId: 'tonKho', sheetName: 'Báo cáo Tồn kho', access: 'view', columns: {} },
        dashboard: { sheetId: 'dashboard', sheetName: 'Dashboard', access: 'view', columns: {} },
        phanQuyen: { sheetId: 'phanQuyen', sheetName: 'Phân quyền', access: newRole === 'admin' ? 'edit' : 'hidden', columns: {} },
        ncc: { sheetId: 'ncc', sheetName: 'Data NCC', access: newRole === 'viewer' ? 'view' : 'edit', columns: {} }
      }
    };

    onAddUser(newUserObj);
    setSelectedUserEmail(newUserObj.email);
    setNewEmail('');
    setNewFullName('');
    setShowAddUserModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">5. Sheet Phân Quyền: Quản Lý Phân Quyền Theo User &amp; Cột</h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
              {users.length} người dùng
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Phân quyền 3 mức (Được xem / Chỉnh sửa / Không được xem) cho từng Sheet và từng Cột bảo mật
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddUserModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm Người Dùng Mới
          </button>
        )}
      </div>

      {/* Grid: User Selector & Permission Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Danh sách User */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <Users className="w-4 h-4 mr-2 text-indigo-600" />
              Danh Sách Người Dùng
            </h3>
            <span className="text-[11px] text-slate-400">Bấm để cấu hình</span>
          </div>

          <div className="space-y-2">
            {users.map((u) => {
              const isSelected = u.email === selectedUser?.email;
              const isActiveInApp = u.email === currentUserRole.email;

              return (
                <div
                  key={u.email}
                  onClick={() => setSelectedUserEmail(u.email)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{u.fullName}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{u.email}</p>
                    </div>
                    {isActiveInApp && (
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Đang chọn
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/80">
                    <span className="text-[11px] font-medium text-indigo-700 bg-indigo-100/50 px-2 py-0.5 rounded">
                      {u.roleName}
                    </span>
                    {!isActiveInApp && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectActiveRole(u);
                        }}
                        className="text-[11px] text-slate-500 hover:text-indigo-600 font-medium underline"
                      >
                        Đổi sang vai trò này
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Ma trận Phân Quyền Sheet & Cột */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sheet-level Permissions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-indigo-600" />
                  Phân Quyền Theo Sheet Cho: <span className="text-indigo-700 ml-1.5">{selectedUser?.fullName}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Email: {selectedUser?.email} &bull; Vai trò: {selectedUser?.roleName}
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg font-bold bg-slate-100 text-slate-700">
                {selectedUser?.role?.toUpperCase()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Tên Sheet</th>
                    <th className="py-2.5 px-3 text-center">Trạng Thái Quyền</th>
                    <th className="py-2.5 px-3 text-right">Hành Động Cấu Hình</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sheetKeys.map((sh) => {
                    const perm = selectedUser?.sheets[sh.key]?.access || 'view';

                    return (
                      <tr key={sh.key} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {sh.label}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {perm === 'edit' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <Edit3 className="w-3 h-3 mr-1" />
                              Xem &amp; Chỉnh sửa
                            </span>
                          )}
                          {perm === 'view' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                              <Eye className="w-3 h-3 mr-1" />
                              Chỉ được xem
                            </span>
                          )}
                          {perm === 'hidden' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Không được xem
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center space-x-1">
                            <button
                              onClick={() => handleSheetAccessChange(sh.key, 'edit')}
                              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                perm === 'edit'
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleSheetAccessChange(sh.key, 'view')}
                              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                perm === 'view'
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Xem
                            </button>
                            <button
                              onClick={() => handleSheetAccessChange(sh.key, 'hidden')}
                              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                perm === 'hidden'
                                  ? 'bg-rose-600 text-white font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Khóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Column-level Security Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  <Lock className="w-4 h-4 mr-2 text-amber-600" />
                  Phân Quyền Chi Tiết Từng Cột Của Sheet (Bảo Mật Dữ Liệu)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm soát quyền hiển thị các cột giá trị nhạy cảm theo đúng yêu cầu đề bài
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Cột Đơn giá nhập */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="font-bold text-slate-800">Cột "Đơn giá nhập" &amp; "Thành tiền" (Sheet Nhập)</p>
                  <p className="text-[11px] text-slate-500">Ẩn thông tin giá vốn đối với nhân viên kho thuần túy</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      handleColumnAccessChange('nhap', 'donGiaNhap', 'view');
                      handleColumnAccessChange('nhap', 'thanhTien', 'view');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      selectedUser?.sheets?.nhap?.columns?.donGiaNhap !== 'hidden'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border text-slate-600'
                    }`}
                  >
                    Hiển thị
                  </button>
                  <button
                    onClick={() => {
                      handleColumnAccessChange('nhap', 'donGiaNhap', 'hidden');
                      handleColumnAccessChange('nhap', 'thanhTien', 'hidden');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      selectedUser?.sheets?.nhap?.columns?.donGiaNhap === 'hidden'
                        ? 'bg-rose-600 text-white'
                        : 'bg-white border text-slate-600'
                    }`}
                  >
                    Ẩn cột (***)
                  </button>
                </div>
              </div>

              {/* Cột Chi phí nhập */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="font-bold text-slate-800">Cột "Chi phí nhập" (Sheet Tồn kho)</p>
                  <p className="text-[11px] text-slate-500">Chỉ cho phép Kế toán và Ban Giám đốc theo dõi chi phí</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleColumnAccessChange('tonKho', 'chiPhiNhap', 'view')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      selectedUser?.sheets?.tonKho?.columns?.chiPhiNhap !== 'hidden'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border text-slate-600'
                    }`}
                  >
                    Hiển thị
                  </button>
                  <button
                    onClick={() => handleColumnAccessChange('tonKho', 'chiPhiNhap', 'hidden')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      selectedUser?.sheets?.tonKho?.columns?.chiPhiNhap === 'hidden'
                        ? 'bg-rose-600 text-white'
                        : 'bg-white border text-slate-600'
                    }`}
                  >
                    Ẩn cột (***)
                  </button>
                </div>
              </div>

              {/* Cột STK Ngân Hàng NCC */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="font-bold text-slate-800">Cột "Stk Ngân hàng" (Sheet Data NCC)</p>
                  <p className="text-[11px] text-slate-500">Giới hạn xem thông tin thanh toán tài chính đối tác</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleColumnAccessChange('ncc', 'stkNganHang', 'view')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      selectedUser?.sheets?.ncc?.columns?.stkNganHang !== 'hidden'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border text-slate-600'
                    }`}
                  >
                    Hiển thị
                  </button>
                  <button
                    onClick={() => handleColumnAccessChange('ncc', 'stkNganHang', 'hidden')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      selectedUser?.sheets?.ncc?.columns?.stkNganHang === 'hidden'
                        ? 'bg-rose-600 text-white'
                        : 'bg-white border text-slate-600'
                    }`}
                  >
                    Ẩn cột (***)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Thêm User mới */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-indigo-900 font-bold text-base pb-2 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Thêm Người Dùng &amp; Phân Quyền Mới</span>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label htmlFor={`${uniqueId}-email`} className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Google Người Dùng
                </label>
                <input
                  id={`${uniqueId}-email`}
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nhanvien@gmail.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label htmlFor={`${uniqueId}-fullname`} className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và Tên
                </label>
                <input
                  id={`${uniqueId}-fullname`}
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Nguyễn Văn B"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label htmlFor={`${uniqueId}-role`} className="block text-xs font-semibold text-slate-700 mb-1">
                  Vai Trò Mặc Định
                </label>
                <select
                  id={`${uniqueId}-role`}
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="warehouse_staff">Thủ kho (Chỉ nhập/xuất, ẩn giá tiền)</option>
                  <option value="warehouse_manager">Quản lý kho (Toàn quyền kho vận)</option>
                  <option value="accountant">Kế toán (Xem toàn bộ, quản lý chi phí)</option>
                  <option value="viewer">Nhân viên xem (Chỉ xem)</option>
                  <option value="admin">Quản trị viên (Toàn quyền hệ thống)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  Tạo Người Dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
