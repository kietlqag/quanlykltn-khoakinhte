import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { AlertCircle, CheckCircle } from 'lucide-react';

type FieldRow = {
  email: string;
  major: string;
  field: string;
};

type QuotaRow = {
  emailGV: string;
  dot: string;
  available: number;
  maxSlot: number;
  approved: boolean;
  hoTen: string;
  hasExplicitAvailable: boolean;
};

export function StudentRegister() {
  const { user } = useAuth();
  const { thesisRegistrations, users, addThesisRegistration } = useData();

  const [type, setType] = useState<'BCTT' | 'KLTN'>('BCTT');
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [field, setField] = useState('');
  const [advisorId, setAdvisorId] = useState('');
  const [period, setPeriod] = useState('');

  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldRow[]>([]);
  const [quotaMappings, setQuotaMappings] = useState<QuotaRow[]>([]);

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const myRegistrations = thesisRegistrations.filter((r) => r.studentId === user?.id);
  const bcttRegistration = myRegistrations.find((r) => r.type === 'BCTT');
  const hasBCTT = myRegistrations.some((r) => r.type === 'BCTT' && r.status === 'completed');
  const hasKLTN = myRegistrations.some((r) => r.type === 'KLTN');

  const currentStudentMajor =
    users.find((u) => u.id === user?.id)?.expertise?.[0] || user?.expertise?.[0] || '';

  const normalizeText = (value: string) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const parseDate = (value: unknown): Date | null => {
    const raw = String(value || '').trim();
    if (!raw) return null;

    const ddmmyyyy = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (ddmmyyyy) {
      const day = Number(ddmmyyyy[1]);
      const month = Number(ddmmyyyy[2]) - 1;
      const year = Number(ddmmyyyy[3]);
      const dt = new Date(year, month, day);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;

    return null;
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'dot'), (snapshot) => {
      const now = new Date();
      const periods = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();

          const periodValue = String(data.dot || data.maDot || data.tenDot || '').trim();
          if (!periodValue) return '';

          const periodMajor = String(data.major || '').trim();
          const periodType = String(data.loaiDeTai || data.loaidetai || '')
            .trim()
            .toUpperCase();

          const startRegDate = parseDate(data.startReg || data.start || data.beginReg);
          const endRegDate = parseDate(data.endReg || data.end || data.closeReg);

          const activeRaw = String(data.active ?? '').trim().toLowerCase();
          const active =
            data.active === true || ['true', '1', 'yes', 'y', 'active', 'x'].includes(activeRaw);

          const isWithinRegWindow =
            (!startRegDate || startRegDate <= now) && (!endRegDate || endRegDate >= now);
          const isMajorMatched =
            !currentStudentMajor ||
            !periodMajor ||
            normalizeText(periodMajor) === normalizeText(currentStudentMajor);
          const isTypeMatched = !periodType || periodType === type;

          return active && isWithinRegWindow && isMajorMatched && isTypeMatched ? periodValue : '';
        })
        .filter(Boolean);

      const uniquePeriods = Array.from(new Set(periods));
      setAvailablePeriods(uniquePeriods);

      if (uniquePeriods.length === 0) {
        setPeriod('');
        return;
      }

      setPeriod((prev) => (prev && uniquePeriods.includes(prev) ? prev : uniquePeriods[0]));
    });

    return () => unsubscribe();
  }, [currentStudentMajor, type]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'field'), (snapshot) => {
      const rows: FieldRow[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          email: String(data.email || data.emailGV || data.emailgv || '')
            .trim()
            .toLowerCase(),
          major: String(data.major || data.nganh || '').trim(),
          field: String(data.field || data.linhVuc || '').trim(),
        };
      });

      setFieldMappings(rows);

      const normalizedMajor = normalizeText(currentStudentMajor);
      const filtered = rows
        .filter((row) => row.field)
        .filter((row) => {
          if (!normalizedMajor) return true;
          if (!row.major) return true;
          return normalizeText(row.major) === normalizedMajor;
        })
        .map((row) => row.field);

      const uniqueFields = Array.from(new Set(filtered)).sort((a, b) => a.localeCompare(b, 'vi'));
      setAvailableFields(uniqueFields);
    });

    return () => unsubscribe();
  }, [currentStudentMajor]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'quota'), (snapshot) => {
      const rows: QuotaRow[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const availableRaw = Number(data.available ?? Number.NaN);
        const maxSlotRaw = Number(data.maxSlot ?? data.maxslot ?? data.quota ?? 0);

        return {
          emailGV: String(data.emailGV || data.emailgv || data.email || '')
            .trim()
            .toLowerCase(),
          dot: String(data.dot || data.period || data.dothk || '').trim(),
          available: Number.isFinite(availableRaw) ? availableRaw : 0,
          maxSlot: Number.isFinite(maxSlotRaw) ? maxSlotRaw : 0,
          approved: Boolean(data.approved),
          hoTen: String(data.hoTen || data.name || '').trim(),
          hasExplicitAvailable: Number.isFinite(availableRaw),
        };
      });

      setQuotaMappings(rows);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => setSuccess(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [success]);

  useEffect(() => {
    setField('');
    setAdvisorId('');

    if (type === 'KLTN' && bcttRegistration?.advisorId) {
      setAdvisorId(bcttRegistration.advisorId);
    }
  }, [type, bcttRegistration?.advisorId]);

  useEffect(() => {
    setAdvisorId('');
  }, [field]);

  const availableAdvisors = useMemo(() => {
    if (!field) return [];

    const normalizedField = normalizeText(field);
    const emails = Array.from(
      new Set(
        fieldMappings
          .filter((row) => row.email)
          .filter((row) => normalizeText(row.field) === normalizedField)
          .map((row) => row.email),
      ),
    );

    const results = emails
      .map((email) => {
        const teacher = users.find(
          (u) => u.role === 'GV' && normalizeText(u.email) === normalizeText(email),
        );

        const quotaForPeriod =
          quotaMappings.find((q) => q.emailGV === email && q.dot && q.dot === period) ||
          quotaMappings.find((q) => q.emailGV === email && !q.dot) ||
          quotaMappings.find((q) => q.emailGV === email);

        if (!quotaForPeriod || !quotaForPeriod.approved) {
          return null;
        }

        const advisorIdentity = teacher?.id || email;

        const registeredCount = thesisRegistrations.filter((r) => {
          if (r.status === 'advisor_rejected') return false;
          const sameAdvisor = r.advisorId === advisorIdentity || normalizeText(r.advisorId) === normalizeText(email);
          const samePeriod = !period || r.period === period;
          return sameAdvisor && samePeriod;
        }).length;

        const maxSlot = quotaForPeriod.maxSlot;
        const available = quotaForPeriod.hasExplicitAvailable
          ? Math.max(0, quotaForPeriod.available)
          : Math.max(0, maxSlot - registeredCount);

        const registered = Math.max(0, maxSlot - available);

        return {
          id: advisorIdentity,
          email,
          displayName: quotaForPeriod.hoTen || teacher?.fullName || email,
          available,
          registered,
        };
      })
      .filter((advisor): advisor is { id: string; email: string; displayName: string; available: number; registered: number } => Boolean(advisor))
      .sort((a, b) => {
        if (b.available !== a.available) return b.available - a.available;
        return a.displayName.localeCompare(b.displayName, 'vi');
      });

    return results;
  }, [field, fieldMappings, period, quotaMappings, thesisRegistrations, users]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!user?.id) {
      setError('Không tìm thấy thông tin sinh viên.');
      return;
    }

    if (type === 'KLTN' && !hasBCTT) {
      setError('Bạn cần hoàn thành BCTT trước khi đăng ký KLTN.');
      return;
    }

    if (type === 'BCTT' && myRegistrations.some((r) => r.type === 'BCTT')) {
      setError('Bạn đã đăng ký BCTT rồi.');
      return;
    }

    if (type === 'KLTN' && hasKLTN) {
      setError('Bạn đã đăng ký KLTN rồi.');
      return;
    }

    if (availablePeriods.length === 0 || !period) {
      setError('Hiện chưa có đợt mở đăng ký.');
      return;
    }

    const newReg = {
      id: `REG${Date.now()}`,
      studentId: user.id,
      type,
      title,
      companyName,
      registeredAt: new Date().toISOString().split('T')[0],
      field,
      advisorId,
      period,
      status: 'pending' as const,
      submissionDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    };

    addThesisRegistration(newReg);
    setSuccess(true);
    setTitle('');
    setCompanyName('');
    setField('');
    setAdvisorId('');
  };

  return (
    <div className="w-full">
      {success && (
        <div className="fixed right-6 top-6 z-50 max-w-md rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-emerald-100 p-1">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-700">Đăng ký thành công</p>
              <p className="text-sm text-gray-700">Vui lòng chờ giảng viên phê duyệt.</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex justify-center">
        <div className="inline-flex w-fit flex-wrap items-center gap-2 rounded-full bg-gray-200 p-1">
          <button
            type="button"
            onClick={() => setType('BCTT')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              type === 'BCTT' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {'Báo cáo thực tập (BCTT)'}
            {hasBCTT ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setType('KLTN')}
            disabled={!hasBCTT}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              type === 'KLTN' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            } ${!hasBCTT ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {'Khóa luận tốt nghiệp (KLTN)'}
            {hasKLTN ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tên đề tài <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tên đề tài..."
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tên công ty <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tên công ty..."
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Lĩnh vực <span className="text-red-500">*</span>
            </label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              disabled={availableFields.length === 0}
              required
            >
              <option value="">
                {availableFields.length === 0
                  ? 'Chưa có lĩnh vực phù hợp ngành của bạn'
                  : 'Chọn lĩnh vực'}
              </option>
              {availableFields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Giảng viên hướng dẫn <span className="text-red-500">*</span>
            </label>
            <select
              value={advisorId}
              onChange={(e) => setAdvisorId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              disabled={!field || availableAdvisors.length === 0}
              required
            >
              <option value="">
                {!field
                  ? 'Chọn lĩnh vực trước'
                  : availableAdvisors.length === 0
                    ? 'Không có giảng viên mở slot cho lĩnh vực đã chọn'
                    : 'Chọn giảng viên'}
              </option>
              {availableAdvisors.map((advisor) => (
                <option key={advisor.id} value={advisor.id}>
                  {`${advisor.displayName} - Còn lại: ${advisor.available} | Đã đăng ký: ${advisor.registered}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Đợt đăng ký <span className="text-red-500">*</span>
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              required
            >
              {availablePeriods.length === 0 && <option value="">Chưa có đợt mở đăng ký</option>}
              {availablePeriods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white shadow-lg transition hover:bg-blue-700 hover:shadow-xl"
          >
            Đăng ký đề tài
          </button>
        </form>
      </div>
    </div>
  );
}
