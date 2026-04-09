import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Eye, Save } from 'lucide-react';

export function TeacherCouncil() {
  const { user } = useAuth();
  const { thesisRegistrations, councils, users, updateThesisRegistration } = useData();
  const [scoringFor, setScoringFor] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);

  const myCouncils = councils.filter((c) => c.members.includes(user?.id || ''));
  const councilIds = myCouncils.map((c) => c.id);
  const myCouncilStudents = thesisRegistrations.filter((r) => r.councilId && councilIds.includes(r.councilId));

  const getStudentName = (studentId: string) => {
    return users.find((u) => u.id === studentId)?.fullName || 'N/A';
  };

  const handleSaveScore = (regId: string) => {
    if (score < 0 || score > 10) {
      alert('Điểm phải từ 0 đến 10');
      return;
    }
    updateThesisRegistration(regId, { councilScore: score });
    setScoringFor(null);
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
                  <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Xem bài nộp
                  </button>
                  {reg.turnitinUrl && (
                    <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Xem Turnitin
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chấm điểm (0-10)
                  </label>
                  {scoringFor === reg.id ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={score}
                        onChange={(e) => setScore(parseFloat(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                      />
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
                  ) : reg.councilScore ? (
                    <div className="flex items-center gap-4">
                      <div className="bg-green-50 rounded-lg px-4 py-2">
                        <p className="text-2xl font-bold text-green-600">{reg.councilScore}</p>
                      </div>
                      <button
                        onClick={() => {
                          setScoringFor(reg.id);
                          setScore(reg.councilScore || 0);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Chỉnh sửa
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setScoringFor(reg.id)}
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
