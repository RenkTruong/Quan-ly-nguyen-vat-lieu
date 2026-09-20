import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { 
  ImportRecord, 
  ExportRecord, 
  Supplier, 
  UserRole, 
  SheetId 
} from './types/inventory';
import { 
  initialImports, 
  initialExports, 
  initialSuppliers, 
  initialUsers, 
  initialMinStocks 
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
import { Lock, FileSpreadsheet, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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

  const [minStocks, setMinStocks] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('nvl_min_stocks');
    return saved ? JSON.parse(saved) : initialMinStocks;
  });

  // Role & Tab state
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(initialUsers[0]);
  const [activeTab, setActiveTab] = useState<SheetId>('nhap');

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
    localStorage.setItem('nvl_min_stocks', JSON.stringify(minStocks));
  }, [minStocks]);

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuth((firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthLoading(false);

      if (firebaseUser?.email) {
        // Find or map user in our role system
        const matched = users.find((u) => u.email.toLowerCase() === firebaseUser.email?.toLowerCase());
        if (matched) {
          setCurrentUserRole(matched);
        } else {
          // If first time login, set as active role or keep current role mapped to user email
          setCurrentUserRole((prev) => ({
            ...prev,
            email: firebaseUser.email || prev.email,
            fullName: firebaseUser.displayName || prev.fullName
          }));
        }
      }
    });

    return () => unsubscribe();
  }, [users]);

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

  // Auth handler with friendly error display
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setAuthErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      const code = err?.code || '';
      if (code === 'auth/unauthorized-domain') {
        setAuthErrorMessage(
          'Tên miền GitHub Pages (renktruong.github.io) chưa được thêm vào danh sách "Authorized Domains" trong Firebase Authentication. Vui lòng thêm "renktruong.github.io" vào Firebase Console > Authentication > Settings > Authorized domains.'
        );
      } else if (code === 'auth/popup-blocked') {
        setAuthErrorMessage('Trình duyệt đã chặn cửa sổ Popup đăng nhập. Vui lòng cho phép Pop-up trên trình duyệt.');
      } else if (code === 'auth/popup-closed-by-user') {
        // User closed popup, no need to show scary error
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
  const isCurrentTabHidden = currentSheetPermission?.access === 'hidden';

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
        onLogout={signOutUser}
        isLoggingIn={isAuthLoading}
        spreadsheetId={spreadsheetId}
        spreadsheetUrl={spreadsheetUrl}
        isCreatingSheet={isCreatingSheet}
        onCreateOrSyncSheet={() => setIsSheetModalOpen(true)}
        lastSyncedAt={lastSyncedAt}
      />

      {/* Auth Error Banner if domain is not authorized in Firebase */}
      {authErrorMessage && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start space-x-3 text-amber-900 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm space-y-1">
              <div className="font-bold flex items-center justify-between">
                <span>Thông báo kết nối tài khoản Google:</span>
                <button
                  onClick={() => setAuthErrorMessage(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-amber-800 leading-relaxed">{authErrorMessage}</p>
              <div className="pt-1 text-xs text-amber-700">
                <strong>Gợi ý:</strong> Bạn vẫn có thể sử dụng 100% đầy đủ chức năng của app (Nhập, Xuất, Tồn kho, Biểu đồ, Quản lý NCC, Phân quyền) bằng bộ mô phỏng vai trò (Role Switcher) ở góc trên bên phải thanh menu.
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
        />

        {/* Content Area with Role-Based Access Enforcement */}
        {isCurrentTabHidden ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-4 max-w-lg mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Truy Cập Bị Giới Hạn</h3>
              <p className="text-sm text-slate-500 mt-1">
                Tài khoản <strong className="text-slate-800">{currentUserRole.fullName}</strong> ({currentUserRole.roleName}) không có quyền xem sheet này.
              </p>
            </div>
            <p className="text-xs text-slate-400">
              Vui lòng liên hệ Quản trị viên hệ thống để được cấp quyền mở khóa.
            </p>
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
                onUpdateUserRole={handleUpdateUserRole}
                onAddUser={handleAddUser}
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
    </div>
  );
}
