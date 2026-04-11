import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { BookOpen, Eye, Pencil, Save, Settings, X } from 'lucide-react';
import { CriteriaBreakdown } from '../../components/CriteriaBreakdown';

const REVIEWER_APP_CRITERIA = [
  { id: 'c1', label: '1. Äáº·t váº¥n Ä‘á» - LÃ½ do chá»n Ä‘á» tÃ i', maxScore: 1 },
  { id: 'c2', label: '2. Ná»™i dung - CÆ¡ sá»Ÿ lÃ½ thuyáº¿t', maxScore: 1 },
  { id: 'c3', label: '3. Ná»™i dung - PhÃ¢n tÃ­ch, Ä‘Ã¡nh giÃ¡', maxScore: 2 },
  { id: 'c4', label: '4. Ná»™i dung - Giáº£i phÃ¡p', maxScore: 2 },
  { id: 'c5', label: '5. HÃ¬nh thá»©c - Cáº¥u trÃºc, cÃ¢u vÄƒn vÃ  tá»« ngá»¯', maxScore: 2 },
  { id: 'c6', label: '6. HÃ¬nh thá»©c - TrÃ­ch dáº«n vÃ  tÃ i liá»‡u tham kháº£o', maxScore: 1 },
  { id: 'c7', label: '7. ThÃ¡i Ä‘á»™', maxScore: 1 },
  { id: 'c8', label: '8. Äiá»ƒm cá»™ng (Tiáº¿ng Anh/BÃ i bÃ¡o khoa há»c)', maxScore: 2 },
] as const;
const REVIEWER_RESEARCH_CRITERIA = [
  { id: 'r1', label: '1. Tá»•ng quan luáº­n vÄƒn - Giá»›i thiá»‡u', maxScore: 1 },
  { id: 'r2', label: '2. CÆ¡ sá»Ÿ lÃ½ thuyáº¿t - LÆ°á»£c kháº£o vÃ  mÃ´ hÃ¬nh nghiÃªn cá»©u', maxScore: 2 },
  { id: 'r3', label: '3. PhÆ°Æ¡ng phÃ¡p nghiÃªn cá»©u', maxScore: 1 },
  { id: 'r4', label: '4. Káº¿t quáº£ nghiÃªn cá»©u vÃ  tháº£o luáº­n', maxScore: 2 },
  { id: 'r5', label: '5. Káº¿t luáº­n vÃ  hÃ m Ã½ quáº£n trá»‹ (chÃ­nh sÃ¡ch)', maxScore: 1 },
  { id: 'r6', label: '6. HÃ¬nh thá»©c - TrÃ­ch dáº«n vÃ  tÃ i liá»‡u tham kháº£o', maxScore: 2 },
  { id: 'r7', label: '7. TÃ­nh sÃ¡ng táº¡o - tÃ­nh má»›i', maxScore: 1 },
  { id: 'r8', label: '8. Äiá»ƒm cá»™ng (Tiáº¿ng Anh/BÃ i bÃ¡o khoa há»c)', maxScore: 2 },
] as const;

interface Criterion {
  id: string;
  label: string;
  description: string;
  maxScore: number;
}

