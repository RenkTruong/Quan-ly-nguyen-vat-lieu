import React, { useState, useId } from 'react';
import { 
  Users, 
  Shield, 
  Eye, 
  Edit3, 
  EyeOff, 
  UserCheck, 
  Plus, 
  Trash2, 
  Sparkles,
  Crown,
  Layers,
  Check,
  AlertCircle,
  PlusCircle
} from 'lucide-react';
import { UserRole, PermissionLevel, RoleDefinition } from '../types/inventory';
import { OWNER_EMAIL } from '../data/initialData';

interface PermissionsSheetProps {
  users: UserRole[];
  currentUserRole: UserRole;
  isOwner: boolean;
  loggedInEmail?: string | null;
  roleDefinitions: RoleDefinition[];
  onUpdateUserRole: (updatedUser: UserRole) => void;
  onAddUser: (newUser: UserRole) => void;
  onDeleteUser: (email: string) => void;
  onAddRoleDefinition: (newRole: RoleDefinition) => void;
  onDeleteRoleDefinition: (roleId: string) => void;
  onSelectActiveRole: (role: UserRole) => void;
}

export const PermissionsSheet: React.FC<PermissionsSheetProps> = ({
  users,
  currentUserRole,
  isOwner,
  loggedInEmail,
  roleDefinitions,
  onUpdateUserRole,
  onAddUser,
  onDeleteUser,
  onAddRoleDefinition,
  onDeleteRoleDefinition,
  onSelectActiveRole
}) => {
  const [selectedTab, setSelectedTab] = useState<'users' | 'roles'>('users');
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>(users[0]?.email || '');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);

  // Form add user
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roleDefinitions[0]?.id || 'warehouse_staff');

  // Form add role definition
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleSheets, setNewRoleSheets] = useState<Record<string, PermissionLevel>>({
    nhap: 'edit',
    xuat: 'edit',
    tonKho: 'view',
    dashboard: 'view',
    phanQuyen: 'hidden',
    ncc: 'view'
  });

  const uniqueId = useId();

  const selectedUser = users.find((u) => u.email === selectedUserEmail) || users[0];

  const sheetKeys = [
    { key: 'nhap', label: '1. Nhập hàng' },
    { key: 'xuat', label: '2. Xuất hàng' },
    { key: 'tonKho', label: '3. Tồn kho' },
    { key: 'dashboard', label: '4. Dashboard' },
    { key: 'phanQuyen', label: '5. Phân quyền' },
    { key: 'ncc', label: '6. Data NCC' }
  ];

  // Handler cập nhật quyền cấp Sheet cho User
  const handleSheetAccessChange = (sheetKey: string, level: PermissionLevel) => {
    if (!selectedUser || !isOwner) return;
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

  // Handler cập nhật quyền cấp Cột cho User
  const handleColumnAccessChange = (sheetKey: string, columnId: string, level: PermissionLevel) => {
    if (!selectedUser || !isOwner) return;

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

  // Handler cập nhật đồng thời nhiều quyền cấp Cột cho User (tránh race condition / ghi đè state)
  const handleMultiColumnAccessChange = (sheetKey: string, columnMap: Record<string, PermissionLevel>) => {
    if (!selectedUser || !isOwner) return;

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
            ...columnMap
          }
        }
      }
    };
    onUpdateUserRole(updatedUser);
  };

  // Tạo người dùng mới
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newFullName.trim()) return;

    const emailTrimmed = newEmail.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === emailTrimmed)) {
      alert('Email này đã tồn tại trong danh sách người dùng!');
      return;
    }

    const matchedDef = roleDefinitions.find(r => r.id === selectedRoleId) || roleDefinitions[0];

    const newUserObj: UserRole = {
      email: emailTrimmed,
      fullName: newFullName.trim(),
      role: matchedDef.id,
      roleName: matchedDef.name,
      sheets: JSON.parse(JSON.stringify(matchedDef.defaultSheets))
    };

    onAddUser(newUserObj);
    setSelectedUserEmail(newUserObj.email);
    setNewEmail('');
    setNewFullName('');
    setShowAddUserModal(false);
  };

  // Xóa người dùng
  const handleDeleteUserClick = (email: string) => {
    if (email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
      alert('Không thể xóa tài khoản Chủ tài khoản tối cao!');
      return;
    }
    if (window.confirm(`Bạn có chắc muốn xóa tài khoản "${email}" khỏi hệ thống?`)) {
      onDeleteUser(email);
      if (selectedUserEmail === email) {
        const remaining = users.filter(u => u.email !== email);
        if (remaining.length > 0) {
          setSelectedUserEmail(remaining[0].email);
        }
      }
    }
  };

  // Tạo vai trò mặc định mới
  const handleCreateRoleDef = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const roleId = 'role_' + Date.now();
    const newRoleObj: RoleDefinition = {
      id: roleId,
      name: newRoleName.trim(),
      description: newRoleDesc.trim() || 'Vai trò tùy chỉnh tạo bởi Chủ tài khoản',
      isSystem: false,
      defaultSheets: {
        nhap: { sheetId: 'nhap', sheetName: 'Lịch sử Nhập hàng', access: newRoleSheets.nhap, columns: {} },
        xuat: { sheetId: 'xuat', sheetName: 'Lịch sử Xuất hàng', access: newRoleSheets.xuat, columns: {} },
        tonKho: { sheetId: 'tonKho', sheetName: 'Báo cáo Tồn kho', access: newRoleSheets.tonKho, columns: {} },
        dashboard: { sheetId: 'dashboard', sheetName: 'Dashboard Phân tích', access: newRoleSheets.dashboard, columns: {} },
        phanQuyen: { sheetId: 'phanQuyen', sheetName: 'Phân quyền User', access: newRoleSheets.phanQuyen, columns: {} },
        ncc: { sheetId: 'ncc', sheetName: 'Danh bạ Nhà cung cấp', access: newRoleSheets.ncc, columns: {} }
      }
    };

    onAddRoleDefinition(newRoleObj);
    setNewRoleName('');
    setNewRoleDesc('');
    setShowAddRoleModal(false);
  };

  // Xóa vai trò mặc định
  const handleDeleteRoleDefClick = (roleDef: RoleDefinition) => {
    if (roleDef.isSystem) {
      alert('Không thể xóa vai trò hệ thống gốc!');
      return;
    }
    if (window.confirm(`Bạn có chắc muốn xóa vai trò "${roleDef.name}"?`)) {
      onDeleteRoleDefinition(roleDef.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">5. Quản Lý Phân Quyền &amp; Người Dùng</h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
              {users.length} tài khoản &bull; {roleDefinitions.length} vai trò
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Đăng nhập Google để kích hoạt đầy đủ quyền hạn theo phân quyền của tài khoản.
          </p>
        </div>

        {/* Owner status badge */}
        <div className="flex items-center space-x-2">
          {isOwner ? (
            <div className="flex items-center space-x-2 bg-amber-50 text-amber-900 border border-amber-300 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs">
              <Crown className="w-4 h-4 text-amber-600" />
              <span>Chủ Tài Khoản ({OWNER_EMAIL})</span>
            </div>
          ) : (
            <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Quyền quản trị cấp cao: <strong className="text-slate-800">{OWNER_EMAIL}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Switcher: Quản lý Tài Khoản vs Quản lý Vai Trò Mặc Định */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setSelectedTab('users')}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
            selectedTab === 'users'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh Sách Người Dùng ({users.length})</span>
        </button>

        <button
          onClick={() => setSelectedTab('roles')}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
            selectedTab === 'roles'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Quản Lý Vai Trò Mặc Định ({roleDefinitions.length})</span>
        </button>
      </div>

      {/* TAB 1: Quản lý Người dùng & Ma trận Phân quyền */}
      {selectedTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Danh sách User */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Users className="w-4 h-4 mr-2 text-indigo-600" />
                Tài Khoản Phân Quyền
              </h3>
              {isOwner && (
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Thêm User
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {users.map((u) => {
                const isSelected = u.email === selectedUser?.email;
                const isActiveInApp = u.email.toLowerCase() === currentUserRole.email.toLowerCase();
                const isThisUserOwner = u.email.toLowerCase() === OWNER_EMAIL.toLowerCase();

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
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <p className="text-xs font-bold text-slate-900 truncate">{u.fullName}</p>
                          {isThisUserOwner && (
                            <span title="Chủ sở hữu hệ thống">
                              <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{u.email}</p>
                      </div>

                      <div className="flex items-center space-x-1">
                        {isActiveInApp && (
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Đang dùng
                          </span>
                        )}
                        {isOwner && !isThisUserOwner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUserClick(u.email);
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                            title="Xóa tài khoản này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/80">
                      <span className="text-[11px] font-medium text-indigo-700 bg-indigo-100/50 px-2 py-0.5 rounded truncate max-w-[140px]">
                        {u.roleName}
                      </span>
                      {!isActiveInApp && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectActiveRole(u);
                          }}
                          className="text-[11px] text-slate-500 hover:text-indigo-600 font-medium underline whitespace-nowrap"
                        >
                          Chuyển vai trò
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Ma trận Phân Quyền Sheet & Cột của User */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-indigo-600" />
                    Phân Quyền Cho: <span className="text-indigo-700 ml-1.5">{selectedUser?.fullName}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Email: {selectedUser?.email} &bull; Vai trò: {selectedUser?.roleName}
                  </p>
                </div>

                {!isOwner && (
                  <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                    Chỉ Chủ tài khoản mới được chỉnh sửa phân quyền
                  </div>
                )}
              </div>

              {/* Sheet Permissions Matrix */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3">Tên Sheet</th>
                      <th className="py-2.5 px-3 text-center">Trạng Thái Hiện Tại</th>
                      <th className="py-2.5 px-3 text-right">Điều Chỉnh Quyền (Chủ tài khoản)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sheetKeys.map((sh) => {
                      const perm = selectedUser?.sheets[sh.key]?.access || 'view';

                      return (
                        <tr key={sh.key} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-800">{sh.label}</td>
                          <td className="py-3 px-3 text-center">
                            {perm === 'edit' && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                <Edit3 className="w-3 h-3 mr-1" />
                                Toàn quyền (Sửa &amp; Xóa)
                              </span>
                            )}
                            {perm === 'create' && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <PlusCircle className="w-3 h-3 mr-1 text-amber-600" />
                                Thêm (Chỉ tạo mới, không sửa/xóa)
                              </span>
                            )}
                            {perm === 'view' && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                                <Eye className="w-3 h-3 mr-1" />
                                Chỉ Xem
                              </span>
                            )}
                            {perm === 'hidden' && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                                <EyeOff className="w-3 h-3 mr-1" />
                                Không Được Xem
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {isOwner ? (
                              <div className="inline-flex rounded-lg shadow-2xs border border-slate-200 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => handleSheetAccessChange(sh.key, 'edit')}
                                  title="Toàn quyền: Xem, Thêm mới, Sửa và Xóa các phiếu"
                                  className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                    perm === 'edit' ? 'bg-emerald-600 text-white font-bold' : 'bg-white hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSheetAccessChange(sh.key, 'create')}
                                  title="Chỉ thêm mới: Chỉ được tạo thêm phiếu, không được sửa hoặc xóa các phiếu đã tạo"
                                  className={`px-2.5 py-1 text-[11px] font-medium border-l border-slate-200 transition-colors ${
                                    perm === 'create' ? 'bg-amber-600 text-white font-bold' : 'bg-white hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  Thêm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSheetAccessChange(sh.key, 'view')}
                                  title="Chỉ xem: Không được tạo, sửa hoặc xóa"
                                  className={`px-2.5 py-1 text-[11px] font-medium border-l border-r border-slate-200 transition-colors ${
                                    perm === 'view' ? 'bg-blue-600 text-white font-bold' : 'bg-white hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  Xem
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSheetAccessChange(sh.key, 'hidden')}
                                  title="Khóa: Ẩn sheet hoàn toàn"
                                  className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                    perm === 'hidden' ? 'bg-rose-600 text-white font-bold' : 'bg-white hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  Khóa
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Chỉ xem</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Column Level Security */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Quyền Bảo Mật Dữ Liệu Theo Cột Nhạy Cảm:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Cột Đơn giá & Thành tiền */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-xs text-slate-800">Cột Đơn giá &amp; Thành tiền (Sheet Nhập)</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          selectedUser?.sheets?.nhap?.columns?.donGiaNhap === 'hidden'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {selectedUser?.sheets?.nhap?.columns?.donGiaNhap === 'hidden' ? 'Đang ẩn (***)' : 'Đang hiển thị'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Bảo mật giá vốn: Bấm chọn để ẩn hoặc hiển thị đơn giá &amp; thành tiền cho tài khoản này.
                      </p>
                    </div>
                    {isOwner ? (
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            handleMultiColumnAccessChange('nhap', {
                              donGiaNhap: 'view',
                              thanhTien: 'view'
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            selectedUser?.sheets?.nhap?.columns?.donGiaNhap !== 'hidden'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                          title="Cho phép tài khoản này xem đơn giá và thành tiền"
                        >
                          Hiển thị
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleMultiColumnAccessChange('nhap', {
                              donGiaNhap: 'hidden',
                              thanhTien: 'hidden'
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            selectedUser?.sheets?.nhap?.columns?.donGiaNhap === 'hidden'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                          title="Bảo mật: Ẩn cột đơn giá và thành tiền (thay bằng ***) đối với tài khoản này"
                        >
                          Ẩn cột (***)
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-600">
                        {selectedUser?.sheets?.nhap?.columns?.donGiaNhap === 'hidden' ? 'Đang ẩn (***)' : 'Đang hiển thị'}
                      </span>
                    )}
                  </div>

                  {/* Cột Chi phí nhập */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div>
                      <p className="font-bold text-xs text-slate-800">Cột Chi phí nhập (Sheet Tồn kho)</p>
                      <p className="text-[11px] text-slate-500">Bảo mật giá trị kho hàng</p>
                    </div>
                    {isOwner ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleColumnAccessChange('tonKho', 'chiPhiNhap', 'view')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            selectedUser?.sheets?.tonKho?.columns?.chiPhiNhap !== 'hidden'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border text-slate-600'
                          }`}
                        >
                          Hiển thị
                        </button>
                        <button
                          onClick={() => handleColumnAccessChange('tonKho', 'chiPhiNhap', 'hidden')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            selectedUser?.sheets?.tonKho?.columns?.chiPhiNhap === 'hidden'
                              ? 'bg-rose-600 text-white'
                              : 'bg-white border text-slate-600'
                          }`}
                        >
                          Ẩn cột (***)
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-600">
                        {selectedUser?.sheets?.tonKho?.columns?.chiPhiNhap === 'hidden' ? 'Đang ẩn (***)' : 'Hiển thị'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Quản lý Vai Trò Mặc Định */}
      {selectedTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Layers className="w-4 h-4 mr-2 text-indigo-600" />
                Danh Sách Vai Trò Mặc Định
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các mẫu quyền định sẵn để gán nhanh cho nhân viên mới khi thêm vào hệ thống.
              </p>
            </div>

            {isOwner && (
              <button
                onClick={() => setShowAddRoleModal(true)}
                className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Tạo Thêm Vai Trò Mới
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roleDefinitions.map((roleDef) => {
              const userCount = users.filter((u) => u.role === roleDef.id).length;

              return (
                <div
                  key={roleDef.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{roleDef.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {roleDef.id}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {roleDef.isSystem ? (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            Mặc định hệ thống
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                            Tùy chỉnh
                          </span>
                        )}
                        {isOwner && !roleDef.isSystem && (
                          <button
                            onClick={() => handleDeleteRoleDefClick(roleDef)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                            title="Xóa vai trò này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{roleDef.description}</p>

                    <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                      <div className="font-semibold text-slate-700 mb-1.5">Quyền mặc định các sheet:</div>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        {Object.entries(roleDef.defaultSheets).map(([sheetKey, sheetObj]) => (
                          <div key={sheetKey} className="flex items-center space-x-1 text-slate-600">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              sheetObj.access === 'edit' 
                                ? 'bg-emerald-500' 
                                : sheetObj.access === 'create'
                                ? 'bg-amber-500'
                                : sheetObj.access === 'view' 
                                ? 'bg-blue-500' 
                                : 'bg-rose-400'
                            }`} />
                            <span className="capitalize">{sheetKey}:</span>
                            <span className="font-semibold text-slate-800">
                              {sheetObj.access === 'edit' ? 'Sửa' : sheetObj.access === 'create' ? 'Thêm' : sheetObj.access === 'view' ? 'Xem' : 'Khóa'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Đang áp dụng: <strong className="text-slate-800">{userCount} tài khoản</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Thêm User Mới */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-indigo-900 font-bold text-base pb-2 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Thêm Tài Khoản Người Dùng Mới</span>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label htmlFor={`${uniqueId}-email`} className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Google Của Người Dùng
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
                  Họ và Tên Nhân Viên
                </label>
                <input
                  id={`${uniqueId}-fullname`}
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label htmlFor={`${uniqueId}-role-select`} className="block text-xs font-semibold text-slate-700 mb-1">
                  Gán Vai Trò Mặc Định
                </label>
                <select
                  id={`${uniqueId}-role-select`}
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {roleDefinitions.map((rd) => (
                    <option key={rd.id} value={rd.id}>
                      {rd.name} ({rd.description || rd.id})
                    </option>
                  ))}
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

      {/* Modal Thêm Vai Trò Mặc Định Mới */}
      {showAddRoleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-indigo-900 font-bold text-base pb-2 border-b border-slate-100">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Tạo Thêm Vai Trò Mặc Định Mới</span>
            </div>

            <form onSubmit={handleCreateRoleDef} className="space-y-3">
              <div>
                <label htmlFor={`${uniqueId}-rolename`} className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Vai Trò
                </label>
                <input
                  id={`${uniqueId}-rolename`}
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Ví dụ: Kiểm soát chất lượng (QC)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label htmlFor={`${uniqueId}-roledesc`} className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô Tả Nhiệm Vụ
                </label>
                <input
                  id={`${uniqueId}-roledesc`}
                  type="text"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Mô tả ngắn gọn quyền hạn của vai trò này"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Cấu Hình Quyền Của Vai Trò Mới:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {sheetKeys.map((sh) => (
                    <div key={sh.key} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-800">{sh.label}</span>
                      <select
                        value={newRoleSheets[sh.key] || 'view'}
                        onChange={(e) => setNewRoleSheets(prev => ({ ...prev, [sh.key]: e.target.value as PermissionLevel }))}
                        className="px-2 py-1 rounded border border-slate-300 text-xs bg-white"
                      >
                        <option value="edit">Toàn quyền (Xem, Thêm, Sửa, Xóa)</option>
                        <option value="create">Thêm (Chỉ tạo mới, không sửa/xóa)</option>
                        <option value="view">Chỉ xem</option>
                        <option value="hidden">Không được xem (Khóa)</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  Lưu Vai Trò
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
