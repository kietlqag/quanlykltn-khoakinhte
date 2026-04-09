import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Save, Plus } from 'lucide-react';

export function TbmAssignCouncil() {
  const { thesisRegistrations, users, councils, updateThesisRegistration, addCouncil } = useData();
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [showCreateCouncil, setShowCreateCouncil] = useState(false);
  const [newCouncil, setNewCouncil] = useState({
    name: '',
    chairmanId: '',
    secretaryId: '',
    period: 'HK2-2025-2026',
  });

  const teachers = users.filter((u) => u.role === 'GV');
  const students = users.filter((u) => u.role === 'SV');
  const gradedRegistrations = thesisRegistrations.filter((r) => r.advisorScore && r.reviewerScore);

  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.fullName || 'N/A';
  };

  const handleAssign = (regId: string) => {
    const councilId = assignments[regId];
    if (!councilId) {
      alert('Vui lòng chọn hội đồng');
      return;
    }
    updateThesisRegistration(regId, {
      councilId,
      status: 'defended',
      defenseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      defenseLocation: 'Phòng A101',
    });
    alert('Đã phân công hội đồng');
  };

  const handleCreateCouncil = () => {
    if (!newCouncil.name || !newCouncil.chairmanId || !newCouncil.secretaryId) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    addCouncil({
      id: `HD${Date.now()}`,
      ...newCouncil,
      members: [],
    });
    setShowCreateCouncil(false);
    setNewCouncil({ name: '', chairmanId: '', secretaryId: '', period: 'HK2-2025-2026' });
    alert('Đã tạo hội đồng mới');
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Phân công hội đồng</h1>
          <p className="text-gray-600">Phân công hội đồng bảo vệ cho sinh viên</p>
        </div>
        <button
          onClick={() => setShowCreateCouncil(!showCreateCouncil)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Tạo hội đồng mới
        </button>
      </div>

      {/* Create Council Form */}
      {showCreateCouncil && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Tạo hội đồng mới</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên hội đồng</label>
              <input
                type="text"
                value={newCouncil.name}
                onChange={(e) => setNewCouncil({ ...newCouncil, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Hội đồng 1 - Web & Mobile"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chủ tịch</label>
                <select
                  value={newCouncil.chairmanId}
                  onChange={(e) => setNewCouncil({ ...newCouncil, chairmanId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Chọn chủ tịch</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thư ký</label>
                <select
                  value={newCouncil.secretaryId}
                  onChange={(e) => setNewCouncil({ ...newCouncil, secretaryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Chọn thư ký</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateCouncil}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                Tạo hội đồng
              </button>
              <button
                onClick={() => setShowCreateCouncil(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Council List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Danh sách hội đồng ({councils.length})</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {councils.map((council) => (
            <div key={council.id} className="p-4">
              <p className="font-medium text-gray-900">{council.name}</p>
              <p className="text-sm text-gray-600">
                Chủ tịch: {teachers.find((t) => t.id === council.chairmanId)?.fullName} | 
                Thư ký: {teachers.find((t) => t.id === council.secretaryId)?.fullName}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Assign Students */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Phân công sinh viên ({gradedRegistrations.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {gradedRegistrations.map((reg) => (
            <div key={reg.id} className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {reg.type}
                  </span>
                  {reg.councilId && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      Đã phân công
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{reg.title}</h3>
                <p className="text-sm text-gray-600">Sinh viên: {getStudentName(reg.studentId)}</p>
              </div>

              <div className="flex gap-2">
                <select
                  value={assignments[reg.id] || reg.councilId || ''}
                  onChange={(e) => setAssignments({ ...assignments, [reg.id]: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Chọn hội đồng</option>
                  {councils.map((council) => (
                    <option key={council.id} value={council.id}>
                      {council.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleAssign(reg.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Lưu
                </button>
              </div>
            </div>
          ))}
          {gradedRegistrations.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Chưa có sinh viên nào cần phân công hội đồng
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