export function TeacherReviewing() {
  const { user } = useAuth();
  const { thesisRegistrations, users, updateThesisRegistration } = useData();
  const [scoringFor, setScoringFor] = useState<string | null>(null);
  const [scoreTypePickerFor, setScoreTypePickerFor] = useState<string | null>(null);
  const [reviewerAppScoreFor, setReviewerAppScoreFor] = useState<string | null>(null);
  const [reviewerRubricType, setReviewerRubricType] = useState<'ung_dung' | 'nghien_cuu'>('ung_dung');
  const [reviewerAppScores, setReviewerAppScores] = useState<Record<string, number>>({});
  const [reviewerAppComments, setReviewerAppComments] = useState('');
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<string>('');
  const [criteriaByType, setCriteriaByType] = useState<{ BCTT: Criterion[]; KLTN: Criterion[] }>({
    BCTT: [],
    KLTN: [],
  });

  const myReviewStudents = thesisRegistrations.filter((r) => r.type === 'KLTN' && r.reviewerId === user?.id);

  const getStudentName = (studentId: string) => {
    return users.find((u) => u.id === studentId)?.fullName || 'N/A';
  };

  useEffect(() => {
    const toCriteria = (docs: any[]): Criterion[] =>
      docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          label: String(data.tieuchitc || data.noidungdanhgia || `TiÃªu chÃ­ ${data.stt || ''}`).trim(),
          description: String(
            data.motachitiet || data.dauhieudanhgiagoiycham || data.motachitietdauhieuchamdiem || '',
          ).trim(),
          maxScore: Math.max(0.5, Number(data.diemtoida || 1)),
        };
      });

    const unsubBctt = onSnapshot(collection(db, 'bb_gvpb_bctt'), (snap) =>
      setCriteriaByType((prev) => ({ ...prev, BCTT: toCriteria(snap.docs) })),
    );
    const unsubKltn = onSnapshot(collection(db, 'bb_gvpb_kltn'), (snap) =>
      setCriteriaByType((prev) => ({ ...prev, KLTN: toCriteria(snap.docs) })),
    );

    return () => {
      unsubBctt();
      unsubKltn();
    };
  }, []);

  const getCriteriaForType = (type: 'BCTT' | 'KLTN') =>
    type === 'BCTT' ? criteriaByType.BCTT : criteriaByType.KLTN;

  const openScorePanel = (regId: string) => {
    const reg = myReviewStudents.find((r) => r.id === regId);
    if (!reg) return;
    setScoringFor(regId);
    setCriteriaScores((reg.reviewerCriteriaScores as Record<string, number>) || {});
    setComments(reg.reviewerComments || '');
  };

  const openScoreTypePicker = (regId: string) => {
    setScoreTypePickerFor(regId);
  };

  const handlePickTopicType = (_topicType: 'ung_dung' | 'nghien_cuu') => {
    if (!scoreTypePickerFor) return;
    const reg = myReviewStudents.find((r) => r.id === scoreTypePickerFor);
    setReviewerRubricType(_topicType);
    setReviewerAppScores((reg?.reviewerCriteriaScores as Record<string, number>) || {});
    setReviewerAppComments(reg?.reviewerComments || '');
    setReviewerAppScoreFor(scoreTypePickerFor);
    setScoreTypePickerFor(null);
  };

  const handleSaveReviewerAppScore = (regId: string) => {
    const criteria =
      reviewerRubricType === 'nghien_cuu' ? REVIEWER_RESEARCH_CRITERIA : REVIEWER_APP_CRITERIA;
    const total = Number(
      criteria.reduce((sum, c) => sum + (reviewerAppScores[c.id] || 0), 0).toFixed(2),
    );
    updateThesisRegistration(regId, {
      reviewerScore: total,
      reviewerCriteriaScores: reviewerAppScores,
      reviewerComments: reviewerAppComments.trim() || undefined,
    });
    setReviewerAppScoreFor(null);
    setReviewerAppScores({});
    setReviewerAppComments('');
    alert('ÄÃ£ lÆ°u Ä‘iá»ƒm vÃ  nháº­n xÃ©t');
  };

  const handleSaveScore = (regId: string) => {
    const reg = myReviewStudents.find((r) => r.id === regId);
    if (!reg) return;
    const criteria = getCriteriaForType(reg.type);
    const score = Number(criteria.reduce((sum, c) => sum + (criteriaScores[c.id] || 0), 0).toFixed(2));

    updateThesisRegistration(regId, {
      reviewerScore: score,
      reviewerCriteriaScores: criteriaScores,
      reviewerComments: comments,
    });

    setScoringFor(null);
    setCriteriaScores({});
    setComments('');
    alert('ÄÃ£ lÆ°u Ä‘iá»ƒm vÃ  nháº­n xÃ©t');
  };

  const activeReg = scoringFor ? myReviewStudents.find((r) => r.id === scoringFor) : null;
  const activeCriteria = activeReg ? getCriteriaForType(activeReg.type) : [];
  const activeTotal = activeCriteria.reduce((sum, c) => sum + (criteriaScores[c.id] || 0), 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div className="col-span-3">Sinh viÃªn</div>
          <div className="col-span-4">TÃªn Ä‘á» tÃ i</div>
          <div className="col-span-2 text-center">BÃ i lÃ m</div>
          <div className="col-span-2 text-center">Turnitin</div>
          <div className="col-span-1 text-center">Äiá»ƒm</div>
        </div>

        <div className="divide-y divide-gray-200">
          {myReviewStudents.map((reg) => (
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
                      className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
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
                      Chi tiáº¿t
                    </button>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </div>

                <div className="md:col-span-1 md:text-center">
                  {typeof reg.reviewerScore === 'number' ? (
                    <button
                      onClick={() => openScoreTypePicker(reg.id)}
                      className="inline-flex items-center justify-center min-w-8 rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700"
                    >
                      {reg.reviewerScore}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openScoreTypePicker(reg.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Cháº¥m Ä‘iá»ƒm
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {myReviewStudents.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              ChÆ°a cÃ³ dá»¯ liá»‡u
            </div>
          )}
        </div>
      </div>

      {activeReg && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">
              Sinh viÃªn: <span className="font-medium text-gray-900">{getStudentName(activeReg.studentId)}</span>
            </p>
            <h3 className="font-semibold text-gray-900 text-lg">{activeReg.title}</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nháº­n xÃ©t vÃ  cÃ¢u há»i</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nháº­p nháº­n xÃ©t, gÃ³p Ã½ vÃ  cÃ¢u há»i cho sinh viÃªn..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cháº¥m Ä‘iá»ƒm theo tiÃªu chÃ­</label>
              <div className="space-y-3">
                {activeCriteria.map((criterion) => (
                  <div key={criterion.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-8">
                      <p className="text-sm font-medium text-gray-800">{criterion.label}</p>
                      {criterion.description && <p className="text-xs text-gray-500">{criterion.description}</p>}
                    </div>
                    <div className="col-span-2 text-xs text-gray-500 text-right">Max {criterion.maxScore}</div>
                    <input
                      type="number"
                      min="0"
                      max={criterion.maxScore}
                      step="0.1"
                      value={criteriaScores[criterion.id] ?? 0}
                      onChange={(e) =>
                        setCriteriaScores((prev) => ({
                          ...prev,
                          [criterion.id]: Math.max(0, Math.min(criterion.maxScore, Number(e.target.value || 0))),
                        }))
                      }
                      className="col-span-2 px-2 py-1 border border-gray-300 rounded-lg"
                    />
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-700">Tá»•ng: {activeTotal.toFixed(2)}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveScore(activeReg.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      LÆ°u Ä‘iá»ƒm
                    </button>
                    <button
                      onClick={() => {
                        setScoringFor(null);
                        setCriteriaScores({});
                        setComments('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                    >
                      Há»§y
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {activeReg.reviewerScore ? (
              <CriteriaBreakdown
                criteria={getCriteriaForType(activeReg.type)}
                scores={activeReg.reviewerCriteriaScores}
                totalScore={activeReg.reviewerScore}
              />
            ) : null}
          </div>
        </div>
      )}

      {scoreTypePickerFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-blue-700 px-6 py-4 text-white">
              <h3 className="text-2xl font-bold">CHá»ŒN LOáº I Äá»€ TÃ€I</h3>
              <button
                type="button"
                onClick={() => setScoreTypePickerFor(null)}
                className="rounded-lg px-2 py-1 text-3xl leading-none hover:bg-blue-600"
              >
                Ã—
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handlePickTopicType('ung_dung')}
                className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
              >
                <span className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <Settings className="h-7 w-7" />
                </span>
                <p className="font-semibold text-slate-900">Äá»€ TÃ€I á»¨NG Dá»¤NG</p>
              </button>

              <button
                type="button"
                onClick={() => handlePickTopicType('nghien_cuu')}
                className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
              >
                <span className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <BookOpen className="h-7 w-7" />
                </span>
                <p className="font-semibold text-slate-900">Äá»€ TÃ€I NGHIÃŠN Cá»¨U</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewerAppScoreFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="shrink-0 bg-blue-700 px-6 py-4 text-center text-white">
              <h3 className="text-xl font-bold">BIÃŠN Báº¢N CHáº¤M ÄIá»‚M</h3>
              <p className="text-lg font-semibold">GIÃO VIÃŠN PHáº¢N BIá»†N</p>
            </div>

            <div className="overflow-y-auto p-5">
              <div className="mb-2 grid grid-cols-[1fr_80px_120px] gap-3 text-center font-semibold text-gray-800">
                <div />
                <div>Tá»I ÄA</div>
                <div>ÄIá»‚M</div>
              </div>
              <div className="space-y-2">
                {(reviewerRubricType === 'nghien_cuu' ? REVIEWER_RESEARCH_CRITERIA : REVIEWER_APP_CRITERIA).map((criterion) => (
                  <div key={criterion.id} className="grid grid-cols-[1fr_80px_120px] items-center gap-3">
                    <div className="rounded-full bg-gray-200 px-4 py-2 font-semibold text-gray-900">
                      {criterion.label}
                    </div>
                    <div className="mx-auto inline-flex min-w-9 items-center justify-center rounded-full bg-gray-200 px-3 py-1 font-bold text-gray-700">
                      {criterion.maxScore}
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={criterion.maxScore}
                      step="0.1"
                      value={reviewerAppScores[criterion.id] ?? 0}
                      onChange={(e) =>
                        setReviewerAppScores((prev) => ({
                          ...prev,
                          [criterion.id]: Math.max(
                            0,
                            Math.min(criterion.maxScore, Number(e.target.value || 0)),
                          ),
                        }))
                      }
                      className="w-full rounded-full border border-blue-200 bg-blue-100 px-3 py-1.5 text-center font-semibold text-gray-800"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Nháº­n xÃ©t vÃ  cÃ¢u há»i (náº¿u cÃ³)
                </label>
                <textarea
                  value={reviewerAppComments}
                  onChange={(e) => setReviewerAppComments(e.target.value)}
                  rows={4}
                  placeholder="Nháº­p nháº­n xÃ©t hoáº·c cÃ¢u há»i cho sinh viÃªn..."
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="sticky bottom-0 mt-6 flex items-center justify-end gap-3 border-t border-gray-200 bg-white pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setReviewerAppScoreFor(null);
                    setReviewerAppScores({});
                    setReviewerAppComments('');
                  }}
                  aria-label="Quay láº¡i"
                  title="Quay láº¡i"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-300 text-gray-700 hover:bg-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveReviewerAppScore(reviewerAppScoreFor)}
                  aria-label="LÆ°u"
                  title="LÆ°u"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
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
