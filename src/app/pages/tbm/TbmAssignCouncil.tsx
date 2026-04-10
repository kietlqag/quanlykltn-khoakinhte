import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { collection, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Plus, Save, Trash2, Users } from 'lucide-react';

type CouncilTab = 'create' | 'assign';

export function TbmAssignCouncil() {
  const { thesisRegistrations, users, councils, updateThesisRegistration, addCouncil } = useData();
  const [activeTab, setActiveTab] = useState<CouncilTab>('create');
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [showCreateCouncil, setShowCreateCouncil] = useState(false);
  const [newCouncil, setNewCouncil] = useState({
    name: '',
    chairmanId: '',
    secretaryId: '',
    memberIds: [] as string[],
    period: 'HK2-2025-2026',
  });

  const teachers = users.filter((u) => u.role === 'GV');
  const students = users.filter((u) => u.role === 'SV');

  const gradedRegistrations = thesisRegistrations.filter((r) => {
    if (!r.advisorScore) return false;
    if (r.type === 'BCTT') return true;
    return !!r.reviewerScore;
  });

  const getStudentName = (studentId: string) => students.find((s) => s.id === studentId)?.fullName || 'N/A';
  const getAdvisorName = (advisorId: string) => teachers.find((t) => t.id === advisorId)?.fullName || 'N/A';
  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return 'Chưa chọn';
    return teachers.find((t) => t.id === teacherId)?.fullName || teacherId;
  };

  const handleAssign = async (regId: string) => {
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

    const reg = thesisRegistrations.find((r) => r.id === regId);
    const student = students.find((s) => s.id === reg?.studentId);
    if (reg && student?.email) {
      const statusQuery = query(
        collection(db, 'trangthaidetai'),
        where('emailSV', '==', student.email.toLowerCase()),
        where('loaidetai', '==', reg.type),
      );
      const statusSnap = await getDocs(statusQuery);
      for (const docSnap of statusSnap.docs) {
        await updateDoc(docSnap.ref, {
          councilId,
          ngayHD: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          diadiem: 'Phòng A101',
          updatedBy: 'TBM',
        });
      }
    }

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
      members: newCouncil.memberIds,
    });

    setShowCreateCouncil(false);
    setNewCouncil({ name: '', chairmanId: '', secretaryId: '', memberIds: [], period: 'HK2-2025-2026' });
    alert('Đã tạo hội đồng mới');
  };

  const tabButtonClass = (tab: CouncilTab) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold transition ${
      activeTab === tab ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-700 hover:text-slate-900'
    }`;

  return (
    <div className="mx-auto max-w-6xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center rounded-full bg-gray-200 p-1">
          <button type="button" className={tabButtonClass('create')} onClick={() => setActiveTab('create')}>
            Tạo hội đồng ({councils.length})
          </button>
          <button type="button" className={tabButtonClass('assign')} onClick={() => setActiveTab('assign')}>
            Phân công hội đồng ({gradedRegistrations.length})
          </button>
        </div>

        {activeTab === 'create' && (
          <button
            type="button"
            onClick={() => setShowCreateCouncil((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Tạo hội đồng
          </button>
        )}
      </div>

      {activeTab === 'create' && (
        <div className="space-y-3">
          {showCreateCouncil && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Tên hội đồng</label>
                  <input
                    type="text"
                    value={newCouncil.name}
                    onChange={(e) => setNewCouncil({ ...newCouncil, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Hội đồng 1 - Phòng A2.301"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Chủ tịch hội đồng</label>
                  <select
                    value={newCouncil.chairmanId}
                    onChange={(e) => setNewCouncil({ ...newCouncil, chairmanId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                  >
                    <option value="">Chọn chủ tịch</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Thư ký hội đồng</label>
                  <select
                    value={newCouncil.secretaryId}
                    onChange={(e) => setNewCouncil({ ...newCouncil, secretaryId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                  >
                    <option value="">Chọn thư ký</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-2 block text-sm font-medium text-gray-700">Thành viên hội đồng</label>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  {teachers
                    .filter((t) => t.id !== newCouncil.chairmanId && t.id !== newCouncil.secretaryId)
                    .map((t) => {
                      const checked = newCouncil.memberIds.includes(t.id);
                      return (
                        <label key={t.id} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewCouncil({ ...newCouncil, memberIds: [...newCouncil.memberIds, t.id] });
                              } else {
                                setNewCouncil({
                                  ...newCouncil,
                                  memberIds: newCouncil.memberIds.filter((id) => id !== t.id),
                                });
                              }
                            }}
                          />
                          {t.fullName}
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCouncil(false)}
                  className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateCouncil}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  Lưu hội đồng
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            {councils.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-center text-gray-500">
                Chưa có hội đồng nào
              </div>
            )}
            {councils.map((council) => (
              <div key={council.id} className="rounded-2xl border border-gray-200 bg-white p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-blue-800">{council.name}</h3>
                    <p className="mt-0.5 text-sm text-gray-600">Chủ tịch: {getTeacherName(council.chairmanId)}</p>
                    <p className="text-sm text-gray-600">Thư ký: {getTeacherName(council.secretaryId)}</p>
                    <p className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      Thành viên:{' '}
                      {council.members.length > 0 ? council.members.map((id) => getTeacherName(id)).join(', ') : 'Chưa có'}
                    </p>
                  </div>
                  <button type="button" className="text-gray-400 hover:text-red-500" title="Xóa">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'assign' && (
        <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr className="text-gray-700">
                  <th className="w-[20%] px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Sinh viên</th>
                  <th className="w-[24%] px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Tên đề tài</th>
                  <th className="w-[12%] px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Loại</th>
                  <th className="w-[12%] px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Đợt</th>
                  <th className="w-[14%] px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Giảng viên hướng dẫn</th>
                  <th className="w-[18%] px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Hội đồng bảo vệ</th>
                </tr>
              </thead>
              <tbody>
                {gradedRegistrations.map((reg) => (
                  <tr key={reg.id} className="align-top border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-gray-900">{getStudentName(reg.studentId)}</div>
                      <div className="text-gray-500">{reg.studentId}</div>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{reg.title}</td>
                    <td className="px-4 py-2.5">{reg.type}</td>
                    <td className="px-4 py-2.5">{reg.period || '-'}</td>
                    <td className="px-4 py-2.5">{getAdvisorName(reg.advisorId)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <select
                          value={assignments[reg.id] || reg.councilId || ''}
                          onChange={(e) => setAssignments({ ...assignments, [reg.id]: e.target.value })}
                          className="min-w-[140px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2"
                        >
                          <option value="">Chọn hội đồng</option>
                          {councils.map((council) => (
                            <option key={council.id} value={council.id}>
                              {council.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleAssign(reg.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                        >
                          <Save className="h-4 w-4" />
                          Lưu
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {gradedRegistrations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
