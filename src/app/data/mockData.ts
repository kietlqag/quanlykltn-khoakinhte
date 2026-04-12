// Mock data for the Thesis Management System

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'SV' | 'GV' | 'TBM';
  fullName: string;
  email: string;
  faculty?: string;
  expertise?: string[];
  heDaoTao?: string;
  quota?: number;
}

export interface ThesisRegistration {
  id: string;
  studentId: string;
  type: 'BCTT' | 'KLTN';
  title: string;
  registeredAt?: string;
  companyName?: string;
  field: string;
  advisorId: string;
  reviewerId?: string;
  councilId?: string;
  period: string;
  status: 'pending' | 'advisor_approved' | 'advisor_rejected' | 'submitted' | 'graded' | 'defended' | 'revision_pending' | 'completed';
  submittedAt?: string;
  pdfUrl?: string;
  internshipCertUrl?: string;
  turnitinUrl?: string;
  advisorScore?: number;
  reviewerScore?: number;
  councilScore?: number;
  chairmanScore?: number;
  chairmanCriteriaScores?: Record<string, number>;
  councilMemberScores?: Record<string, number>;
  councilMemberCriteriaScores?: Record<string, Record<string, number>>;
  finalScore?: number;
  scoreLocked?: boolean;
  defenseDate?: string;
  defenseLocation?: string;
  councilMinutesUrl?: string;
  revisedPdfUrl?: string;
  revisionExplanationUrl?: string;
  advisorApprovalRevision?: boolean;
  chairmanApprovalRevision?: boolean;
  advisorComments?: string;
  reviewerComments?: string;
  councilComments?: string;
  chairmanComments?: string;
  councilMemberComments?: Record<string, string>;
  submissionDeadline?: string;
  advisorCriteriaScores?: Record<string, number>;
  reviewerCriteriaScores?: Record<string, number>;
  councilCriteriaScores?: Record<string, number>;
}

export interface Council {
  id: string;
  name: string;
  chairmanId: string;
  secretaryId: string;
  members: string[];
  period: string;
  location?: string;
  time?: string;
}

// Mock users
export const mockUsers: User[] = [
  // Students
  {
    id: 'SV001',
    username: '2001212345',
    password: '123456',
    role: 'SV',
    fullName: 'Nguy�n Vn An',
    email: 'an.nguyen@student.hcmute.edu.vn',
  },
  {
    id: 'SV002',
    username: '2001212346',
    password: '123456',
    role: 'SV',
    fullName: 'Tr�n Th� B�o',
    email: 'bao.tran@student.hcmute.edu.vn',
  },
  {
    id: 'SV003',
    username: '2001212347',
    password: '123456',
    role: 'SV',
    fullName: 'L� Ho�ng C��ng',
    email: 'cuong.le@student.hcmute.edu.vn',
  },
  {
    id: 'SV004',
    username: '2001212348',
    password: '123456',
    role: 'SV',
    fullName: 'Ph�m Minh �c',
    email: 'duc.pham@student.hcmute.edu.vn',
  },
  {
    id: 'SV005',
    username: '2001212349',
    password: '123456',
    role: 'SV',
    fullName: 'V� Th� H��ng',
    email: 'huong.vo@student.hcmute.edu.vn',
  },
  // Teachers
  {
    id: 'GV001',
    username: 'gv.nguyenducthang',
    password: '123456',
    role: 'GV',
    fullName: 'TS. Nguy�n �c Th�ng',
    email: 'thang.nguyen@hcmute.edu.vn',
    faculty: 'Khoa C�ng ngh� Ph�n m�m',
    expertise: ['AI', 'Machine Learning', 'Data Science'],
    quota: 5,
  },
  {
    id: 'GV002',
    username: 'gv.tranthiminh',
    password: '123456',
    role: 'GV',
    fullName: 'PGS.TS. Tr�n Th� Minh',
    email: 'minh.tran@hcmute.edu.vn',
    faculty: 'Khoa C�ng ngh� Ph�n m�m',
    expertise: ['Web Development', 'Mobile Development', 'Cloud Computing'],
    quota: 6,
  },
  {
    id: 'GV003',
    username: 'gv.lequochuy',
    password: '123456',
    role: 'GV',
    fullName: 'TS. L� Qu�c Huy',
    email: 'huy.le@hcmute.edu.vn',
    faculty: 'Khoa C�ng ngh� Ph�n m�m',
    expertise: ['IoT', 'Embedded Systems', 'Networking'],
    quota: 4,
  },
  {
    id: 'GV004',
    username: 'gv.phamvankhanh',
    password: '123456',
    role: 'GV',
    fullName: 'TS. Ph�m Vn Kh�nh',
    email: 'khanh.pham@hcmute.edu.vn',
    faculty: 'Khoa C�ng ngh� Ph�n m�m',
    expertise: ['Blockchain', 'Security', 'Cryptography'],
    quota: 5,
  },
  {
    id: 'GV005',
    username: 'gv.vothilan',
    password: '123456',
    role: 'GV',
    fullName: 'ThS. V� Th� Lan',
    email: 'lan.vo@hcmute.edu.vn',
    faculty: 'Khoa C�ng ngh� Ph�n m�m',
    expertise: ['UI/UX', 'Web Development', 'Mobile Development'],
    quota: 5,
  },
  // Admin
  {
    id: 'TBM001',
    username: 'tbm.admin',
    password: '123456',
    role: 'TBM',
    fullName: 'PGS.TS. Nguy�n Vn Qu�n',
    email: 'quan.nguyen@hcmute.edu.vn',
    faculty: 'Khoa C�ng ngh� Ph�n m�m',
  },
];

