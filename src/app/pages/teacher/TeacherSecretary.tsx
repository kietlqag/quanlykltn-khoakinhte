import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { db } from '../../../lib/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Eye, FileText, X } from 'lucide-react';

export function TeacherSecretary() {
  const { user } = useAuth();
  const { thesisRegistrations, councils, users, updateThesisRegistration } = useData();
  const [editingMinutes, setEditingMinutes] = useState<string | null>(null);
  const [councilComments, setCouncilComments] = useState<string>('');

  const secretaryCouncils = councils.filter((c) => c.secretaryId === user?.id);
  const councilIds = secretaryCouncils.map((c) => c.id);
  const councilStudents = thesisRegistrations.filter((r) => r.councilId && councilIds.includes(r.councilId));

  const getStudentName = (studentId: string) => {
    return users.find((u) => u.id === studentId)?.fullName || 'N/A';
  };

  const calculateFinalScore = (reg: any): string => {
    const scores = [reg.advisorScore, reg.reviewerScore, reg.councilScore].filter((s) => s !== undefined);
    return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 'N/A';
  };

  const openIfUrl = (url?: string) => {
    if (!url) return;
    if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    alert('Biên bản đã lưu trong Firestore, xem nội dung tại phần góp ý hội đồng.');
  };

  const handleSaveMinutes = async (regId: string) => {
    const reg = councilStudents.find((r) => r.id === regId);
    if (!reg) return;
    const finalScore = calculateFinalScore(reg);
    const finalScoreNumber = finalScore === 'N/A' ? null : Number(finalScore);

    await setDoc(
      doc(db, 'bienban', regId),
      {
        registrationId: regId,
        studentId: reg.studentId,
        title: reg.title,
        reviewerComments: reg.reviewerComments || '',
        councilComments,
        advisorScore: reg.advisorScore ?? null,
        reviewerScore: reg.reviewerScore ?? null,
        councilScore: reg.councilScore ?? null,
        finalScore: finalScoreNumber,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    updateThesisRegistration(regId, {
      councilMinutesUrl: `firestore://bienban/${regId}`,
      councilComments,
      finalScore: finalScoreNumber ?? undefined,
      status: finalScoreNumber !== null ? 'defended' : reg.status,
    });
    setEditingMinutes(null);
    setCouncilComments('');
    alert('Đã lưu biên bản hội đồng');
  };

  const handleFinishCouncil = (councilId: string) => {
    const students = councilStudents.filter((r) => r.councilId === councilId);
    students.forEach((reg) => {
      if (reg.councilMinutesUrl) {
        updateThesisRegistration(reg.id, { status: 'defended' });
      }
    });
    alert('Đã kết thúc hội đồng');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {(secretaryCouncils.length > 0
        ? secretaryCouncils.map((c) => ({ id: c.id, name: c.name }))
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
              <div className="hidden md:grid md:grid-cols-[2fr_2.7fr_2.4fr_1fr_1.5fr] gap-4 px-6 py-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <div>Sinh viên</div>
                <div>Bảng điểm</div>
                <div>Điểm tổng kết</div>
                <div className="text-center">Biên bản hội đồng</div>
                <div className="text-center">Thao tác</div>
              </div>

              <div className="divide-y divide-gray-200">
                {students.map((reg) => (
                  <div key={reg.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_2.7fr_2.4fr_1fr_1.5fr] md:items-center">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{getStudentName(reg.studentId)}</div>
                        <div className="text-xs text-gray-500 mt-1 truncate">{reg.studentId}</div>
                      </div>

                      <div className="text-xs text-gray-700">
                        <span className="font-semibold">(HD PB CT TV1 TV2)</span>
                        <div className="mt-1 inline-flex items-center gap-1 flex-wrap">
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full">{reg.advisorScore ?? '-'}</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full">{reg.reviewerScore ?? '-'}</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full">{reg.councilScore ?? '-'}</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full">{reg.councilScore ?? '-'}</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full">{reg.councilScore ?? '-'}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-2xl font-bold text-blue-600">{calculateFinalScore(reg)}</span>
                      </div>

                      <div className="md:text-center">
                        <button
                          onClick={() => {
                            setEditingMinutes(reg.id);
                            setCouncilComments(reg.councilComments || '');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 rounded-full text-xs font-semibold text-red-700 hover:bg-red-200"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {reg.councilMinutesUrl ? 'Sửa' : 'Tạo'}
                        </button>
                      </div>

                      <div className="md:text-center">
                        {reg.councilMinutesUrl ? (
                          <button
                            onClick={() => openIfUrl(reg.councilMinutesUrl)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 rounded-full text-xs font-semibold text-blue-700 hover:bg-blue-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Xem
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {students.length === 0 && (
                  <div className="px-6 py-10 text-center text-sm text-gray-500">
                    Chưa có dữ liệu
                    <div className="hidden md:grid md:grid-cols-[2fr_2.7fr_2.4fr_1fr_1.5fr] gap-4 min-h-12 items-center text-sm text-transparent">
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

            {council.id !== '__empty__' && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => handleFinishCouncil(council.id)}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700"
                >
                  KẾT THÚC
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Minutes Editor Dialog */}
      {editingMinutes && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {(() => {
              const reg = councilStudents.find((item) => item.id === editingMinutes);
              if (!reg) return null;
              return (
                <>
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Biên bản hội đồng</h3>
                    <button
                      onClick={() => {
                        setEditingMinutes(null);
                        setCouncilComments('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">Họ tên sinh viên</p>
                          <p className="font-medium text-gray-900">{getStudentName(reg.studentId)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">MSSV</p>
                          <p className="font-medium text-gray-900">{reg.studentId}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-600">Tên đề tài</p>
                          <p className="font-medium text-gray-900">{reg.title}</p>
                        </div>
                      </div>
                    </div>

                    {reg.reviewerComments && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Góp ý của GV Phản biện</label>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                          {reg.reviewerComments}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Góp ý của Hội đồng</label>
                      <textarea
                        value={councilComments}
                        onChange={(e) => setCouncilComments(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập các góp ý, nhận xét và quyết định của hội đồng..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tổng hợp điểm số</label>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-600 mb-1">GVHD</p>
                          <p className="text-lg font-bold text-blue-600">{reg.advisorScore || 'N/A'}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-600 mb-1">Phản biện</p>
                          <p className="text-lg font-bold text-purple-600">{reg.reviewerScore || 'N/A'}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-600 mb-1">Hội đồng</p>
                          <p className="text-lg font-bold text-orange-600">{reg.councilScore || 'N/A'}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-600 mb-1">Điểm cuối</p>
                          <p className="text-lg font-bold text-green-600">{calculateFinalScore(reg)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={() => handleSaveMinutes(reg.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Lưu biên bản
                      </button>
                      <button
                        onClick={() => {
                          setEditingMinutes(null);
                          setCouncilComments('');
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
