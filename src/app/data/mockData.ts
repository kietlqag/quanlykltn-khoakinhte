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
  quota?: number;
}

export interface ThesisRegistration {
  id: string;
  studentId: string;
  type: 'BCTT' | 'KLTN';
  title: string;
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
  finalScore?: number;
  defenseDate?: string;
  defenseLocation?: string;
  councilMinutesUrl?: string;
  revisedPdfUrl?: string;
  revisionExplanationUrl?: string;
  advisorApprovalRevision?: boolean;
  chairmanApprovalRevision?: boolean;
  reviewerComments?: string;
  councilComments?: string;
  submissionDeadline?: string;
}

export interface Council {
  id: string;
  name: string;
  chairmanId: string;
  secretaryId: string;
  members: string[];
  period: string;
}

// Mock users
export const mockUsers: User[] = [
  // Students
  {
    id: 'SV001',
    username: '2001212345',
    password: '123456',
    role: 'SV',
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@student.hcmute.edu.vn',
  },
  {
    id: 'SV002',
    username: '2001212346',
    password: '123456',
    role: 'SV',
    fullName: 'Trần Thị Bảo',
    email: 'bao.tran@student.hcmute.edu.vn',
  },
  {
    id: 'SV003',
    username: '2001212347',
    password: '123456',
    role: 'SV',
    fullName: 'Lê Hoàng Cường',
    email: 'cuong.le@student.hcmute.edu.vn',
  },
  {
    id: 'SV004',
    username: '2001212348',
    password: '123456',
    role: 'SV',
    fullName: 'Phạm Minh Đức',
    email: 'duc.pham@student.hcmute.edu.vn',
  },
  {
    id: 'SV005',
    username: '2001212349',
    password: '123456',
    role: 'SV',
    fullName: 'Võ Thị Hương',
    email: 'huong.vo@student.hcmute.edu.vn',
  },
  // Teachers
  {
    id: 'GV001',
    username: 'gv.nguyenducthang',
    password: '123456',
    role: 'GV',
    fullName: 'TS. Nguyễn Đức Thắng',
    email: 'thang.nguyen@hcmute.edu.vn',
    faculty: 'Khoa Công nghệ Phần mềm',
    expertise: ['AI', 'Machine Learning', 'Data Science'],
    quota: 5,
  },
  {
    id: 'GV002',
    username: 'gv.tranthiminh',
    password: '123456',
    role: 'GV',
    fullName: 'PGS.TS. Trần Thị Minh',
    email: 'minh.tran@hcmute.edu.vn',
    faculty: 'Khoa Công nghệ Phần mềm',
    expertise: ['Web Development', 'Mobile Development', 'Cloud Computing'],
    quota: 6,
  },
  {
    id: 'GV003',
    username: 'gv.lequochuy',
    password: '123456',
    role: 'GV',
    fullName: 'TS. Lê Quốc Huy',
    email: 'huy.le@hcmute.edu.vn',
    faculty: 'Khoa Công nghệ Phần mềm',
    expertise: ['IoT', 'Embedded Systems', 'Networking'],
    quota: 4,
  },
  {
    id: 'GV004',
    username: 'gv.phamvankhanh',
    password: '123456',
    role: 'GV',
    fullName: 'TS. Phạm Văn Khánh',
    email: 'khanh.pham@hcmute.edu.vn',
    faculty: 'Khoa Công nghệ Phần mềm',
    expertise: ['Blockchain', 'Security', 'Cryptography'],
    quota: 5,
  },
  {
    id: 'GV005',
    username: 'gv.vothilan',
    password: '123456',
    role: 'GV',
    fullName: 'ThS. Võ Thị Lan',
    email: 'lan.vo@hcmute.edu.vn',
    faculty: 'Khoa Công nghệ Phần mềm',
    expertise: ['UI/UX', 'Web Development', 'Mobile Development'],
    quota: 5,
  },
  // Admin
  {
    id: 'TBM001',
    username: 'tbm.admin',
    password: '123456',
    role: 'TBM',
    fullName: 'PGS.TS. Nguyễn Văn Quản',
    email: 'quan.nguyen@hcmute.edu.vn',
    faculty: 'Khoa Công nghệ Phần mềm',
  },
];

// Mock thesis registrations
export const mockThesisRegistrations: ThesisRegistration[] = [
  {
    id: 'REG001',
    studentId: 'SV001',
    type: 'BCTT',
    title: 'Xây dựng hệ thống quản lý thư viện sử dụng React và Node.js',
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
    defenseLocation: 'Phòng A101',
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
    title: 'Phát triển ứng dụng Mobile quản lý học tập với React Native',
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
    defenseLocation: 'Phòng B202',
    councilMinutesUrl: 'mock-url',
    revisedPdfUrl: 'mock-url',
    revisionExplanationUrl: 'mock-url',
    advisorApprovalRevision: true,
    chairmanApprovalRevision: false,
    reviewerComments: 'Cần bổ sung thêm phần testing và deployment',
    councilComments: 'Nên mở rộng thêm tính năng thông báo push notification',
    submissionDeadline: '2026-04-30',
  },
  {
    id: 'REG003',
    studentId: 'SV002',
    type: 'BCTT',
    title: 'Nghiên cứu thuật toán Machine Learning cho dự đoán giá cổ phiếu',
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
    title: 'Xây dựng hệ thống IoT giám sát môi trường',
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
    title: 'Nghiên cứu và ứng dụng Blockchain trong quản lý chuỗi cung ứng',
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
    defenseLocation: 'Phòng C301',
    submissionDeadline: '2026-04-20',
  },
  {
    id: 'REG006',
    studentId: 'SV005',
    type: 'BCTT',
    title: 'Thiết kế giao diện người dùng cho ứng dụng thương mại điện tử',
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
    name: 'Hội đồng 1 - Web & Mobile',
    chairmanId: 'GV001',
    secretaryId: 'GV005',
    members: ['GV002', 'GV003'],
    period: 'HK2-2025-2026',
  },
  {
    id: 'HD002',
    name: 'Hội đồng 2 - AI & IoT',
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
