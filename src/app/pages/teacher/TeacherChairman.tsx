import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Eye, FileCheck2, FileSearch, FileText, Pencil, Save, X } from 'lucide-react';

interface Criterion {
  id: string;
  label: string;
  description: string;
  maxScore: number;
}

const COUNCIL_DEFAULT_CRITERIA: Criterion[] = [
  { id: 'c1', label: '1. Slide trình chiếu', description: '', maxScore: 1 },
  { id: 'c2', label: '2. Phong thái thuyết trình', description: '', maxScore: 1.5 },
  { id: 'c3', label: '3. Thời gian', description: '', maxScore: 0.5 },
  { id: 'c4', label: '4. Nội dung', description: '', maxScore: 4 },
  { id: 'c5', label: '5. Trả lời câu hỏi', description: '', maxScore: 2 },
  { id: 'c6', label: '6. Tính sáng tạo - tính mới', description: '', maxScore: 1 },
  { id: 'c7', label: '7. Điểm cộng (Tiếng Anh/Bài báo khoa học)', description: '', maxScore: 2 },
];


export function TeacherChairman() {
  const { user } = useAuth();
  const { thesisRegistrations, councils, users, updateThesisRegistration } = useData();

  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [scoringFor, setScoringFor] = useState<string | null>(null);
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({});
  const [councilCommentDraft, setCouncilCommentDraft] = useState('');
  const [revisionReviewFor, setRevisionReviewFor] = useState<string | null>(null);

  const chairmanCouncils = councils.filter((c) => c.chairmanId === user?.id);
  const councilIds = chairmanCouncils.map((c) => c.id);
  const councilStudents = thesisRegistrations.filter((r) => r.councilId && councilIds.includes(r.councilId));

  const getStudentName = (studentId: string) => users.find((u) => u.id === studentId)?.fullName || 'N/A';

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'diemhoidong'), (snap) => {
      const rows: Criterion[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          label: String(data.tieuchitc || data.noidungdanhgia || `Tiêu chí ${data.stt || ''}`).trim(),
          description: String(
            data.motachitiet || data.dauhieudanhgiagoiycham || data.motachitietdauhieuchamdiem || '',
          ).trim(),
          maxScore: Math.max(0.5, Number(data.diemtoida || 1)),
        };
      });
      setCriteria(rows);
    });

    return () => unsub();
  }, []);

  const openIfUrl = (url?: string) => {
    if (!url) return;
    if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    alert('Tài liệu được lưu nội bộ trong Firestore.');
  };

  const computeCouncilAverage = (chairmanScore?: number, memberScores?: Record<string, number>) => {
    const scores = [
      chairmanScore,
      ...(memberScores ? Object.values(memberScores) : []),
    ].filter((score): score is number => typeof score === 'number' && Number.isFinite(score));
    if (scores.length === 0) return undefined;
    return Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2));
  };

  const openScoreModal = (regId: string) => {
    const reg = councilStudents.find((r) => r.id === regId);
    if (!reg) return;
    setScoringFor(regId);
    setCriteriaScores((reg.chairmanCriteriaScores as Record<string, number>) || (reg.councilCriteriaScores as Record<string, number>) || {});
    setCouncilCommentDraft(reg.chairmanComments || '');
  };

  const closeScoreModal = () => {
    setScoringFor(null);
    setCriteriaScores({});
    setCouncilCommentDraft('');
  };

  const scoringCriteria = criteria.length > 0 ? criteria : COUNCIL_DEFAULT_CRITERIA;

  const handleSaveScore = (regId: string) => {
    const total = Number(scoringCriteria.reduce((sum, c) => sum + (criteriaScores[c.id] || 0), 0).toFixed(2));
    const finalScore = Math.min(total, 10);
    const reg = councilStudents.find((r) => r.id === regId);
    if (!reg) return;
    if (reg.scoreLocked) {
      alert('Điểm đã bị khóa, không thể chỉnh sửa.');
      return;
    }
    const councilScore = computeCouncilAverage(finalScore, reg.councilMemberScores);

    updateThesisRegistration(regId, {
      chairmanScore: finalScore,
      chairmanCriteriaScores: criteriaScores,
      councilScore: councilScore ?? finalScore,
      chairmanComments: councilCommentDraft.trim() || undefined,
    });

    closeScoreModal();
    alert('Đã lưu điểm và nhận xét');
  };

  const handleApprove = (regId: string, approve: boolean) => {
    updateThesisRegistration(regId, {
      chairmanApprovalRevision: approve,
      ...(approve ? {} : { advisorApprovalRevision: false }),
      status: approve ? 'completed' : 'revision_pending',
    });
    setRevisionReviewFor(null);
    alert(approve ? 'Đã duyệt chỉnh sửa' : 'Đã từ chối chỉnh sửa');
  };

  const activeReg = scoringFor ? councilStudents.find((r) => r.id === scoringFor) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {(chairmanCouncils.length > 0
        ? chairmanCouncils.map((c) => ({ id: c.id, name: c.name }))
        : [{ id: '__empty__', name: 'Chưa có hội đồng' }]
      ).map((council) => {
        const students = council.id === '__empty__' ? [] : councilStudents.filter((r) => r.councilId === council.id);

        return (
          <div key={council.id}>
            <div className="inline-flex px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold mb-3">
              {council.name}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="hidden md:grid md:grid-cols-[2fr_2.8fr_2.2fr_1fr_1.6fr_1.6fr] gap-4 px-6 py-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <div>Sinh viên</div>
                <div>Tên đề tài</div>
                <div>Hồ sơ</div>
                <div className="text-center">Điểm</div>
                <div className="text-center">Trạng thái GVHD</div>
                <div className="text-left">Chỉnh sửa</div>
              </div>

              <div className="divide-y divide-gray-200">
                {students.map((reg) => (
                  <div key={reg.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_2.8fr_2.2fr_1fr_1.6fr_1.6fr] md:items-center">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{getStudentName(reg.studentId)}</div>
                        <div className="text-xs text-gray-500 mt-1 truncate">{reg.studentId}</div>
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{reg.title}</div>
                      </div>

                      <div className="flex flex-col items-start gap-1.5">
                        {reg.pdfUrl && (
                          <button
                            onClick={() => openIfUrl(reg.pdfUrl)}
                            className="inline-flex items-center gap-1.5 text-[13px] font-semibold leading-5 text-slate-700 hover:underline"
                          >
                            <FileText className="h-4 w-4 text-blue-600" />
                            Bài làm
                          </button>
                        )}
                        {reg.turnitinUrl && (
                          <button
                            onClick={() => openIfUrl(reg.turnitinUrl)}
                            className="inline-flex items-center gap-1.5 text-[13px] font-semibold leading-5 text-red-600 hover:underline"
                          >
                            <FileSearch className="h-4 w-4 text-red-500" />
                            Turnitin
                          </button>
                        )}
                        {reg.councilMinutesUrl && (
                          <button
                            onClick={() => openIfUrl(reg.councilMinutesUrl)}
                            className="inline-flex items-center gap-1.5 text-[13px] font-semibold leading-5 text-emerald-700 hover:underline"
                          >
                            <FileCheck2 className="h-4 w-4 text-emerald-600" />
                            BB hội đồng
                          </button>
                        )}
                      </div>

                      <div className="md:text-center">
                        <button
                          type="button"
                          disabled={Boolean(reg.scoreLocked)}
                          onClick={() => openScoreModal(reg.id)}
                          className={`inline-flex items-center justify-center min-w-8 px-2 py-1 rounded-full text-xs font-bold ${
                            reg.scoreLocked
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : typeof reg.chairmanScore === 'number'
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          }`}
                          title={reg.scoreLocked ? 'Điểm đã bị khóa' : 'Chấm điểm'}
                        >
                          {typeof reg.chairmanScore === 'number' ? reg.chairmanScore.toFixed(2) : (
                            <span className="inline-flex items-center gap-1">
                              <Pencil className="h-3 w-3" />
                              Chấm
                            </span>
                          )}
                        </button>
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

                      <div className="md:text-left">
                        <div className="flex flex-col items-start gap-2">
                          {reg.revisedPdfUrl && (
                            <button
                              onClick={() => openIfUrl(reg.revisedPdfUrl)}
                              className="inline-flex items-center gap-1.5 text-[13px] font-semibold leading-5 text-amber-700 hover:underline"
                            >
                              <FileText className="h-4 w-4 text-amber-600" />
                              Bài sửa
                            </button>
                          )}
                          {reg.revisionExplanationUrl && (
                            <button
                              onClick={() => openIfUrl(reg.revisionExplanationUrl)}
                              className="inline-flex items-center gap-1.5 text-[13px] font-semibold leading-5 text-slate-700 hover:underline"
                            >
                              <FileSearch className="h-4 w-4 text-slate-600" />
                              Giải trình
                            </button>
                          )}
                          {reg.status === 'completed' ? null : reg.chairmanApprovalRevision ? null : reg.revisedPdfUrl || reg.status === 'revision_pending' ? (
                            <button
                              type="button"
                              onClick={() => setRevisionReviewFor(reg.id)}
                              className={`px-3 py-1 rounded-full text-[13px] font-semibold leading-5 ${
                                reg.chairmanApprovalRevision
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {reg.chairmanApprovalRevision ? 'Đã duyệt' : 'Chờ duyệt'}
                            </button>
                          ) : (
                            <div className="flex flex-col items-start gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  updateThesisRegistration(reg.id, {
                                    status: 'revision_pending',
                                    chairmanApprovalRevision: false,
                                  });
                                  alert('Đã yêu cầu sinh viên chỉnh sửa');
                                }}
                                className="rounded-full bg-amber-100 px-2.5 py-1 text-[13px] font-semibold leading-5 text-amber-700 hover:bg-amber-200"
                              >
                                Yêu cầu chỉnh sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateThesisRegistration(reg.id, {
                                    status: 'completed',
                                    advisorApprovalRevision: true,
                                    chairmanApprovalRevision: true,
                                  });
                                  alert('Đã hoàn thành báo cáo');
                                }}
                                className="rounded-full bg-emerald-100 px-2.5 py-1 text-[13px] font-semibold leading-5 text-emerald-700 hover:bg-emerald-200"
                              >
                                Hoàn thành báo cáo
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {students.length === 0 && (
                  <div className="px-6 py-10 text-center text-sm text-gray-500">Chưa có dữ liệu</div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {activeReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="shrink-0 bg-blue-700 px-6 py-4 text-center text-white relative">
              <h3 className="text-xl font-bold">BIÊN BẢN CHẤM ĐIỂM</h3>
              <p className="text-lg font-semibold">HỘI ĐỒNG</p>
              <button
                type="button"
                onClick={closeScoreModal}
                className="absolute right-4 top-4 rounded-lg p-1.5 hover:bg-blue-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              <div className="mb-2 grid grid-cols-[1fr_80px_120px] gap-3 text-center font-semibold text-gray-800">
                <div />
                <div>TỐI ĐA</div>
                <div>ĐIỂM</div>
              </div>

              <div className="space-y-2">
                {scoringCriteria.map((criterion) => (
                  <div key={criterion.id} className="grid grid-cols-[1fr_80px_120px] items-center gap-3">
                    <div className="rounded-full bg-gray-200 px-4 py-2 text-gray-900">
                      <p className="font-semibold">{criterion.label}</p>
                      {criterion.description ? (
                        <p className="mt-0.5 text-xs text-gray-600">{criterion.description}</p>
                      ) : null}
                    </div>
                    <div className="mx-auto w-fit rounded-full bg-gray-200 px-3 py-1 text-center font-semibold text-gray-700">
                      {criterion.maxScore}
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={criterion.maxScore}
                      step={0.1}
                      value={criteriaScores[criterion.id] ?? 0}
                      onChange={(e) =>
                        setCriteriaScores((prev) => ({
                          ...prev,
                          [criterion.id]: Math.max(0, Math.min(criterion.maxScore, Number(e.target.value || 0))),
                        }))
                      }
                      className="w-full rounded-full border border-blue-200 bg-blue-100 px-3 py-1.5 text-center font-semibold text-gray-800"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-gray-800">Nhận xét (nếu có)</label>
                <textarea
                  value={councilCommentDraft}
                  onChange={(e) => setCouncilCommentDraft(e.target.value)}
                  rows={4}
                  placeholder="Nhập nhận xét của chủ tịch hội đồng..."
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="shrink-0 border-t border-gray-200 px-5 py-4">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeScoreModal}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-300 text-gray-700 hover:bg-gray-400"
                  aria-label="Quay lại"
                  title="Quay lại"
                >
                  <X className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveScore(activeReg.id)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
                  aria-label="Lưu"
                  title="Lưu"
                >
                  <Save className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {revisionReviewFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {(() => {
              const reg = councilStudents.find((r) => r.id === revisionReviewFor);
              if (!reg) return null;
              return (
                <>
                  <div className="flex items-start justify-between border-b border-gray-200 bg-gray-50 px-6 py-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Duyệt chỉnh sửa</p>
                      <h2 className="mt-1 text-xl font-semibold text-gray-900">{reg.title}</h2>
                      <p className="mt-1 text-sm text-gray-600">{reg.studentId}</p>
                    </div>
                    <button
                      onClick={() => setRevisionReviewFor(null)}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-5 px-6 py-6">
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => reg.revisedPdfUrl && openIfUrl(reg.revisedPdfUrl)}
                          disabled={!reg.revisedPdfUrl}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[13px] font-semibold leading-5 text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:bg-blue-100"
                        >
                          <Eye className="h-4 w-4" />
                          Xem bài sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => reg.revisionExplanationUrl && openIfUrl(reg.revisionExplanationUrl)}
                          disabled={!reg.revisionExplanationUrl}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] font-semibold leading-5 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                          <Eye className="h-4 w-4" />
                          Xem giải trình
                        </button>
                      </div>
                    </div>

                    {reg.advisorApprovalRevision ? (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                        <button
                          type="button"
                          onClick={() => handleApprove(reg.id, true)}
                          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-semibold leading-5 text-white shadow-sm hover:bg-emerald-700"
                        >
                          Duyệt chỉnh sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(reg.id, false)}
                          className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] font-semibold leading-5 text-rose-700 hover:bg-rose-100"
                        >
                          Không duyệt
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <span className="text-sm font-medium text-amber-600">GVHD Chưa duyệt</span>
                      </div>
                    )}
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