// Mock thesis registrations
export const mockThesisRegistrations: ThesisRegistration[] = [
  {
    id: 'REG001',
    studentId: 'SV001',
    type: 'BCTT',
    title: 'X�y d�ng h� th�ng qu�n l� th� vi�n s� d�ng React v� Node.js',
    field: 'Web Development',
    advisorId: 'GV002',
    reviewerId: 'GV005',
    councilId: 'HD001',
    period: 'HK2-2025-2026',
    status: 'completed',
    submittedAt: '2026-03-15',
    pdfUrl: 'mock-url',
    internshipCertUrl: 'mock-url',
    turnitinUrl: 'mock-url',
    advisorScore: 8.5,
    reviewerScore: 8.0,
    councilScore: 8.2,
    finalScore: 8.23,
    defenseDate: '2026-04-01',
    defenseLocation: 'Ph�ng A101',
    councilMinutesUrl: 'mock-url',
    revisedPdfUrl: 'mock-url',
    revisionExplanationUrl: 'mock-url',
    advisorApprovalRevision: true,
    chairmanApprovalRevision: true,
    submissionDeadline: '2026-03-31',
  },
  {
    id: 'REG002',
    studentId: 'SV001',
    type: 'KLTN',
    title: 'Ph�t tri�n �ng d�ng Mobile qu�n l� h�c t�p v�i React Native',
    field: 'Mobile Development',
    advisorId: 'GV002',
    reviewerId: 'GV005',
    councilId: 'HD001',
    period: 'HK2-2025-2026',
    status: 'revision_pending',
    submittedAt: '2026-04-05',
    pdfUrl: 'mock-url',
    turnitinUrl: 'mock-url',
    advisorScore: 8.8,
    reviewerScore: 8.5,
    councilScore: 8.6,
    finalScore: 8.63,
    defenseDate: '2026-04-08',
    defenseLocation: 'Ph�ng B202',
    councilMinutesUrl: 'mock-url',
    revisedPdfUrl: 'mock-url',
    revisionExplanationUrl: 'mock-url',
    advisorApprovalRevision: true,
    chairmanApprovalRevision: false,
    reviewerComments: 'C�n b� sung th�m ph�n testing v� deployment',
    councilComments: 'N�n m� r�ng th�m t�nh nng th�ng b�o push notification',
    submissionDeadline: '2026-04-30',
  },
  {
    id: 'REG003',
    studentId: 'SV002',
    type: 'BCTT',
    title: 'Nghi�n c�u thu�t to�n Machine Learning cho d� o�n gi� c� phi�u',
    field: 'AI',
    advisorId: 'GV001',
    period: 'HK2-2025-2026',
    status: 'advisor_approved',
    submissionDeadline: '2026-04-20',
  },
  {
    id: 'REG004',
    studentId: 'SV003',
    type: 'BCTT',
    title: 'X�y d�ng h� th�ng IoT gi�m s�t m�i tr��ng',
    field: 'IoT',
    advisorId: 'GV003',
    period: 'HK2-2025-2026',
    status: 'submitted',
    submittedAt: '2026-04-01',
    pdfUrl: 'mock-url',
    internshipCertUrl: 'mock-url',
    submissionDeadline: '2026-04-20',
  },
  {
    id: 'REG005',
    studentId: 'SV004',
    type: 'BCTT',
    title: 'Nghi�n c�u v� �ng d�ng Blockchain trong qu�n l� chu�i cung �ng',
    field: 'Blockchain',
    advisorId: 'GV004',
    reviewerId: 'GV001',
    period: 'HK2-2025-2026',
    status: 'graded',
    submittedAt: '2026-03-25',
    pdfUrl: 'mock-url',
    internshipCertUrl: 'mock-url',
    turnitinUrl: 'mock-url',
    advisorScore: 9.0,
    reviewerScore: 8.7,
    defenseDate: '2026-04-10',
    defenseLocation: 'Ph�ng C301',
    submissionDeadline: '2026-04-20',
  },
  {
    id: 'REG006',
    studentId: 'SV005',
    type: 'BCTT',
    title: 'Thi�t k� giao di�n ng��i d�ng cho �ng d�ng th��ng m�i i�n t�',
    field: 'UI/UX',
    advisorId: 'GV005',
    period: 'HK2-2025-2026',
    status: 'pending',
    submissionDeadline: '2026-04-20',
  },
];

// Mock councils
export const mockCouncils: Council[] = [
  {
    id: 'HD001',
    name: 'H�i �ng 1 - Web & Mobile',
    chairmanId: 'GV001',
    secretaryId: 'GV005',
    members: ['GV002', 'GV003'],
    period: 'HK2-2025-2026',
  },
  {
    id: 'HD002',
    name: 'H�i �ng 2 - AI & IoT',
    chairmanId: 'GV002',
    secretaryId: 'GV003',
    members: ['GV001', 'GV004'],
    period: 'HK2-2025-2026',
  },
];

export const FIELDS = [
  'AI',
  'Machine Learning',
  'Data Science',
  'Web Development',
  'Mobile Development',
  'Cloud Computing',
  'IoT',
  'Embedded Systems',
  'Networking',
  'Blockchain',
  'Security',
  'Cryptography',
  'UI/UX',
];

export const PERIODS = [
  'HK1-2024-2025',
  'HK2-2024-2025',
  'HK1-2025-2026',
  'HK2-2025-2026',
];
