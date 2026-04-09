import React from 'react';
import { useData } from '../../contexts/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle, X, Clock } from 'lucide-react';

export function TbmStatistics() {
  const { thesisRegistrations, users } = useData();

  const students = users.filter((u) => u.role === 'SV');

  // Status distribution
  const statusData = [
    { name: 'Chờ duyệt', value: thesisRegistrations.filter((r) => r.status === 'pending').length },
    { name: 'Đã duyệt', value: thesisRegistrations.filter((r) => r.status === 'advisor_approved').length },
    { name: 'Đã nộp', value: thesisRegistrations.filter((r) => r.status === 'submitted').length },
    { name: 'Hoàn thành', value: thesisRegistrations.filter((r) => r.status === 'completed').length },
  ];

  // Score distribution
  const scoreData = thesisRegistrations
    .filter((r) => r.finalScore)
    .map((r) => ({
      student: students.find((s) => s.id === r.studentId)?.fullName || 'N/A',
      score: r.finalScore,
      type: r.type,
    }));

  // Revision approval status
  const revisionData = thesisRegistrations.filter((r) => r.revisedPdfUrl);

  const COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Thống kê</h1>
        <p className="text-gray-600">Thống kê và báo cáo tổng quan hệ thống</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {statusData.map((stat, index) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
            <p className="text-3xl font-bold" style={{ color: COLORS[index] }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Phân bố trạng thái</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Score Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Điểm sinh viên</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreData.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="student" angle={-45} textAnchor="end" height={100} />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#3B82F6" name="Điểm" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revision Approval Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Trạng thái duyệt chỉnh sửa ({revisionData.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sinh viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đề tài
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GV HD
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chủ tịch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {revisionData.map((reg) => (
                <tr key={reg.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {students.find((s) => s.id === reg.studentId)?.fullName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                    {reg.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {reg.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {reg.advisorApprovalRevision ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {reg.chairmanApprovalRevision ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {reg.advisorApprovalRevision && reg.chairmanApprovalRevision ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Hoàn thành
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                        Đang xử lý
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {revisionData.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Chưa có sinh viên nào nộp bài chỉnh sửa
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
