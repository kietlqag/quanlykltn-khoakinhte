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
  X,
  ClipboardCheck,
} from 'lucide-react';

export function StudentStatus() {
  const { user } = useAuth();
  const { thesisRegistrations, users, updateThesisRegistration } = useData();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [submitModalRegId, setSubmitModalRegId] = useState<string | null>(null);
  const [submissionFiles, setSubmissionFiles] = useState<{
    pdf: File | null;
    internship: File | null;
  }>({
    pdf: null,
    internship: null,
  });
  const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

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

  const isSubmissionOpen = (deadline?: string) => {
    if (!deadline) return false;
    const endDate = new Date(deadline);
    if (Number.isNaN(endDate.getTime())) return false;
    const now = new Date();
    return now <= endDate;
  };

  const sanitizeUploadSegment = (value: string) =>
    String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'file';

  const uploadFile = async (
    regId: string,
    uploadType: 'pdf' | 'internship' | 'revised' | 'explanation',
    file: File,
  ) => {
    const registration = myRegistrations.find((r) => r.id === regId);
    if (!registration || !user) {
      throw new Error('Không tìm thấy thông tin đăng ký.');
    }

    if ((uploadType === 'pdf' || uploadType === 'internship') && !isSubmissionOpen(registration.submissionDeadline)) {
      throw new Error('Đã quá hạn nộp hồ sơ cho đợt này.');
    }

    if ((uploadType === 'revised' || uploadType === 'explanation') && registration.status !== 'defended') {
      throw new Error('Chỉ được nộp hồ sơ chỉnh sửa sau khi bảo vệ.');
    }

    if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
      throw new Error('Thiếu cấu hình Cloudinary. Hãy thiết lập VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET.');
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/raw/upload`;
    const folder = [
      'truc_project',
      sanitizeUploadSegment(registration.type),
      sanitizeUploadSegment(user.id),
      sanitizeUploadSegment(regId),
    ].join('/');
    const originalName = file.name.replace(/\.[^.]+$/, '');
    const extension = (file.name.split('.').pop() || 'pdf').toLowerCase();
    const publicId = [
      sanitizeUploadSegment(uploadType),
      Date.now().toString(),
      sanitizeUploadSegment(originalName).slice(0, 40),
    ]
      .filter(Boolean)
      .join('-')
      .concat(`.${extension}`);

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      formData.append('file', file);
      formData.append('upload_preset', cloudinaryUploadPreset);
      formData.append('folder', folder);
      formData.append('public_id', publicId);

      const startTimeout = window.setTimeout(() => {
        xhr.abort();
        reject(new Error('Upload Cloudinary không bắt đầu. Kiểm tra cloud name, upload preset hoặc kết nối mạng.'));
      }, 15000);

      xhr.upload.onprogress = (event) => {
        window.clearTimeout(startTimeout);
        if (!event.lengthComputable) return;
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
      };

      xhr.onerror = () => {
        window.clearTimeout(startTimeout);
        reject(new Error('Upload Cloudinary thất bại do lỗi mạng.'));
      };

      xhr.onabort = () => {
        window.clearTimeout(startTimeout);
        reject(new Error('Upload đã bị hủy.'));
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState !== XMLHttpRequest.DONE) return;
        window.clearTimeout(startTimeout);

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText) as {
              secure_url?: string;
              version?: number | string;
              public_id?: string;
              resource_type?: string;
              type?: string;
            };

            if (response.version && response.public_id) {
              const normalizedPublicId = String(response.public_id).replace(/^\/+/, '');
              const forcedPublicUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/raw/upload/v${response.version}/${normalizedPublicId}`;
              resolve(forcedPublicUrl);
              return;
            }

            if (!response.secure_url) {
              reject(new Error('Cloudinary không trả về secure_url.'));
              return;
            }
            resolve(response.secure_url);
          } catch {
            reject(new Error('Không đọc được phản hồi Cloudinary.'));
          }
          return;
        }

        try {
          const response = JSON.parse(xhr.responseText) as { error?: { message?: string } };
          reject(new Error(response.error?.message || `Cloudinary upload failed with status ${xhr.status}.`));
        } catch {
          reject(new Error(`Cloudinary upload failed with status ${xhr.status}.`));
        }
      };

      xhr.open('POST', endpoint);
      xhr.send(formData);
    });
  };

  const handleFileUpload = async (
    regId: string,
    uploadType: 'pdf' | 'internship' | 'revised' | 'explanation',
  ) => {
    if (!selectedFile) {
      alert('Vui lòng chọn file');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadMessage('Đang tải file...');
      const url = await uploadFile(regId, uploadType, selectedFile);

      const updates: Record<string, unknown> = {
        submittedAt: new Date().toISOString().split('T')[0],
      };

      if (uploadType === 'pdf') {
        updates.pdfUrl = url;
        updates.status = 'submitted';
      } else if (uploadType === 'internship') {
        updates.internshipCertUrl = url;
      } else if (uploadType === 'revised') {
        updates.revisedPdfUrl = url;
        updates.status = 'revision_pending';
      } else if (uploadType === 'explanation') {
        updates.revisionExplanationUrl = url;
      }

      updateThesisRegistration(regId, updates);
      setSelectedFile(null);
      setUploadingFor(null);
      setUploadMessage('');
      setUploadProgress(null);
      alert('Upload thành công!');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Upload thất bại, vui lòng thử lại.';
      alert(message);
    } finally {
      setIsUploading(false);
      setUploadMessage('');
      setUploadProgress(null);
    }
  };

  const openSubmitModal = (regId: string) => {
    setSubmitModalRegId(regId);
    setSubmissionFiles({ pdf: null, internship: null });
  };

  const closeSubmitModal = () => {
    setSubmitModalRegId(null);
    setSubmissionFiles({ pdf: null, internship: null });
  };

  const handleSubmitRegistrationFiles = async (reg: any) => {
    if (!submissionFiles.pdf) {
      alert('Vui lòng chọn file bài nộp.');
      return;
    }

    if (reg.type === 'BCTT' && !submissionFiles.internship) {
      alert('Vui lòng chọn phiếu xác nhận thực tập.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadMessage('Đang tải file bài nộp...');
      const pdfUrl = await uploadFile(reg.id, 'pdf', submissionFiles.pdf);
      const updates: Record<string, unknown> = {
        pdfUrl,
        status: 'submitted',
        submittedAt: new Date().toISOString().split('T')[0],
      };

      if (reg.type === 'BCTT' && submissionFiles.internship) {
        setUploadProgress(0);
        setUploadMessage('Đang tải phiếu xác nhận thực tập...');
        updates.internshipCertUrl = await uploadFile(reg.id, 'internship', submissionFiles.internship);
      }

      updateThesisRegistration(reg.id, updates);
      closeSubmitModal();
      setUploadMessage('');
      setUploadProgress(null);
      alert('Nộp hồ sơ thành công!');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Nộp hồ sơ thất bại, vui lòng thử lại.';
      alert(message);
    } finally {
      setIsUploading(false);
      setUploadMessage('');
      setUploadProgress(null);
    }
  };

  const canUploadPdf = (reg: any) => {
    return reg.status === 'advisor_approved' && !reg.pdfUrl && isSubmissionOpen(reg.submissionDeadline);
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
    <div className="w-full">
      <div className="hidden">
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
                    <p className="text-sm text-gray-600 mt-1">GV hướng dẫn: {getAdvisorName(reg.advisorId)}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {reg.submissionDeadline && isNearDeadline(reg.submissionDeadline) && !reg.pdfUrl && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">Sắp đến hạn nộp bài</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Hạn nộp: {new Date(reg.submissionDeadline).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                )}

                {reg.submissionDeadline && !isSubmissionOpen(reg.submissionDeadline) && !reg.pdfUrl && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">Đã quá hạn nộp bài</p>
                      <p className="text-sm text-red-700 mt-1">
                        Hạn nộp: {new Date(reg.submissionDeadline).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Đăng ký đề tài</p>
                      <p className="text-sm text-gray-600">Đã hoàn thành</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        reg.status !== 'pending' ? 'bg-green-100' : 'bg-gray-100'
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
                      <p className="text-sm text-gray-600">{reg.status === 'pending' ? 'Đang chờ duyệt' : 'Đã duyệt'}</p>
                    </div>
                  </div>

                  {canUploadPdf(reg) && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Upload className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">Nộp bài {reg.type}</p>
                        <p className="text-sm text-gray-600 mb-4">
                          {reg.type === 'BCTT'
                            ? 'Tải lên bài báo cáo và phiếu xác nhận thực tập.'
                            : 'Tải lên file PDF bài nộp.'}
                        </p>
                        <button
                          onClick={() => openSubmitModal(reg.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                          Nộp bài
                        </button>
                      </div>
                    </div>
                  )}

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
                        <div className="mt-2 space-y-2">
                          <button
                            onClick={() => window.open(reg.pdfUrl, '_blank', 'noopener,noreferrer')}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Xem báo cáo đã nộp
                          </button>
                          {reg.type === 'BCTT' && (
                            reg.internshipCertUrl ? (
                              <button
                                onClick={() => window.open(reg.internshipCertUrl, '_blank', 'noopener,noreferrer')}
                                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                Xem phiếu xác nhận thực tập
                              </button>
                            ) : (
                              <p className="text-sm text-amber-600">Chưa có phiếu xác nhận thực tập</p>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}

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

                  {canUploadRevised(reg) && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Upload className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">Nộp bài chỉnh sửa</p>
                        <p className="text-sm text-gray-600 mb-3">
                          Vui lòng chỉnh sửa theo góp ý của hội đồng và nộp lại.
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
                                disabled={isUploading}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
                              >
                                {isUploading ? 'Đang upload...' : 'Upload'}
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

                        <div className="mt-3">
                          <p className="text-sm text-gray-700 mb-2">Biên bản giải trình chỉnh sửa:</p>
                          {uploadingFor === `${reg.id}-explanation` ? (
                            <div className="space-y-3">
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleFileUpload(reg.id, 'explanation')}
                                  disabled={isUploading}
                                  className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
                                >
                                  {isUploading ? 'Đang upload...' : 'Upload'}
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
                              onClick={() => setUploadingFor(`${reg.id}-explanation`)}
                              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
                            >
                              {reg.revisionExplanationUrl ? 'Đã upload giải trình' : 'Upload giải trình'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {reg.revisedPdfUrl && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">Trạng thái duyệt chỉnh sửa</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {reg.revisionExplanationUrl ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className="text-sm text-gray-700">
                              Biên bản giải trình: {reg.revisionExplanationUrl ? 'Đã nộp' : 'Chưa nộp'}
                            </span>
                            {reg.revisionExplanationUrl && (
                              <button
                                onClick={() => window.open(reg.revisionExplanationUrl, '_blank', 'noopener,noreferrer')}
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                Xem
                              </button>
                            )}
                          </div>
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

      {submitModalRegId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {(() => {
              const activeReg = myRegistrations.find((item) => item.id === submitModalRegId);
              if (!activeReg) return null;

              const isBctt = activeReg.type === 'BCTT';
              const canSubmit = Boolean(submissionFiles.pdf) && (!isBctt || Boolean(submissionFiles.internship));

              return (
                <>
                  <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Nộp bài {activeReg.type}</h2>
                      <p className="mt-1 text-sm text-gray-600">{activeReg.title}</p>
                    </div>
                    <button
                      onClick={closeSubmitModal}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className={`grid gap-4 px-6 py-6 ${isBctt ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                    <label className="block rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">File bài nộp</p>
                          <p className="text-sm text-gray-600">Tải lên file PDF báo cáo</p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) =>
                          setSubmissionFiles((prev) => ({
                            ...prev,
                            pdf: e.target.files?.[0] || null,
                          }))
                        }
                        className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2.5 file:font-medium file:text-white hover:file:bg-blue-700"
                      />
                      {submissionFiles.pdf && (
                        <p className="mt-3 text-sm text-gray-700">{submissionFiles.pdf.name}</p>
                      )}
                    </label>

                    {isBctt && (
                      <label className="block rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100">
                            <ClipboardCheck className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Phiếu xác nhận thực tập</p>
                            <p className="text-sm text-gray-600">Tải lên file PDF xác nhận</p>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) =>
                            setSubmissionFiles((prev) => ({
                              ...prev,
                              internship: e.target.files?.[0] || null,
                            }))
                          }
                          className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-amber-600 file:px-4 file:py-2.5 file:font-medium file:text-white hover:file:bg-amber-700"
                        />
                        {submissionFiles.internship && (
                          <p className="mt-3 text-sm text-gray-700">{submissionFiles.internship.name}</p>
                        )}
                      </label>
                    )}
                  </div>

                  {isUploading && (
                    <div className="px-6 pb-2">
                      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-blue-900">{uploadMessage || 'Đang nộp hồ sơ...'}</span>
                          <span className="text-blue-700">{uploadProgress ?? 0}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all"
                            style={{ width: `${uploadProgress ?? 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
                    <button
                      onClick={closeSubmitModal}
                      disabled={isUploading}
                      className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => handleSubmitRegistrationFiles(activeReg)}
                      disabled={!canSubmit || isUploading}
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                      {isUploading ? 'Đang nộp...' : 'Xác nhận nộp bài'}
                    </button>
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
