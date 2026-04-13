import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { CalendarPlus, Save } from 'lucide-react';
import { db } from '../../../lib/firebase';

type DotType = 'BCTT' | 'KLTN';

type DotRecord = {
  id: string;
  maDot: string;
  tenDot: string;
  dot: string;
  loaiDeTai: DotType;
  major: string;
  startReg: string;
  endReg: string;
  startEx: string;
  endEx: string;
  active: boolean;
};

function readDateLike(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && value !== null) {
    const maybeTimestamp = value as { toDate?: () => Date };
    if (typeof maybeTimestamp.toDate === 'function') {
      return maybeTimestamp.toDate().toISOString().split('T')[0];
    }
  }
  return String(value).trim();
}

function slugify(input: string) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const DEFAULT_FORM = {
  maDot: '',
  tenDot: '',
  dot: '',
  loaiDeTai: 'BCTT' as DotType,
  major: '',
  startReg: '',
  endReg: '',
  startEx: '',
  endEx: '',
  active: true,
};

export function TbmCreateDot() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [dotRows, setDotRows] = useState<DotRecord[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'dot'), (snapshot) => {
      const mapped = snapshot.docs.map((d) => {
        const data = d.data();
        const activeRaw = String(data.active ?? '').trim().toLowerCase();
        return {
          id: d.id,
          maDot: String(data.maDot || '').trim(),
          tenDot: String(data.tenDot || '').trim(),
          dot: String(data.dot || '').trim(),
          loaiDeTai: String(data.loaiDeTai || data.loaidetai || data.type || 'BCTT').toUpperCase().includes('KLTN')
            ? 'KLTN'
            : 'BCTT',
          major: String(data.major || '').trim(),
          startReg: readDateLike(data.startReg ?? data.startreg ?? data.start ?? data.beginReg),
          endReg: readDateLike(data.endReg ?? data.endreg ?? data.end ?? data.closeReg),
          startEx: readDateLike(data.startEx ?? data.startex ?? data.startExecution ?? data.startExDate),
          endEx: readDateLike(data.endEx ?? data.endex ?? data.endExecution ?? data.endExDate),
          active:
            data.active === true || ['true', '1', 'yes', 'y', 'active', 'x'].includes(activeRaw),
        } as DotRecord;
      });
      mapped.sort((a, b) => (a.startReg < b.startReg ? 1 : -1));
      setDotRows(mapped);
    });

    return () => unsubscribe();
  }, []);

  const canSave = useMemo(() => {
    if (!form.maDot.trim()) return false;
    if (!form.tenDot.trim()) return false;
    if (!form.dot.trim()) return false;
    if (!form.major.trim()) return false;
    if (!form.startReg || !form.endReg) return false;
    return true;
  }, [form]);

  const handleSave = async () => {
    if (!canSave || isSaving) return;
    if (form.startReg > form.endReg) {
      alert('Ngày bắt đầu đăng ký phải nhỏ hơn hoặc bằng ngày kết thúc đăng ký.');
      return;
    }
    if (form.startEx && form.endEx && form.startEx > form.endEx) {
      alert('Ngày bắt đầu nộp báo cáo phải nhỏ hơn hoặc bằng ngày kết thúc nộp báo cáo.');
      return;
    }

    try {
      setIsSaving(true);
      const maDot = form.maDot.trim();
      const tenDot = form.tenDot.trim();
      const dot = form.dot.trim();
      const major = form.major.trim();
      const docId = slugify(`${maDot}_${form.loaiDeTai}_${major}`);

      await setDoc(
        doc(db, 'dot', docId),
        {
          maDot,
          tenDot,
          dot,
          loaiDeTai: form.loaiDeTai,
          type: form.loaiDeTai,
          major,
          startReg: form.startReg,
          endReg: form.endReg,
          startEx: form.startEx || null,
          endEx: form.endEx || null,
          active: form.active,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );

      setForm(DEFAULT_FORM);
      alert('Đã lưu đợt báo cáo.');
    } catch (error) {
      console.error('Create dot failed:', error);
      alert('Không thể lưu đợt báo cáo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (row: DotRecord) => {
    if (togglingId) return;
    try {
      setTogglingId(row.id);
      await updateDoc(doc(db, 'dot', row.id), {
        active: !row.active,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Toggle dot active failed:', error);
      alert('Không thể cập nhật trạng thái đợt.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 font-sans">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-gray-900">Tạo Đợt Báo Cáo</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mã đợt</label>
            <input
              value={form.maDot}
              onChange={(e) => setForm((prev) => ({ ...prev, maDot: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="VD: DOT2026HK2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên đợt</label>
            <input
              value={form.tenDot}
              onChange={(e) => setForm((prev) => ({ ...prev, tenDot: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="VD: Đợt HK2 năm học 2025-2026"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Học kỳ / Đợt</label>
            <input
              value={form.dot}
              onChange={(e) => setForm((prev) => ({ ...prev, dot: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="VD: HK2-2025-2026"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Loại đề tài</label>
            <select
              value={form.loaiDeTai}
              onChange={(e) => setForm((prev) => ({ ...prev, loaiDeTai: e.target.value as DotType }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
            >
              <option value="BCTT">BCTT</option>
              <option value="KLTN">KLTN</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Ngành</label>
            <input
              value={form.major}
              onChange={(e) => setForm((prev) => ({ ...prev, major: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="VD: QLCN"
            />
          </div>
          <div className="flex items-end">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              Kích hoạt đợt
            </label>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Bắt đầu đăng ký</label>
            <input
              type="date"
              value={form.startReg}
              onChange={(e) => setForm((prev) => ({ ...prev, startReg: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Kết thúc đăng ký</label>
            <input
              type="date"
              value={form.endReg}
              onChange={(e) => setForm((prev) => ({ ...prev, endReg: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Bắt đầu nộp báo cáo</label>
            <input
              type="date"
              value={form.startEx}
              onChange={(e) => setForm((prev) => ({ ...prev, startEx: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Kết thúc nộp báo cáo</label>
            <input
              type="date"
              value={form.endEx}
              onChange={(e) => setForm((prev) => ({ ...prev, endEx: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Đang lưu...' : 'Lưu đợt báo cáo'}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-3 text-sm font-semibold text-gray-800">
          Danh sách đợt báo cáo
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">Mã đợt</th>
                <th className="px-4 py-2 text-left">Tên đợt</th>
                <th className="px-4 py-2 text-left">Học kỳ/Đợt</th>
                <th className="px-4 py-2 text-left">Loại</th>
                <th className="px-4 py-2 text-left">Ngành</th>
                <th className="px-4 py-2 text-left">ĐK</th>
                <th className="px-4 py-2 text-left">Nộp BC</th>
                <th className="px-4 py-2 text-left">Trạng thái</th>
                <th className="px-4 py-2 text-left">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dotRows.map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-medium text-gray-900">{row.maDot || '-'}</td>
                  <td className="px-4 py-2 text-gray-800">{row.tenDot || '-'}</td>
                  <td className="px-4 py-2 text-gray-800">{row.dot || '-'}</td>
                  <td className="px-4 py-2 text-gray-800">{row.loaiDeTai}</td>
                  <td className="px-4 py-2 text-gray-800">{row.major || '-'}</td>
                  <td className="px-4 py-2 text-gray-800">{row.startReg} - {row.endReg}</td>
                  <td className="px-4 py-2 text-gray-800">{row.startEx || '-'} - {row.endEx || '-'}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {row.active ? 'Đang mở' : 'Tắt'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(row)}
                      disabled={togglingId === row.id}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        row.active
                          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {togglingId === row.id ? 'Đang cập nhật...' : row.active ? 'Đóng đợt' : 'Mở đợt'}
                    </button>
                  </td>
                </tr>
              ))}
              {dotRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Chưa có đợt báo cáo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
