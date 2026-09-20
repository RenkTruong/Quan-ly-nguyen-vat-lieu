import React from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut,
  ChevronDown
} from 'lucide-react';
import { User } from 'firebase/auth';
import { UserRole } from '../types/inventory';

interface NavbarProps {
  user: User | null;
  currentUserRole: UserRole;
  allUserRoles: UserRole[];
  onSelectUserRole: (role: UserRole) => void;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  isCreatingSheet: boolean;
  onCreateOrSyncSheet: () => void;
  lastSyncedAt: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentUserRole,
  allUserRoles,
  onSelectUserRole,
  onLogin,
  onLogout,
  isLoggingIn,
  spreadsheetId,
  spreadsheetUrl,
  isCreatingSheet,
  onCreateOrSyncSheet,
  lastSyncedAt
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">Quản Lý Nguyên Vật Liệu</span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full font-medium">
                  Google Sheets Hub
                </span>
              </div>
              <p className="text-xs text-slate-400">Hệ thống kho tự động 6 Sheets chuẩn hóa</p>
            </div>
          </div>

          {/* Action Center: Google Sheet Sync & User RBAC Switcher */}
          <div className="flex items-center space-x-3">
            {/* Sheet Actions */}
            {spreadsheetUrl ? (
              <div className="flex items-center space-x-2">
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white shadow transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                  Mở Google Sheet
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
                <button
                  onClick={onCreateOrSyncSheet}
                  disabled={isCreatingSheet}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  title={lastSyncedAt ? `Đã đồng bộ lúc: ${lastSyncedAt}` : 'Đồng bộ dữ liệu'}
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isCreatingSheet ? 'animate-spin text-emerald-400' : ''}`} />
                  {isCreatingSheet ? 'Đang cập nhật...' : 'Cập nhật Sheet'}
                </button>
              </div>
            ) : (
              <button
                onClick={onCreateOrSyncSheet}
                disabled={isCreatingSheet}
                className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-emerald-900/40 transition-all cursor-pointer"
              >
                <FileSpreadsheet className={`w-4 h-4 mr-1.5 ${isCreatingSheet ? 'animate-spin' : ''}`} />
                {isCreatingSheet ? 'Đang tạo Google Sheet...' : 'Tạo 1 File Google Sheet'}
              </button>
            )}

            {/* Role Display / Switcher */}
            <div className="relative group">
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
                <span className="text-slate-400 mr-1">Vai trò:</span>
                <span className="font-semibold text-amber-300 max-w-[120px] truncate">
                  {user ? currentUserRole.roleName : 'Khách (Chỉ xem Tồn kho)'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </div>
              
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 hidden group-hover:block z-50">
                <div className="px-3 py-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider border-b border-slate-700 mb-1">
                  {user ? 'Tài khoản & Phân quyền đã cấu hình:' : 'Đăng nhập Google để nhận đúng vai trò:'}
                </div>
                {allUserRoles.map((ur) => (
                  <button
                    key={ur.email}
                    onClick={() => {
                      if (user) onSelectUserRole(ur);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex flex-col transition-colors ${
                      user && ur.email.toLowerCase() === currentUserRole.email.toLowerCase()
                        ? 'bg-slate-700/80 text-emerald-400 font-semibold'
                        : 'text-slate-200 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{ur.fullName}</span>
                      {ur.email.toLowerCase() === 'trucgiau.truong@gmail.com' && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">Chủ tài khoản</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{ur.roleName} ({ur.email})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Google Account Auth */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-emerald-500/50"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                    <UserIcon className="w-4 h-4 text-slate-300" />
                  </div>
                )}
                <button
                  onClick={onLogout}
                  className="text-slate-400 hover:text-rose-400 p-1 rounded-md transition-colors"
                  title="Đăng xuất Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-900 hover:bg-slate-100 transition-colors shadow-sm"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                {isLoggingIn ? 'Đang kết nối...' : 'Đăng nhập Google'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
