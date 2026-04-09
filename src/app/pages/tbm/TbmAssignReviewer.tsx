import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Save } from 'lucide-react';

export function TbmAssignReviewer() {
  const { thesisRegistrations, users, updateThesisRegistration } = useData();
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  const teachers = users.filter((u) => u.role === 'GV');
  const students = users.filter((u) => u.role === 'SV');
  const approvedRegistrations = thesisRegistrations.filter((r) => r.status === 'advisor_approved' || r.pdfUrl);

  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.fullName || 'N/A';
  };

  const getAdvisorName = (advisorId: string) => {
    return teachers.find((t) => t.id === advisorId)?.fullName || 'N/A';
  };

  const handleAssign = (regId: string) => {
    const reviewerId = assignments[regId];
    if (!reviewerId) {
      alert('Vui lòng chọn giảng viên phản biện');
      return;
    }
    updateThesisRegistration(regId, { reviewerId });
    alert('Đã phân công phản biện');
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Phân công phản biện</h1>
        <p className="text-gray-600">Phân công giảng viên phản biện cho các đề tài</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Danh sách đề tài ({approvedRegistrations.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {approvedRegistrations.map((reg) => (
            <div key={reg.id} className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {reg.type}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                    {reg.period}
                  </span>
                  {reg.reviewerId && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      Đã phân công
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{reg.title}</h3>
                <p className="text-sm text-gray-600">
                  Sinh viên: <span className="font-medium">{getStudentName(reg.studentId)}</span> | 
                  GVHD: <span className="font-medium">{getAdvisorName(reg.advisorId)}</span>
                </p>
              </div>

              <div className="flex gap-2">
                <select
                  value={assignments[reg.id] || reg.reviewerId || ''}
                  onChange={(e) => setAssignments({ ...assignments, [reg.id]: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Chọn GV phản biện</option>
                  {teachers
                    .filter((t) => t.id !== reg.advisorId)
                    .map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.fullName} - {teacher.expertise?.join(', ')}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => handleAssign(reg.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Lưu
                </button>
              </div>
            </div>
          ))}
          {approvedRegistrations.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Chưa có đề tài nào cần phân công phản biện
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
