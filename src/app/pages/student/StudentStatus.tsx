import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
  FileText,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  MapPin,
  Award,
  Eye,
} from 'lucide-react';

export function StudentStatus() {
  const { user } = useAuth();
  const { thesisRegistrations, users, updateThesisRegistration } = useData();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const myRegistrations = thesisRegistrations.filter((r) => r.studentId === user?.id);

  const getAdvisorName = (advisorId: string) => {
    const advisor = users.find((u) => u.id === advisorId);
    return advisor?.fullName || 'N/A';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      advisor_approved: 'bg-green-100 text-green-700',
      advisor_rejected: 'bg-red-100 text-red-700',
      submitted: 'bg-blue-100 text-blue-700',
      graded: 'bg-purple-100 text-purple-700',
      defended: 'bg-indigo-100 text-indigo-700',
      revision_pending: 'bg-orange-100 text-orange-700',
      completed: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Chờ GV duyệt',
      advisor_approved: 'GV đã duyệt',
      advisor_rejected: 'GV từ chối',
      submitted: 'Đã nộp bài',
      graded: 'Đã chấm điểm',
      defended: 'Đã bảo vệ',
      revision_pending: 'Chờ duyệt chỉnh sửa',
      completed: 'Hoàn thành',
    };
    return statusMap[status] || status;
  };

  const handleFileUpload = (regId: string, uploadType: 'pdf' | 'internship' | 'revised') => {
    if (!selectedFile) {
      alert('Vui lòng chọn file');
      return;
    }

    // Simulate upload
    const updates: any = {
      submittedAt: new Date().toISOString().split('T')[0],
    };

    if (uploadType === 'pdf') {
      updates.pdfUrl = `mock-url-${selectedFile.name}`;
      updates.status = 'submitted';
    } else if (uploadType === 'internship') {
      updates.internshipCertUrl = `mock-url-${selectedFile.name}`;
    } else if (uploadType === 'revised') {
      updates.revisedPdfUrl = `mock-url-${selectedFile.name}`;
      updates.status = 'revision_pending';
    }

    updateThesisRegistration(regId, updates);
    setSelectedFile(null);
    setUploadingFor(null);
    alert('Upload thành công!');
  };

  const canUploadPdf = (reg: any) => {
    return reg.status === 'advisor_approved' && !reg.pdfUrl;
  };

  const canUploadRevised = (reg: any) => {
    return reg.status === 'defended' && reg.finalScore && !reg.revisedPdfUrl;
  };

  const isNearDeadline = (deadline?: string) => {
    if (!deadline) return false;
    const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7 && daysLeft >= 0;
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Theo dõi trạng thái</h1>
        <p className="text-gray-600">Theo dõi tiến độ thực hiện đề tài của bạn</p>
      </div>

      {myRegistrations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Bạn chưa có đăng ký nào</p>
          <p className="text-gray-400 mt-2">Vui lòng đăng ký đề tài để bắt đầu</p>
        </div>
      ) : (
        <div className="space-y-6">
          {myRegistrations.map((reg) => (
            <div key={reg.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                        {reg.type}
                      </span>
                      <span className="px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded">
                        {reg.period}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(reg.status)}`}>
                        {getStatusText(reg.status)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">{reg.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      GV hướng dẫn: {getAdvisorName(reg.advisorId)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Deadline Warning */}
                {reg.submissionDeadline && isNearDeadline(reg.submissionDeadline) && !reg.pdfUrl && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">Sắp đến hạn nộp bài!</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Hạn nộp: {new Date(reg.submissionDeadline).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="space-y-4">
                  {/* Registration */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Đăng ký đề tài</p>
                      <p className="text-sm text-gray-600">Đã hoàn thành</p>
                    </div>
                  </div>

                  {/* Advisor Approval */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        reg.status !== 'pending'
                          ? 'bg-green-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      {reg.status !== 'pending' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Giảng viên phê duyệt</p>
                      <p className="text-sm text-gray-600">
                        {reg.status === 'pending' ? 'Đang chờ duyệt' : 'Đã duyệt'}
                      </p>
                    </div>
                  </div>

                  {/* Upload Files */}
                  {canUploadPdf(reg) && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Upload className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-3">Nộp bài {reg.type}</p>
                        {uploadingFor === `${reg.id}-pdf` ? (
                          <div className="space-y-3">
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleFileUpload(reg.id, 'pdf')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                              >
                                Upload
                              </button>
                              <button
                                onClick={() => {
                                  setUploadingFor(null);
                                  setSelectedFile(null);
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setUploadingFor(`${reg.id}-pdf`)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                          >
                            Upload bài {reg.type}
                          </button>
                        )}
                        {reg.type === 'BCTT' && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-700 mb-2">Phiếu xác nhận thực tập:</p>
                            {uploadingFor === `${reg.id}-internship` ? (
                              <div className="space-y-3">
                                <input
                                  type="file"
                                  accept=".pdf"
                                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleFileUpload(reg.id, 'internship')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                                  >
                                    Upload
                                  </button>
                                  <button
                                    onClick={() => {
                                      setUploadingFor(null);
                                      setSelectedFile(null);
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setUploadingFor(`${reg.id}-internship`)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                              >
                                {reg.internshipCertUrl ? 'Đã upload ✓' : 'Upload phiếu'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Submitted */}
                  {reg.pdfUrl && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Đã nộp bài</p>
                        <p className="text-sm text-gray-600">
                          Ngày nộp: {reg.submittedAt ? new Date(reg.submittedAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </p>
                        <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          Xem bài đã nộp
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Defense Info */}
                  {reg.defenseDate && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Thông tin bảo vệ</p>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Ngày: {new Date(reg.defenseDate).toLocaleDateString('vi-VN')}
                          </p>
                          <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Địa điểm: {reg.defenseLocation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scores */}
                  {reg.finalScore && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">Kết quả điểm</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {reg.advisorScore && (
                            <div className="bg-blue-50 rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">GV hướng dẫn</p>
                              <p className="text-xl font-bold text-blue-600">{reg.advisorScore}</p>
                            </div>
                          )}
                          {reg.reviewerScore && (
                            <div className="bg-purple-50 rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">GV phản biện</p>
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
                            <p className="text-xs text-gray-600 mb-1">Điểm tổng kết</p>
                            <p className="text-xl font-bold text-green-600">{reg.finalScore}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload Revised */}
                  {canUploadRevised(reg) && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Upload className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">Nộp bài chỉnh sửa</p>
                        <p className="text-sm text-gray-600 mb-3">
                          Vui lòng chỉnh sửa theo góp ý của hội đồng và nộp lại
                        </p>
                        {uploadingFor === `${reg.id}-revised` ? (
                          <div className="space-y-3">
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleFileUpload(reg.id, 'revised')}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
                              >
                                Upload
                              </button>
                              <button
                                onClick={() => {
                                  setUploadingFor(null);
                                  setSelectedFile(null);
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setUploadingFor(`${reg.id}-revised`)}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
                          >
                            Upload bài chỉnh sửa
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Revision Approval Status */}
                  {reg.revisedPdfUrl && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">Trạng thái duyệt chỉnh sửa</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {reg.advisorApprovalRevision ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className="text-sm text-gray-700">
                              GV hướng dẫn: {reg.advisorApprovalRevision ? 'Đã duyệt' : 'Chờ duyệt'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {reg.chairmanApprovalRevision ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className="text-sm text-gray-700">
                              Chủ tịch hội đồng: {reg.chairmanApprovalRevision ? 'Đã duyệt' : 'Chờ duyệt'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
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