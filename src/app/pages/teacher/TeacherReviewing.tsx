import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Eye, Save } from 'lucide-react';

export function TeacherReviewing() {
  const { user } = useAuth();
  const { thesisRegistrations, users, updateThesisRegistration } = useData();
  const [scoringFor, setScoringFor] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [comments, setComments] = useState<string>('');

  const myReviewStudents = thesisRegistrations.filter((r) => r.reviewerId === user?.id);

  const getStudentName = (studentId: string) => {
    return users.find((u) => u.id === studentId)?.fullName || 'N/A';
  };

  const handleSaveScore = (regId: string) => {
    if (score < 0 || score > 10) {
      alert('Điểm phải từ 0 đến 10');
      return;
    }
    updateThesisRegistration(regId, {
      reviewerScore: score,
      reviewerComments: comments,
    });
    setScoringFor(null);
    setScore(0);
    setComments('');
    alert('Đã lưu điểm và nhận xét');
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Phản biện</h1>
        <p className="text-gray-600">Chấm điểm và nhận xét các đề tài được phân công phản biện</p>
      </div>

      {myReviewStudents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">Chưa được phân công phản biện</p>
        </div>
      ) : (
        <div className="space-y-6">
          {myReviewStudents.map((reg) => (
            <div key={reg.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {reg.type}
                  </span>
                  {reg.reviewerScore && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      Đã chấm
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  Sinh viên: <span className="font-medium text-gray-900">{getStudentName(reg.studentId)}</span>
                </p>
                <h3 className="font-semibold text-gray-900 text-lg">{reg.title}</h3>
              </div>

              <div className="space-y-4">
                {/* View Files */}
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

                {/* Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nhận xét và câu hỏi
                  </label>
                  {scoringFor === reg.id || !reg.reviewerScore ? (
                    <textarea
                      value={scoringFor === reg.id ? comments : reg.reviewerComments || ''}
                      onChange={(e) => setComments(e.target.value)}
                      disabled={scoringFor !== reg.id && !!reg.reviewerScore}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập nhận xét, góp ý và câu hỏi cho sinh viên..."
                    />
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {reg.reviewerComments || 'Chưa có nhận xét'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Scoring */}
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
                        placeholder="0.0"
                      />
                      <button
                        onClick={() => handleSaveScore(reg.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Lưu điểm
                      </button>
                      <button
                        onClick={() => {
                          setScoringFor(null);
                          setComments('');
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : reg.reviewerScore ? (
                    <div className="flex items-center gap-4">
                      <div className="bg-green-50 rounded-lg px-4 py-2">
                        <p className="text-2xl font-bold text-green-600">{reg.reviewerScore}</p>
                      </div>
                      <button
                        onClick={() => {
                          setScoringFor(reg.id);
                          setScore(reg.reviewerScore || 0);
                          setComments(reg.reviewerComments || '');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Chỉnh sửa
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setScoringFor(reg.id);
                        setScore(0);
                        setComments('');
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
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
