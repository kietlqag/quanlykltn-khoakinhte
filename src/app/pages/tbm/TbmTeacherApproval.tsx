import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { collection, doc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { CheckCircle, Edit } from 'lucide-react';

export function TbmTeacherApproval() {
  const { users, thesisRegistrations, updateUser } = useData();
  const [editingQuota, setEditingQuota] = useState<{ id: string; quota: number } | null>(null);
  const [quotaByEmail, setQuotaByEmail] = useState<Record<string, { id: string; maxSlot: number; approved: boolean }>>({});

  const teachers = users.filter((u) => u.role === 'GV');

  React.useEffect(() => {
    const q = query(collection(db, 'quota'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, { id: string; maxSlot: number; approved: boolean }> = {};
      snapshot.docs.forEach((d) => {
        const data = d.data();
        const email = String(data.emailGV || '').toLowerCase();
        if (!email) return;
        map[email] = {
          id: d.id,
          maxSlot: Number(data.maxSlot ?? 0),
          approved: Boolean(data.approved),
        };
      });
      setQuotaByEmail(map);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveQuota = async (teacherId: string) => {
    if (editingQuota && editingQuota.id === teacherId) {
      updateUser(teacherId, { quota: editingQuota.quota });
      const teacher = teachers.find((t) => t.id === teacherId);
      const email = teacher?.email?.toLowerCase() || '';
      const currentQuotaDoc = quotaByEmail[email];
      if (currentQuotaDoc) {
        await updateDoc(doc(db, 'quota', currentQuotaDoc.id), {
          maxSlot: editingQuota.quota,
          approved: true,
        });
      } else if (email) {
        const q = query(collection(db, 'quota'), where('emailGV', '==', email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          await updateDoc(doc(db, 'quota', snap.docs[0].id), {
            maxSlot: editingQuota.quota,
            approved: true,
          });
        }
      }
      setEditingQuota(null);
      alert('Đã cập nhật quota');
    }
  };

  const handleToggleApproval = async (teacherId: string, approve: boolean) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher?.email) return;
    const email = teacher.email.toLowerCase();
    const currentQuotaDoc = quotaByEmail[email];
    if (currentQuotaDoc) {
      await updateDoc(doc(db, 'quota', currentQuotaDoc.id), { approved: approve });
      return;
    }
    const q = query(collection(db, 'quota'), where('emailGV', '==', email));
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(doc(db, 'quota', snap.docs[0].id), { approved: approve });
      return;
    }
    alert('Chưa có bản ghi quota cho giảng viên này.');
  };

  const getUsedQuota = (teacherId: string) =>
    thesisRegistrations.filter(
      (r) => r.advisorId === teacherId && r.status !== 'advisor_rejected' && r.status !== 'pending',
    ).length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="hidden md:grid md:grid-cols-[2.2fr_0.9fr_1.3fr_1fr_1fr_1.2fr_1.2fr_1.5fr] gap-4 px-6 py-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div>Giảng viên</div>
          <div>Ngành</div>
          <div>Lĩnh vực</div>
          <div>Hệ đào tạo</div>
          <div>Học kỳ / Đợt</div>
          <div>Quota (SD/Tổng)</div>
          <div>Trạng thái</div>
          <div>Hành động</div>
        </div>

        <div className="divide-y divide-gray-200">
          {teachers.map((teacher) => {
            const email = teacher.email.toLowerCase();
            const quotaTotal = quotaByEmail[email]?.maxSlot ?? teacher.quota ?? 0;
            const quotaUsed = getUsedQuota(teacher.id);
            const approved = quotaByEmail[email]?.approved ?? false;
            const latestPeriod =
              thesisRegistrations.find((r) => r.advisorId === teacher.id)?.period || 'HK2 / 2025-2026';

            return (
              <div key={teacher.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[2.2fr_0.9fr_1.3fr_1fr_1fr_1.2fr_1.2fr_1.5fr] md:items-center">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{teacher.fullName}</div>
                    <div className="text-xs text-gray-500 truncate">{teacher.id}</div>
                  </div>

                  <div className="text-sm text-gray-700 truncate">{teacher.faculty || '-'}</div>
                  <div className="text-sm text-gray-700 truncate">{teacher.expertise?.[0] || '-'}</div>
                  <div className="text-sm text-gray-700">Đại trà</div>
                  <div className="text-sm text-gray-700">{latestPeriod}</div>

                  <div>
                    {editingQuota?.id === teacher.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{quotaUsed}/</span>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={editingQuota.quota}
                          onChange={(e) =>
                            setEditingQuota({ ...editingQuota, quota: Number.parseInt(e.target.value || '0', 10) })
                          }
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button onClick={() => handleSaveQuota(teacher.id)} className="text-green-700 text-xs font-semibold">
                          Lưu
                        </button>
                        <button onClick={() => setEditingQuota(null)} className="text-gray-600 text-xs font-semibold">
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-indigo-600">
                          {quotaUsed}/{quotaTotal}
                        </span>
                        <button
                          onClick={() =>
                            setEditingQuota({
                              id: teacher.id,
                              quota: quotaTotal,
                            })
                          }
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    {approved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Đang mở đăng ký
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold">
                        Chưa mở
                      </span>
                    )}
                  </div>

                  <div>
                    {approved ? (
                      <button
                        onClick={() => handleToggleApproval(teacher.id, false)}
                        className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 text-xs font-semibold hover:bg-rose-200"
                      >
                        Đóng
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleApproval(teacher.id, true)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-semibold hover:bg-indigo-200"
                      >
                        Duyệt & mở
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {teachers.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
