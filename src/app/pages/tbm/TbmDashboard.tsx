import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Users, FileText, CheckCircle, BarChart3, UserCheck, MessageSquare } from 'lucide-react';

export function TbmDashboard() {
  const { user } = useAuth();
  const { thesisRegistrations, users, councils } = useData();

  const teachers = users.filter((u) => u.role === 'GV');
  const students = users.filter((u) => u.role === 'SV');
  const totalRegistrations = thesisRegistrations.length;
  const completedRegistrations = thesisRegistrations.filter((r) => r.status === 'completed').length;
  const pendingApprovals = users.filter((u) => u.role === 'GV' && u.approvalStatus === 'pending');
  const readyForReviewer = thesisRegistrations.filter((r) => r.status === 'ready_for_reviewer');

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Xin chào, {user?.fullName}!
        </h1>
        <p className="text-gray-600">Quản lý toàn bộ hệ thống khóa luận tốt nghiệp</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Giảng viên</p>
              <p className="text-3xl font-bold text-gray-900">{teachers.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Sinh viên</p>
              <p className="text-3xl font-bold text-gray-900">{students.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng đăng ký</p>
              <p className="text-3xl font-bold text-gray-900">{totalRegistrations}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Hoàn thành</p>
              <p className="text-3xl font-bold text-gray-900">{completedRegistrations}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">Duyệt giảng viên</h3>
          </div>
          <p className="text-blue-50 text-sm mb-4">Duyệt giảng viên hướng dẫn cho sinh viên</p>
          <p className="text-2xl font-bold">{pendingApprovals.length} đang chờ</p>
        </div>

        <div className="bg-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">Phân công phản biện</h3>
          </div>
          <p className="text-purple-50 text-sm mb-4">Phân công giảng viên phản biện</p>
          <p className="text-2xl font-bold">{readyForReviewer.length} cần phân công</p>
        </div>

        <div className="bg-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">Phân công hội đồng</h3>
          </div>
          <p className="text-orange-50 text-sm mb-4">Lập hội đồng bảo vệ khóa luận</p>
          <p className="text-2xl font-bold">{councils.length} hội đồng</p>
        </div>

        <div className="bg-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">Thống kê</h3>
          </div>
          <p className="text-green-50 text-sm mb-4">Xem báo cáo và thống kê tổng quan</p>
          <p className="text-2xl font-bold">{thesisRegistrations.length} đề tài</p>
        </div>
      </div>
    </div>
  );
}