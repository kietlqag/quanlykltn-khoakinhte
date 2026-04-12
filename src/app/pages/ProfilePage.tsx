import React from 'react';
import { User, Mail, Building2, Briefcase, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function ProfilePage() {
  const { user } = useAuth();

  const isTeacher = user?.role === 'GV' || user?.role === 'TBM';
  const isStudent = user?.role === 'SV';
  const expertise = (user?.expertise || []).filter(Boolean);
  const expertisePreview = expertise.slice(0, 3);
  const expertiseRemaining = Math.max(0, expertise.length - expertisePreview.length);
  const roleLabel =
    user?.role === 'SV' ? 'Sinh viên' : user?.role === 'GV' ? 'Giảng viên' : 'Trưởng bộ môn';
  const idLabel = isStudent ? 'MSSV' : 'Mã giảng viên';

  return (
    <div className="w-full flex justify-center pt-4 font-sans">
      <div className="w-full max-w-6xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-5 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {user?.fullName?.charAt(0) || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-gray-900 truncate">{user?.fullName || '-'}</h2>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700">{roleLabel}</span>
                  {isTeacher && user?.quota !== undefined && (
                    <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700">
                      Quota: {user.quota}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">{idLabel}</div>
                  <div className="text-sm font-semibold text-gray-900 truncate">{user?.id || '-'}</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">Tên đăng nhập</div>
                  <div className="text-sm font-medium text-gray-900 truncate">{user?.username || '-'}</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="text-sm font-medium text-gray-900 truncate">{user?.email || '-'}</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">{isStudent ? 'Hệ đào tạo' : 'Khoa'}</div>
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {isStudent ? user?.heDaoTao || 'Chưa cập nhật' : user?.faculty || 'Chưa cập nhật'}
                  </div>
                </div>
              </div>

              {isTeacher && (
                <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-gray-500">Lĩnh vực chuyên môn</div>
                    {expertisePreview.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {expertisePreview.map((exp) => (
                          <span
                            key={exp}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                          >
                            {exp}
                          </span>
                        ))}
                        {expertiseRemaining > 0 && (
                          <span className="px-2 py-1 bg-white text-gray-600 text-xs font-medium rounded-full border border-gray-200">
                            +{expertiseRemaining}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-gray-900 mt-0.5">Chưa cập nhật</div>
                    )}
                  </div>
                </div>
              )}

              {isTeacher && user?.quota !== undefined && (
                <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500">Số lượng SV có thể hướng dẫn</div>
                    <div className="text-sm font-semibold text-gray-900 truncate">{user.quota} sinh viên</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
