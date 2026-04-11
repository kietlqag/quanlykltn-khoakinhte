import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { CheckCircle, X, Upload, UploadCloud, Eye, Save, Users, Search, Download, Pencil } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'pending' | 'bctt' | 'kltn'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingTurnitin, setUploadingTurnitin] = useState<string | null>(null);
  const [scoringFor, setScoringFor] = useState<string | null>(null);
  const [viewingSubmissionRegId, setViewingSubmissionRegId] = useState<string | null>(null);
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const [criteriaByType, setCriteriaByType] = useState<{ BCTT: Criterion[]; KLTN: Criterion[] }>({
    BCTT: [],
    KLTN: [],
  });

  const myStudents = thesisRegistrations.filter((r) => r.advisorId === user?.id);

  const getStudentName = (studentId: string) => {
    const student = users.find((u) => u.id === studentId);
    return student?.fullName || 'N/A';
  };

  const normalizeSearch = (value: string) => String(value || '').toLowerCase().trim();
  const matchesSearch = (reg: any) => {
    const q = normalizeSearch(searchQuery);
    if (!q) return true;
    const haystack = [
      reg?.studentId,
      getStudentName(reg?.studentId),
      reg?.title,
      reg?.field,
      reg?.type,
      reg?.period,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
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

  const sanitizeUploadSegment = (value: string) =>
    String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'file';

  const uploadTurnitinFile = async (regId: string, regType: string, file: File) => {
    if (!user) {
      throw new Error('Không tìm thấy thông tin giảng viên.');
    }
    if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
      throw new Error('Thiếu cấu hình Cloudinary. Hãy thiết lập VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET.');
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/raw/upload`;
    const folder = [
      'truc_project',
      'turnitin',
      sanitizeUploadSegment(regType),
      sanitizeUploadSegment(user.id),
      sanitizeUploadSegment(regId),
    ].join('/');
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const extension = (file.name.split('.').pop() || 'pdf').toLowerCase();
    const publicId = [
      'turnitin',
      Date.now().toString(),
      sanitizeUploadSegment(baseName).slice(0, 40),
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
        reject(new Error('Upload không bắt đầu. Kiểm tra Cloudinary preset hoặc kết nối mạng.'));
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
            };
            if (response.version && response.public_id) {
              const normalizedPublicId = String(response.public_id).replace(/^\/+/, '');
              resolve(`https://res.cloudinary.com/${cloudinaryCloudName}/raw/upload/v${response.version}/${normalizedPublicId}`);
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

  const handleUploadTurnitin = async (regId: string) => {
    if (!selectedFile) {
      alert('Vui lòng chọn file');
      return;
    }
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadMessage('Đang tải Turnitin...');
      const reg = myStudents.find((r) => r.id === regId);
      if (!reg || !user) {
        throw new Error('Không tìm thấy thông tin hồ sơ.');
      }
      const turnitinUrl = await uploadTurnitinFile(regId, reg.type, selectedFile);
      updateThesisRegistration(regId, { turnitinUrl });
      setUploadingTurnitin(null);
      setSelectedFile(null);
      alert('Upload Turnitin thành công');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Upload Turnitin thất bại';
      alert(message);
    } finally {
      setIsUploading(false);
      setUploadMessage('');
      setUploadProgress(null);
    }
  };

  const setTurnitinFile = (file: File | null) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      alert('Chỉ chấp nhận file PDF.');
      return;
    }
    setSelectedFile(file);
  };

  const handleTurnitinDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] || null;
    setTurnitinFile(file);
  };

  const handleSaveScore = (regId: string) => {
    const reg = myStudents.find((r) => r.id === regId);
    if (!reg) return;
    const criteria = reg.type === 'BCTT' ? criteriaByType.BCTT : criteriaByType.KLTN;
    const total = criteria.reduce((sum, c) => sum + (criteriaScores[c.id] || 0), 0);
    const roundedScore = Number(total.toFixed(2));

    updateThesisRegistration(regId, {
      advisorCriteriaScores: criteriaScores,
      advisorScore: roundedScore,
      ...(reg.type === 'BCTT' && roundedScore >= 5 ? { status: 'completed' as const } : {}),
    });
    setScoringFor(null);
    setCriteriaScores({});
    alert(
      reg.type === 'BCTT' && roundedScore >= 5
        ? '?? l?u ?i?m. Sinh vi?n ???c x?c nh?n ho?n th?nh BCTT.'
        : '?? l?u ?i?m',
    );
  };

  const handleMarkBcttPassed = (regId: string) => {
    updateThesisRegistration(regId, { status: 'completed' });
    alert('Đã xác nhận hoàn thành BCTT. Sinh viên có thể đăng ký KLTN.');
  };

  const triggerDownload = async (url?: string, fallbackName = 'download.pdf') => {
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Không tải được file.');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fallbackName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error(error);
      alert('Tải file thất bại, vui lòng thử lại.');
    }
  };

  const pendingStudents = myStudents.filter((r) => r.status === 'pending');
  const submittedStudents = myStudents.filter((r) => r.pdfUrl && !r.advisorScore);
  const gradedStudents = myStudents.filter((r) => r.advisorScore);
  const revisionStudents = myStudents.filter((r) => r.revisedPdfUrl && !r.advisorApprovalRevision);
  const advisingStudents = myStudents.filter((r) => r.status !== 'pending' && r.status !== 'advisor_rejected');
  const advisingBcttStudents = advisingStudents.filter((r) => r.type === 'BCTT');
  const advisingKltnStudents = advisingStudents.filter((r) => r.type === 'KLTN');

  const filteredPendingStudents = pendingStudents.filter(matchesSearch);
  const filteredRevisionStudents = revisionStudents.filter(matchesSearch);
  const filteredSubmittedStudents = submittedStudents.filter(matchesSearch);
  const filteredGradedStudents = gradedStudents.filter(matchesSearch);
  const filteredAdvisingBcttStudents = advisingBcttStudents.filter(matchesSearch);
  const filteredAdvisingKltnStudents = advisingKltnStudents.filter(matchesSearch);
  const filteredAdvisingStudents =
    activeTab === 'bctt' ? filteredAdvisingBcttStudents : filteredAdvisingKltnStudents;
  const getCriteriaForType = (type: 'BCTT' | 'KLTN') =>
    type === 'BCTT' ? criteriaByType.BCTT : criteriaByType.KLTN;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="inline-flex rounded-full bg-gray-200 p-1 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
              activeTab === 'pending' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >{'\u0043\u0068\u1edd \u0064\u0075\u0079\u1ec7\u0074'} ({pendingStudents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bctt')}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
              activeTab === 'bctt' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >{'\u0110\u0061\u006e\u0067 \u0068\u01b0\u1edb\u006e\u0067 \u0064\u1eab\u006e \u0042\u0043\u0054\u0054'} ({advisingBcttStudents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kltn')}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
              activeTab === 'kltn' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >{'\u0110\u0061\u006e\u0067 \u0068\u01b0\u1edb\u006e\u0067 \u0064\u1eab\u006e \u004b\u004c\u0054\u004e'} ({advisingKltnStudents.length})
          </button>
        </div>

        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIds([]);
            }}
            placeholder={'\u0054\u00ec\u006d \u004d\u0053\u0053\u0056\u002c \u0054\u00ea\u006e\u002c \u0110\u1ec1 \u0074\u00e0\u0069\u002e\u002e\u002e'}
            className="w-full pl-10 pr-3 py-2.5 rounded-full border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Pending Approvals */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-end gap-2 flex-wrap bg-gray-50/70">
            <button
              onClick={() => handleBulkApprove(true)}
              disabled={selectedIds.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-semibold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              {'\u0044\u0075\u0079\u1ec7\u0074'} ({selectedIds.length})
            </button>
            <button
              onClick={() => handleBulkApprove(false)}
              disabled={selectedIds.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-semibold hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              {'\u0054\u1eeb \u0063\u0068\u1ed1\u0069'} ({selectedIds.length})
            </button>
          </div>

          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div className="col-span-4 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIds.length > 0 && selectedIds.length === filteredPendingStudents.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIds(filteredPendingStudents.map((r) => r.id));
                  } else {
                    setSelectedIds([]);
                  }
                }}
              />
              <span>{'\u0053\u0069\u006e\u0068 \u0076\u0069\u00ea\u006e'}</span>
            </div>
            <div className="col-span-5">{'\u0054\u00ea\u006e \u0111\u1ec1 \u0074\u00e0\u0069'}</div>
            <div className="col-span-3 text-right">{'\u0048\u00e0\u006e\u0068 \u0111\u1ed9\u006e\u0067'}</div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredPendingStudents.map((reg) => (
              <div key={reg.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:items-center">
                  <div className="md:col-span-4 flex items-start gap-3">
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
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {getStudentName(reg.studentId)}
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-gray-500">
                        <span className="truncate">{reg.studentId}</span>
                        <span>â€¢</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-medium rounded">{reg.type}</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 font-medium rounded">
                          {reg.period}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-5 min-w-0">
                    {editingTitle?.id === reg.id ? (
                      <input
                        type="text"
                        value={editingTitle.title}
                        onChange={(e) => setEditingTitle({ ...editingTitle, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-gray-900 truncate">{reg.title}</div>
                    )}
                    {reg.field && <div className="text-xs text-gray-500 truncate mt-1">{reg.field}</div>}
                  </div>

                  <div className="md:col-span-3 flex gap-2 md:justify-end flex-wrap">
                    <button
                      onClick={() => {
                        updateThesisRegistration(reg.id, { status: 'advisor_approved' });
                        setSelectedIds((prev) => prev.filter((id) => id !== reg.id));
                        alert('Đã duyệt đề tài');
                      }}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-full text-sm font-semibold hover:bg-green-700"
                    >
                      DUYỆT
                    </button>
                    <button
                      onClick={() => {
                        updateThesisRegistration(reg.id, { status: 'advisor_rejected' });
                        setSelectedIds((prev) => prev.filter((id) => id !== reg.id));
                        alert('Đã từ chối đề tài');
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-full text-sm font-semibold hover:bg-red-700"
                    >
                      TỪ CHỐI
                    </button>
                    <button
                      onClick={() => handleEditTitle(reg)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700"
                    >
                      {editingTitle?.id === reg.id ? '\u004c\u01af\u0055' : '\u0053\u1eec\u0041 \u0054\u00ca\u004e'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredPendingStudents.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500">
                {'\u0043\u0068\u01b0\u0061 \u0063\u00f3 \u0064\u1eef \u006c\u0069\u1ec7\u0075'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Advising Table */}
      {(activeTab === 'bctt' || activeTab === 'kltn') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          {activeTab === 'kltn' ? (
            <div className="hidden md:grid md:grid-cols-[2fr_2.6fr_1.1fr_1.1fr_0.8fr_1.1fr_1.3fr] gap-4 px-6 py-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div>{'\u0053\u0069\u006e\u0068 \u0076\u0069\u00ea\u006e'}</div>
              <div>{'\u0054\u00ea\u006e \u0111\u1ec1 \u0074\u00e0\u0069'}</div>
              <div className="text-center">{'\u0042\u00e0\u0069 \u006c\u00e0\u006d'}</div>
              <div className="text-center">Turnitin</div>
              <div className="text-center">{'\u0110\u0069\u1ec3\u006d'}</div>
              <div className="text-center">{'\u0043\u0068\u1ec9\u006e\u0068 \u0073\u1eeda'}</div>
              <div className="text-center">{'\u0042\u0069\u00ea\u006e \u0062\u1ea3\u006e \u0068\u1ed9\u0069 \u0111\u1ed3\u006e\u0067'}</div>
            </div>
          ) : (
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-3">{'\u0053\u0069\u006e\u0068 \u0076\u0069\u00ea\u006e'}</div>
              <div className="col-span-4">{'\u0054\u00ea\u006e \u0111\u1ec1 \u0074\u00e0\u0069'}</div>
              <div className="col-span-2 text-center">{'\u0042\u00e0\u0069 \u006c\u00e0\u006d'}</div>
              <div className="col-span-2 text-center">Turnitin</div>
              <div className="col-span-1 text-center">{'\u0110\u0069\u1ec3\u006d'}</div>
            </div>
          )}

          <div className="divide-y divide-gray-200">
            {filteredAdvisingStudents.map((reg) => (
              <div key={reg.id} className="px-6 py-4 hover:bg-gray-50">
                <div
                  className={`grid grid-cols-1 gap-3 md:items-center ${
                    activeTab === 'kltn'
                      ? 'md:grid-cols-[2fr_2.6fr_1.1fr_1.1fr_0.8fr_1.1fr_1.3fr]'
                      : 'md:grid-cols-12'
                  }`}
                >
                  <div className={activeTab === 'kltn' ? 'min-w-0' : 'md:col-span-3 min-w-0'}>
                    <div className="text-sm font-semibold text-gray-900 truncate">{getStudentName(reg.studentId)}</div>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {reg.studentId} - {reg.type}
                    </div>
                  </div>

                  <div className={activeTab === 'kltn' ? 'min-w-0' : 'md:col-span-4 min-w-0'}>
                    <div className="text-sm font-semibold text-gray-900 truncate">{reg.title}</div>
                  </div>

                  <div className={activeTab === 'kltn' ? 'md:text-center' : 'md:col-span-2 md:text-center'}>
                    {reg.pdfUrl ? (
                      <button
                        onClick={() => setViewingSubmissionRegId(reg.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:opacity-90"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {'\u0058\u0065\u006d \u0062\u00e0\u0069'}
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </div>

                  <div className={activeTab === 'kltn' ? 'md:text-center' : 'md:col-span-2 md:text-center'}>
                    {reg.turnitinUrl ? (
                      <button
                        onClick={() => window.open(reg.turnitinUrl, '_blank', 'noopener,noreferrer')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setUploadingTurnitin(reg.id);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 rounded-lg text-xs font-medium text-indigo-700 hover:bg-indigo-200"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {'\u0054\u1ea3\u0069 \u006c\u00ea\u006e'}
                      </button>
                    )}
                  </div>

                  <div className={activeTab === 'kltn' ? 'md:text-center' : 'md:col-span-1 md:text-center'}>
                    {typeof reg.advisorScore === 'number' ? (
                      <span className="inline-flex items-center justify-center min-w-8 rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                        {reg.advisorScore}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        <Pencil className="h-3.5 w-3.5" />
                        {'\u0043\u0068\u1ea5\u006d \u0111\u0069\u1ec3\u006d'}
                      </span>
                    )}
                  </div>

                  {activeTab === 'kltn' && (
                    <div className="md:text-center">
                      {reg.revisionExplanationUrl ? (
                        <button
                          onClick={() =>
                            reg.revisionExplanationUrl &&
                            window.open(reg.revisionExplanationUrl, '_blank', 'noopener,noreferrer')
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:opacity-90"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>
                  )}

                  {activeTab === 'kltn' && (
                    <div className="md:text-center">
                      {reg.councilMinutesUrl ? (
                        <button
                          onClick={() =>
                            reg.councilMinutesUrl &&
                            window.open(reg.councilMinutesUrl, '_blank', 'noopener,noreferrer')
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:opacity-90"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredAdvisingStudents.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500">
                {'\u0043\u0068\u01b0\u0061 \u0063\u00f3 \u0064\u1eef \u006c\u0069\u1ec7\u0075'}
              </div>
            )}
          </div>
        </div>
      )}

      {viewingSubmissionRegId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {(() => {
              const activeReg = myStudents.find((item) => item.id === viewingSubmissionRegId);
              if (!activeReg) return null;
              return (
                <>
                  <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{'\u0058\u0065\u006d \u0068\u1ed3 \u0073\u01a1 \u0062\u00e0\u0069 \u006e\u1ed9\u0070'}</h2>
                      <p className="mt-1 text-sm text-gray-600">{activeReg.title}</p>
                    </div>
                    <button
                      onClick={() => setViewingSubmissionRegId(null)}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid gap-4 px-6 py-6 md:grid-cols-2">
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                      <p className="text-sm font-semibold text-gray-900">{'\u0042\u00e0\u0069 \u006c\u00e0\u006d \u0042\u0043\u0054\u0054 \u0028\u0050\u0044\u0046\u0029'}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() =>
                            activeReg.pdfUrl &&
                            window.open(activeReg.pdfUrl, '_blank', 'noopener,noreferrer')
                          }
                          disabled={!activeReg.pdfUrl}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Xem file
                        </button>
                        {activeReg.pdfUrl ? (
                          <button
                            type="button"
                            onClick={() => triggerDownload(activeReg.pdfUrl, `${activeReg.studentId}-bao-cao-bctt.pdf`)}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                          >
                            <Download className="h-3.5 w-3.5" />
                            {'\u0054\u1ea3\u0069 \u0076\u1ec1'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">{'\u0043\u0068\u01b0\u0061 \u0063\u00f3 \u0066\u0069\u006c\u0065'}</span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                      <p className="text-sm font-semibold text-gray-900">{'\u0050\u0068\u0069\u1ebf\u0075 \u0078\u00e1\u0063 \u006e\u0068\u1ead\u006e \u0063\u00f4\u006e\u0067 \u0074\u0079 \u0028\u0050\u0044\u0046\u0029'}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() =>
                            activeReg.internshipCertUrl &&
                            window.open(activeReg.internshipCertUrl, '_blank', 'noopener,noreferrer')
                          }
                          disabled={!activeReg.internshipCertUrl}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Xem file
                        </button>
                        {activeReg.internshipCertUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              triggerDownload(
                                activeReg.internshipCertUrl,
                                `${activeReg.studentId}-phieu-xac-nhan-cong-ty.pdf`,
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                          >
                            <Download className="h-3.5 w-3.5" />
                            {'\u0054\u1ea3\u0069 \u0076\u1ec1'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">{'\u0043\u0068\u01b0\u0061 \u0063\u00f3 \u0066\u0069\u006c\u0065'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {uploadingTurnitin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {(() => {
              const activeReg = myStudents.find((item) => item.id === uploadingTurnitin);
              if (!activeReg) return null;

              return (
                <>
                  <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Upload Turnitin Report</h2>
                      <p className="mt-1 text-sm text-gray-600">{activeReg.title}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (isUploading) return;
                        setUploadingTurnitin(null);
                        setSelectedFile(null);
                      }}
                      disabled={isUploading}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="px-6 py-6">
                    <input
                      id="upload-turnitin-pdf"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => setTurnitinFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="upload-turnitin-pdf"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleTurnitinDrop}
                      className="block cursor-pointer rounded-2xl border border-blue-200 bg-blue-50/70 p-5 transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <div className="mb-4">
                        <div>
                          <p className="font-medium text-gray-900">File Turnitin (PDF)</p>
                          <p className="text-sm text-gray-600">{'\u0054\u1ea3\u0069 \u006c\u00ea\u006e \u0062\u00e1\u006f \u0063\u00e1\u006f \u0054\u0075\u0072\u006e\u0069\u0074\u0069\u006e \u0063\u1ee7\u0061 \u0073\u0069\u006e\u0068 \u0076\u0069\u00ea\u006e'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-dashed border-blue-300 bg-white/80 px-4 py-3">
                        <UploadCloud className="h-5 w-5 text-blue-600" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-blue-700">{'\u004e\u0068\u1ea5\u006e \u0068\u006f\u1eb7\u0063 \u006b\u00e9\u006f \u0074\u0068\u1ea3 \u0066\u0069\u006c\u0065 \u0076\u00e0\u006f \u0111\u00e2\u0079'}</p>
                          <p className="truncate text-xs text-gray-600">
                            {selectedFile?.name || '\u0043\u0068\u01b0\u0061 \u0063\u0068\u1ecdn \u0066\u0069\u006c\u0065'}
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {isUploading && (
                    <div className="px-6 pb-2">
                      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-blue-900">{uploadMessage || '\u0110ang upload...'}</span>
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
                      onClick={() => {
                        if (isUploading) return;
                        setUploadingTurnitin(null);
                        setSelectedFile(null);
                      }}
                      disabled={isUploading}
                      className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      {'\u0048\u1ee7\u0079'}
                    </button>
                    <button
                      onClick={() => handleUploadTurnitin(activeReg.id)}
                      disabled={!selectedFile || isUploading}
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                      {isUploading ? '\u0110ang upload...' : '\u0058\u00e1\u0063 \u006e\u0068\u1ead\u006e upload'}
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
