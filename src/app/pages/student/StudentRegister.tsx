import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { AlertCircle, CheckCircle } from 'lucide-react';

type FieldRow = {
  email: string;
  major: string;
  heDaoTao: string;
  field: string;
};

type QuotaRow = {
  emailGV: string;
  dot: string;
  heDaoTao: string;
  available: number;
  maxSlot: number;
  approved: boolean;
  hoTen: string;
  hasExplicitAvailable: boolean;
};

export function StudentRegister() {
  const location = useLocation() as { state?: { defaultType?: 'BCTT' | 'KLTN' } };
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
  const currentStudentHeDaoTao =
    users.find((u) => u.id === user?.id)?.heDaoTao || user?.heDaoTao || '';

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
          heDaoTao: String(data.heDaoTao || data.hedaotao || data.he || '').trim(),
          field: String(data.field || data.linhVuc || '').trim(),
        };
      });

      setFieldMappings(rows);

      const normalizedMajor = normalizeText(currentStudentMajor);
      const normalizedHeDaoTao = normalizeText(currentStudentHeDaoTao);
      const filtered = rows
        .filter((row) => row.field)
        .filter((row) => {
          const majorMatched = !normalizedMajor || !row.major || normalizeText(row.major) === normalizedMajor;
          const heDaoTaoMatched =
            !normalizedHeDaoTao ||
            !row.heDaoTao ||
            normalizeText(row.heDaoTao) === normalizedHeDaoTao;
          return majorMatched && heDaoTaoMatched;
        })
        .map((row) => row.field);

      const uniqueFields = Array.from(new Set(filtered)).sort((a, b) => a.localeCompare(b, 'vi'));
      setAvailableFields(uniqueFields);
    });

    return () => unsubscribe();
  }, [currentStudentHeDaoTao, currentStudentMajor]);

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
          heDaoTao: String(data.heDaoTao || data.hedaotao || '').trim(),
          available: Number.isFinite(availableRaw) ? availableRaw : 0,
          maxSlot: Number.isFinite(maxSlotRaw) ? maxSlotRaw : 0,
          approved:
            data.approved === undefined || data.approved === null ? true : Boolean(data.approved),
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

    if (type === 'KLTN') {
      if (bcttRegistration?.field) {
        setField(bcttRegistration.field);
      }
      if (bcttRegistration?.advisorId) {
        setAdvisorId(bcttRegistration.advisorId);
      }
    }
  }, [type, bcttRegistration?.advisorId, bcttRegistration?.field]);

  useEffect(() => {
    if (type === 'BCTT') {
      setAdvisorId('');
    }
  }, [field]);

  useEffect(() => {
    if (location.state?.defaultType === 'KLTN') {
      setType('KLTN');
    }
  }, [location.state?.defaultType]);

  const availableAdvisors = useMemo(() => {
    if (!field) return [];

    const normalizedField = normalizeText(field);
    const normalizedMajor = normalizeText(currentStudentMajor);
    const normalizedHeDaoTao = normalizeText(currentStudentHeDaoTao);
    const matchesMajor = (value: string) =>
      !normalizedMajor || !value || normalizeText(value) === normalizedMajor;
    const matchesHeDaoTao = (value: string) =>
      !normalizedHeDaoTao || !value || normalizeText(value) === normalizedHeDaoTao;

    const emails = Array.from(
      new Set(
        fieldMappings
          .filter((row) => row.email)
          .filter((row) => normalizeText(row.field) === normalizedField)
          .filter((row) => matchesMajor(row.major))
          .filter((row) => matchesHeDaoTao(row.heDaoTao))
          .map((row) => row.email),
      ),
    );

    const results = emails
      .map((email) => {
        const teacher = users.find(
          (u) => u.role === 'GV' && normalizeText(u.email) === normalizeText(email),
        );

        const quotaRowsForAdvisor = quotaMappings.filter(
          (q) => q.emailGV === email && matchesHeDaoTao(q.heDaoTao),
        );
        const quotaForPeriod =
          quotaRowsForAdvisor.find((q) => q.dot && q.dot === period) ||
          quotaRowsForAdvisor.find((q) => !q.dot) ||
          quotaRowsForAdvisor[0];

        if (!quotaForPeriod || !quotaForPeriod.approved) {
          return null;
        }

        const advisorIdentity = teacher?.id || email;

        const registeredCount = thesisRegistrations.filter((r) => {
          if (r.status === 'advisor_rejected') return false;
          const sameAdvisor = r.advisorId === advisorIdentity || normalizeText(r.advisorId) === normalizeText(email);
          return sameAdvisor;
        }).length;

        const maxSlot = quotaForPeriod.maxSlot;
        const registered = Math.max(0, registeredCount);
        const available = Math.max(0, maxSlot - registered);

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

    if (type !== 'KLTN' || !bcttRegistration?.advisorId) {
      return results;
    }

    const bcttTeacher = users.find((u) => u.role === 'GV' && u.id === bcttRegistration.advisorId);
    const bcttEmail = bcttRegistration.advisorId.includes('@')
      ? bcttRegistration.advisorId.toLowerCase()
      : (bcttTeacher?.email || '').toLowerCase();
    const bcttInList = results.find(
      (advisor) =>
        advisor.id === bcttRegistration.advisorId ||
        (bcttEmail && normalizeText(advisor.email) === normalizeText(bcttEmail)),
    );

    if (bcttInList) {
      return [bcttInList, ...results.filter((advisor) => advisor !== bcttInList)];
    }

    const quotaForBctt =
      quotaMappings.find((q) => q.emailGV === bcttEmail && matchesHeDaoTao(q.heDaoTao) && q.dot && q.dot === period) ||
      quotaMappings.find((q) => q.emailGV === bcttEmail && matchesHeDaoTao(q.heDaoTao) && !q.dot) ||
      quotaMappings.find((q) => q.emailGV === bcttEmail && matchesHeDaoTao(q.heDaoTao));
    if (quotaForBctt && !quotaForBctt.approved) {
      return results;
    }

    const bcttAdvisorIdentity = bcttRegistration.advisorId;
    const registeredCountForBctt = thesisRegistrations.filter((r) => {
      if (r.status === 'advisor_rejected') return false;
      const sameAdvisor =
        r.advisorId === bcttAdvisorIdentity ||
        (bcttEmail && normalizeText(r.advisorId) === normalizeText(bcttEmail));
      return sameAdvisor;
    }).length;

    const maxSlot = Number(quotaForBctt?.maxSlot ?? 0);
    const registered = Math.max(0, registeredCountForBctt);
    const available = Math.max(0, maxSlot - registered);

    const fallbackAdvisor = {
      id: bcttRegistration.advisorId,
      email: bcttEmail,
      displayName: bcttTeacher?.fullName || quotaForBctt?.hoTen || bcttRegistration.advisorId,
      available,
      registered,
    };

    return [fallbackAdvisor, ...results];
  }, [
    bcttRegistration?.advisorId,
    currentStudentHeDaoTao,
    currentStudentMajor,
    field,
    fieldMappings,
    period,
    quotaMappings,
    thesisRegistrations,
    type,
    users,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!user?.id) {
      setError('\u004b\u0068\u00f4\u006e\u0067 \u0074\u00ec\u006d \u0074\u0068\u1ea5\u0079 \u0074\u0068\u00f4\u006e\u0067 \u0074\u0069\u006e \u0073\u0069\u006e\u0068 \u0076\u0069\u00ea\u006e\u002e');
      return;
    }

    if (type === 'KLTN' && !hasBCTT) {
      setError('\u0042\u1ea1\u006e \u0063\u1ea7\u006e \u0068\u006f\u00e0\u006e \u0074\u0068\u00e0\u006e\u0068 \u0042\u0043\u0054\u0054 \u0074\u0072\u01b0\u1edb\u0063 \u006b\u0068\u0069 \u0111\u0103\u006e\u0067 \u006b\u00fd \u004b\u004c\u0054\u004e\u002e');
      return;
    }

    if (type === 'BCTT' && myRegistrations.some((r) => r.type === 'BCTT')) {
      setError('\u0042\u1ea1\u006e \u0111\u00e3 \u0111\u0103\u006e\u0067 \u006b\u00fd \u0042\u0043\u0054\u0054 \u0072\u1ed3\u0069\u002e');
      return;
    }

    if (type === 'KLTN' && hasKLTN) {
      setError('\u0042\u1ea1\u006e \u0111\u00e3 \u0111\u0103\u006e\u0067 \u006b\u00fd \u004b\u004c\u0054\u004e \u0072\u1ed3\u0069\u002e');
      return;
    }

    if (availablePeriods.length === 0 || !period) {
      setError('\u0048\u0069\u1ec7\u006e \u0063\u0068\u01b0\u0061 \u0063\u00f3 \u0111\u1ee3\u0074 \u006d\u1edf \u0111\u0103\u006e\u0067 \u006b\u00fd\u002e');
      return;
    }

    const newReg = {
      id: `REG${Date.now()}`,
      studentId: user.id,
      type,
      title,
      ...(type === 'BCTT' ? { companyName } : {}),
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
            {'\u0042\u00e1\u006f \u0063\u00e1\u006f \u0074\u0068\u1ef1\u0063 \u0074\u1ead\u0070 \u0028\u0042\u0043\u0054\u0054\u0029'}
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
            {'\u004b\u0068\u00f3\u0061 \u006c\u0075\u1ead\u006e \u0074\u1ed1\u0074 \u006e\u0067\u0068\u0069\u1ec7\u0070 \u0028\u004b\u004c\u0054\u004e\u0029'}
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
              {'\u0054\u00ea\u006e \u0111\u1ec1 \u0074\u00e0\u0069'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder={'\u004e\u0068\u1ead\u0070 \u0074\u00ea\u006e \u0111\u1ec1 \u0074\u00e0\u0069\u002e\u002e\u002e'}
              required
            />
          </div>

          {type === 'BCTT' && (
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
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {'\u004c\u0129\u006e\u0068 \u0076\u1ef1\u0063'} <span className="text-red-500">*</span>
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
                  ? '\u0043\u0068\u01b0\u0061 \u0063\u00f3 \u006c\u0129\u006e\u0068 \u0076\u1ef1\u0063 \u0070\u0068\u00f9 \u0068\u1ee3\u0070 \u006e\u0067\u00e0\u006e\u0068 \u0063\u1ee7\u0061 \u0062\u1ea1\u006e'
                  : '\u0043\u0068\u1ecd\u006e \u006c\u0129\u006e\u0068 \u0076\u1ef1\u0063'}
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
              {'\u0047\u0069\u1ea3\u006e\u0067 \u0076\u0069\u00ea\u006e \u0068\u01b0\u1edb\u006e\u0067 \u0064\u1eab\u006e'} <span className="text-red-500">*</span>
            </label>
            <select
              value={advisorId}
              onChange={(e) => setAdvisorId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              disabled={!field || availableAdvisors.length === 0}
              required
            >
              <option value="">
                {type === 'KLTN'
                  ? availableAdvisors.length === 0
                    ? '\u004b\u0068\u00f4\u006e\u0067 \u0063\u00f3 \u0047\u0056 \u0070\u0068\u00f9 \u0068\u1ee3\u0070'
                    : '\u0043\u0068\u1ecd\u006e \u0067\u0069\u1ea3\u006e\u0067 \u0076\u0069\u00ea\u006e'
                  : !field
                  ? '\u0043\u0068\u1ecd\u006e \u006c\u0129\u006e\u0068 \u0076\u1ef1\u0063 \u0074\u0072\u01b0\u1edb\u0063'
                  : availableAdvisors.length === 0
                    ? '\u004b\u0068\u00f4\u006e\u0067 \u0063\u00f3 \u0067\u0069\u1ea3\u006e\u0067 \u0076\u0069\u00ea\u006e \u006d\u1edf \u0073\u006c\u006f\u0074 \u0063\u0068\u006f \u006c\u0129\u006e\u0068 \u0076\u1ef1\u0063 \u0111\u00e3 \u0063\u0068\u1ecd\u006e'
                    : '\u0043\u0068\u1ecd\u006e \u0067\u0069\u1ea3\u006e\u0067 \u0076\u0069\u00ea\u006e'}
              </option>
              {availableAdvisors.map((advisor) => (
                <option key={advisor.id} value={advisor.id}>
                  {type === 'KLTN'
                    ? `${advisor.displayName} - \u0043\u00f2\u006e \u006c\u1ea1\u0069\u003a ${advisor.available} | \u0110\u00e3 \u0111\u0103\u006e\u0067 \u006b\u00fd\u003a ${advisor.registered}`
                    : `${advisor.displayName} - \u0043\u00f2\u006e \u006c\u1ea1\u0069\u003a ${advisor.available} | \u0110\u00e3 \u0111\u0103\u006e\u0067 \u006b\u00fd\u003a ${advisor.registered}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {'\u0110\u1ee3\u0074 \u0111\u0103\u006e\u0067 \u006b\u00fd'} <span className="text-red-500">*</span>
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              required
            >
              {availablePeriods.length === 0 && <option value="">{'\u0043\u0068\u01b0\u0061 \u0063\u00f3 \u0111\u1ee3\u0074 \u006d\u1edf \u0111\u0103\u006e\u0067 \u006b\u00fd'}</option>}
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
            {'\u0110\u0103\u006e\u0067 \u006b\u00fd \u0111\u1ec1 \u0074\u00e0\u0069'}
          </button>
        </form>
      </div>
    </div>
  );
}




