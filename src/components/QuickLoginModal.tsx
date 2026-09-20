import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Crown, 
  ShieldCheck, 
  User as UserIcon, 
  CheckCircle2, 
  LogIn,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../types/inventory';
import { OWNER_EMAIL } from '../data/initialData';

interface QuickLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserRole[];
  onSelectUser: (email: string, fullName: string) => void;
  onGoogleLogin: () => void;
}

export const QuickLoginModal: React.FC<QuickLoginModalProps> = ({
  isOpen,
  onClose,
  users,
  onSelectUser,
  onGoogleLogin
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const name = customName.trim() || customEmail.split('@')[0];
    onSelectUser(customEmail.trim(), name);
    onClose();
  };

  const handleQuickPick = (email: string, fullName: string) => {
    onSelectUser(email, fullName);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Đăng Nhập Hệ Thống Quản Lý</h3>
              <p className="text-xs text-slate-300">Hoạt động 100% trên GitHub Pages &amp; mọi trình duyệt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Quick Login As Owner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center">
                <Crown className="w-4 h-4 mr-1 text-amber-600" />
                Chủ tài khoản hệ thống (Owner)
              </span>
              <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                Toàn quyền quản trị
              </span>
            </div>
            <p className="text-xs text-amber-800">
              Đăng nhập trực tiếp với email Chủ sở hữu để quản trị phân quyền, thêm/xóa tài khoản và cấu hình toàn bộ hệ thống.
            </p>
            <button
              onClick={() => handleQuickPick(OWNER_EMAIL, 'Trúc Giàu Trương (Chủ tài khoản)')}
              className="w-full mt-2 inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
            >
              <Crown className="w-4 h-4 mr-2" />
              Đăng nhập ngay: {OWNER_EMAIL}
            </button>
          </div>

          {/* Quick Select Configured Users */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Hoặc chọn tài khoản nhân viên đã phân quyền:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {users.map((u) => {
                const isOwner = u.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
                return (
                  <button
                    key={u.email}
                    onClick={() => handleQuickPick(u.email, u.fullName)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all hover:shadow-xs cursor-pointer ${
                      isOwner
                        ? 'bg-amber-50/50 border-amber-200 hover:bg-amber-100/50'
                        : 'bg-slate-50 border-slate-200 hover:bg-indigo-50/60 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {u.fullName.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">{u.fullName}</span>
                          {isOwner && <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono block truncate">{u.email}</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="inline-block text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                        {u.roleName}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Email Form */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Đăng nhập bằng Email khác:
            </label>
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="Nhập địa chỉ email của bạn..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Họ và tên (không bắt buộc)"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập Bằng Email Này</span>
              </button>
            </form>
          </div>

          {/* Option: Login with Google OAuth */}
          <div className="pt-3 border-t border-slate-200 text-center">
            <p className="text-[11px] text-slate-500 mb-2">
              Nếu bạn đang mở trên môi trường được cấp phép Google:
            </p>
            <button
              onClick={() => {
                onClose();
                onGoogleLogin();
              }}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
            >
              <svg className="w-3.5 h-3.5 mr-2" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Thử Đăng Nhập Bằng Cửa Sổ Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
