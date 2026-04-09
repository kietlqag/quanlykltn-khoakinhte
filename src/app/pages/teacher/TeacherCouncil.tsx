import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Eye, Save } from 'lucide-react';
import { CriteriaBreakdown } from '../../components/CriteriaBreakdown';

interface Criterion {
  id: string;
  label: string;
  description: string;
  maxScore: number;
}

export function TeacherCouncil() {
  const { user } = useAuth();
  const { thesisRegistrations, councils, users, updateThesisRegistration } = useData();
  const [scoringFor, setScoringFor] = useState<string | null>(null);
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({});
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  const myCouncils = councils.filter((c) => c.members.includes(user?.id || ''));
  const councilIds = myCouncils.map((c) => c.id);
  const myCouncilStudents = thesisRegistrations.filter((r) => r.councilId && councilIds.includes(r.councilId));

  const getStudentName = (studentId: string) => {
    return users.find((u) => u.id === studentId)?.fullName || 'N/A';
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'diemhoidong'), (snap) => {
      const rows: Criterion[] = snap.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          label: String(x.tieuchitc || x.noidungdanhgia || `Tiêu chí ${x.stt || ''}`).trim(),
          description: String(
            x.motachitiet || x.dauhieudanhgiagoiycham || x.motachitietdauhieuchamdiem || '',
          ).trim(),
          maxScore: Math.max(0.5, Number(x.diemtoida || 1)),
        };
      });
      setCriteria(rows);
    });
    return () => unsub();
  }, []);

  const handleSaveScore = (regId: string) => {
    const score = Number(criteria.reduce((sum, c) => sum + (criteriaScores[c.id] || 0), 0).toFixed(2));
    updateThesisRegistration(regId, { councilScore: score, councilCriteriaScores: criteriaScores });
    setScoringFor(null);
    setCriteriaScores({});
    alert('Đã lưu điểm');
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hội đồng</h1>
        <p className="text-gray-600">Chấm điểm các sinh viên trong hội đồng</p>
      </div>

      {myCouncilStudents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Chưa được phân công vào hội đồng nào</p>
        </div>
      ) : (
        <div className="space-y-6">
          {myCouncilStudents.map((reg) => (
            <div key={reg.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {reg.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  Sinh viên: <span className="font-medium text-gray-900">{getStudentName(reg.studentId)}</span>
                </p>
                <h3 className="font-semibold text-gray-900">{reg.title}</h3>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => reg.pdfUrl && window.open(reg.pdfUrl, '_blank', 'noopener,noreferrer')}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Xem bài nộp
                  </button>
                  {reg.turnitinUrl && (
                    <button
                      onClick={() => window.open(reg.turnitinUrl, '_blank', 'noopener,noreferrer')}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Xem Turnitin
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chấm điểm theo tiêu chí
                  </label>
                  {scoringFor === reg.id ? (
                    <div className="space-y-3">
                      {criteria.map((c) => (
                        <div key={c.id} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-8">
                            <p className="text-sm font-medium text-gray-800">{c.label}</p>
                            {c.description && <p className="text-xs text-gray-500">{c.description}</p>}
                          </div>
                          <div className="col-span-2 text-xs text-gray-500 text-right">Max {c.maxScore}</div>
                          <input
                            type="number"
                            min="0"
                            max={c.maxScore}
                            step="0.1"
                            value={criteriaScores[c.id] ?? 0}
                            onChange={(e) =>
                              setCriteriaScores((prev) => ({
                                ...prev,
                                [c.id]: Math.max(0, Math.min(c.maxScore, Number(e.target.value || 0))),
                              }))
                            }
                            className="col-span-2 px-2 py-1 border border-gray-300 rounded-lg"
                          />
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <p className="text-sm font-semibold text-gray-700">
                          Tổng: {criteria.reduce((sum, c) => sum + (criteriaScores[c.id] || 0), 0).toFixed(2)}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveScore(reg.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Lưu
                          </button>
                          <button
                            onClick={() => setScoringFor(null)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : reg.councilScore ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                      <div className="bg-green-50 rounded-lg px-4 py-2">
                        <p className="text-2xl font-bold text-green-600">{reg.councilScore}</p>
                      </div>
                      <button
                        onClick={() => {
                          setScoringFor(reg.id);
                          setCriteriaScores((reg.councilCriteriaScores as Record<string, number>) || {});
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Chỉnh sửa
                      </button>
                      </div>
                      <CriteriaBreakdown
                        criteria={criteria}
                        scores={reg.councilCriteriaScores}
                        totalScore={reg.councilScore}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setScoringFor(reg.id);
                        setCriteriaScores({});
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                    >
                      Nhập điểm
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
