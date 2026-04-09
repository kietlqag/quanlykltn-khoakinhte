import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { CheckCircle, Edit } from 'lucide-react';

export function TbmTeacherApproval() {
  const { users, updateUser } = useData();
  const [editingQuota, setEditingQuota] = useState<{ id: string; quota: number } | null>(null);

  const teachers = users.filter((u) => u.role === 'GV');

  const handleSaveQuota = (teacherId: string) => {
    if (editingQuota && editingQuota.id === teacherId) {
      updateUser(teacherId, { quota: editingQuota.quota });
      setEditingQuota(null);
      alert('Đã cập nhật quota');
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Duyệt giảng viên</h1>
        <p className="text-gray-600">Quản lý quota hướng dẫn của giảng viên</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Danh sách giảng viên ({teachers.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{teacher.fullName}</h3>
                  <p className="text-sm text-gray-600 mb-2">{teacher.email}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {teacher.expertise?.map((exp) => (
                      <span key={exp} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {exp}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Quota:</p>
                      {editingQuota?.id === teacher.id ? (
                        <div className="flex gap-2 mt-1">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={editingQuota.quota}
                            onChange={(e) =>
                              setEditingQuota({ ...editingQuota, quota: parseInt(e.target.value) })
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <button
                            onClick={() => handleSaveQuota(teacher.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingQuota(null)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold text-blue-600">{teacher.quota || 0} sinh viên</span>
                          <button
                            onClick={() => setEditingQuota({ id: teacher.id, quota: teacher.quota || 0 })}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-600">Đã duyệt</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
