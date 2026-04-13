import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import hcmuteLogo from '../../assets/LogoHCMUTE-NoBG.png';
import {
  LogOut,
  Home,
  FileText,
  ClipboardList,
  Users,
  UserCheck,
  MessageSquare,
  Shield,
  UserCog,
  Lightbulb,
  BarChart3,
  User,
  Settings,
  CalendarDays,
} from 'lucide-react';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getMenuItems = () => {
    if (user?.role === 'SV') {
      return [
        { to: '/dashboard', icon: Home, label: 'Thông tin chung', end: true },
        { to: '/dashboard/register', icon: FileText, label: 'Đăng ký đề tài' },
        { to: '/dashboard/status', icon: ClipboardList, label: 'Theo dõi trạng thái' },
        { to: '/dashboard/profile', icon: User, label: 'Thông tin cá nhân' },
      ];
    }

    if (user?.role === 'GV' || user?.role === 'TBM') {
      const teacherMenus = [
        { to: '/dashboard', icon: Home, label: 'Thông tin cá nhân', end: true },
        { to: '/dashboard/advising', icon: Users, label: 'Hướng dẫn' },
        { to: '/dashboard/reviewing', icon: UserCheck, label: 'Phản biện' },
        { to: '/dashboard/council', icon: MessageSquare, label: 'Hội đồng' },
        { to: '/dashboard/chairman', icon: Shield, label: 'Chủ tịch' },
        { to: '/dashboard/secretary', icon: UserCog, label: 'Thư ký' },
        { to: '/dashboard/suggestions', icon: Lightbulb, label: 'Gợi ý đề tài' },
      ];

      if (user.role === 'TBM') {
        return [
          ...teacherMenus,
          { to: '/dashboard/teacher-approval', icon: Settings, label: 'Quản lý Quota', divider: true },
          { to: '/dashboard/create-dot', icon: CalendarDays, label: 'Quản lý đợt báo cáo' },
          { to: '/dashboard/assign-reviewer', icon: Users, label: 'Phân công PB' },
          { to: '/dashboard/assign-council', icon: MessageSquare, label: 'Phân công hội đồng' },
          { to: '/dashboard/statistics', icon: BarChart3, label: 'Thống kê' },
        ];
      }

      return teacherMenus;
    }

    return [];
  };

  const menuItems = getMenuItems();
  const activeTabLabel =
    menuItems.find((item) => {
      const isExact = Boolean(item.end);
      if (isExact) return location.pathname === item.to;
      return location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
    })?.label || 'Bảng điều khiển';

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <aside className="hcmute-scrollbar fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-[#214E9A] to-[#163B7A] text-white flex flex-col overflow-y-auto shadow-lg">
        <div className="p-5 bg-[#214E9A] border-b border-white/15 flex items-center justify-center">
          <img
            src={hcmuteLogo}
            alt="Logo HCMUTE"
            className="w-24 h-24 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
          />
        </div>

        <div className="p-4 border-b border-white/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D71920] rounded-full flex items-center justify-center text-white font-medium shadow-sm">
              {user?.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-white/75">
                {user?.role === 'SV' && 'Sinh viên'}
                {user?.role === 'GV' && 'Giảng viên'}
                {user?.role === 'TBM' && 'Trưởng bộ môn'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <React.Fragment key={item.to}>
                {item.divider && (
                  <li className="py-3">
                    <div className="border-t border-white/15" />
                    <p className="text-xs text-white/70 mt-3 px-4 font-medium uppercase tracking-wider">Quản lý TBM</p>
                  </li>
                )}
                <li>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex min-w-0 items-center gap-3 pr-4 pl-4 py-3 rounded-lg border-l-4 border-transparent transition-colors ${
                        isActive
                          ? 'bg-white/15 text-white ring-1 ring-white/20 border-[#D71920] pl-3'
                          : 'text-white/85 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="truncate whitespace-nowrap text-sm font-medium">{item.label}</span>
                  </NavLink>
                </li>
              </React.Fragment>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/15 space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className="ml-64 min-h-screen">
        <div className="sticky top-0 z-10 bg-[#214E9A] text-white shadow-sm">
          <div className="px-8 py-4">
            <h1 className="text-lg font-semibold tracking-wide">{activeTabLabel}</h1>
          </div>
        </div>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
