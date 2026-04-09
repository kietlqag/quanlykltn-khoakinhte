import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Users, UserCheck, MessageSquare, CheckCircle } from 'lucide-react';

export function TeacherDashboard() {
  const { user } = useAuth();
  const { thesisRegistrations, councils } = useData();

  const advisingCount = thesisRegistrations.filter((r) => r.advisorId === user?.id).length;
  const reviewingCount = thesisRegistrations.filter((r) => r.reviewerId === user?.id).length;
  const councilCount = councils.filter(
    (c) => c.chairmanId === user?.id || c.secretaryId === user?.id || c.members.includes(user?.id || '')
  ).length;
  const approvedCount = thesisRegistrations.filter(
    (r) => r.advisorId === user?.id && r.status !== 'pending' && r.status !== 'advisor_rejected'
  ).length;

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Xin chào, {user?.fullName}!
        </h1>
        <p className="text-gray-600">Quản lý khóa luận tốt nghiệp</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Hướng dẫn</p>
              <p className="text-3xl font-bold text-gray-900">{advisingCount}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Phản biện</p>
              <p className="text-3xl font-bold text-gray-900">{reviewingCount}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Hội đồng</p>
              <p className="text-3xl font-bold text-gray-900">{councilCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Đã duyệt</p>
              <p className="text-3xl font-bold text-gray-900">{approvedCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Thông tin cá nhân</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-32">Họ và tên:</span>
            <span className="text-sm font-medium text-gray-900">{user?.fullName}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-32">Email:</span>
            <span className="text-sm font-medium text-gray-900">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-32">Khoa:</span>
            <span className="text-sm font-medium text-gray-900">{user?.faculty}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-32">Chuyên môn:</span>
            <div className="flex flex-wrap gap-2">
              {user?.expertise?.map((exp) => (
                <span key={exp} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  {exp}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-32">Quota:</span>
            <span className="text-sm font-medium text-gray-900">{user?.quota || 0} sinh viên</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-3">Hướng dẫn sử dụng</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Vào tab "Hướng dẫn" để xem danh sách sinh viên cần duyệt đề tài</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Sau khi sinh viên nộp bài, upload file Turnitin và chấm điểm</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Kiểm tra tab "Phản biện" và "Hội đồng" để xem các công việc được phân công</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Nếu là Chủ tịch hoặc Thư ký hội đồng, truy cập các tab tương ứng để quản lý</span>
          </li>
        </ul>
      </div>
    </div>
  );
}