import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { User, Mail, Building2, Briefcase, Save, Edit2 } from 'lucide-react';

export function ProfilePage() {
  const { user } = useAuth();
  const { users, updateUser } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    faculty: user?.faculty || '',
    expertise: user?.expertise || [],
  });

  const handleSave = () => {
    if (user) {
      updateUser(user.id, {
        fullName: formData.fullName,
        email: formData.email,
        faculty: formData.faculty,
        expertise: formData.expertise,
      });
      setIsEditing(false);
      alert('Đã cập nhật thông tin cá nhân');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Thông tin cá nhân</h1>
        <p className="text-gray-600">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Header with Avatar */}
            <div className="px-6 py-8 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {user?.fullName.charAt(0)}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{user?.fullName}</h2>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="px-3 py-1 bg-white rounded-full text-sm font-medium">
                      {user?.role === 'SV' && 'Sinh viên'}
                      {user?.role === 'GV' && 'Giảng viên'}
                      {user?.role === 'TBM' && 'Trưởng bộ môn'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  {isEditing ? 'Hủy' : 'Chỉnh sửa'}
                </button>
              </div>
            </div>

            {/* Information Form */}
            <div className="p-6 space-y-6">
              {/* Username (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên đăng nhập
                </label>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{user?.username}</span>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{user?.fullName}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{user?.email}</span>
                  </div>
                )}
              </div>

              {/* Faculty (For teachers) */}
              {(user?.role === 'GV' || user?.role === 'TBM') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Khoa
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.faculty}
                      onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{user?.faculty || 'Chưa cập nhật'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Expertise (For teachers) */}
              {(user?.role === 'GV' || user?.role === 'TBM') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lĩnh vực chuyên môn
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={formData.expertise.join(', ')}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expertise: e.target.value.split(',').map((s) => s.trim()),
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập các lĩnh vực, cách nhau bởi dấu phẩy"
                      />
                      <p className="text-xs text-gray-500">Ví dụ: AI, Machine Learning, Web Development</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                      <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex flex-wrap gap-2">
                        {user?.expertise && user.expertise.length > 0 ? (
                          user.expertise.map((exp, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                            >
                              {exp}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">Chưa cập nhật</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quota (For teachers - Read only) */}
              {(user?.role === 'GV' || user?.role === 'TBM') && user?.quota !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng SV có thể hướng dẫn
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 font-semibold">{user.quota} sinh viên</span>
                  </div>
                </div>
              )}

              {/* Save Button */}
              {isEditing && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Lưu thay đổi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="xl:col-span-1">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 xl:sticky xl:top-8">
            <h3 className="font-semibold text-gray-900 mb-2">Lưu ý</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Tên đăng nhập không thể thay đổi</li>
              <li>• Thông tin email được sử dụng để nhận thông báo từ hệ thống</li>
              {(user?.role === 'GV' || user?.role === 'TBM') && (
                <>
                  <li>• Lĩnh vực chuyên môn giúp hệ thống gợi ý sinh viên phù hợp</li>
                  <li>• Quota được quản lý bởi Trưởng bộ môn</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
