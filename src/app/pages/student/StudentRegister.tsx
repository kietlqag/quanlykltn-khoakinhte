import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { FIELDS, PERIODS } from '../../data/mockData';
import { CheckCircle, AlertCircle, Search } from 'lucide-react';

export function StudentRegister() {
  const { user } = useAuth();
  const { thesisRegistrations, users, addThesisRegistration } = useData();
  
  const [type, setType] = useState<'BCTT' | 'KLTN'>('BCTT');
  const [title, setTitle] = useState('');
  const [field, setField] = useState('');
  const [advisorId, setAdvisorId] = useState('');
  const [period, setPeriod] = useState(PERIODS[PERIODS.length - 1]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const myRegistrations = thesisRegistrations.filter((r) => r.studentId === user?.id);
  const hasBCTT = myRegistrations.some((r) => r.type === 'BCTT' && r.status === 'completed');
  const hasKLTN = myRegistrations.some((r) => r.type === 'KLTN');

  // Get teachers sorted by expertise
  const teachers = users.filter((u) => u.role === 'GV');
  const sortedTeachers = field
    ? [...teachers].sort((a, b) => {
        const aMatch = a.expertise?.includes(field) ? 1 : 0;
        const bMatch = b.expertise?.includes(field) ? 1 : 0;
        return bMatch - aMatch;
      })
    : teachers;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
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

    // Create new registration
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
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng ký đề tài</h1>
        <p className="text-gray-600">Đăng ký báo cáo thực tập hoặc khóa luận tốt nghiệp</p>
      </div>

      {/* Status Check */}
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

      {/* Registration Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Loại đăng ký <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType('BCTT')}
                className={`p-4 rounded-lg border-2 transition ${
                  type === 'BCTT'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
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
                  type === 'KLTN'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!hasBCTT ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <p className="font-medium text-gray-900">Khóa luận tốt nghiệp (KLTN)</p>
                <p className="text-sm text-gray-600 mt-1">Yêu cầu hoàn thành BCTT</p>
              </button>
            </div>
          </div>

          {/* Title */}
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

          {/* Field */}
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
            {field && (
              <p className="mt-2 text-sm text-blue-600 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Danh sách giảng viên đã được sắp xếp theo chuyên môn phù hợp
              </p>
            )}
          </div>

          {/* Advisor */}
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

          {/* Period */}
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
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Messages */}
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

          {/* Submit */}
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