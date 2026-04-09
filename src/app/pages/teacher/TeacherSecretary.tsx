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

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Thư ký hội đồng</h1>
        <p className="text-gray-600">Quản lý điểm và biên bản hội đồng</p>
      </div>

      {secretaryCouncils.map((council) => {
        const students = councilStudents.filter((r) => r.councilId === council.id);
        return (
          <div key={council.id} className="mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                <h2 className="text-lg font-semibold text-gray-900">{council.name}</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {students.map((reg) => (
                  <div key={reg.id} className="p-6">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">
                        Sinh viên: <span className="font-medium text-gray-900">{getStudentName(reg.studentId)}</span>
                      </p>
                      <h3 className="font-semibold text-gray-900">{reg.title}</h3>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      {reg.advisorScore && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">GVHD</p>
                          <p className="text-xl font-bold text-blue-600">{reg.advisorScore}</p>
                        </div>
                      )}
                      {reg.reviewerScore && (
                        <div className="bg-purple-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">Phản biện</p>
                          <p className="text-xl font-bold text-purple-600">{reg.reviewerScore}</p>
                        </div>
                      )}
                      {reg.councilScore && (
                        <div className="bg-orange-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">Hội đồng</p>
                          <p className="text-xl font-bold text-orange-600">{reg.councilScore}</p>
                        </div>
                      )}
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Tổng kết</p>
                        <p className="text-xl font-bold text-green-600">{calculateFinalScore(reg)}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setEditingMinutes(reg.id);
                        setCouncilComments(reg.councilComments || '');
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
                    >
                      <FileText className="w-4 h-4" />
                      {reg.councilMinutesUrl ? 'Sửa biên bản hội đồng' : 'Tạo biên bản hội đồng'}
                    </button>
                    {reg.councilMinutesUrl && (
                      <button
                        onClick={() => openIfUrl(reg.councilMinutesUrl)}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
                      >
                        <Eye className="w-4 h-4" />
                        Xem biên bản
                      </button>
                    )}

                    {/* Minutes Editor Dialog */}
                    {editingMinutes === reg.id && (
                      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
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
                            {/* Pre-filled Information */}
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

                            {/* Reviewer Comments (Read-only) */}
                            {reg.reviewerComments && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Góp ý của GV Phản biện
                                </label>
                                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                                  {reg.reviewerComments}
                                </div>
                              </div>
                            )}

                            {/* Council Comments (Editable) */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Góp ý của Hội đồng
                              </label>
                              <textarea
                                value={councilComments}
                                onChange={(e) => setCouncilComments(e.target.value)}
                                rows={6}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nhập các góp ý, nhận xét và quyết định của hội đồng..."
                              />
                            </div>

                            {/* Scores Summary */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tổng hợp điểm số
                              </label>
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
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {secretaryCouncils.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Bạn không phải là thư ký hội đồng nào</p>
        </div>
      )}
    </div>
  );
}