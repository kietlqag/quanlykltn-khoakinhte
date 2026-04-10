import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { FIELDS } from '../../data/mockData';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { CheckCircle, AlertCircle } from 'lucide-react';

export function StudentRegister() {
  const { user } = useAuth();
  const { thesisRegistrations, users, addThesisRegistration } = useData();

  const [type, setType] = useState<'BCTT' | 'KLTN'>('BCTT');
  const [title, setTitle] = useState('');
  const [field, setField] = useState('');
  const [advisorId, setAdvisorId] = useState('');
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [period, setPeriod] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const myRegistrations = thesisRegistrations.filter((r) => r.studentId === user?.id);
  const bcttRegistration = myRegistrations.find((r) => r.type === 'BCTT');
  const hasBCTT = myRegistrations.some((r) => r.type === 'BCTT' && r.status === 'completed');
  const hasKLTN = myRegistrations.some((r) => r.type === 'KLTN');

  const teachers = users.filter((u) => u.role === 'GV');
  const sortedTeachers = field
    ? [...teachers].sort((a, b) => {
        const aMatch = a.expertise?.includes(field) ? 1 : 0;
        const bMatch = b.expertise?.includes(field) ? 1 : 0;
        return bMatch - aMatch;
      })
    : teachers;

  const normalizeText = (value: string) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const parseRegDate = (value: string): Date | null => {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const hasYear = /\b\d{4}\b/.test(raw);
    const candidate = hasYear ? raw : `${raw} ${new Date().getFullYear()}`;
    const withCurrentYear = new Date(candidate);
    if (!Number.isNaN(withCurrentYear.getTime())) return withCurrentYear;
    return null;
  };

  const currentStudentMajor =
    users.find((u) => u.id === user?.id)?.expertise?.[0] ||
    user?.expertise?.[0] ||
    '';

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'dot'), (snapshot) => {
      const periods = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          const periodValue = String(data.dot || data.maDot || data.tenDot || '').trim();
          const periodMajor = String(data.major || '').trim();
          const periodType = String(data.loaiDeTai || data.loaidetai || '').trim().toUpperCase();
          const startRegDate = parseRegDate(String(data.startReg || ''));
          const endRegDate = parseRegDate(String(data.endReg || ''));
          const activeRaw = String(data.active ?? '').trim().toLowerCase();
          const active =
            data.active === true || ['true', '1', 'yes', 'y', 'active', 'x'].includes(activeRaw);

          const now = new Date();
          const isWithinRegWindow =
            (!startRegDate || startRegDate <= now) && (!endRegDate || endRegDate >= now);

          const isMajorMatched =
            !currentStudentMajor ||
            !periodMajor ||
            normalizeText(periodMajor) === normalizeText(currentStudentMajor);
          const isTypeMatched = !periodType || periodType === type;

          return active && isMajorMatched && isWithinRegWindow && isTypeMatched ? periodValue : '';
        })
        .filter(Boolean);

      const uniquePeriods = Array.from(new Set(periods));
      setAvailablePeriods(uniquePeriods);

      if (uniquePeriods.length > 0) {
        setPeriod((prev) => prev || uniquePeriods[uniquePeriods.length - 1]);
      }
    });

    return () => unsubscribe();
  }, [currentStudentMajor, type]);

  useEffect(() => {
    if (type === 'KLTN' && bcttRegistration?.advisorId) {
      setAdvisorId(bcttRegistration.advisorId);
    }
    if (type === 'BCTT') {
      setAdvisorId('');
    }
  }, [type, bcttRegistration?.advisorId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (type === 'KLTN' && !hasBCTT) {
      setError('Bạn cần hoàn thành BCTT trước khi đăng ký KLTN');
      return;
    }

    if (type === 'BCTT' && myRegistrations.some((r) => r.type === 'BCTT')) {
      setError('Bạn đã đăng ký BCTT rồi');
      return;
    }

    if (type === 'KLTN' && hasKLTN) {
      setError('Bạn đã đăng ký KLTN rồi');
      return;
    }

    const newReg = {
      id: `REG${Date.now()}`,
      studentId: user!.id,
      type,
      title,
      field,
      advisorId,
      period,
      status: 'pending' as const,
      submissionDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    addThesisRegistration(newReg);
    setSuccess(true);
    setTitle('');
    setField('');
    setAdvisorId('');
  };

  return (
    <div className="w-full">
      <div className="hidden">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng ký đề tài</h1>
        <p className="text-gray-600">Đăng ký báo cáo thực tập hoặc khóa luận tốt nghiệp</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Trạng thái đăng ký</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {hasBCTT ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
            <span className="text-sm text-gray-700">
              {hasBCTT ? 'Đã hoàn thành BCTT' : 'Chưa hoàn thành BCTT'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {hasKLTN ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-sm text-gray-700">
              {hasKLTN ? 'Đã đăng ký KLTN' : 'Chưa đăng ký KLTN'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Loại đăng ký <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType('BCTT')}
                className={`p-4 rounded-lg border-2 transition ${
                  type === 'BCTT' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-gray-900">Báo cáo thực tập (BCTT)</p>
                <p className="text-sm text-gray-600 mt-1">Báo cáo thực tập cơ sở</p>
              </button>
              <button
                type="button"
                onClick={() => setType('KLTN')}
                disabled={!hasBCTT}
                className={`p-4 rounded-lg border-2 transition ${
                  type === 'KLTN' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                } ${!hasBCTT ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <p className="font-medium text-gray-900">Khóa luận tốt nghiệp (KLTN)</p>
                <p className="text-sm text-gray-600 mt-1">Yêu cầu hoàn thành BCTT</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên đề tài <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập tên đề tài..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lĩnh vực <span className="text-red-500">*</span>
            </label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Chọn lĩnh vực</option>
              {FIELDS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giảng viên hướng dẫn <span className="text-red-500">*</span>
            </label>
            <select
              value={advisorId}
              onChange={(e) => setAdvisorId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Chọn giảng viên</option>
              {sortedTeachers.map((teacher) => {
                const matchesField = teacher.expertise?.includes(field);
                return (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.fullName} {matchesField && '⭐'} - {teacher.expertise?.join(', ')}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đợt đăng ký <span className="text-red-500">*</span>
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Đăng ký thành công! Vui lòng chờ giảng viên phê duyệt.</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
          >
            Đăng ký đề tài
          </button>
        </form>
      </div>
    </div>
  );
}
