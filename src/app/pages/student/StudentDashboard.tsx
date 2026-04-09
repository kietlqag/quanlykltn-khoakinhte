import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export function StudentDashboard() {
  const { user } = useAuth();
  const { thesisRegistrations } = useData();

  const myRegistrations = thesisRegistrations.filter((r) => r.studentId === user?.id);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Chờ duyệt',
      advisor_approved: 'GV đã duyệt',
      advisor_rejected: 'GV từ chối',
      submitted: 'Đã nộp bài',
      graded: 'Đã chấm điểm',
      defended: 'Đã bảo vệ',
      revision_pending: 'Chờ duyệt chỉnh sửa',
      completed: 'Hoàn thành',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="max-w-6xl">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Xin chào, {user?.fullName}!
        </h1>
        <p className="text-gray-600">Chào mừng bạn đến với hệ thống quản lý khóa luận tốt nghiệp</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng số đăng ký</p>
              <p className="text-3xl font-bold text-gray-900">{myRegistrations.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Đang thực hiện</p>
              <p className="text-3xl font-bold text-gray-900">
                {myRegistrations.filter((r) => !['completed', 'advisor_rejected'].includes(r.status)).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Đã hoàn thành</p>
              <p className="text-3xl font-bold text-gray-900">
                {myRegistrations.filter((r) => r.status === 'completed').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* My Registrations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Đề tài của tôi</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {myRegistrations.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Bạn chưa đăng ký đề tài nào</p>
            </div>
          ) : (
            myRegistrations.map((reg) => (
              <div key={reg.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {reg.type}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                        {reg.period}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{reg.title}</h3>
                    <p className="text-sm text-gray-600">Lĩnh vực: {reg.field}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(reg.status)}
                    <span className="text-sm font-medium text-gray-700">
                      {getStatusText(reg.status)}
                    </span>
                  </div>
                </div>
                {reg.finalScore && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Điểm tổng kết: <span className="font-bold text-green-600">{reg.finalScore}</span>
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Important Notices */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-3">Thông báo quan trọng</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Sinh viên cần hoàn thành BCTT trước khi đăng ký KLTN</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Kiểm tra hạn nộp bài và nộp đúng thời gian quy định</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Sau khi bảo vệ, cần nộp bài chỉnh sửa theo góp ý của hội đồng</span>
          </li>
        </ul>
      </div>
    </div>
  );
}