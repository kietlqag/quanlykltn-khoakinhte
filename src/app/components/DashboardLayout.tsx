import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Outlet, NavLink, useNavigate } from 'react-router';
import {
  GraduationCap,
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
} from 'lucide-react';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Menu items based on role
  const getMenuItems = () => {
    if (user?.role === 'SV') {
      return [
        { to: '/dashboard', icon: Home, label: 'Thông tin chung', end: true },
        { to: '/dashboard/register', icon: FileText, label: 'Đăng ký đề tài' },
        { to: '/dashboard/status', icon: ClipboardList, label: 'Theo dõi trạng thái' },
        { to: '/dashboard/profile', icon: User, label: 'Thông tin cá nhân' },
      ];
    } else if (user?.role === 'GV' || user?.role === 'TBM') {
      const teacherMenus = [
        { to: '/dashboard', icon: Home, label: 'Thông tin chung', end: true },
        { to: '/dashboard/advising', icon: Users, label: 'Hướng dẫn' },
        { to: '/dashboard/reviewing', icon: UserCheck, label: 'Phản biện' },
        { to: '/dashboard/council', icon: MessageSquare, label: 'Hội đồng' },
        { to: '/dashboard/chairman', icon: Shield, label: 'Chủ tịch' },
        { to: '/dashboard/secretary', icon: UserCog, label: 'Thư ký' },
        { to: '/dashboard/suggestions', icon: Lightbulb, label: 'Gợi ý đề tài' },
      ];

      // TBM has all teacher menus + TBM specific menus
      if (user?.role === 'TBM') {
        return [
          ...teacherMenus,
          { to: '/dashboard/teacher-approval', icon: UserCheck, label: 'Duyệt giảng viên', divider: true },
          { to: '/dashboard/assign-reviewer', icon: Users, label: 'Phân công phản biện' },
          { to: '/dashboard/assign-council', icon: MessageSquare, label: 'Phân công hội đồng' },
          { to: '/dashboard/statistics', icon: BarChart3, label: 'Thống kê' },
          { to: '/dashboard/profile', icon: User, label: 'Thông tin cá nhân' },
        ];
      }

      return [
        ...teacherMenus,
        { to: '/dashboard/profile', icon: User, label: 'Thông tin cá nhân' },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Quản lý KLTN</h2>
              <p className="text-xs text-gray-500">HCMUTE</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-medium">
              {user?.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-500">
                {user?.role === 'SV' && 'Sinh viên'}
                {user?.role === 'GV' && 'Giảng viên'}
                {user?.role === 'TBM' && 'Trưởng bộ môn'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item, index) => (
              <React.Fragment key={item.to}>
                {item.divider && (
                  <li className="py-3">
                    <div className="border-t border-gray-200"></div>
                    <p className="text-xs text-gray-500 mt-3 px-4 font-medium uppercase tracking-wider">
                      Quản lý TBM
                    </p>
                  </li>
                )}
                <li>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </NavLink>
                </li>
              </React.Fragment>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200 space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}