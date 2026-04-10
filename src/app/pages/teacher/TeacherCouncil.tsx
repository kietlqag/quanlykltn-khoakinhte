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

  const openScorePanel = (regId: string) => {
    const reg = myCouncilStudents.find((r) => r.id === regId);
    if (!reg) return;
    setScoringFor(regId);
    setCriteriaScores((reg.councilCriteriaScores as Record<string, number>) || {});
  };

  const handleSaveScore = (regId: string) => {
    const score = Number(criteria.reduce((sum, c) => sum + (criteriaScores[c.id] || 0), 0).toFixed(2));
    updateThesisRegistration(regId, { councilScore: score, councilCriteriaScores: criteriaScores });
    setScoringFor(null);
    setCriteriaScores({});
    alert('Đã lưu điểm');
  };

  const activeReg = scoringFor ? myCouncilStudents.find((r) => r.id === scoringFor) : null;
  const activeTotal = criteria.reduce((sum, c) => sum + (criteriaScores[c.id] || 0), 0);

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
                    onClick={() => openScorePanel(reg.id)}
                    className={`inline-flex items-center justify-center min-w-8 px-2 py-1 rounded-full text-xs font-bold ${
                      reg.councilScore ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {reg.councilScore ?? 0}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {myCouncilStudents.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </div>

      {activeReg && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">
              Sinh viên: <span className="font-medium text-gray-900">{getStudentName(activeReg.studentId)}</span>
            </p>
            <h3 className="font-semibold text-gray-900 text-lg">{activeReg.title}</h3>
          </div>

          <div className="space-y-3">
            {criteria.map((criterion) => (
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
              <p className="text-sm font-semibold text-gray-700">Tổng: {activeTotal.toFixed(2)}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveScore(activeReg.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Lưu
                </button>
                <button
                  onClick={() => {
                    setScoringFor(null);
                    setCriteriaScores({});
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>

          {activeReg.councilScore ? (
            <div className="mt-4">
              <CriteriaBreakdown
                criteria={criteria}
                scores={activeReg.councilCriteriaScores}
                totalScore={activeReg.councilScore}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
