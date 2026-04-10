import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { useAuth } from './contexts/AuthContext';

import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentRegister } from './pages/student/StudentRegister';
import { StudentStatus } from './pages/student/StudentStatus';

import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherAdvising } from './pages/teacher/TeacherAdvising';
import { TeacherReviewing } from './pages/teacher/TeacherReviewing';
import { TeacherCouncil } from './pages/teacher/TeacherCouncil';
import { TeacherChairman } from './pages/teacher/TeacherChairman';
import { TeacherSecretary } from './pages/teacher/TeacherSecretary';
import { TeacherSuggestions } from './pages/teacher/TeacherSuggestions';

import { TbmDashboard } from './pages/tbm/TbmDashboard';
import { TbmTeacherApproval } from './pages/tbm/TbmTeacherApproval';
import { TbmAssignReviewer } from './pages/tbm/TbmAssignReviewer';
import { TbmAssignCouncil } from './pages/tbm/TbmAssignCouncil';
import { TbmStatistics } from './pages/tbm/TbmStatistics';

import { ProfilePage } from './pages/ProfilePage';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthReady } = useAuth();

  if (!isAuthReady) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return <>{children}</>;
}

function ProtectedRoute({ children, role, roles }: { children: React.ReactNode; role?: string; roles?: string[] }) {
  const { user, isAuthenticated, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (role || roles) {
    const allowedRoles = roles || (role ? [role] : []);
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

function DashboardHome() {
  const { user, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role === 'SV') {
    return <StudentDashboard />;
  }
  if (user.role === 'GV') {
    return <TeacherDashboard />;
  }
  if (user.role === 'TBM') {
    return <TbmDashboard />;
  }

  return <Navigate to="/" replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthGate>
        <LoginPage />
      </AuthGate>
    ),
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
