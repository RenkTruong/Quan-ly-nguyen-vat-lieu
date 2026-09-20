import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Table, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { User } from 'firebase/auth';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastSyncedAt: string | null;
  isCreating: boolean;
  onConfirmCreateOrSync: () => Promise<void>;
  user: User | null;
  onLogin: () => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  spreadsheetId,
  spreadsheetUrl,
  lastSyncedAt,
  isCreating,
  onConfirmCreateOrSync,
  user,
  onLogin
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleActionClick = () => {
    if (!user) {
      onLogin();
      return;
    }
    setShowConfirm(true);
  };

  const handleExecute = async () => {
    setShowConfirm(false);
    setErrorMessage(null);
    try {
      await onConfirmCreateOrSync();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi thao tác Google Sheet');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Google Sheets Quản Lý Nguyên Vật Liệu
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Đồng bộ hóa 6 Sheets chuẩn hóa thời gian thực với Google Drive của bạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
          >
            &times;
          </button>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Existing Spreadsheet Status */}
        {spreadsheetUrl ? (
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-emerald-950 text-sm">File Google Sheet Đã Sẵn Sàng</span>
              </div>
              <span className="text-[11px] text-emerald-800 bg-emerald-100 font-mono px-2 py-0.5 rounded">
                ID: {spreadsheetId?.slice(0, 12)}...
              </span>
            </div>

            <p className="text-xs text-emerald-800 leading-relaxed">
              Bảng tính của bạn đã được thiết lập đầy đủ 6 Sheets với công thức liên kết động (VLOOKUP, SUMIFS, IF, kiểm định HSD). Bạn có thể mở trực tiếp trên Google Sheets để làm việc cùng đồng nghiệp hoặc cập nhật dữ liệu từ ứng dụng này.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors cursor-pointer"
              >
                Mở Trên Google Sheets
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </a>

              <button
                onClick={handleActionClick}
                disabled={isCreating}
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isCreating ? 'animate-spin' : ''}`} />
                {isCreating ? 'Đang đồng bộ...' : 'Ghi Đè & Cập Nhật Dữ Liệu'}
              </button>
            </div>

            {lastSyncedAt && (
              <p className="text-[11px] text-emerald-700 font-mono">
                Lần đồng bộ cuối: {lastSyncedAt}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Chưa tạo file Google Sheet</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Nhấn nút bên dưới để tạo ngay 1 file Google Spreadsheet mới trong Google Drive của bạn. Hệ thống sẽ tự động cấu trúc chuẩn xác 6 sheets với tiêu đề, màu sắc, công thức tính toán tự động và định dạng số.
            </p>
          </div>
        )}

        {/* 6 Sheets Architecture Overview */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
            <Table className="w-4 h-4 mr-1.5 text-slate-500" />
            Cấu Trúc 6 Sheets Được Tự Động Thiết Lập:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/30">
              <div className="font-bold text-emerald-950 flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                1. Sheet Nhập (Lịch sử nhập)
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Mã <code className="font-mono text-[10px] text-emerald-800">LL-BG-0001</code> &bull; Công thức Thành tiền <code className="font-mono text-[10px]">=D*E</code> &bull; Kiểm tra HSD &bull; Chọn NCC
              </p>
            </div>

            <div className="p-3 rounded-xl border border-amber-100 bg-amber-50/30">
              <div className="font-bold text-amber-950 flex items-center">
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                2. Sheet Xuất (Lịch sử xuất)
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Dropdown mã hàng hóa &bull; Công thức <code className="font-mono text-[10px]">=VLOOKUP</code> lấy Tên hàng &amp; ĐVT &bull; Tự động người xuất
              </p>
            </div>

            <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/30">
              <div className="font-bold text-blue-950 flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                3. Sheet Tồn kho (Theo ngày)
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Bộ lọc ngày &bull; Mã duy nhất &bull; Công thức <code className="font-mono text-[10px]">=SUMIFS</code> Tổng nhập, Tổng xuất, Chi phí &bull; Cảnh báo Nhập mới
              </p>
            </div>

            <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/30">
              <div className="font-bold text-purple-950 flex items-center">
                <span className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
                4. Sheet Dashboard
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Chỉ số tổng hợp kho &bull; Bảng khuyến nghị chính sách đặt hàng lại &bull; Quản lý FIFO tối ưu
              </p>
            </div>

            <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/30">
              <div className="font-bold text-indigo-950 flex items-center">
                <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2" />
                5. Sheet Phân quyền
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Bảng ma trận người dùng &bull; Quyền Xem / Chỉnh sửa / Khóa từng Sheet &amp; ẩn cột bảo mật giá vốn
              </p>
            </div>

            <div className="p-3 rounded-xl border border-teal-100 bg-teal-50/30">
              <div className="font-bold text-teal-950 flex items-center">
                <span className="w-2 h-2 rounded-full bg-teal-500 mr-2" />
                6. Sheet Data NCC
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Đủ 8 trường: Tên, Người liên hệ, SĐT, Địa chỉ, Thông tin, Ngân hàng, STK, Ghi chú
              </p>
            </div>
          </div>
        </div>

        {/* Confirmation Step for Mutating Workspace Operations */}
        {showConfirm ? (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 space-y-3">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Xác Nhận Tạo / Cập Nhật File Trên Google Drive</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Hành động này sẽ gọi trực tiếp Google Sheets API với quyền tài khoản Google của bạn (<strong>{user?.email}</strong>) để khởi tạo hoặc ghi dữ liệu nguyên vật liệu vào bảng tính. Bạn có xác nhận thực hiện không?
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleExecute}
                disabled={isCreating}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Tôi Xác Nhận Tạo / Đồng Bộ'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Đóng
            </button>

            {!spreadsheetUrl && (
              <button
                onClick={handleActionClick}
                disabled={isCreating}
                className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {user ? 'Tạo File Google Sheet Ngay Bây Giờ' : 'Đăng Nhập Google Để Tạo File'}
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
