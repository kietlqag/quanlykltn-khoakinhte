import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { collection, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Clock, MapPin, Plus, Save, Trash2, User, Users } from 'lucide-react';

type CouncilTab = 'create' | 'assign';

export function TbmAssignCouncil() {
  const {
    thesisRegistrations,
    users,
    councils,
    updateThesisRegistration,
    addCouncil,
    deleteCouncil,
  } = useData();
  const [activeTab, setActiveTab] = useState<CouncilTab>('create');
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [showCreateCouncil, setShowCreateCouncil] = useState(false);
  const [deleteCouncilId, setDeleteCouncilId] = useState<string | null>(null);
  const [newCouncil, setNewCouncil] = useState({
    number: '',
    location: '',
    time: '',
    chairmanId: '',
    member1Id: '',
    member2Id: '',
    secretaryId: '',
    period: 'HK2-2025-2026',
  });

  const teachers = users.filter((u) => u.role === 'GV');
  const students = users.filter((u) => u.role === 'SV');

  const gradedRegistrations = thesisRegistrations.filter((r) => r.type === 'KLTN' && !!r.reviewerId);

  const getStudentName = (studentId: string) =>
    students.find((s) => s.id === studentId)?.fullName || 'N/A';
  const getAdvisorName = (advisorId: string) =>
    teachers.find((t) => t.id === advisorId)?.fullName || 'N/A';
  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return 'Chưa chọn';
    return teachers.find((t) => t.id === teacherId)?.fullName || teacherId;
  };

  const availableTeachersFor = (blockedIds: string[], currentId: string) =>
    teachers.filter((t) => t.id === currentId || !blockedIds.includes(t.id));

  const resetNewCouncil = () =>
    setNewCouncil({
      number: '',
      location: '',
      time: '',
      chairmanId: '',
      member1Id: '',
      member2Id: '',
      secretaryId: '',
      period: 'HK2-2025-2026',
    });

  const handleAssign = async (regId: string) => {
    const councilId = assignments[regId];
    if (!councilId) {
      alert('Vui lòng chọn hội đồng');
      return;
    }

    const selectedCouncil = councils.find((c) => c.id === councilId);

    updateThesisRegistration(regId, {
      councilId,
      status: 'defended',
      defenseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      defenseLocation: selectedCouncil?.location || 'Phòng A101',
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
          diadiem: selectedCouncil?.location || 'Phòng A101',
          updatedBy: 'TBM',
        });
      }
    }

    alert('Đã phân công hội đồng');
  };

  const handleCreateCouncil = () => {
    if (
      !newCouncil.number ||
      !newCouncil.location ||
      !newCouncil.time ||
      !newCouncil.chairmanId ||
      !newCouncil.member1Id ||
      !newCouncil.member2Id ||
      !newCouncil.secretaryId
    ) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const selected = [
      newCouncil.chairmanId,
      newCouncil.member1Id,
      newCouncil.member2Id,
      newCouncil.secretaryId,
    ];
    if (new Set(selected).size !== selected.length) {
      alert('Không được chọn trùng giảng viên trong cùng hội đồng.');
      return;
    }

    const councilNameInput = newCouncil.number.trim();
    const councilName = /^hội đồng\b/i.test(councilNameInput)
      ? councilNameInput
      : `Hội đồng ${councilNameInput}`;

    addCouncil({
      id: `HD${Date.now()}`,
      name: councilName,
      chairmanId: newCouncil.chairmanId,
      secretaryId: newCouncil.secretaryId,
      members: [newCouncil.member1Id, newCouncil.member2Id],
      period: newCouncil.period,
      location: newCouncil.location,
      time: newCouncil.time,
    });

    setShowCreateCouncil(false);
    resetNewCouncil();
    alert('Đã tạo hội đồng mới');
  };

  const handleDeleteCouncil = (id: string) => {
    setDeleteCouncilId(id);
  };

  const handleConfirmDeleteCouncil = () => {
    if (!deleteCouncilId) return;
    deleteCouncil(deleteCouncilId);
    setDeleteCouncilId(null);
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
            <Plus className="h-4 w-4" />TẠO HỘI ĐỒNG
          </button>
        )}
      </div>

      {activeTab === 'create' && (
        <div className="space-y-3">
          {showCreateCouncil && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">HỘI ĐỒNG</label>
                  <input
                    type="text"
                    value={newCouncil.number}
                    onChange={(e) => setNewCouncil({ ...newCouncil, number: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Ví dụ: Hội đồng 1"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Địa điểm</label>
                  <input
                    type="text"
                    value={newCouncil.location}
                    onChange={(e) => setNewCouncil({ ...newCouncil, location: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Phòng A101"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Thời gian</label>
                  <input
                    type="datetime-local"
                    value={newCouncil.time}
                    onChange={(e) => setNewCouncil({ ...newCouncil, time: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">CHỦ TỊCH</label>
                  <select
                    value={newCouncil.chairmanId}
                    onChange={(e) =>
                      setNewCouncil({
                        ...newCouncil,
                        chairmanId: e.target.value,
                        member1Id: e.target.value === newCouncil.member1Id ? '' : newCouncil.member1Id,
                        member2Id: e.target.value === newCouncil.member2Id ? '' : newCouncil.member2Id,
                        secretaryId: e.target.value === newCouncil.secretaryId ? '' : newCouncil.secretaryId,
                      })
                    }
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
                  <label className="mb-2 block text-sm font-medium text-gray-700">THÀNH VIÊN HỘI ĐỒNG 1</label>
                  <select
                    value={newCouncil.member1Id}
                    onChange={(e) =>
                      setNewCouncil({
                        ...newCouncil,
                        member1Id: e.target.value,
                        member2Id: e.target.value === newCouncil.member2Id ? '' : newCouncil.member2Id,
                        secretaryId: e.target.value === newCouncil.secretaryId ? '' : newCouncil.secretaryId,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                  >
                    <option value="">Chọn thành viên 1</option>
                    {availableTeachersFor([newCouncil.chairmanId], newCouncil.member1Id).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">THÀNH VIÊN HỘI ĐỒNG 2</label>
                  <select
                    value={newCouncil.member2Id}
                    onChange={(e) =>
                      setNewCouncil({
                        ...newCouncil,
                        member2Id: e.target.value,
                        secretaryId: e.target.value === newCouncil.secretaryId ? '' : newCouncil.secretaryId,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                  >
                    <option value="">Chọn thành viên 2</option>
                    {availableTeachersFor([newCouncil.chairmanId, newCouncil.member1Id], newCouncil.member2Id).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">THƯ KÝ HỘI ĐỒNG</label>
                  <select
                    value={newCouncil.secretaryId}
                    onChange={(e) => setNewCouncil({ ...newCouncil, secretaryId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                  >
                    <option value="">Chọn thư ký</option>
                    {availableTeachersFor(
                      [newCouncil.chairmanId, newCouncil.member1Id, newCouncil.member2Id],
                      newCouncil.secretaryId,
                    ).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
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
                  Lưu
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
            {councils.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-center text-gray-500 lg:col-span-2">
                Chưa có hội đồng nào
              </div>
            )}
            {councils.map((council, index) => (
              <div
                key={council.id}
                className="rounded-xl border border-blue-100 bg-gradient-to-r from-white to-blue-50/60 p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-blue-800">{council.name || `Hội đồng ${index + 1}`}</h3>
                    <p className="flex items-center gap-1.5 text-sm text-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-rose-500" />
                      <span className="font-medium">Địa điểm:</span> {council.location || '-'}
                    </p>
                    <p className="flex items-center gap-1.5 text-sm text-slate-700">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span className="font-medium">Thời gian:</span> {council.time ? council.time.replace('T', ' ') : '-'}
                    </p>
                    <p className="flex items-center gap-1.5 text-sm text-slate-700">
                      <User className="h-3.5 w-3.5 text-blue-500" />
                      <span className="font-medium">Chủ tịch:</span> {getTeacherName(council.chairmanId)}
                    </p>
                    <p className="flex items-center gap-1.5 text-sm text-slate-700">
                      <User className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="font-medium">Thư ký:</span> {getTeacherName(council.secretaryId)}
                    </p>
                    <p className="flex items-start gap-1.5 text-sm text-slate-700">
                      <Users className="mt-0.5 h-3.5 w-3.5 text-violet-500" />
                      <span className="font-medium">Thành viên:</span>{' '}
                      {council.members.length > 0
                        ? council.members.map((id) => getTeacherName(id)).join(', ')
                        : 'Chưa có'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                    title="Xóa"
                    onClick={() => handleDeleteCouncil(council.id)}
                  >
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
                {gradedRegistrations.map((reg) => {
                  const isAssigned = !!reg.councilId;
                  return (
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
                            disabled={isAssigned}
                            className="min-w-[140px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500"
                          >
                            <option value="">Chọn hội đồng</option>
                            {councils.map((council) => (
                              <option key={council.id} value={council.id}>
                                {council.name}
                              </option>
                            ))}
                          </select>
                          {!isAssigned ? (
                            <button
                              type="button"
                              onClick={() => handleAssign(reg.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                            >
                              <Save className="h-4 w-4" />
                              Lưu
                            </button>
                          ) : (
                            <span className="rounded-lg bg-emerald-100 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
                              Đã phân công
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {deleteCouncilId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">Xác nhận xóa hội đồng</h3>
            <p className="mt-2 text-sm text-gray-600">Bạn có chắc muốn xóa hội đồng này?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteCouncilId(null)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCouncil}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
