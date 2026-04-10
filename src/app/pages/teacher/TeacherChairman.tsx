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
    <div className="max-w-6xl mx-auto space-y-5">
      {(chairmanCouncils.length > 0
        ? chairmanCouncils.map((c) => ({ id: c.id, name: c.name }))
        : [{ id: '__empty__', name: 'Chưa có hội đồng' }]
      ).map((council) => {
        const students =
          council.id === '__empty__' ? [] : councilStudents.filter((r) => r.councilId === council.id);

        return (
          <div key={council.id}>
            <div className="inline-flex px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold mb-3">
              {council.name}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="hidden md:grid md:grid-cols-[2fr_2.8fr_2.2fr_0.8fr_1.6fr_1.6fr] gap-4 px-6 py-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <div>Sinh viên</div>
                <div>Tên đề tài</div>
                <div>Hồ sơ</div>
                <div className="text-center">Điểm</div>
                <div className="text-center">Trạng thái GVHD</div>
                <div className="text-center">Chỉnh sửa</div>
              </div>

              <div className="divide-y divide-gray-200">
                {students.map((reg) => (
                  <div key={reg.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_2.8fr_2.2fr_0.8fr_1.6fr_1.6fr] md:items-center">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{getStudentName(reg.studentId)}</div>
                        <div className="text-xs text-gray-500 mt-1 truncate">{reg.studentId}</div>
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{reg.title}</div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {reg.pdfUrl && (
                          <button
                            onClick={() => openIfUrl(reg.pdfUrl)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Bài làm
                          </button>
                        )}
                        {reg.turnitinUrl && (
                          <button
                            onClick={() => openIfUrl(reg.turnitinUrl)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Turnitin
                          </button>
                        )}
                        {reg.councilMinutesUrl && (
                          <button
                            onClick={() => openIfUrl(reg.councilMinutesUrl)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 rounded-lg text-xs font-medium text-indigo-700 hover:bg-indigo-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            BB hội đồng
                          </button>
                        )}
                        {reg.revisedPdfUrl && (
                          <button
                            onClick={() => openIfUrl(reg.revisedPdfUrl)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Bài sửa
                          </button>
                        )}
                        {reg.revisionExplanationUrl && (
                          <button
                            onClick={() => openIfUrl(reg.revisionExplanationUrl)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Giải trình
                          </button>
                        )}
                      </div>

                      <div className="md:text-center">
                        <span className="inline-flex items-center justify-center min-w-8 px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          {reg.councilScore ?? 0}
                        </span>
                      </div>

                      <div className="md:text-center">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                            reg.advisorApprovalRevision ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {reg.advisorApprovalRevision ? 'Đã duyệt' : 'Chưa duyệt'}
                        </span>
                      </div>

                      <div className="md:text-center">
                        {reg.revisedPdfUrl && reg.advisorApprovalRevision && !reg.chairmanApprovalRevision ? (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleApprove(reg.id, true)}
                              className="px-2.5 py-1 bg-green-600 text-white rounded-full text-xs font-semibold hover:bg-green-700"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => handleApprove(reg.id, false)}
                              className="px-2.5 py-1 bg-red-600 text-white rounded-full text-xs font-semibold hover:bg-red-700"
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                              reg.chairmanApprovalRevision ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {reg.chairmanApprovalRevision ? 'Đã duyệt' : '-'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {students.length === 0 && (
                  <div className="px-6 py-10 text-center text-sm text-gray-500">
                    Chưa có dữ liệu
                    <div className="hidden md:grid md:grid-cols-[2fr_2.8fr_2.2fr_0.8fr_1.6fr_1.6fr] gap-4 min-h-12 items-center text-sm text-transparent">
                      <div>.</div>
                      <div>.</div>
                      <div>.</div>
                      <div>.</div>
                      <div>.</div>
                      <div>.</div>
                    </div>
                    <div className="hidden text-center text-gray-500 text-sm">Chưa có hội đồng</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
