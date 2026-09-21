import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { 
  ImportRecord, 
  ExportRecord, 
  Supplier, 
  UserRole, 
  RoleDefinition,
  SheetId 
} from './types/inventory';
import { 
  initialImports, 
  initialExports, 
  initialSuppliers, 
  initialUsers, 
  initialMinStocks,
  initialRoleDefinitions,
  OWNER_EMAIL
} from './data/initialData';
import { 
  signInWithGoogle, 
  signOutUser, 
  subscribeToAuth, 
  getCachedAccessToken 
} from './services/firebase';
import { createFullInventorySpreadsheet } from './services/googleSheets';
import { Navbar } from './components/Navbar';
import { TabNavigation } from './components/TabNavigation';
import { ImportSheet } from './components/ImportSheet';
import { ExportSheet } from './components/ExportSheet';
import { InventorySheet } from './components/InventorySheet';
import { DashboardSheet } from './components/DashboardSheet';
import { PermissionsSheet } from './components/PermissionsSheet';
import { SupplierSheet } from './components/SupplierSheet';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { QuickLoginModal } from './components/QuickLoginModal';
import { Lock, FileSpreadsheet, AlertTriangle, XCircle, ExternalLink, Crown, LogIn } from 'lucide-react';

export interface AppUser {
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

export const GUEST_USER_ROLE: UserRole = {
  email: '',
  fullName: 'Khách vãng lai',
  role: 'guest',
  roleName: 'Khách (Chỉ xem Tồn kho)',
  sheets: {
    nhap: { sheetId: 'nhap', sheetName: 'Lịch sử Nhập hàng', access: 'hidden', columns: {} },
    xuat: { sheetId: 'xuat', sheetName: 'Lịch sử Xuất hàng', access: 'hidden', columns: {} },
    tonKho: { sheetId: 'tonKho', sheetName: 'Báo cáo Tồn kho', access: 'view', columns: {} },
    dashboard: { sheetId: 'dashboard', sheetName: 'Dashboard Phân tích', access: 'hidden', columns: {} },
    phanQuyen: { sheetId: 'phanQuyen', sheetName: 'Phân quyền User', access: 'hidden', columns: {} },
    ncc: { sheetId: 'ncc', sheetName: 'Danh bạ Nhà cung cấp', access: 'hidden', columns: {} }
  }
};

export default function App() {
  // Auth state - persists locally for GitHub Pages & seamless offline access
  const [user, setUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('nvl_session_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isQuickLoginOpen, setIsQuickLoginOpen] = useState(false);

  // Data states (Persisted locally in memory & synced with Google Sheets)
  const [imports, setImports] = useState<ImportRecord[]>(() => {
    const saved = localStorage.getItem('nvl_imports');
    return saved ? JSON.parse(saved) : initialImports;
  });

  const [exports, setExports] = useState<ExportRecord[]>(() => {
    const saved = localStorage.getItem('nvl_exports');
    return saved ? JSON.parse(saved) : initialExports;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('nvl_suppliers');
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [users, setUsers] = useState<UserRole[]>(() => {
    const saved = localStorage.getItem('nvl_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>(() => {
    const saved = localStorage.getItem('nvl_role_defs');
    if (saved) {
      try {
        const parsed: RoleDefinition[] = JSON.parse(saved);
        if (!parsed.some(r => r.id === 'guest')) {
          const guestDef = initialRoleDefinitions.find(r => r.id === 'guest');
          if (guestDef) parsed.push(guestDef);
        }
        return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return initialRoleDefinitions;
  });

  const [minStocks, setMinStocks] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('nvl_min_stocks');
    return saved ? JSON.parse(saved) : initialMinStocks;
  });

  // Role & Tab state: Mặc định là Khách vãng lai (Chỉ xem Tồn kho) nếu chưa đăng nhập
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('nvl_session_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.email) {
          const userEmailLower = parsed.email.toLowerCase();
          const matched = initialUsers.find((u) => u.email.toLowerCase() === userEmailLower);
          if (matched) return matched;
          if (userEmailLower === OWNER_EMAIL.toLowerCase()) {
            return {
              email: parsed.email,
              fullName: parsed.displayName || 'Trúc Giàu Trương (Chủ tài khoản)',
              role: 'admin',
              roleName: 'Quản trị viên cấp cao (Chủ sở hữu)',
              sheets: initialRoleDefinitions[0].defaultSheets
            };
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    return GUEST_USER_ROLE;
  });
  const [activeTab, setActiveTab] = useState<SheetId>('tonKho');

  // Check if current logged-in user is the Owner (trucgiau.truong@gmail.com)
  const isOwner = useMemo(() => {
    if (!user?.email) return false;
    return user.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
  }, [user]);

  // Google Sheets integration state
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem('nvl_spreadsheet_id') || null;
  });
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => {
    return localStorage.getItem('nvl_spreadsheet_url') || null;
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return localStorage.getItem('nvl_last_synced') || null;
  });
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('nvl_imports', JSON.stringify(imports));
  }, [imports]);

  useEffect(() => {
    localStorage.setItem('nvl_exports', JSON.stringify(exports));
  }, [exports]);

  useEffect(() => {
    localStorage.setItem('nvl_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('nvl_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('nvl_role_defs', JSON.stringify(roleDefinitions));
  }, [roleDefinitions]);

  useEffect(() => {
    localStorage.setItem('nvl_min_stocks', JSON.stringify(minStocks));
  }, [minStocks]);

  const applyUserRole = (email: string, displayName?: string | null) => {
    const userEmailLower = email.toLowerCase();
    const matched = users.find((u) => u.email.toLowerCase() === userEmailLower);
    if (matched) {
      setCurrentUserRole(matched);
    } else if (userEmailLower === OWNER_EMAIL.toLowerCase()) {
      const ownerObj: UserRole = {
        email,
        fullName: displayName || 'Trúc Giàu Trương (Chủ tài khoản)',
        role: 'admin',
        roleName: 'Quản trị viên cấp cao (Chủ sở hữu)',
        sheets: initialRoleDefinitions[0].defaultSheets
      };
      setCurrentUserRole(ownerObj);
    } else {
      const defaultViewerObj: UserRole = {
        email,
        fullName: displayName || 'Nhân viên',
        role: 'viewer',
        roleName: 'Nhân viên chưa cấu hình (Chỉ xem)',
        sheets: initialRoleDefinitions[4]?.defaultSheets || initialRoleDefinitions[0].defaultSheets
      };
      setCurrentUserRole(defaultViewerObj);
    }
  };

  // Subscribe to Firebase Auth and sync session
  useEffect(() => {
    // Check saved session on boot
    const savedUserStr = localStorage.getItem('nvl_session_user');
    if (savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
        if (parsed?.email) {
          applyUserRole(parsed.email, parsed.displayName);
        }
      } catch (e) {
        console.error(e);
      }
    }

    const unsubscribe = subscribeToAuth((firebaseUser) => {
      setIsAuthLoading(false);
      if (firebaseUser?.email) {
        const uObj: AppUser = {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        };
        setUser(uObj);
        localStorage.setItem('nvl_session_user', JSON.stringify(uObj));
        applyUserRole(firebaseUser.email, firebaseUser.displayName);
      } else {
        // Fallback to local session if present
        const stored = localStorage.getItem('nvl_session_user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed?.email) {
              setUser(parsed);
              applyUserRole(parsed.email, parsed.displayName);
              return;
            }
          } catch (e) {
            console.error(e);
          }
        }
        setUser(null);
        setCurrentUserRole(GUEST_USER_ROLE);
        setActiveTab('tonKho');
      }
    });

    return () => unsubscribe();
  }, [users, roleDefinitions]);

  // Calculate current stock for each product code
  const inventoryMap = useMemo(() => {
    const map = new Map<string, { ten: string; dvt: string; tonKho: number }>();
    imports.forEach((imp) => {
      const cur = map.get(imp.maHangHoa) || { ten: imp.tenHangHoa, dvt: imp.donViTinh, tonKho: 0 };
      cur.tonKho += imp.soLuongNhap;
      map.set(imp.maHangHoa, cur);
    });

    exports.forEach((exp) => {
      const cur = map.get(exp.maHangHoa);
      if (cur) {
        cur.tonKho -= exp.soLuongXuat;
      }
    });
    return map;
  }, [imports, exports]);

  // Handlers for Data changes
  const handleAddImport = (record: ImportRecord) => {
    setImports((prev) => [record, ...prev]);
  };

  const handleDeleteImport = (id: string) => {
    setImports((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddExport = (record: ExportRecord) => {
    setExports((prev) => [record, ...prev]);
  };

  const handleDeleteExport = (id: string) => {
    setExports((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateMinStock = (maHangHoa: string, newMin: number) => {
    setMinStocks((prev) => ({
      ...prev,
      [maHangHoa]: Math.max(0, newMin)
    }));
  };

  const handleAddSupplier = (supplier: Supplier) => {
    setSuppliers((prev) => [...prev, supplier]);
  };

  const handleUpdateSupplier = (updated: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateUserRole = (updatedUser: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.email === updatedUser.email ? updatedUser : u)));
    if (currentUserRole.email === updatedUser.email) {
      setCurrentUserRole(updatedUser);
    }
  };

  const handleAddUser = (newUser: UserRole) => {
    setUsers((prev) => [...prev, newUser]);
  };

  const handleDeleteUser = (email: string) => {
    setUsers((prev) => prev.filter((u) => u.email.toLowerCase() !== email.toLowerCase()));
  };

  const handleAddRoleDefinition = (newRole: RoleDefinition) => {
    setRoleDefinitions((prev) => [...prev, newRole]);
  };

  const handleDeleteRoleDefinition = (roleId: string) => {
    setRoleDefinitions((prev) => prev.filter((r) => r.id !== roleId));
  };

  const handleSelectRole = (role: UserRole) => {
    setCurrentUserRole(role);
    // If switched to a role that does not have access to current tab, switch to first visible tab
    const access = role.sheets[activeTab]?.access;
    if (access === 'hidden') {
      const firstAllowed = (['nhap', 'xuat', 'tonKho', 'dashboard', 'phanQuyen', 'ncc'] as SheetId[]).find(
        (t) => role.sheets[t]?.access !== 'hidden'
      );
      if (firstAllowed) setActiveTab(firstAllowed);
    }
  };

  // Auth handlers
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  const handleEmailLogin = (email: string, fullName: string) => {
    const customUser: AppUser = {
      email,
      displayName: fullName,
      photoURL: null
    };
    setUser(customUser);
    localStorage.setItem('nvl_session_user', JSON.stringify(customUser));
    applyUserRole(email, fullName);
    setAuthErrorMessage(null);
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('nvl_session_user');
    setUser(null);
    setCurrentUserRole(GUEST_USER_ROLE);
    setActiveTab('tonKho');
  };

  const handleGoogleLogin = async () => {
    setAuthErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      const code = err?.code || '';
      if (code === 'auth/unauthorized-domain') {
        setAuthErrorMessage(
          'Firebase chặn đăng nhập Google do chưa cấp phép tên miền. Bạn hãy bấm "Đăng nhập nhanh bằng Email" bên dưới để vào hệ thống ngay lập tức mà không cần Firebase.'
        );
      } else if (code === 'auth/popup-blocked') {
        setAuthErrorMessage('Trình duyệt đã chặn cửa sổ Popup đăng nhập. Vui lòng cho phép Pop-up trên trình duyệt.');
      } else if (code === 'auth/popup-closed-by-user') {
        console.log('User closed popup');
      } else {
        setAuthErrorMessage(err?.message || 'Đăng nhập Google không thành công. Vui lòng thử lại.');
      }
    }
  };

  // Google Sheets Integration Handlers
  const handleCreateOrSyncGoogleSheet = async () => {
    let token = getCachedAccessToken();
    if (!token) {
      // Trigger login
      const res = await signInWithGoogle();
      if (!res?.accessToken) {
        throw new Error('Không thể lấy mã truy cập Google Sheets. Vui lòng thử lại.');
      }
      token = res.accessToken;
    }

    if (!token) {
      throw new Error('Chưa có quyền truy cập Google Sheets.');
    }

    setIsCreatingSheet(true);
    try {
      const result = await createFullInventorySpreadsheet(
        token,
        imports,
        exports,
        suppliers,
        users,
        minStocks
      );

      setSpreadsheetId(result.spreadsheetId);
      setSpreadsheetUrl(result.spreadsheetUrl);
      const nowStr = new Date().toLocaleString('vi-VN');
      setLastSyncedAt(nowStr);

      localStorage.setItem('nvl_spreadsheet_id', result.spreadsheetId);
      localStorage.setItem('nvl_spreadsheet_url', result.spreadsheetUrl);
      localStorage.setItem('nvl_last_synced', nowStr);
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Current sheet permission
  const currentSheetPermission = currentUserRole.sheets[activeTab];
  // If not logged in, user can ONLY view 'tonKho'; all other sheets are blocked
  const isGuestBlocked = !user && activeTab !== 'tonKho';
  const isCurrentTabHidden = isGuestBlocked || currentSheetPermission?.access === 'hidden';

  const reorderCount = Array.from(inventoryMap.entries()).filter(([code, item]) => {
    const min = minStocks[code] ?? 10;
    return item.tonKho <= min;
  }).length;

  const expiredCount = imports.filter((i) => i.conSuDung === 'Hết hạn sử dụng').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-emerald-200">
      {/* Top Navigation Bar */}
      <Navbar
        user={user}
        currentUserRole={currentUserRole}
        allUserRoles={users}
        onSelectUserRole={handleSelectRole}
        onLogin={handleGoogleLogin}
        onOpenQuickLogin={() => setIsQuickLoginOpen(true)}
        onLogout={handleLogout}
        isLoggingIn={isAuthLoading}
        spreadsheetId={spreadsheetId}
        spreadsheetUrl={spreadsheetUrl}
        isCreatingSheet={isCreatingSheet}
        onCreateOrSyncSheet={() => setIsSheetModalOpen(true)}
        lastSyncedAt={lastSyncedAt}
      />

      {/* Guest Notice Banner if not logged in */}
      {!user && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-blue-950 text-sm block">
                  Chế độ Khách: Đang xem Sheet Tồn kho
                </span>
                <span className="text-blue-800">
                  Vui lòng đăng nhập để mở khóa đầy đủ 6 Sheet theo phân quyền của bạn.
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleEmailLogin(OWNER_EMAIL, 'Trúc Giàu Trương (Chủ tài khoản)')}
                className="inline-flex items-center px-3 py-1.5 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors whitespace-nowrap"
                title="Đăng nhập ngay với tư cách Chủ sở hữu"
              >
                <Crown className="w-3.5 h-3.5 mr-1" />
                Vào vai Chủ tài khoản
              </button>
              <button
                onClick={() => setIsQuickLoginOpen(true)}
                className="inline-flex items-center px-3.5 py-1.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Error Banner if domain is not authorized in Firebase */}
      {authErrorMessage && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300/80 rounded-2xl p-4.5 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-amber-100/80 text-amber-700 flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-950">
                    Đăng nhập trực tiếp (Bỏ qua Firebase bị chặn)
                  </h4>
                  <p className="text-xs text-amber-900 leading-relaxed max-w-3xl">
                    Firebase trên GitHub Pages cần quyền thêm domain. Bạn <strong>không cần Firebase</strong> vẫn có thể đăng nhập đầy đủ quyền Chủ tài khoản hoặc các vai trò nhân viên ngay tại đây:
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAuthErrorMessage(null)}
                className="p-1 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-100/60 transition-colors"
                title="Đóng thông báo"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white/90 rounded-xl p-3 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-800">
                  Khuyên dùng cho GitHub Pages:
                </div>
                <div className="text-slate-500">
                  Nhấn nút bên cạnh để đăng nhập ngay với tư cách Chủ sở hữu <span className="font-mono font-bold text-emerald-700">{OWNER_EMAIL}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEmailLogin(OWNER_EMAIL, 'Trúc Giàu Trương (Chủ tài khoản)')}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs whitespace-nowrap transition-colors"
                >
                  <Crown className="w-3.5 h-3.5 mr-1.5" />
                  Đăng nhập {OWNER_EMAIL}
                </button>
                <button
                  onClick={() => setIsQuickLoginOpen(true)}
                  className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs whitespace-nowrap transition-colors"
                >
                  Chọn tài khoản khác
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tab Switcher */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentUserRole={currentUserRole}
          reorderCount={reorderCount}
          expiredCount={expiredCount}
          isLoggedIn={!!user}
        />

        {/* Content Area with Role-Based Access Enforcement */}
        {isCurrentTabHidden ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-4 max-w-lg mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isGuestBlocked ? 'Yêu Cầu Đăng Nhập' : 'Truy Cập Bị Giới Hạn'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {isGuestBlocked ? (
                  'Chế độ xem chưa đăng nhập chỉ cho phép xem Sheet Tồn kho. Vui lòng đăng nhập để được mở khóa theo phân quyền của bạn.'
                ) : (
                  <>
                    Tài khoản <strong className="text-slate-800">{currentUserRole.fullName}</strong> ({currentUserRole.roleName}) không có quyền xem sheet này.
                  </>
                )}
              </p>
            </div>
            {isGuestBlocked ? (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => handleEmailLogin(OWNER_EMAIL, 'Trúc Giàu Trương (Chủ tài khoản)')}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
                >
                  <Crown className="w-3.5 h-3.5 mr-1.5" />
                  Đăng nhập Chủ sở hữu ({OWNER_EMAIL})
                </button>
                <button
                  onClick={() => setIsQuickLoginOpen(true)}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  Đăng nhập tài khoản khác
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Vui lòng liên hệ Chủ tài khoản ({OWNER_EMAIL}) để được phân quyền mở khóa.
              </p>
            )}
          </div>
        ) : (
          <div>
            {activeTab === 'nhap' && (
              <ImportSheet
                imports={imports}
                suppliers={suppliers}
                onAddImport={handleAddImport}
                onDeleteImport={handleDeleteImport}
                currentUserRole={currentUserRole}
                sheetPermission={currentSheetPermission}
              />
            )}

            {activeTab === 'xuat' && (
              <ExportSheet
                exports={exports}
                imports={imports}
                onAddExport={handleAddExport}
                onDeleteExport={handleDeleteExport}
                currentUserRole={currentUserRole}
                sheetPermission={currentSheetPermission}
                inventoryMap={inventoryMap}
              />
            )}

            {activeTab === 'tonKho' && (
              <InventorySheet
                imports={imports}
                exports={exports}
                minStocks={minStocks}
                onUpdateMinStock={handleUpdateMinStock}
                currentUserRole={currentUserRole}
                sheetPermission={currentSheetPermission}
                onNavigateToImportWithItem={(_code, _name) => {
                  setActiveTab('nhap');
                }}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardSheet
                imports={imports}
                exports={exports}
                suppliers={suppliers}
                minStocks={minStocks}
                onNavigateToTab={setActiveTab}
              />
            )}

            {activeTab === 'phanQuyen' && (
              <PermissionsSheet
                users={users}
                currentUserRole={currentUserRole}
                isOwner={isOwner}
                loggedInEmail={user?.email}
                roleDefinitions={roleDefinitions}
                onUpdateUserRole={handleUpdateUserRole}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
                onAddRoleDefinition={handleAddRoleDefinition}
                onDeleteRoleDefinition={handleDeleteRoleDefinition}
                onSelectActiveRole={handleSelectRole}
              />
            )}

            {activeTab === 'ncc' && (
              <SupplierSheet
                suppliers={suppliers}
                onAddSupplier={handleAddSupplier}
                onUpdateSupplier={handleUpdateSupplier}
                onDeleteSupplier={handleDeleteSupplier}
                currentUserRole={currentUserRole}
                sheetPermission={currentSheetPermission}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hệ thống Quản lý Nguyên Vật Liệu Google Sheets &bull; 6 Sheets Chuẩn Hóa</span>
          </div>
          <div className="flex items-center space-x-4 font-medium">
            <span>Vai trò hiện tại: <strong className="text-slate-900">{currentUserRole.roleName}</strong></span>
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-800 underline flex items-center font-semibold"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                Mở Google Spreadsheet
              </a>
            )}
          </div>
        </div>
      </footer>

      {/* Google Sheet Sync Modal */}
      <GoogleSheetModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        spreadsheetId={spreadsheetId}
        spreadsheetUrl={spreadsheetUrl}
        lastSyncedAt={lastSyncedAt}
        isCreating={isCreatingSheet}
        onConfirmCreateOrSync={handleCreateOrSyncGoogleSheet}
        user={user}
        onLogin={handleGoogleLogin}
      />

      {/* Direct / Quick Login Modal for GitHub Pages */}
      <QuickLoginModal
        isOpen={isQuickLoginOpen}
        onClose={() => setIsQuickLoginOpen(false)}
        users={users}
        onSelectUser={handleEmailLogin}
        onGoogleLogin={handleGoogleLogin}
      />
    </div>
  );
}
