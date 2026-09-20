import React from 'react';
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Boxes, 
  LayoutDashboard, 
  Users, 
  Truck,
  Lock
} from 'lucide-react';
import { UserRole } from '../types/inventory';

export type TabKey = 'nhap' | 'xuat' | 'tonKho' | 'dashboard' | 'phanQuyen' | 'ncc';

interface TabNavigationProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  currentUserRole: UserRole;
  reorderCount: number;
  expiredCount: number;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  currentUserRole,
  reorderCount,
  expiredCount
}) => {
  const tabs = [
    {
      key: 'nhap' as TabKey,
      title: '1. Nhập hàng',
      subtitle: 'Lịch sử nhập hàng',
      icon: ArrowDownToLine,
      color: 'emerald',
      badge: expiredCount > 0 ? `${expiredCount} hết hạn` : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      key: 'xuat' as TabKey,
      title: '2. Xuất hàng',
      subtitle: 'Lịch sử xuất hàng',
      icon: ArrowUpFromLine,
      color: 'amber'
    },
    {
      key: 'tonKho' as TabKey,
      title: '3. Tồn kho',
      subtitle: 'Báo cáo tồn theo ngày',
      icon: Boxes,
      color: 'blue',
      badge: reorderCount > 0 ? `${reorderCount} cần nhập` : undefined,
      badgeColor: 'bg-amber-500 text-slate-900'
    },
    {
      key: 'dashboard' as TabKey,
      title: '4. Dashboard',
      subtitle: 'Biểu đồ tổng quan & tối ưu',
      icon: LayoutDashboard,
      color: 'purple'
    },
    {
      key: 'phanQuyen' as TabKey,
      title: '5. Phân quyền',
      subtitle: 'Theo user & cột sheet',
      icon: Users,
      color: 'indigo'
    },
    {
      key: 'ncc' as TabKey,
      title: '6. Data NCC',
      subtitle: 'Danh bạ nhà cung cấp',
      icon: Truck,
      color: 'teal'
    }
  ];

  return (
    <div className="bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const sheetPerm = currentUserRole.sheets[tab.key];
            const isHidden = sheetPerm?.access === 'hidden';
            const isActive = activeTab === tab.key;

            if (isHidden) {
              return (
                <div
                  key={tab.key}
                  className="flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-xs font-medium text-slate-400 bg-slate-100/70 border border-dashed border-slate-200 cursor-not-allowed opacity-60"
                  title="Tài khoản của bạn không có quyền xem Sheet này"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{tab.title}</span>
                </div>
              );
            }

            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <div className="text-left">
                  <div className="font-semibold leading-none">{tab.title}</div>
                  <div className={`text-[10px] mt-0.5 ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                    {tab.subtitle}
                  </div>
                </div>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
