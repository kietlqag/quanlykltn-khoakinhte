import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Eye, FileText, ClipboardCheck, UploadCloud, X } from 'lucide-react';

type DotRow = {
  dot: string;
  loaiDeTai: string;
  major: string;
  endEx: string;
  endReg: string;
};

const I18N = {
  errMissingReg: 'Kh\u00f4ng t\u00ecm th\u1ea5y th\u00f4ng tin \u0111\u0103ng k\u00fd.',
  errMissingCloud: 'Thi\u1ebfu c\u1ea5u h\u00ecnh Cloudinary.',
  errNetwork: 'Upload th\u1ea5t b\u1ea1i do l\u1ed7i m\u1ea1ng.',
  errAbort: 'Upload \u0111\u00e3 b\u1ecb h\u1ee7y.',
  errNoSecureUrl: 'Cloudinary kh\u00f4ng tr\u1ea3 v\u1ec1 secure_url.',
  errParseCloud: 'Kh\u00f4ng \u0111\u1ecdc \u0111\u01b0\u1ee3c ph\u1ea3n h\u1ed3i Cloudinary.',
  errPdfOnly: 'Ch\u1ec9 ch\u1ea5p nh\u1eadn file PDF.',
  errChoosePdf: 'Vui l\u00f2ng ch\u1ecdn file b\u00e0i l\u00e0m BCTT.',
  errChooseIntern: 'Vui l\u00f2ng ch\u1ecdn file Phi\u1ebfu x\u00e1c nh\u1eadn c\u00f4ng ty.',
  uploadingPdf: '\u0110ang t\u1ea3i B\u00e0i l\u00e0m BCTT...',
  uploadingIntern: '\u0110ang t\u1ea3i Phi\u1ebfu x\u00e1c nh\u1eadn c\u00f4ng ty...',
  uploadDone: 'N\u1ed9p b\u00e0i ch\u00ednh th\u1ee9c th\u00e0nh c\u00f4ng.',
  uploadFailed: 'N\u1ed9p b\u00e0i th\u1ea5t b\u1ea1i.',
  emptyTitle: 'B\u1ea1n ch\u01b0a c\u00f3 \u0111\u0103ng k\u00fd BCTT',
  emptyDesc: 'Vui l\u00f2ng \u0111\u0103ng k\u00fd \u0111\u1ec1 t\u00e0i \u0111\u1ec3 b\u1eaft \u0111\u1ea7u',
  statusPending: 'TR\u1ea0NG TH\u00c1I: \u0110ANG CH\u1edc DUY\u1ec6T',
  pendingDesc:
    'H\u1ec7 th\u1ed1ng \u0111\u00e3 ghi nh\u1eadn \u0111\u0103ng k\u00fd c\u1ee7a b\u1ea1n. Vui l\u00f2ng \u0111\u1ee3i Gi\u1ea3ng vi\u00ean ph\u00ea duy\u1ec7t.',
  sectionRegDetail: 'CHI TI\u1ebeT \u0110\u0102NG K\u00dd',
  lblTitle: 'T\u00ean \u0111\u1ec1 t\u00e0i:',
  lblField: 'L\u0129nh v\u1ef1c:',
  lblPeriod: '\u0110\u1ee3t:',
  lblRegDate: 'Ng\u00e0y \u0111\u0103ng k\u00fd:',
  lblAdvisor: 'Gi\u1ea3ng vi\u00ean h\u01b0\u1edbng d\u1eabn:',
  waitAdvisor: '\u0110ang ch\u1edd Gi\u1ea3ng vi\u00ean ph\u1ea3n h\u1ed3i',
  statusDoing: 'TR\u1ea0NG TH\u00c1I: \u0110ANG TH\u1ef0C HI\u1ec6N',
  doingDesc:
    'B\u1ea1n c\u00f3 th\u1ec3 b\u1eaft \u0111\u1ea7u qu\u00e1 tr\u00ecnh th\u1ef1c t\u1eadp. Vui l\u00f2ng n\u1ed9p b\u00e1o c\u00e1o \u0111\u00fang th\u1eddi h\u1ea1n.',
  sectionApproveInfo: 'TH\u00d4NG TIN PH\u00ca DUY\u1ec6T',
  lblDeadline: 'H\u1ea1n n\u1ed9p b\u00e0i:',
  sectionSubmit: 'Khung n\u1ed9p B\u00e1o c\u00e1o th\u1ef1c t\u1eadp (PDF)',
  submitNote:
    'Vui l\u00f2ng ki\u1ec3m tra \u0111\u1ecbnh d\u1ea1ng file tr\u01b0\u1edbc khi n\u1ed9p b\u00e0i: B\u00e0i l\u00e0m BCTT (PDF) v\u00e0 Phi\u1ebfu x\u00e1c nh\u1eadn c\u00f4ng ty (PDF).',
  submitOfficial: 'N\u1ed8P B\u00c0I CH\u00cdNH TH\u1ee8C',
  fileReport: 'File B\u00e1o c\u00e1o th\u1ef1c t\u1eadp.pdf',
  fileCompany: 'File Phi\u1ebfu x\u00e1c nh\u1eadn c\u00f4ng ty.pdf',
  uploadLabelReport: 'B\u00e0i l\u00e0m BCTT (PDF)',
  uploadLabelCompany: 'Phi\u1ebfu x\u00e1c nh\u1eadn c\u00f4ng ty (PDF)',
  statusDone: 'TR\u1ea0NG TH\u00c1I: \u0110\u00c3 HO\u00c0N TH\u00c0NH',
  doneDesc: 'Ch\u00fac m\u1eebng b\u1ea1n \u0111\u00e3 ho\u00e0n th\u00e0nh B\u00e1o c\u00e1o th\u1ef1c t\u1eadp.',
  sectionTopicInfo: 'TH\u00d4NG TIN \u0110\u1ec0 T\u00c0I',
  submittedFiles: 'File \u0111\u00e3 n\u1ed9p:',
  sectionScore: 'K\u1ebeT QU\u1ea2',
  scoreDone: '\u0110\u00e3 ho\u00e0n th\u00e0nh h\u1ecdc ph\u1ea7n',
  scoreLabel: '\u0110i\u1ec3m:',
  doneBcttBanner: 'B\u00c1O C\u00c1O TH\u1ef0C T\u1eacP HO\u00c0N T\u1ea4T',
  doneBcttBannerDesc:
    'Ch\u00fac m\u1eebng b\u1ea1n \u0111\u00e3 v\u01b0\u1ee3t qua B\u00e1o c\u00e1o th\u1ef1c t\u1eadp. H\u1ec7 th\u1ed1ng hi\u1ec7n \u0111\u00e3 s\u1eb5n s\u00e0ng \u0111\u1ec3 b\u1ea1n \u0111\u0103ng k\u00fd Kh\u00f3a lu\u1eadn t\u1ed1t nghi\u1ec7p.',
  startKltn: 'B\u1eaeT \u0110\u1ea6U \u0110\u0102NG K\u00dd KLTN',
  tabBctt: 'B\u00e1o c\u00e1o th\u1ef1c t\u1eadp (BCTT)',
  tabKltn: 'Kh\u00f3a lu\u1eadn t\u1ed1t nghi\u1ec7p (KLTN)',
  emptyKltnTitle: 'B\u1ea1n ch\u01b0a \u0111\u0103ng k\u00fd KLTN',
  emptyKltnDesc: 'Sau khi \u0111\u1ee7 \u0111i\u1ec1u ki\u1ec7n, b\u1ea1n c\u00f3 th\u1ec3 b\u1eaft \u0111\u1ea7u \u0111\u0103ng k\u00fd Kh\u00f3a lu\u1eadn t\u1ed1t nghi\u1ec7p.',
  kltnStatusDoing: 'TR\u1ea0NG TH\u00c1I: \u0110ANG TH\u1ef0C HI\u1ec6N',
  kltnDoingDesc:
    'C\u1ed5ng n\u1ed9p b\u00e0i Kh\u00f3a lu\u1eadn t\u1ed1t nghi\u1ec7p \u0111\u00e3 m\u1edf. Vui l\u00f2ng n\u1ed9p b\u00e1o c\u00e1o \u0111\u00fang th\u1eddi h\u1ea1n.',
  kltnSubmitFrame: 'Khung n\u1ed9p Kh\u00f3a lu\u1eadn t\u1ed1t nghi\u1ec7p (PDF)',
  kltnSubmitHint: 'MSSV_HoTen_KLTN.pdf',
  kltnChooseDraft: 'Vui l\u00f2ng ch\u1ecdn file KLTN (PDF).',
  kltnUploadingDraft: '\u0110ang t\u1ea3i file KLTN...',
  kltnStatusGrading: 'TR\u1ea0NG TH\u00c1I: \u0110ANG CH\u1ea4M \u0110I\u1ec2M',
  kltnGradingDesc: 'GVHD & GVPB \u0111ang xem x\u00e9t b\u00e0i l\u00e0m c\u1ee7a b\u1ea1n.',
  kltnEligibleCouncilStatus: 'TR\u1ea0NG TH\u00c1I: \u0110\u1ee6 \u0110I\u1ec0U KI\u1ec6N RA H\u1ed8I \u0110\u1ed2NG B\u1ea2O V\u1ec6 KLTN',
  kltnEligibleCouncilDesc: 'B\u1ea1n \u0111\u1ee7 \u0111i\u1ec1u ki\u1ec7n ra h\u1ed9i \u0111\u1ed3ng b\u1ea3o v\u1ec7 KLTN.',
  kltnIneligibleCouncilStatus: 'TR\u1ea0NG TH\u00c1I: KH\u00d4NG \u0110\u1ee6 \u0110I\u1ec0U KI\u1ec6N RA H\u1ed8I \u0110\u1ed2NG B\u1ea2O V\u1ec6 KLTN',
  kltnIneligibleCouncilDesc: 'B\u1ea1n ch\u01b0a \u0111\u1ee7 \u0111i\u1ec1u ki\u1ec7n ra h\u1ed9i \u0111\u1ed3ng b\u1ea3o v\u1ec7 KLTN.',
  advisorGraded: '\u0110\u00e3 ch\u1ea5m',
  advisorGrading: '\u0110ang ch\u1ea5m',
  reviewerGraded: '\u0110\u00e3 ch\u1ea5m',
  reviewerGrading: '\u0110ang ch\u1ea5m',
  waitAdvisorScore: 'H\u1ec7 th\u1ed1ng \u0111ang \u0111\u1ee3i \u0111i\u1ec3m s\u1ed1 t\u1eeb GVHD.',
  waitReviewerScore: 'H\u1ec7 th\u1ed1ng \u0111ang \u0111\u1ee3i nh\u1eadn x\u00e9t v\u00e0 \u0111i\u1ec3m s\u1ed1 t\u1eeb GVPB.',
  kltnStatusCouncil: 'TR\u1ea0NG TH\u00c1I: H\u1ed8I \u0110\u1ed2NG B\u1ea2O V\u1ec6',
  kltnCouncilDesc: 'L\u1ecbch b\u1ea3o v\u1ec7 ch\u00ednh th\u1ee9c c\u1ee7a b\u1ea1n \u0111\u00e3 c\u00f3 tr\u00ean h\u1ec7 th\u1ed1ng.',
  sectionDefenseInfo: 'TH\u00d4NG TIN BU\u1ed4I B\u1ea2O V\u1ec6',
  lblDefenseDateTime: 'Ng\u00e0y & Gi\u1edd:',
  lblDefenseLocation: '\u0110\u1ecba \u0111i\u1ec3m:',
  lblCouncilMembers: 'Th\u00e0nh vi\u00ean h\u1ed9i \u0111\u1ed3ng:',
  kltnStatusRevision: 'TR\u1ea0NG TH\u00c1I: CH\u1ec8NH S\u1eecA SAU B\u1ea2O V\u1ec6',
  kltnRevisionDesc: 'B\u1ea1n \u0111\u00e3 b\u1ea3o v\u1ec7 th\u00e0nh c\u00f4ng. Vui l\u00f2ng ho\u00e0n thi\u1ec7n b\u00e0i l\u00e0m theo Bi\u00ean b\u1ea3n.',
  sectionRevisionSubmit: 'Khung n\u1ed9p KLTN cu\u1ed1i c\u00f9ng (PDF)',
  revisionSubmitNote:
    'Vui l\u00f2ng ki\u1ec3m tra \u0111\u1ecbnh d\u1ea1ng file tr\u01b0\u1edbc khi n\u1ed9p b\u00e0i: KLTN ch\u1ec9nh s\u1eeda (PDF) v\u00e0 Bi\u00ean b\u1ea3n gi\u1ea3i tr\u00ecnh (PDF).',
  uploadLabelRevision: 'KLTN ch\u1ec9nh s\u1eeda (PDF)',
  uploadLabelExplain: 'Bi\u00ean b\u1ea3n gi\u1ea3i tr\u00ecnh (PDF)',
  submitRevision: 'N\u1ed8P B\u00c0I',
  chooseRevision: 'Vui l\u00f2ng ch\u1ecdn \u0111\u1ee7 2 file ch\u1ec9nh s\u1eeda.',
  uploadingRevision: '\u0110ang t\u1ea3i b\u1ea3n ch\u1ec9nh s\u1eeda...',
  uploadingExplain: '\u0110ang t\u1ea3i bi\u00ean b\u1ea3n gi\u1ea3i tr\u00ecnh...',
  sectionRevisionApprove: 'TR\u1ea0NG TH\u00c1I PH\u00ca DUY\u1ec6T B\u1ea2N CH\u1ec8NH S\u1eecA',
  advisorApproveDone: 'Gi\u1ea3ng vi\u00ean h\u01b0\u1edbng d\u1eabn \u0111\u1ed3ng \u00fd',
  advisorApproveWaiting: 'Gi\u1ea3ng vi\u00ean h\u01b0\u1edbng d\u1eabn \u0111ang duy\u1ec7t',
  chairmanApproveDone: 'Ch\u1ee7 t\u1ecbch h\u1ed9i \u0111\u1ed3ng \u0111\u1ed3ng \u00fd',
  chairmanApproveWaiting: 'Ch\u1ee7 t\u1ecbch h\u1ed9i \u0111\u1ed3ng \u0111ang duy\u1ec7t',
  sectionCouncilMinutesRevision: 'BI\u00caN B\u1ea2N H\u1ed8I \u0110\u1ed2NG (S\u1eecA B\u00c0I)',
  downloadMinutes: 'T\u1ea3i bi\u00ean b\u1ea3n',
  modalTitle: 'N\u1ed9p b\u00e0i BCTT ch\u00ednh th\u1ee9c',
  modalTitleKltn: 'N\u1ed9p b\u00e0i KLTN ch\u00ednh th\u1ee9c',
  dropHint: 'Nh\u1ea5n ho\u1eb7c k\u00e9o th\u1ea3 file v\u00e0o \u0111\u00e2y',
  noFile: 'Ch\u01b0a ch\u1ecdn file',
  uploadingFallback: '\u0110ang n\u1ed9p h\u1ed3 s\u01a1...',
  cancel: 'H\u1ee7y',
  uploading: '\u0110ang n\u1ed9p...',
};

