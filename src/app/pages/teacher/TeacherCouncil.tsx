import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Eye, Pencil, Save, X } from 'lucide-react';

interface Criterion {
  id: string;
  label: string;
  description: string;
  maxScore: number;
}

const COUNCIL_DEFAULT_CRITERIA: Criterion[] = [
  { id: 'c1', label: '1. Slide \u0074\u0072\u00ec\u006e\u0068 \u0063\u0068\u0069\u1ebf\u0075', description: '', maxScore: 1 },
  { id: 'c2', label: '2. Phong \u0074\u0068\u00e1\u0069 \u0074\u0068\u0075\u0079\u1ebf\u0074 \u0074\u0072\u00ec\u006e\u0068', description: '', maxScore: 1.5 },
  { id: 'c3', label: '3. Th\u1eddi gian', description: '', maxScore: 0.5 },
  { id: 'c4', label: '4. N\u1ed9i dung', description: '', maxScore: 4 },
  { id: 'c5', label: '5. Tr\u1ea3 l\u1eddi c\u00e2u h\u1ecfi', description: '', maxScore: 2 },
  { id: 'c6', label: '6. T\u00ednh s\u00e1ng t\u1ea1o - t\u00ednh m\u1edbi', description: '', maxScore: 1 },
  { id: 'c7', label: '7. \u0110i\u1ec3m c\u1ed9ng (Ti\u1ebfng Anh/B\u00e0i b\u00e1o khoa h\u1ecdc)', description: '', maxScore: 2 },
];


export function TeacherCouncil() {
  const { user } = useAuth();
  const { thesisRegistrations, councils, users, updateThesisRegistration } = useData();

  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [scoringFor, setScoringFor] = useState<string | null>(null);
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({});
  const [councilCommentDraft, setCouncilCommentDraft] = useState('');

  const myCouncils = councils.filter((c) => c.members.includes(user?.id || ''));
  const councilIds = myCouncils.map((c) => c.id);
  const myCouncilStudents = thesisRegistrations.filter((r) => r.councilId && councilIds.includes(r.councilId));

  const getStudentName = (studentId: string) => users.find((u) => u.id === studentId)?.fullName || 'N/A';

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'diemhoidong'), (snap) => {
      const rows: Criterion[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          label: String(data.tieuchitc || data.noidungdanhgia || `Ti?u ch? ${data.stt || ''}`).trim(),
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

  const computeCouncilAverage = (chairmanScore?: number, memberScores?: Record<string, number>) => {
    const scores = [
      chairmanScore,
      ...(memberScores ? Object.values(memberScores) : []),
    ].filter((score): score is number => typeof score === 'number' && Number.isFinite(score));
    if (scores.length === 0) return undefined;
    return Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2));
  };

  const openScoreModal = (regId: string) => {
    const reg = myCouncilStudents.find((r) => r.id === regId);
    if (!reg) return;
    setScoringFor(regId);
    setCriteriaScores(
      (user?.id && reg.councilMemberCriteriaScores?.[user.id]) ||
      (reg.councilCriteriaScores as Record<string, number>) ||
      {},
    );
    setCouncilCommentDraft((user?.id && reg.councilMemberComments?.[user.id]) || '');
  };

  const closeScoreModal = () => {
    setScoringFor(null);
    setCriteriaScores({});
    setCouncilCommentDraft('');
  };

  const scoringCriteria = criteria.length > 0 ? criteria : COUNCIL_DEFAULT_CRITERIA;

  const handleSaveScore = (regId: string) => {
    const reg = myCouncilStudents.find((item) => item.id === regId);
    if (!reg) return;
    if (!user?.id) {
      alert('\u004b\u0068\u00f4ng \u0078\u00e1\u0063 \u0111\u1ecb\u006e\u0068 \u0111\u01b0\u1ee3\u0063 \u006e\u0067\u01b0\u1edd\u0069 \u0063\u0068\u1ea5\u006d.');
      return;
    }
    if (reg.scoreLocked) {
      alert('Điểm đã bị khóa, không thể chỉnh sửa.');
      return;
    }

    const total = Number(scoringCriteria.reduce((sum, c) => sum + (criteriaScores[c.id] || 0), 0).toFixed(2));
    const finalScore = Math.min(total, 10);

    const nextMemberComments = { ...(reg.councilMemberComments || {}) } as Record<string, string>;
    const nextMemberScores = { ...(reg.councilMemberScores || {}) } as Record<string, number>;
    const nextMemberCriteriaScores = { ...(reg.councilMemberCriteriaScores || {}) } as Record<string, Record<string, number>>;
    const trimmed = councilCommentDraft.trim();
    if (trimmed) nextMemberComments[user.id] = trimmed;
    else delete nextMemberComments[user.id];
    nextMemberScores[user.id] = finalScore;
    nextMemberCriteriaScores[user.id] = criteriaScores;

    const councilScore = computeCouncilAverage(reg.chairmanScore, nextMemberScores);

    updateThesisRegistration(regId, {
      councilScore: councilScore ?? finalScore,
      councilMemberComments: nextMemberComments,
      councilMemberScores: nextMemberScores,
      councilMemberCriteriaScores: nextMemberCriteriaScores,
    });

    closeScoreModal();
    alert('\u0110\u00e3 \u006c\u01b0\u0075 \u0111\u0069\u1ec3\u006d \u0076\u00e0 \u006e\u0068\u1ead\u006e \u0078\u00e9\u0074');
  };

  const activeReg = scoringFor ? myCouncilStudents.find((r) => r.id === scoringFor) : null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div className="col-span-3">Sinh viên</div>
          <div className="col-span-4">Tên đề tài</div>
          <div className="col-span-2 text-center">Bài làm</div>
          <div className="col-span-2 text-center">Turnitin</div>
          <div className="col-span-1 text-center">Điểm</div>
        </div>

        <div className="divide-y divide-gray-200">
          {myCouncilStudents.map((reg) => (
            <div key={reg.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:items-center">
                <div className="md:col-span-3 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{getStudentName(reg.studentId)}</div>
                  <div className="text-xs text-gray-500 mt-1 truncate">{reg.studentId}</div>
                </div>

                <div className="md:col-span-4 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{reg.title}</div>
                </div>

                <div className="md:col-span-2 md:text-center">
                  {reg.pdfUrl ? (
                    <button
                      onClick={() => window.open(reg.pdfUrl, '_blank', 'noopener,noreferrer')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Xem bài
                    </button>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </div>

                <div className="md:col-span-2 md:text-center">
                  {reg.turnitinUrl ? (
                    <button
                      onClick={() => window.open(reg.turnitinUrl, '_blank', 'noopener,noreferrer')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Chi tiết
                    </button>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </div>

                <div className="md:col-span-1 md:text-center">
                  <button
                    type="button"
                    disabled={Boolean(reg.scoreLocked)}
                    onClick={() => openScoreModal(reg.id)}
                    className={`inline-flex items-center justify-center min-w-8 px-2 py-1 rounded-full text-xs font-bold ${
                      reg.scoreLocked
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : typeof (user?.id ? reg.councilMemberScores?.[user.id] : undefined) === 'number'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
                    title={reg.scoreLocked ? 'Điểm đã bị khóa' : 'Chấm điểm'}
                  >
                    {typeof (user?.id ? reg.councilMemberScores?.[user.id] : undefined) === 'number' ? (
                      Number(reg.councilMemberScores?.[user.id]).toFixed(1)
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Pencil className="h-3 w-3" />
                        Chấm
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {myCouncilStudents.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-gray-500">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

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
                  placeholder="Nhập nhận xét của thành viên hội đồng..."
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
    </div>
  );
}
