import React from 'react';
import { useData } from '../../contexts/DataContext';
import { CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function TbmStatistics() {
  const { thesisRegistrations, users, updateThesisRegistration } = useData();

  const students = users.filter((u) => u.role === 'SV');
  const periods = Array.from(new Set(thesisRegistrations.map((r) => r.period))).filter(Boolean);
  const currentPeriod = periods[periods.length - 1];
  const periodRegistrations = currentPeriod
    ? thesisRegistrations.filter((r) => r.period === currentPeriod)
    : thesisRegistrations;

  const revisionRows = periodRegistrations.filter((r) => r.revisedPdfUrl || r.revisionExplanationUrl);

  const getStudentName = (studentId: string) => students.find((s) => s.id === studentId)?.fullName || 'N/A';

  const scoreChartData = revisionRows
    .filter((r) => typeof r.finalScore === 'number')
    .map((r) => ({
      name: getStudentName(r.studentId).split(' ').slice(-2).join(' '),
      score: Number(r.finalScore),
    }))
    .slice(0, 8);

  const advisorApproveData = [
    { name: 'Đã duyệt', value: revisionRows.filter((r) => r.advisorApprovalRevision).length, color: '#22C55E' },
    { name: 'Chưa duyệt', value: revisionRows.filter((r) => !r.advisorApprovalRevision).length, color: '#F59E0B' },
  ];

  const chairmanApproveData = [
    { name: 'Đã duyệt', value: revisionRows.filter((r) => r.chairmanApprovalRevision).length, color: '#3B82F6' },
    { name: 'Chưa duyệt', value: revisionRows.filter((r) => !r.chairmanApprovalRevision).length, color: '#EF4444' },
  ];

  const fieldData = Object.entries(
    revisionRows.reduce<Record<string, number>>((acc, row) => {
      const key = row.field || 'Chưa cập nhật';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr className="text-gray-700">
                <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">Sinh viên</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">Tên đề tài</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">Lĩnh vực</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">Đợt</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide">Điểm</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide">GVHD duyệt sửa</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide">Chủ tịch duyệt sửa</th>
              </tr>
            </thead>
            <tbody>
              {revisionRows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 align-top hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{getStudentName(row.studentId)}</div>
                    <div className="text-gray-500">{row.studentId}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.title}</td>
                  <td className="px-4 py-3 text-blue-700">{row.field || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{row.period || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-blue-100 px-2 py-1 text-base font-bold text-blue-700">
                      {typeof row.finalScore === 'number' ? row.finalScore.toFixed(1) : '0'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center gap-2">
                      {row.advisorApprovalRevision ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Đã duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          <Clock className="h-3.5 w-3.5" />
                          Chờ duyệt
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center gap-2">
                      {row.chairmanApprovalRevision ? (
                        <button
                          onClick={() =>
                            updateThesisRegistration(row.id, {
                              chairmanApprovalRevision: false,
                            })
                          }
                          className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-200"
                        >
                          Đã duyệt
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            updateThesisRegistration(row.id, {
                              chairmanApprovalRevision: true,
                            })
                          }
                          className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                        >
                          Chờ duyệt
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {revisionRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    Chưa có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-300 bg-white p-4">
        <h2 className="text-lg font-semibold text-gray-900">Biểu đồ liên quan</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 p-3">
            <p className="mb-2 text-sm font-semibold text-gray-700">Phân bố điểm</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={scoreChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="score" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-gray-200 p-3">
            <p className="mb-2 text-sm font-semibold text-gray-700">Duyệt sửa của GVHD</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={advisorApproveData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={78} label>
                  {advisorApproveData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-gray-200 p-3">
            <p className="mb-2 text-sm font-semibold text-gray-700">Duyệt sửa của Chủ tịch</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={chairmanApproveData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={78} label>
                  {chairmanApproveData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-gray-200 p-3">
            <p className="mb-2 text-sm font-semibold text-gray-700">Số lượng theo lĩnh vực</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={fieldData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
