import { createBrowserRouter, Navigate } from 'react-router';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';

// Student pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentRegister } from './pages/student/StudentRegister';
import { StudentStatus } from './pages/student/StudentStatus';

// Teacher pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherAdvising } from './pages/teacher/TeacherAdvising';
import { TeacherReviewing } from './pages/teacher/TeacherReviewing';
import { TeacherCouncil } from './pages/teacher/TeacherCouncil';
import { TeacherChairman } from './pages/teacher/TeacherChairman';
import { TeacherSecretary } from './pages/teacher/TeacherSecretary';
import { TeacherSuggestions } from './pages/teacher/TeacherSuggestions';

// TBM pages
import { TbmDashboard } from './pages/tbm/TbmDashboard';
import { TbmTeacherApproval } from './pages/tbm/TbmTeacherApproval';
import { TbmAssignReviewer } from './pages/tbm/TbmAssignReviewer';
import { TbmAssignCouncil } from './pages/tbm/TbmAssignCouncil';
import { TbmStatistics } from './pages/tbm/TbmStatistics';

// Profile page
import { ProfilePage } from './pages/ProfilePage';

// Protected route component
function ProtectedRoute({ children, role, roles }: { children: React.ReactNode; role?: string; roles?: string[] }) {
  const currentUser = sessionStorage.getItem('currentUser');
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (role || roles) {
    const user = JSON.parse(currentUser);
    const allowedRoles = roles || (role ? [role] : []);
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

// Route component selector based on role
function DashboardHome() {
  const currentUser = sessionStorage.getItem('currentUser');
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  const user = JSON.parse(currentUser);
  
  if (user.role === 'SV') {
    return <StudentDashboard />;
  } else if (user.role === 'GV') {
    return <TeacherDashboard />;
  } else if (user.role === 'TBM') {
    return <TbmDashboard />;
  }

  return <Navigate to="/" replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardHome />,
      },
      // Student routes
      {
        path: 'register',
        element: (
          <ProtectedRoute role="SV">
            <StudentRegister />
          </ProtectedRoute>
        ),
      },
      {
        path: 'status',
        element: (
          <ProtectedRoute role="SV">
            <StudentStatus />
          </ProtectedRoute>
        ),
      },
      // Teacher routes (accessible by both GV and TBM)
      {
        path: 'advising',
        element: (
          <ProtectedRoute roles={['GV', 'TBM']}>
            <TeacherAdvising />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reviewing',
        element: (
          <ProtectedRoute roles={['GV', 'TBM']}>
            <TeacherReviewing />
          </ProtectedRoute>
        ),
      },
      {
        path: 'council',
        element: (
          <ProtectedRoute roles={['GV', 'TBM']}>
            <TeacherCouncil />
          </ProtectedRoute>
        ),
      },
      {
        path: 'chairman',
        element: (
          <ProtectedRoute roles={['GV', 'TBM']}>
            <TeacherChairman />
          </ProtectedRoute>
        ),
      },
      {
        path: 'secretary',
        element: (
          <ProtectedRoute roles={['GV', 'TBM']}>
            <TeacherSecretary />
          </ProtectedRoute>
        ),
      },
      {
        path: 'suggestions',
        element: (
          <ProtectedRoute roles={['GV', 'TBM']}>
            <TeacherSuggestions />
          </ProtectedRoute>
        ),
      },
      // TBM routes
      {
        path: 'teacher-approval',
        element: (
          <ProtectedRoute role="TBM">
            <TbmTeacherApproval />
          </ProtectedRoute>
        ),
      },
      {
        path: 'assign-reviewer',
        element: (
          <ProtectedRoute role="TBM">
            <TbmAssignReviewer />
          </ProtectedRoute>
        ),
      },
      {
        path: 'assign-council',
        element: (
          <ProtectedRoute role="TBM">
            <TbmAssignCouncil />
          </ProtectedRoute>
        ),
      },
      {
        path: 'statistics',
        element: (
          <ProtectedRoute role="TBM">
            <TbmStatistics />
          </ProtectedRoute>
        ),
      },
      // Profile route
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
