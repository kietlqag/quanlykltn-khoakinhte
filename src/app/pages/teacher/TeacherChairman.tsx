import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { CheckCircle, X, Eye } from 'lucide-react';

export function TeacherChairman() {
  const { user } = useAuth();
  const { thesisRegistrations, councils, users, updateThesisRegistration } = useData();

  const chairmanCouncils = councils.filter((c) => c.chairmanId === user?.id);
  const councilIds = chairmanCouncils.map((c) => c.id);
  const councilStudents = thesisRegistrations.filter((r) => r.councilId && councilIds.includes(r.councilId));

  const getStudentName = (studentId: string) => {
    return users.find((u) => u.id === studentId)?.fullName || 'N/A';
  };

  const openIfUrl = (url?: string) => {
    if (!url) return;
    if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    alert('Tài liệu được lưu nội bộ trong Firestore.');
  };

  const handleApprove = (regId: string, approve: boolean) => {
    updateThesisRegistration(regId, {
      chairmanApprovalRevision: approve,
      status: approve ? 'completed' : 'revision_pending',
    });
    alert(approve ? 'Đã duyệt chỉnh sửa' : 'Đã từ chối chỉnh sửa');
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chủ tịch hội đồng</h1>
        <p className="text-gray-600">Duyệt chỉnh sửa bài làm sau khi bảo vệ</p>
      </div>

      {chairmanCouncils.map((council) => {
        const students = councilStudents.filter((r) => r.councilId === council.id);
        return (
          <div key={council.id} className="mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                <h2 className="text-lg font-semibold text-gray-900">{council.name}</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {students.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">Chưa có sinh viên</div>
                ) : (
                  students.map((reg) => (
                    <div key={reg.id} className="p-6">
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">
                          Sinh viên: <span className="font-medium text-gray-900">{getStudentName(reg.studentId)}</span>
                        </p>
                        <h3 className="font-semibold text-gray-900">{reg.title}</h3>
                      </div>

                      <div className="space-y-3">
                        <div className="flex gap-3 flex-wrap">
                          <button
                            onClick={() => openIfUrl(reg.pdfUrl)}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Xem bài nộp
                          </button>
                          {reg.turnitinUrl && (
                            <button
                              onClick={() => openIfUrl(reg.turnitinUrl)}
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Xem Turnitin
                            </button>
                          )}
                          {reg.councilMinutesUrl && (
                            <button
                              onClick={() => openIfUrl(reg.councilMinutesUrl)}
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Biên bản hội đồng
                            </button>
                          )}
                          {reg.revisedPdfUrl && (
                            <button
                              onClick={() => openIfUrl(reg.revisedPdfUrl)}
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Xem bài chỉnh sửa
                            </button>
                          )}
                          {reg.revisionExplanationUrl && (
                            <button
                              onClick={() => openIfUrl(reg.revisionExplanationUrl)}
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Biên bản giải trình
                            </button>
                          )}
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Trạng thái duyệt:</p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {reg.advisorApprovalRevision ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <X className="w-4 h-4 text-gray-400" />
                              )}
                              <span className="text-sm text-gray-700">
                                GV hướng dẫn: {reg.advisorApprovalRevision ? 'Đã duyệt' : 'Chưa duyệt'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {reg.chairmanApprovalRevision ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <X className="w-4 h-4 text-gray-400" />
                              )}
                              <span className="text-sm text-gray-700">
                                Chủ tịch: {reg.chairmanApprovalRevision ? 'Đã duyệt' : 'Chưa duyệt'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {reg.revisedPdfUrl && reg.advisorApprovalRevision && !reg.chairmanApprovalRevision && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(reg.id, true)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Duyệt chỉnh sửa
                            </button>
                            <button
                              onClick={() => handleApprove(reg.id, false)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Từ chối
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })}

      {chairmanCouncils.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Bạn không phải là chủ tịch hội đồng nào</p>
        </div>
      )}
    </div>
  );
}