export function StudentStatus() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { thesisRegistrations, users, councils, updateThesisRegistration } = useData();
  const [statusTab, setStatusTab] = useState<'BCTT' | 'KLTN'>('BCTT');

  const [dotRows, setDotRows] = useState<DotRow[]>([]);
  const [submitModalRegId, setSubmitModalRegId] = useState<string | null>(null);
  const [submissionFiles, setSubmissionFiles] = useState<{ pdf: File | null; internship: File | null }>({
    pdf: null,
    internship: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [kltnRevisionFile, setKltnRevisionFile] = useState<File | null>(null);
  const [kltnExplainFile, setKltnExplainFile] = useState<File | null>(null);

  const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const normalizeText = (value: string) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const parseDate = (value?: string | null): Date | null => {
    const raw = String(value || '').trim();
    if (!raw) return null;

    const iso = new Date(raw);
    if (!Number.isNaN(iso.getTime())) return iso;

    const mdy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (mdy) {
      const month = Number(mdy[1]);
      const day = Number(mdy[2]);
      let year = Number(mdy[3]);
      if (year < 100) year += 2000;
      const d = new Date(year, month - 1, day);
      if (!Number.isNaN(d.getTime())) return d;
    }

    return null;
  };

  const formatDate = (value?: string | null) => {
    const d = parseDate(value);
    if (!d) return '-';
    return d.toLocaleDateString('vi-VN');
  };

  const getAdvisorInfo = (advisorId: string) => {
    const advisor = users.find((u) => u.id === advisorId);
    return {
      name: advisor?.fullName || 'N/A',
      email: advisor?.email || '',
    };
  };

  const sanitizeUploadSegment = (value: string) =>
    String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'file';

  const currentStudentMajor =
    users.find((u) => u.id === user?.id)?.expertise?.[0] || user?.expertise?.[0] || '';

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'dot'), (snapshot) => {
      const rows = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          dot: String(data.dot || data.maDot || data.tenDot || '').trim(),
          loaiDeTai: String(data.loaiDeTai || data.loaidetai || '').trim().toUpperCase(),
          major: String(data.major || '').trim(),
          endEx: String(data.endEx || data.endex || '').trim(),
          endReg: String(data.endReg || data.endreg || '').trim(),
        };
      });
      setDotRows(rows);
    });
    return () => unsubscribe();
  }, []);

  const myRegistrations = thesisRegistrations.filter((r) => r.studentId === user?.id);

  const latestBctt = useMemo(() => {
    const bctt = myRegistrations.filter((r) => r.type === 'BCTT');
    return [...bctt].sort((a, b) => {
      const ad = parseDate(a.registeredAt)?.getTime() || 0;
      const bd = parseDate(b.registeredAt)?.getTime() || 0;
      return bd - ad;
    })[0];
  }, [myRegistrations]);

  const latestKltn = useMemo(() => {
    const kltn = myRegistrations.filter((r) => r.type === 'KLTN');
    return [...kltn].sort((a, b) => {
      const ad = parseDate(a.registeredAt)?.getTime() || 0;
      const bd = parseDate(b.registeredAt)?.getTime() || 0;
      return bd - ad;
    })[0];
  }, [myRegistrations]);

  const hasKltn = myRegistrations.some((r) => r.type === 'KLTN');

  const getDotForReg = (reg: any) => {
    if (!reg) return null;
    const normalizedPeriod = normalizeText(reg.period || '');
    const normalizedMajor = normalizeText(currentStudentMajor || '');
    return (
      dotRows.find((d) => {
        const periodMatched = normalizeText(d.dot) === normalizedPeriod;
        const typeMatched = !d.loaiDeTai || d.loaiDeTai === String(reg.type || '').toUpperCase();
        const majorMatched = !normalizedMajor || !d.major || normalizeText(d.major) === normalizedMajor;
        return periodMatched && typeMatched && majorMatched;
      }) || null
    );
  };

  const getExecutionDeadline = (reg: any) => {
    const dot = getDotForReg(reg);
    return dot?.endEx || dot?.endReg || reg?.submissionDeadline || '';
  };

  const isPeriodEnded = (reg: any) => {
    const deadline = getExecutionDeadline(reg);
    const d = parseDate(deadline);
    if (!d) return false;
    return Date.now() > d.getTime();
  };

  const uploadFile = async (
    reg: any,
    uploadType: 'pdf' | 'internship' | 'kltn' | 'revised' | 'explain',
    file: File,
  ) => {
    if (!reg || !user) {
      throw new Error(I18N.errMissingReg);
    }

    if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
      throw new Error(I18N.errMissingCloud);
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/raw/upload`;
    const folder = [
      'truc_project',
      sanitizeUploadSegment(reg.type),
      sanitizeUploadSegment(user.id),
      sanitizeUploadSegment(reg.id),
    ].join('/');

    const baseName = file.name.replace(/\.[^.]+$/, '');
    const extension = (file.name.split('.').pop() || 'pdf').toLowerCase();
    const publicId = [uploadType, Date.now().toString(), sanitizeUploadSegment(baseName).slice(0, 40)]
      .join('-')
      .concat(`.${extension}`);

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', cloudinaryUploadPreset);
      formData.append('folder', folder);
      formData.append('public_id', publicId);

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
      };

      xhr.onerror = () => reject(new Error(I18N.errNetwork));
      xhr.onabort = () => reject(new Error(I18N.errAbort));
      xhr.onreadystatechange = () => {
        if (xhr.readyState !== XMLHttpRequest.DONE) return;

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText) as { secure_url?: string; version?: number; public_id?: string };
            if (response.version && response.public_id) {
              resolve(
                `https://res.cloudinary.com/${cloudinaryCloudName}/raw/upload/v${response.version}/${String(response.public_id).replace(/^\/+/, '')}`,
              );
              return;
            }
            if (!response.secure_url) {
              reject(new Error(I18N.errNoSecureUrl));
              return;
            }
            resolve(response.secure_url);
          } catch {
            reject(new Error(I18N.errParseCloud));
          }
          return;
        }

        reject(new Error(`Cloudinary upload failed with status ${xhr.status}.`));
      };

      xhr.open('POST', endpoint);
      xhr.send(formData);
    });
  };

  const openSubmitModal = (regId: string) => {
    setSubmitModalRegId(regId);
    setSubmissionFiles({ pdf: null, internship: null });
  };

  const closeSubmitModal = () => {
    setSubmitModalRegId(null);
    setSubmissionFiles({ pdf: null, internship: null });
  };

  const isPdfFile = (file: File) =>
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  const setPickedFile = (type: 'pdf' | 'internship', file: File | null) => {
    if (!file) return;
    if (!isPdfFile(file)) {
      alert(I18N.errPdfOnly);
      return;
    }
    setSubmissionFiles((prev) => ({ ...prev, [type]: file }));
  };

  const handleDropFile = (
    event: React.DragEvent<HTMLLabelElement>,
    type: 'pdf' | 'internship',
  ) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] || null;
    setPickedFile(type, file);
  };

  const handleSubmitRegistrationFiles = async (reg: any) => {
    if (!submissionFiles.pdf) {
      alert(I18N.errChoosePdf);
      return;
    }

    if (!submissionFiles.internship) {
      alert(I18N.errChooseIntern);
      return;
    }

    try {
      setIsUploading(true);
      setUploadMessage(I18N.uploadingPdf);
      setUploadProgress(0);
      const pdfUrl = await uploadFile(reg, 'pdf', submissionFiles.pdf);

      setUploadMessage(I18N.uploadingIntern);
      setUploadProgress(0);
      const internshipCertUrl = await uploadFile(reg, 'internship', submissionFiles.internship);

      updateThesisRegistration(reg.id, {
        pdfUrl,
        internshipCertUrl,
        status: 'submitted',
        submittedAt: new Date().toISOString().split('T')[0],
      });

      closeSubmitModal();
      alert(I18N.uploadDone);
    } catch (error) {
      const message = error instanceof Error ? error.message : I18N.uploadFailed;
      alert(message);
    } finally {
      setIsUploading(false);
      setUploadMessage('');
      setUploadProgress(null);
    }
  };

  const handleSubmitKltnDraft = async (reg: any) => {
    if (!submissionFiles.pdf) {
      alert(I18N.kltnChooseDraft);
      return;
    }

    try {
      setIsUploading(true);
      setUploadMessage(I18N.kltnUploadingDraft);
      setUploadProgress(0);
      const pdfUrl = await uploadFile(reg, 'kltn', submissionFiles.pdf);

      updateThesisRegistration(reg.id, {
        pdfUrl,
        status: 'submitted',
        submittedAt: new Date().toISOString().split('T')[0],
      });

      closeSubmitModal();
      alert(I18N.uploadDone);
    } catch (error) {
      const message = error instanceof Error ? error.message : I18N.uploadFailed;
      alert(message);
    } finally {
      setIsUploading(false);
      setUploadMessage('');
      setUploadProgress(null);
    }
  };

  const handleSubmitKltnRevision = async (reg: any) => {
    if (!kltnRevisionFile || !kltnExplainFile) {
      alert(I18N.chooseRevision);
      return;
    }

    try {
      setIsUploading(true);
      setUploadMessage(I18N.uploadingRevision);
      setUploadProgress(0);
      const revisedPdfUrl = await uploadFile(reg, 'revised', kltnRevisionFile);

      setUploadMessage(I18N.uploadingExplain);
      setUploadProgress(0);
      const revisionExplanationUrl = await uploadFile(reg, 'explain', kltnExplainFile);

      updateThesisRegistration(reg.id, {
        revisedPdfUrl,
        revisionExplanationUrl,
        status: 'revision_pending',
        advisorApprovalRevision: false,
        chairmanApprovalRevision: false,
      });

      setKltnRevisionFile(null);
      setKltnExplainFile(null);
      alert(I18N.uploadDone);
    } catch (error) {
      const message = error instanceof Error ? error.message : I18N.uploadFailed;
      alert(message);
    } finally {
      setIsUploading(false);
      setUploadMessage('');
      setUploadProgress(null);
    }
  };

  const showReadyForKltnBanner =
    latestBctt && latestBctt.status === 'completed' && !hasKltn && isPeriodEnded(latestBctt);

  if (!latestBctt && !latestKltn) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{I18N.emptyTitle}</p>
          <p className="text-gray-400 mt-2">{I18N.emptyDesc}</p>
        </div>
      </div>
    );
  }

  const bctt = latestBctt as any;
  const advisor = getAdvisorInfo(bctt?.advisorId || '');
  const regDate = bctt?.registeredAt || '-';
  const executionDeadline = bctt ? getExecutionDeadline(bctt) : '';
  const isPending = bctt?.status === 'pending';
  const isCompleted = bctt?.status === 'completed';
  const isInProgress = Boolean(bctt) && !isPending && !isCompleted;
  const completionScore =
    typeof bctt?.finalScore === 'number'
      ? bctt.finalScore
      : typeof bctt?.advisorScore === 'number'
        ? bctt.advisorScore
        : null;
  const kltn = latestKltn as any;
  const kltnAdvisor = getAdvisorInfo(kltn?.advisorId || '');
  const kltnReviewer = getAdvisorInfo(kltn?.reviewerId || '');
  const kltnDeadline = kltn ? getExecutionDeadline(kltn) : '';
  const kltnStatus = String(kltn?.status || '');
  const kltnIsPending = kltnStatus === 'pending';
  const kltnIsDoing = kltnStatus === 'advisor_approved';
  const kltnIsGrading = ['submitted', 'graded'].includes(kltnStatus);
  const kltnIsCouncil = kltnStatus === 'defended';
  const kltnIsRevision = kltnStatus === 'revision_pending';
  const kltnIsCompleted = kltnStatus === 'completed';
  const kltnHasBothScores =
    typeof kltn?.advisorScore === 'number' &&
    typeof kltn?.reviewerScore === 'number';
  const kltnEligibleForCouncil =
    kltnHasBothScores &&
    kltn.advisorScore >= 5 &&
    kltn.reviewerScore >= 5;
  const kltnScore =
    typeof kltn?.finalScore === 'number'
      ? kltn.finalScore
      : typeof kltn?.advisorScore === 'number'
        ? kltn.advisorScore
        : null;
  const kltnCouncil = councils.find((c) => c.id === kltn?.councilId);
  const getTeacherName = (id?: string) => users.find((u) => u.id === id)?.fullName || id || '-';
  const councilMemberLines = [
    kltnCouncil?.chairmanId ? `${getTeacherName(kltnCouncil.chairmanId)} (Chủ tịch hội đồng)` : '',
    ...((kltnCouncil?.members || []).map((memberId: string, index: number) => `${getTeacherName(memberId)} (Thành viên hội đồng ${index + 1})`)),
    kltnCouncil?.secretaryId ? `${getTeacherName(kltnCouncil.secretaryId)} (Thư ký hội đồng)` : '',
  ].filter(Boolean);

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full bg-gray-200 p-1">
          <button
            type="button"
            onClick={() => setStatusTab('BCTT')}
            className={`rounded-full px-5 py-1.5 text-sm font-semibold transition ${
              statusTab === 'BCTT' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {I18N.tabBctt}
          </button>
          <button
            type="button"
            onClick={() => setStatusTab('KLTN')}
            className={`rounded-full px-5 py-1.5 text-sm font-semibold transition ${
              statusTab === 'KLTN' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {I18N.tabKltn}
          </button>
        </div>
      </div>

      {statusTab === 'BCTT' && !latestBctt && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{I18N.emptyTitle}</p>
          <p className="text-gray-400 mt-2">{I18N.emptyDesc}</p>
        </div>
      )}

      {statusTab === 'BCTT' && isPending && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">{I18N.statusPending}</p>
            <p className="text-sm text-amber-800 mt-1">{I18N.pendingDesc}</p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-900 mb-3">{I18N.sectionRegDetail}</p>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">{I18N.lblTitle}</span> {bctt.title || '-'}</p>
              <p><span className="font-medium">{I18N.lblField}</span> {bctt.field || '-'}</p>
              <p><span className="font-medium">{I18N.lblPeriod}</span> {bctt.period || '-'}</p>
              <p><span className="font-medium">{I18N.lblRegDate}</span> {formatDate(regDate)}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
            <span className="font-medium">{I18N.lblAdvisor}</span> {I18N.waitAdvisor}
          </div>
        </div>
      )}

      {statusTab === 'BCTT' && isInProgress && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-blue-900">{I18N.statusDoing}</p>
            <p className="text-sm text-blue-800 mt-1">{I18N.doingDesc}</p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-900 mb-3">{I18N.sectionApproveInfo}</p>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">{I18N.lblTitle}</span> {bctt.title || '-'}</p>
              <p><span className="font-medium">{I18N.lblDeadline}</span> {formatDate(executionDeadline)}</p>
              <p><span className="font-medium">{I18N.lblAdvisor}</span> {advisor.name}{advisor.email ? ` (${advisor.email})` : ''}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-900 mb-2">{I18N.sectionSubmit}</p>
            <p className="text-sm text-gray-600 mb-4">{I18N.submitNote}</p>

            {!bctt.pdfUrl ? (
              <button
                onClick={() => openSubmitModal(bctt.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                {I18N.submitOfficial}
              </button>
            ) : (
              <div className="space-y-2 text-sm">
                <button
                  onClick={() => window.open(bctt.pdfUrl, '_blank', 'noopener,noreferrer')}
                  className="text-blue-600 hover:text-blue-700 flex w-fit items-center gap-1"
                >
                  <Eye className="w-4 h-4" /> {I18N.fileReport}
                </button>
                {bctt.internshipCertUrl && (
                  <button
                    onClick={() => window.open(bctt.internshipCertUrl, '_blank', 'noopener,noreferrer')}
                    className="text-emerald-600 hover:text-emerald-700 flex w-fit items-center gap-1"
                  >
                    <Eye className="w-4 h-4" /> {I18N.fileCompany}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {statusTab === 'BCTT' && isCompleted && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm font-semibold text-green-900">{I18N.statusDone}</p>
            <p className="text-sm text-green-800 mt-1">{I18N.doneDesc}</p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-900 mb-3">{I18N.sectionTopicInfo}</p>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">{I18N.lblTitle}</span> {bctt.title || '-'}</p>
              <div className="space-y-1">
                <p className="font-medium">{I18N.submittedFiles}</p>
                {bctt.pdfUrl ? (
                  <button
                    onClick={() => window.open(bctt.pdfUrl, '_blank', 'noopener,noreferrer')}
                    className="text-blue-600 hover:text-blue-700 flex w-fit items-center gap-1"
                  >
                    <Eye className="w-4 h-4" /> {I18N.fileReport}
                  </button>
                ) : (
                  <p>-</p>
                )}
                {bctt.internshipCertUrl ? (
                  <button
                    onClick={() => window.open(bctt.internshipCertUrl, '_blank', 'noopener,noreferrer')}
                    className="text-emerald-600 hover:text-emerald-700 flex w-fit items-center gap-1"
                  >
                    <Eye className="w-4 h-4" /> {I18N.fileCompany}
                  </button>
                ) : (
                  <p>-</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-900 mb-2">{I18N.sectionScore}</p>
            <p className="mb-1 inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-sm font-semibold text-blue-700">
              {I18N.scoreLabel} {completionScore !== null ? completionScore.toFixed(1) : '-'}
            </p>
            <p className="text-sm font-semibold text-blue-700">
              {I18N.scoreDone}
            </p>
          </div>
        </div>
      )}

      {statusTab === 'KLTN' && !latestKltn && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-semibold">{I18N.emptyKltnTitle}</p>
          <p className="text-gray-400 mt-2">{I18N.emptyKltnDesc}</p>
        </div>
      )}

      {statusTab === 'KLTN' && latestKltn && kltnIsPending && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">{I18N.statusPending}</p>
            <p className="text-sm text-amber-800 mt-1">{I18N.pendingDesc}</p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-900 mb-3">{I18N.sectionRegDetail}</p>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">{I18N.lblTitle}</span> {kltn.title || '-'}</p>
              <p><span className="font-medium">{I18N.lblField}</span> {kltn.field || '-'}</p>
              <p><span className="font-medium">{I18N.lblPeriod}</span> {kltn.period || '-'}</p>
              <p><span className="font-medium">{I18N.lblRegDate}</span> {formatDate(kltn.registeredAt || '')}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
            <span className="font-medium">{I18N.lblAdvisor}</span> {I18N.waitAdvisor}
          </div>
        </div>
      )}

      {statusTab === 'KLTN' && latestKltn && kltnIsDoing && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-blue-900">{I18N.kltnStatusDoing}</p>
            <p className="text-sm text-blue-800 mt-1">{I18N.kltnDoingDesc}</p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-900 mb-3">{I18N.sectionTopicInfo}</p>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">{I18N.lblTitle}</span> {kltn.title || '-'}</p>
              <p><span className="font-medium">{I18N.lblDeadline}</span> {formatDate(kltnDeadline)}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
            <p>
              <span className="font-medium">{I18N.lblAdvisor}</span> {kltnAdvisor.name}
              {kltnAdvisor.email ? ` (${kltnAdvisor.email})` : ''}
            </p>
            <p className="mt-2">
              <span className="font-medium">Giảng viên phản biện:</span>{' '}
              {kltnReviewer.name !== '-' || kltnReviewer.email
                ? `${kltnReviewer.name}${kltnReviewer.email ? ` (${kltnReviewer.email})` : ''}`
                : 'Chưa có GVPB được phân công'}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-900 mb-2">{I18N.kltnSubmitFrame}</p>
            <p className="text-sm text-gray-600 mb-3">Cú pháp đặt tên file: {I18N.kltnSubmitHint}</p>
            {!kltn.pdfUrl ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => openSubmitModal(kltn.id)}
                  disabled={isUploading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {I18N.submitOfficial}
                </button>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <button
                  onClick={() => window.open(kltn.pdfUrl, '_blank', 'noopener,noreferrer')}
                  className="text-blue-600 hover:text-blue-700 flex w-fit items-center gap-1"
                >
                  <Eye className="w-4 h-4" /> {I18N.fileReport}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {statusTab === 'KLTN' && latestKltn && kltnIsGrading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div className={`rounded-lg border px-4 py-3 ${
            kltnHasBothScores
              ? kltnEligibleForCouncil
                ? 'border-green-200 bg-green-50'
                : 'border-rose-200 bg-rose-50'
              : 'border-amber-200 bg-amber-50'
          }`}>
            <p className={`text-sm font-semibold ${
              kltnHasBothScores
                ? kltnEligibleForCouncil
                  ? 'text-green-900'
                  : 'text-rose-900'
                : 'text-amber-900'
            }`}>
              {kltnHasBothScores
                ? kltnEligibleForCouncil
                  ? I18N.kltnEligibleCouncilStatus
                  : I18N.kltnIneligibleCouncilStatus
                : I18N.kltnStatusGrading}
            </p>
            <p className={`text-sm mt-1 ${
              kltnHasBothScores
                ? kltnEligibleForCouncil
                  ? 'text-green-800'
                  : 'text-rose-800'
                : 'text-amber-800'
            }`}>
              {kltnHasBothScores
                ? kltnEligibleForCouncil
                  ? I18N.kltnEligibleCouncilDesc
                  : I18N.kltnIneligibleCouncilDesc
                : I18N.kltnGradingDesc}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700 space-y-3">
            <div>
              <p className="font-medium text-gray-900">
                {I18N.lblAdvisor} {kltnAdvisor.name}{kltnAdvisor.email ? ` (${kltnAdvisor.email})` : ''}
              </p>
              <p className={`${typeof kltn.advisorScore === 'number' ? 'text-green-700' : 'text-amber-700'} font-medium mt-1`}>
                {typeof kltn.advisorScore === 'number' ? `${I18N.advisorGraded}: ${kltn.advisorScore.toFixed(1)}` : I18N.advisorGrading}
              </p>
              
              <p className="mt-2 text-sm text-gray-700"><span className="font-medium">Nhận xét:</span> {kltn.advisorComments || 'Chưa có nhận xét'}</p>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <p className="font-medium text-gray-900">
                Giảng viên phản biện: {kltnReviewer.name}{kltnReviewer.email ? ` (${kltnReviewer.email})` : ''}
              </p>
              <p className={`${typeof kltn.reviewerScore === 'number' ? 'text-green-700' : 'text-amber-700'} font-medium mt-1`}>
                {typeof kltn.reviewerScore === 'number' ? `${I18N.reviewerGraded}: ${kltn.reviewerScore.toFixed(1)}` : I18N.reviewerGrading}
              </p>
              
              <p className="mt-2 text-sm text-gray-700"><span className="font-medium">Nhận xét:</span> {kltn.reviewerComments || 'Chưa có nhận xét'}</p>
            </div>
          </div>
        </div>
      )}

      {statusTab === 'KLTN' && latestKltn && kltnIsCouncil && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-blue-900">{I18N.kltnStatusCouncil}</p>
            <p className="text-sm text-blue-800 mt-1">{I18N.kltnCouncilDesc}</p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-900 mb-3">{I18N.sectionDefenseInfo}</p>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">{I18N.lblDefenseDateTime}</span> {formatDate(kltn.defenseDate)} {kltn.defenseDate ? '- 08:00' : ''}</p>
              <p><span className="font-medium">{I18N.lblDefenseLocation}</span> {kltn.defenseLocation || '-'}</p>
              <div>
                <p className="font-medium">{I18N.lblCouncilMembers}</p>
                <div className="mt-1 space-y-1">
                  {councilMemberLines.length > 0 ? (
                    councilMemberLines.map((line) => <p key={line}>{line}</p>)
                  ) : (
                    <p>-</p>
                  )}
                </div>
              </div>
            </div>
            {typeof kltn.finalScore === 'number' && (
              <div className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                <p className="font-medium text-gray-900">
                  Kết quả: {kltn.finalScore >= 5 ? 'Hoàn thành' : 'Không đạt'}
                </p>
                <p className="text-gray-700">Điểm tổng kết: {kltn.finalScore.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {statusTab === 'KLTN' && latestKltn && kltnIsRevision && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">{I18N.kltnStatusRevision}</p>
            <p className="text-sm text-amber-800 mt-1">{I18N.kltnRevisionDesc}</p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-900 mb-2">{I18N.sectionRevisionSubmit}</p>
            <p className="text-sm text-gray-600 mb-3">{I18N.revisionSubmitNote}</p>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-medium text-gray-900 mb-2">{I18N.uploadLabelRevision}</p>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (!file) {
                      setKltnRevisionFile(null);
                      return;
                    }
                    if (!isPdfFile(file)) {
                      alert(I18N.errPdfOnly);
                      setKltnRevisionFile(null);
                      return;
                    }
                    setKltnRevisionFile(file);
                  }}
                  className="text-sm"
                />
                {kltn.revisedPdfUrl && (
                  <button
                    type="button"
                    onClick={() => window.open(kltn.revisedPdfUrl, '_blank', 'noopener,noreferrer')}
                    className="mt-2 text-blue-600 hover:text-blue-700 flex w-fit items-center gap-1 text-sm"
                  >
                    <Eye className="w-4 h-4" /> {I18N.uploadLabelRevision}
                  </button>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-medium text-gray-900 mb-2">{I18N.uploadLabelExplain}</p>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (!file) {
                      setKltnExplainFile(null);
                      return;
                    }
                    if (!isPdfFile(file)) {
                      alert(I18N.errPdfOnly);
                      setKltnExplainFile(null);
                      return;
                    }
                    setKltnExplainFile(file);
                  }}
                  className="text-sm"
                />
                {kltn.revisionExplanationUrl && (
                  <button
                    type="button"
                    onClick={() => window.open(kltn.revisionExplanationUrl, '_blank', 'noopener,noreferrer')}
                    className="mt-2 text-emerald-600 hover:text-emerald-700 flex w-fit items-center gap-1 text-sm"
                  >
                    <Eye className="w-4 h-4" /> {I18N.uploadLabelExplain}
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSubmitKltnRevision(kltn)}
              disabled={!kltnRevisionFile || !kltnExplainFile || isUploading}
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {I18N.submitRevision}
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-900 mb-3">{I18N.sectionRevisionApprove}</p>
            <div className="space-y-2 text-sm">
              <p className={kltn.advisorApprovalRevision ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'}>
                {kltn.advisorApprovalRevision ? I18N.advisorApproveDone : I18N.advisorApproveWaiting}
              </p>
              <p className={kltn.chairmanApprovalRevision ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'}>
                {kltn.chairmanApprovalRevision ? I18N.chairmanApproveDone : I18N.chairmanApproveWaiting}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-900 mb-2">{I18N.sectionCouncilMinutesRevision}</p>
            {kltn.councilMinutesUrl ? (
              <button
                type="button"
                onClick={() => window.open(kltn.councilMinutesUrl, '_blank', 'noopener,noreferrer')}
                className="text-blue-600 hover:text-blue-700 flex w-fit items-center gap-1 text-sm font-medium"
              >
                <Eye className="w-4 h-4" /> {I18N.downloadMinutes}
              </button>
            ) : (
              <p className="text-sm text-gray-500">-</p>
            )}
          </div>
        </div>
      )}

      {statusTab === 'KLTN' && latestKltn && kltnIsCompleted && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm font-semibold text-green-900">{I18N.statusDone}</p>
            <p className="text-sm text-green-800 mt-1">{I18N.doneDesc}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-900 mb-3">{I18N.sectionTopicInfo}</p>
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">{I18N.lblTitle}</span> {kltn.title || '-'}</p>
              <div className="space-y-1">
                <p className="font-medium">{I18N.submittedFiles}</p>
                {kltn.pdfUrl ? (
                  <button
                    onClick={() => window.open(kltn.pdfUrl, '_blank', 'noopener,noreferrer')}
                    className="text-blue-600 hover:text-blue-700 flex w-fit items-center gap-1"
                  >
                    <Eye className="w-4 h-4" /> {I18N.fileReport}
                  </button>
                ) : (
                  <p>-</p>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-900 mb-2">{I18N.sectionScore}</p>
            <p className="mb-1 inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-sm font-semibold text-blue-700">
              {I18N.scoreLabel} {kltnScore !== null ? kltnScore.toFixed(1) : '-'}
            </p>
            <p className="text-sm font-semibold text-blue-700">{I18N.scoreDone}</p>
          </div>
        </div>
      )}

      {statusTab === 'KLTN' && !latestKltn && showReadyForKltnBanner && (
        <div className="bg-white rounded-xl shadow-sm border border-indigo-200 p-6">
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
            <p className="text-sm font-semibold text-indigo-900">{I18N.doneBcttBanner}</p>
            <p className="text-sm text-indigo-800 mt-1">{I18N.doneBcttBannerDesc}</p>
          </div>
          <button
            onClick={() => navigate('/dashboard/register', { state: { defaultType: 'KLTN' } })}
            className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            {I18N.startKltn}
          </button>
        </div>
      )}

      {submitModalRegId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {(() => {
              const activeReg = myRegistrations.find((item) => item.id === submitModalRegId);
              if (!activeReg) return null;

              const isKltnModal = activeReg.type === 'KLTN';
              const canSubmit = isKltnModal
                ? Boolean(submissionFiles.pdf)
                : Boolean(submissionFiles.pdf) && Boolean(submissionFiles.internship);

              return (
                <>
                  <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {isKltnModal ? I18N.modalTitleKltn : I18N.modalTitle}
                      </h2>
                      <p className="mt-1 text-sm text-gray-600">{activeReg.title}</p>
                    </div>
                    <button onClick={closeSubmitModal} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className={`grid gap-4 px-6 py-6 ${isKltnModal ? 'md:grid-cols-1' : 'md:grid-cols-2'}`}>
                    <input
                      id="upload-bctt-pdf"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => setPickedFile('pdf', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="upload-bctt-pdf"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDropFile(e, 'pdf')}
                      className="block cursor-pointer rounded-2xl border border-blue-200 bg-blue-50/70 p-5 transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {isKltnModal ? I18N.kltnSubmitFrame : I18N.uploadLabelReport}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-dashed border-blue-300 bg-white/80 px-4 py-3">
                        <UploadCloud className="h-5 w-5 text-blue-600" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-blue-700">{I18N.dropHint}</p>
                          <p className="truncate text-xs text-gray-600">
                            {submissionFiles.pdf?.name || I18N.noFile}
                          </p>
                        </div>
                      </div>
                    </label>

                    {!isKltnModal && (
                      <>
                        <input
                          id="upload-company-confirmation"
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={(e) => setPickedFile('internship', e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <label
                          htmlFor="upload-company-confirmation"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDropFile(e, 'internship')}
                          className="block cursor-pointer rounded-2xl border border-amber-200 bg-amber-50/70 p-5 transition hover:border-amber-300 hover:bg-amber-50"
                        >
                          <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100">
                              <ClipboardCheck className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{I18N.uploadLabelCompany}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 rounded-xl border border-dashed border-amber-300 bg-white/80 px-4 py-3">
                            <UploadCloud className="h-5 w-5 text-amber-600" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-amber-700">{I18N.dropHint}</p>
                              <p className="truncate text-xs text-gray-600">
                                {submissionFiles.internship?.name || I18N.noFile}
                              </p>
                            </div>
                          </div>
                        </label>
                      </>
                    )}
                  </div>

                  {isUploading && (
                    <div className="px-6 pb-2">
                      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-blue-900">{uploadMessage || I18N.uploadingFallback}</span>
                          <span className="text-blue-700">{uploadProgress ?? 0}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
                          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${uploadProgress ?? 0}%` }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
                    <button onClick={closeSubmitModal} disabled={isUploading} className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200">
                      {I18N.cancel}
                    </button>
                    <button
                      onClick={() => (isKltnModal ? handleSubmitKltnDraft(activeReg) : handleSubmitRegistrationFiles(activeReg))}
                      disabled={!canSubmit || isUploading}
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                      {isUploading ? I18N.uploading : I18N.submitOfficial}
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



