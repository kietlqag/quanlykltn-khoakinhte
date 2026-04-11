import React, { useEffect, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { collection, doc, getDocs, onSnapshot, query, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { CheckCircle, Edit } from 'lucide-react';

type QuotaInfo = { id: string; maxSlot: number; approved: boolean };

const I18N = {
  updatedQuota: '\u0110\u00e3 c\u1eadp nh\u1eadt quota',
  missingQuota: 'Ch\u01b0a c\u00f3 b\u1ea3n ghi quota cho gi\u1ea3ng vi\u00ean n\u00e0y.',
  colTeacher: 'Gi\u1ea3ng vi\u00ean',
  colMajor: 'Ng\u00e0nh',
  colField: 'L\u0129nh v\u1ef1c',
  colProgram: 'H\u1ec7 \u0111\u00e0o t\u1ea1o',
  colPeriod: 'H\u1ecdc k\u1ef3 / \u0110\u1ee3t',
  colQuota: 'Quota (SD/T\u1ed5ng)',
  colStatus: 'Tr\u1ea1ng th\u00e1i',
  colAction: 'H\u00e0nh \u0111\u1ed9ng',
  defaultProgram: '\u0110\u1ea1i tr\u00e0',
  seeMore: 'xem th\u00eam',
  save: 'L\u01b0u',
  cancel: 'H\u1ee7y',
  statusOpen: '\u0110ang m\u1edf',
  statusClosed: 'Ch\u01b0a m\u1edf',
  btnClose: '\u0110\u00f3ng',
  btnApproveOpen: 'Duy\u1ec7t & m\u1edf',
  noData: 'Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u',
  modalTitlePrefix: 'L\u0129nh v\u1ef1c c\u1ee7a',
};

export function TbmTeacherApproval() {
  const { users, thesisRegistrations, updateUser } = useData();
  const [editingQuota, setEditingQuota] = useState<{ id: string; quota: number } | null>(null);
  const [quotaByEmail, setQuotaByEmail] = useState<Record<string, QuotaInfo>>({});
  const [fieldsByEmail, setFieldsByEmail] = useState<Record<string, string[]>>({});
  const [fieldModal, setFieldModal] = useState<{ teacherName: string; fields: string[] } | null>(null);

  const teachers = users.filter((u) => u.role === 'GV');

  useEffect(() => {
    const q = query(collection(db, 'quota'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, QuotaInfo> = {};
      snapshot.docs.forEach((d) => {
        const data = d.data();
        const email = String(data.emailGV || data.emailgv || data.email || '').trim().toLowerCase();
        if (!email) return;
        const maxSlot = Number(data.maxSlot ?? data.maxslot ?? data.quota ?? 0);
        const approved = data.approved === undefined || data.approved === null ? true : Boolean(data.approved);
        map[email] = { id: d.id, maxSlot, approved };
      });
      setQuotaByEmail(map);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'field'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, Set<string>> = {};
      snapshot.docs.forEach((d) => {
        const data = d.data();
        const email = String(data.email || data.emailGV || data.emailgv || '').trim().toLowerCase();
        const field = String(data.field || '').trim();
        if (!email || !field) return;
        if (!map[email]) map[email] = new Set<string>();
        map[email].add(field);
      });

      const normalized: Record<string, string[]> = {};
      Object.entries(map).forEach(([email, set]) => {
        normalized[email] = Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
      });
      setFieldsByEmail(normalized);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveQuota = async (teacherId: string) => {
    if (!editingQuota || editingQuota.id !== teacherId) return;

    updateUser(teacherId, { quota: editingQuota.quota });

    const teacher = teachers.find((t) => t.id === teacherId);
    const email = teacher?.email?.toLowerCase() || '';
    const currentQuotaDoc = quotaByEmail[email];

    if (currentQuotaDoc) {
      await updateDoc(doc(db, 'quota', currentQuotaDoc.id), {
        maxSlot: editingQuota.quota,
        approved: true,
      });
      setEditingQuota(null);
      alert(I18N.updatedQuota);
      return;
    }

    if (email) {
      const snap = await getDocs(collection(db, 'quota'));
      const matched = snap.docs.find((d) => {
        const data = d.data();
        const x = String(data.emailGV || data.emailgv || data.email || '').trim().toLowerCase();
        return x === email;
      });
      if (matched) {
        await updateDoc(doc(db, 'quota', matched.id), {
          maxSlot: editingQuota.quota,
          approved: true,
        });
      }
    }

    setEditingQuota(null);
    alert(I18N.updatedQuota);
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

    const snap = await getDocs(collection(db, 'quota'));
    const matched = snap.docs.find((d) => {
      const data = d.data();
      const x = String(data.emailGV || data.emailgv || data.email || '').trim().toLowerCase();
      return x === email;
    });
    if (matched) {
      await updateDoc(doc(db, 'quota', matched.id), { approved: approve });
      return;
    }

    alert(I18N.missingQuota);
  };

  const getUsedQuota = (teacherId: string) =>
    thesisRegistrations.filter(
      (r) => r.advisorId === teacherId && r.status !== 'advisor_rejected' && r.status !== 'pending',
    ).length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="hidden md:grid md:grid-cols-[2.2fr_0.9fr_1.3fr_1fr_1fr_1.2fr_1.2fr_1.5fr] gap-4 px-6 py-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div>{I18N.colTeacher}</div>
          <div>{I18N.colMajor}</div>
          <div>{I18N.colField}</div>
          <div>{I18N.colProgram}</div>
          <div>{I18N.colPeriod}</div>
          <div>{I18N.colQuota}</div>
          <div>{I18N.colStatus}</div>
          <div>{I18N.colAction}</div>
        </div>

        <div className="divide-y divide-gray-200">
          {teachers.map((teacher) => {
            const email = teacher.email.toLowerCase();
            const quotaTotal = quotaByEmail[email]?.maxSlot ?? teacher.quota ?? 0;
            const quotaUsed = getUsedQuota(teacher.id);
            const approved = quotaByEmail[email]?.approved ?? false;
            const latestPeriod =
              thesisRegistrations.find((r) => r.advisorId === teacher.id)?.period || 'HK2 / 2025-2026';

            const teacherFields = fieldsByEmail[email] || [];
            const previewFields = teacherFields.slice(0, 2);
            const remainingFields = teacherFields.length - previewFields.length;

            return (
              <div key={teacher.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[2.2fr_0.9fr_1.3fr_1fr_1fr_1.2fr_1.2fr_1.5fr] md:items-center">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{teacher.fullName}</div>
                    <div className="text-xs text-gray-500 truncate">{teacher.id}</div>
                  </div>

                  <div className="text-sm text-gray-700 truncate">{teacher.expertise?.[0] || '-'}</div>

                  <div className="text-sm text-gray-700">
                    {teacherFields.length === 0 ? (
                      <span>-</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1">
                        {previewFields.map((field) => (
                          <span key={`${teacher.id}-${field}`} className="inline-flex rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                            {field}
                          </span>
                        ))}
                        {remainingFields > 0 && (
                          <button
                            type="button"
                            onClick={() => setFieldModal({ teacherName: teacher.fullName, fields: teacherFields })}
                            className="text-xs font-medium text-blue-700 underline hover:text-blue-800"
                          >
                            +{remainingFields} {I18N.seeMore}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-700">{I18N.defaultProgram}</div>
                  <div className="text-sm text-gray-700">{latestPeriod}</div>

                  <div>
                    {editingQuota?.id === teacher.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{quotaUsed}/</span>
                        <input
                          type="number"
                          min="0"
                          max="200"
                          value={editingQuota.quota}
                          onChange={(e) =>
                            setEditingQuota({ ...editingQuota, quota: Number.parseInt(e.target.value || '0', 10) })
                          }
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button onClick={() => handleSaveQuota(teacher.id)} className="text-green-700 text-xs font-semibold">
                          {I18N.save}
                        </button>
                        <button onClick={() => setEditingQuota(null)} className="text-gray-600 text-xs font-semibold">
                          {I18N.cancel}
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
                        {I18N.statusOpen}
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold">
                        {I18N.statusClosed}
                      </span>
                    )}
                  </div>

                  <div>
                    {approved ? (
                      <button
                        onClick={() => handleToggleApproval(teacher.id, false)}
                        className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 text-xs font-semibold hover:bg-rose-200"
                      >
                        {I18N.btnClose}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleApproval(teacher.id, true)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-semibold hover:bg-indigo-200"
                      >
                        {I18N.btnApproveOpen}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {teachers.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-gray-500">{I18N.noData}</div>
          )}
        </div>
      </div>

      {fieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-base font-semibold text-gray-900">{I18N.modalTitlePrefix} {fieldModal.teacherName}</h3>
              <button
                type="button"
                onClick={() => setFieldModal(null)}
                className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                {I18N.btnClose}
              </button>
            </div>
            <div className="max-h-80 overflow-auto px-5 py-4">
              <div className="flex flex-wrap gap-2">
                {fieldModal.fields.map((field) => (
                  <span key={field} className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-sm text-blue-700">
                    {field}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
