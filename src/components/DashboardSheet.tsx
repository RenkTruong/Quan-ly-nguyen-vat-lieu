import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Boxes, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Lightbulb, 
  Truck,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ImportRecord, ExportRecord, Supplier } from '../types/inventory';
import { formatVND, formatNumber } from '../utils/codeGenerator';

interface DashboardSheetProps {
  imports: ImportRecord[];
  exports: ExportRecord[];
  suppliers: Supplier[];
  minStocks: Record<string, number>;
  onNavigateToTab?: (tab: any) => void;
}

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4'];

export const DashboardSheet: React.FC<DashboardSheetProps> = ({
  imports,
  exports,
  suppliers,
  minStocks,
  onNavigateToTab
}) => {
  // 1. Tính toán Tồn kho & Đánh giá
  const uniqueCodes = Array.from(new Set(imports.map((i) => i.maHangHoa)));
  
  const stockComparisonData = uniqueCodes.map((code) => {
    const item = imports.find((i) => i.maHangHoa === code);
    const totalNhap = imports
      .filter((i) => i.maHangHoa === code)
      .reduce((sum, i) => sum + i.soLuongNhap, 0);
    const totalXuat = exports
      .filter((e) => e.maHangHoa === code)
      .reduce((sum, e) => sum + e.soLuongXuat, 0);
    const tonKho = totalNhap - totalXuat;
    const tonToiThieu = minStocks[code] ?? 10;
    const canNhap = tonKho <= tonToiThieu;

    return {
      maHangHoa: code,
      name: item?.tenHangHoa || code,
      dvt: item?.donViTinh || '',
      tonKho,
      tonToiThieu,
      status: canNhap ? 'Cần nhập hàng' : 'Tồn kho ở mức ổn'
    };
  });

  // 2. Thống kê tỷ lệ Cần nhập vs Mức ổn
  const needReorderList = stockComparisonData.filter((i) => i.status === 'Cần nhập hàng');
  const safeStockList = stockComparisonData.filter((i) => i.status === 'Tồn kho ở mức ổn');

  const statusPieData = [
    { name: 'Tồn kho ở mức ổn', value: safeStockList.length, color: '#10b981' },
    { name: 'Cần nhập hàng ngay', value: needReorderList.length, color: '#f43f5e' }
  ];

  // 3. Thống kê Chi phí nhập theo Nhà cung cấp
  const supplierSpendData = suppliers.map((sup) => {
    const totalSpend = imports
      .filter((i) => i.ncc === sup.tenNCC)
      .reduce((sum, i) => sum + i.thanhTien, 0);
    return {
      name: sup.tenNCC.length > 22 ? sup.tenNCC.slice(0, 22) + '...' : sup.tenNCC,
      fullName: sup.tenNCC,
      chiPhi: totalSpend
    };
  }).filter((s) => s.chiPhi > 0);

  // 4. Lịch sử luân chuyển nhập - xuất theo thời gian
  const dateFlowMap = new Map<string, { date: string; nhap: number; xuat: number }>();

  imports.forEach((imp) => {
    const d = imp.thoiGianNhap.split(' ')[1] || imp.thoiGianNhap;
    const cur = dateFlowMap.get(d) || { date: d, nhap: 0, xuat: 0 };
    cur.nhap += imp.soLuongNhap;
    dateFlowMap.set(d, cur);
  });

  exports.forEach((exp) => {
    const d = exp.ngayXuat.split(' ')[1] || exp.ngayXuat;
    const cur = dateFlowMap.get(d) || { date: d, nhap: 0, xuat: 0 };
    cur.xuat += exp.soLuongXuat;
    dateFlowMap.set(d, cur);
  });

  const timeFlowData = Array.from(dateFlowMap.values());

  // KPIs
  const totalItems = uniqueCodes.length;
  const totalCost = imports.reduce((sum, i) => sum + i.thanhTien, 0);
  const expiredItems = imports.filter((i) => i.conSuDung === 'Hết hạn sử dụng');

  return (
    <div className="space-y-6">
      {/* Title & Introduction */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                4. Sheet Dashboard: Biểu Đồ Tổng Quan &amp; Chính Sách Tối Ưu
              </h2>
              <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
                Phân tích kho trực quan
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Theo dõi định mức tồn an toàn, phát hiện thiếu hụt, kiểm soát hạn sử dụng và đề xuất chính sách thu mua tối ưu
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-purple-800 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Tự động đồng bộ với Google Sheets</span>
          </div>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng chủng loại NVL</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalItems} <span className="text-sm font-normal text-slate-500">mã</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng chi phí nhập kho</p>
            <p className="text-lg font-black text-emerald-700 mt-0.5">{formatVND(totalCost)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            needReorderList.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cần nhập hàng gấp</p>
            <p className={`text-2xl font-black mt-0.5 ${needReorderList.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {needReorderList.length} <span className="text-sm font-normal text-slate-500">mặt hàng</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            expiredItems.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cảnh báo HSD</p>
            <p className={`text-2xl font-black mt-0.5 ${expiredItems.length > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
              {expiredItems.length} <span className="text-sm font-normal text-slate-500">hết hạn</span>
            </p>
          </div>
        </div>
      </div>

      {/* Primary Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ 1: Tồn kho thực tế vs Tồn tối thiểu */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">So Sánh Tồn Kho Khả Dụng vs Tồn Tối Thiểu</h3>
              <p className="text-xs text-slate-500">Mã có cột tồn kho thấp hơn định mức cần kích hoạt đơn mua ngay</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium">
              Đơn vị: ĐVT riêng
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="maHangHoa" angle={-25} textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${formatNumber(Number(value))}`,
                    name === 'tonKho' ? 'Tồn kho hiện tại' : 'Định mức tối thiểu'
                  ]}
                  labelFormatter={(label) => {
                    const item = stockComparisonData.find((i) => i.maHangHoa === label);
                    return `${label} - ${item?.name}`;
                  }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="tonKho" name="Tồn kho thực tế" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tonToiThieu" name="Tồn tối thiểu" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ 2: Cơ cấu trạng thái Nhập mới */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Cơ Cấu An Toàn Tồn Kho</h3>
          <p className="text-xs text-slate-500 mb-2">Tỷ lệ mặt hàng ở mức ổn định vs Cần nhập</p>

          <div className="h-56 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => [`${val} mặt hàng`, 'Số lượng']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />
                Tồn kho ở mức ổn:
              </span>
              <span className="font-bold text-slate-900">{safeStockList.length} mã</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-2" />
                Cần nhập hàng ngay:
              </span>
              <span className="font-bold text-rose-600">{needReorderList.length} mã</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Luồng Nhập/Xuất & Phân Bổ Chi Phí NCC */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ 3: Diễn biến Nhập vs Xuất theo ngày */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Xu Hướng Luân Chuyển Nhập &amp; Xuất</h3>
          <p className="text-xs text-slate-500 mb-4">Theo dõi khối lượng nhập và xuất kho theo ngày giao dịch</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNhap" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorXuat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="nhap" name="Tổng lượng nhập" stroke="#10b981" fillOpacity={1} fill="url(#colorNhap)" />
                <Area type="monotone" dataKey="xuat" name="Tổng lượng xuất" stroke="#f59e0b" fillOpacity={1} fill="url(#colorXuat)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ 4: Chi phí theo Nhà cung cấp */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Cơ Cấu Giá Trị Nhập Hàng Theo NCC</h3>
          <p className="text-xs text-slate-500 mb-4">Xác định các đối tác chủ lực để tối ưu đàm phán thương mại</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplierSpendData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v/1000000).toFixed(0)}Tr`} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(val: any) => [formatVND(Number(val)), 'Tổng chi phí']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="chiPhi" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {supplierSpendData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CHÍNH SÁCH TỐI ƯU KHO NGUYÊN VẬT LIỆU */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-700">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Chính Sách &amp; Khuyến Nghị Tối Ưu Hàng Hóa Dành Cho Doanh Nghiệp
            </h3>
            <p className="text-xs text-slate-300">
              Được trích xuất trực tiếp từ các chỉ số báo cáo tồn kho &amp; nhà cung cấp
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>1. Điểm đặt hàng lại (Reorder Point)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Hiện có <strong className="text-rose-400">{needReorderList.length} mặt hàng</strong> (
              {needReorderList.map((i) => i.name).join(', ')}) rơi vào dưới mức tồn tối thiểu.
              Cần kích hoạt đơn mua bổ sung trong vòng 48h để tránh đình trệ phân xưởng.
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>2. Chiến lược xuất kho FIFO &amp; HSD</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Lô <strong className="text-amber-300">Hương liệu Chanh</strong> (HSD 01/08/2026) đã quá hạn, cần lập biên bản thanh lý hoặc kiểm định lại. Ưu tiên xuất trước lô <strong className="text-amber-300">Xi măng Hà Tiên</strong> (HSD 15/12/2026).
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <Truck className="w-4 h-4" />
              <span>3. Tối ưu chiết khấu &amp; dòng tiền NCC</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Nhà cung cấp <strong>Công ty CP Bột giặt LIX</strong> áp dụng chính sách chiết khấu 3% thanh toán sớm. Doanh nghiệp nên chủ động gom đơn để tối ưu chi phí nguyên vật liệu.
            </p>
          </div>
        </div>

        {onNavigateToTab && (
          <div className="flex justify-end pt-2">
            <button
              onClick={() => onNavigateToTab('tonKho')}
              className="inline-flex items-center text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
            >
              Kiểm tra chi tiết bảng Tồn kho ngay
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
