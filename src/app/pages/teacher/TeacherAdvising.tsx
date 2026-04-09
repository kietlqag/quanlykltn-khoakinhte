import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { db, storage } from '../../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { CheckCircle, X, Upload, Eye, Save, Users } from 'lucide-react';
import { CriteriaBreakdown } from '../../components/CriteriaBreakdown';

interface Criterion {
  id: string;
  label: string;
  description: string;
  maxScore: number;
}

export function TeacherAdvising() {
  const { user } = useAuth();
  const { thesisRegistrations, users, updateThesisRegistration } = useData();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingTitle, setEditingTitle] = useState<{ id: string; title: string } | null>(null);
  const [uploadingTurnitin, setUploadingTurnitin] = useState<string | null>(null);
  const [scoringFor, setScoringFor] = useState<string | null>(null);
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [criteriaByType, setCriteriaByType] = useState<{ BCTT: Criterion[]; KLTN: Criterion[] }>({
    BCTT: [],
    KLTN: [],
  });

  const myStudents = thesisRegistrations.filter((r) => r.advisorId === user?.id);

  const getStudentName = (studentId: string) => {
    const student = users.find((u) => u.id === studentId);
    return student?.fullName || 'N/A';
  };

  useEffect(() => {
    const toCriteria = (docs: any[]): Criterion[] =>
      docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          label: String(x.tieuchitc || x.noidungdanhgia || `Tiêu chí ${x.stt || ''}`).trim(),
          description: String(
            x.motachitiet || x.dauhieudanhgiagoiycham || x.tukhoadauhieudanhgia || '',
          ).trim(),
          maxScore: Math.max(0.5, Number(x.diemtoida || 1)),
        };
      });

    const unsubBCTT = onSnapshot(collection(db, 'bb_gvhd_bctt'), (snap) =>
      setCriteriaByType((prev) => ({ ...prev, BCTT: toCriteria(snap.docs) })),
    );
    const unsubKLTN = onSnapshot(collection(db, 'bb_gvhd_kltn'), (snap) =>
      setCriteriaByType((prev) => ({ ...prev, KLTN: toCriteria(snap.docs) })),
    );

    return () => {
      unsubBCTT();
      unsubKLTN();
    };
  }, []);

  const handleBulkApprove = (approve: boolean) => {
    selectedIds.forEach((id) => {
      updateThesisRegistration(id, {
        status: approve ? 'advisor_approved' : 'advisor_rejected',
      });
    });
    setSelectedIds([]);
    alert(approve ? 'Đã duyệt các đề tài đã chọn' : 'Đã từ chối các đề tài đã chọn');
  };

  const handleEditTitle = (reg: any) => {
    if (editingTitle && editingTitle.id === reg.id) {
      updateThesisRegistration(reg.id, { title: editingTitle.title });
      setEditingTitle(null);
      alert('Đã cập nhật tên đề tài');
    } else {
      setEditingTitle({ id: reg.id, title: reg.title });
    }
  };

  const handleUploadTurnitin = async (regId: string) => {
    if (!selectedFile) {
      alert('Vui lòng chọn file');
      return;
    }
    try {
      setIsUploading(true);
      const reg = myStudents.find((r) => r.id === regId);
      if (!reg || !user) {
        throw new Error('Không tìm thấy thông tin hồ sơ.');
      }
      const safeName = selectedFile.name.replace(/\s+/g, '_');
      const filePath = `turnitin/${reg.type}/${user.id}/${regId}/${Date.now()}-${safeName}`;
      const storageRef = ref(storage, filePath);
      const uploaded = await uploadBytes(storageRef, selectedFile, {
        contentType: selectedFile.type || 'application/pdf',
      });
      const turnitinUrl = await getDownloadURL(uploaded.ref);
      updateThesisRegistration(regId, { turnitinUrl });
      setUploadingTurnitin(null);
      setSelectedFile(null);
      alert('Upload Turnitin thành công');
    } catch (error) {
      console.error(error);
      alert('Upload Turnitin thất bại');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveScore = (regId: string) => {
    const reg = myStudents.find((r) => r.id === regId);
    if (!reg) return;
    const criteria = reg.type === 'BCTT' ? criteriaByType.BCTT : criteriaByType.KLTN;
    const total = criteria.reduce((sum, c) => sum + (criteriaScores[c.id] || 0), 0);
    updateThesisRegistration(regId, {
      advisorCriteriaScores: criteriaScores,
      advisorScore: Number(total.toFixed(2)),
    });
    setScoringFor(null);
    setCriteriaScores({});
    alert('Đã lưu điểm');
  };

  const pendingStudents = myStudents.filter((r) => r.status === 'pending');
  const submittedStudents = myStudents.filter((r) => r.pdfUrl && !r.advisorScore);
  const gradedStudents = myStudents.filter((r) => r.advisorScore);
  const revisionStudents = myStudents.filter((r) => r.revisedPdfUrl && !r.advisorApprovalRevision);
  const getCriteriaForType = (type: 'BCTT' | 'KLTN') =>
    type === 'BCTT' ? criteriaByType.BCTT : criteriaByType.KLTN;

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hướng dẫn sinh viên</h1>
        <p className="text-gray-600">Quản lý các sinh viên bạn hướng dẫn</p>
      </div>

      {/* Revision Approval - After Defense */}
      {revisionStudents.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Duyệt chỉnh sửa sau bảo vệ ({revisionStudents.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Sinh viên đã nộp bài chỉnh sửa sau khi bảo vệ, cần duyệt trước khi Chủ tịch duyệt
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {revisionStudents.map((reg) => (
              <div key={reg.id} className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {reg.type}
                    </span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                      Chờ duyệt chỉnh sửa
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Sinh viên: <span className="font-medium text-gray-900">{getStudentName(reg.studentId)}</span>
                  </p>
                  <h3 className="font-semibold text-gray-900">{reg.title}</h3>
                </div>

                <div className="space-y-4">
                  {/* View Files */}
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() =>
                        reg.councilMinutesUrl &&
                        window.open(reg.councilMinutesUrl, '_blank', 'noopener,noreferrer')
                      }
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Biên bản hội đồng
                    </button>
                    <button
                      onClick={() =>
                        reg.revisedPdfUrl &&
                        window.open(reg.revisedPdfUrl, '_blank', 'noopener,noreferrer')
                      }
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Xem bài chỉnh sửa
                    </button>
                    <button
                      onClick={() =>
                        reg.revisionExplanationUrl &&
                        window.open(reg.revisionExplanationUrl, '_blank', 'noopener,noreferrer')
                      }
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Biên bản giải trình
                    </button>
                  </div>

                  {/* Approval Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        updateThesisRegistration(reg.id, { advisorApprovalRevision: true });
                        alert('Đã duyệt chỉnh sửa');
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Đồng ý chỉnh sửa
                    </button>
                    <button
                      onClick={() => {
                        updateThesisRegistration(reg.id, { advisorApprovalRevision: false });
                        alert('Đã từ chối chỉnh sửa');
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Không đồng ý
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      {pendingStudents.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Chờ duyệt ({pendingStudents.length})
            </h2>
            {selectedIds.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkApprove(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Duyệt ({selectedIds.length})
                </button>
                <button
                  onClick={() => handleBulkApprove(false)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Từ chối ({selectedIds.length})
                </button>
              </div>
            )}
          </div>
          <div className="divide-y divide-gray-200">
            {pendingStudents.map((reg) => (
              <div key={reg.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(reg.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds([...selectedIds, reg.id]);
                      } else {
                        setSelectedIds(selectedIds.filter((id) => id !== reg.id));
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {reg.type}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                        {reg.period}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Sinh viên: <span className="font-medium text-gray-900">{getStudentName(reg.studentId)}</span>
                    </p>
                    {editingTitle?.id === reg.id ? (
                      <input
                        type="text"
                        value={editingTitle.title}
                        onChange={(e) => setEditingTitle({ ...editingTitle, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                      />
                    ) : (
                      <h3 className="font-semibold text-gray-900 mb-2">{reg.title}</h3>
                    )}
                    <p className="text-sm text-gray-600">Lĩnh vực: {reg.field}</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEditTitle(reg)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                      >
                        {editingTitle?.id === reg.id ? 'Lưu' : 'Chỉnh sửa tên'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submitted - Need Grading */}
      {submittedStudents.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Đã nộp bài - Cần chấm điểm ({submittedStudents.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {submittedStudents.map((reg) => (
              <div key={reg.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {reg.type}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Đã nộp bài
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Sinh viên: <span className="font-medium text-gray-900">{getStudentName(reg.studentId)}</span>
                    </p>
                    <h3 className="font-semibold text-gray-900">{reg.title}</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* View Submission */}
                  <div>
                    <button
                      onClick={() => reg.pdfUrl && window.open(reg.pdfUrl, '_blank', 'noopener,noreferrer')}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Xem bài nộp
                    </button>
                  </div>

                  {/* Upload Turnitin */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Turnitin Report
                    </label>
                    {uploadingTurnitin === reg.id ? (
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUploadTurnitin(reg.id)}
                            disabled={isUploading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                          >
                            {isUploading ? 'Đang upload...' : 'Upload'}
                          </button>
                          <button
                            onClick={() => {
                              setUploadingTurnitin(null);
                              setSelectedFile(null);
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : reg.turnitinUrl ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-600">✓ Đã upload Turnitin</span>
                        <button
                          onClick={() => setUploadingTurnitin(reg.id)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Upload lại
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setUploadingTurnitin(reg.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Turnitin
                      </button>
                    )}
                  </div>

                  {/* Grading */}
                  {reg.turnitinUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chấm điểm theo tiêu chí
                      </label>
                      {scoringFor === reg.id ? (
                        <div className="space-y-3">
                          {getCriteriaForType(reg.type).map((c) => (
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
                              Tổng: {(
                                (reg.type === 'BCTT' ? criteriaByType.BCTT : criteriaByType.KLTN).reduce(
                                  (sum, c) => sum + (criteriaScores[c.id] || 0),
                                  0,
                                )
                              ).toFixed(2)}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveScore(reg.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
                              >
                                <Save className="w-4 h-4" />
                                Lưu điểm
                              </button>
                              <button
                                onClick={() => setScoringFor(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setScoringFor(reg.id);
                            setCriteriaScores((reg.advisorCriteriaScores as Record<string, number>) || {});
                          }}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                        >
                          Nhập điểm
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Graded Students */}
      {gradedStudents.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Đã chấm điểm ({gradedStudents.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {gradedStudents.map((reg) => (
              <div key={reg.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {reg.type}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Đã chấm
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Sinh viên: <span className="font-medium text-gray-900">{getStudentName(reg.studentId)}</span>
                    </p>
                    <h3 className="font-semibold text-gray-900 mb-2">{reg.title}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => reg.pdfUrl && window.open(reg.pdfUrl, '_blank', 'noopener,noreferrer')}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Xem bài nộp
                      </button>
                      <button
                        onClick={() => reg.turnitinUrl && window.open(reg.turnitinUrl, '_blank', 'noopener,noreferrer')}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Xem Turnitin
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Điểm GVHD</p>
                    <p className="text-2xl font-bold text-green-600">{reg.advisorScore}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <CriteriaBreakdown
                    criteria={getCriteriaForType(reg.type)}
                    scores={reg.advisorCriteriaScores}
                    totalScore={reg.advisorScore}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {myStudents.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Chưa có sinh viên nào</p>
        </div>
      )}
    </div>
  );
}
