import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { collection, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Save } from 'lucide-react';

export function TbmAssignReviewer() {
  const { thesisRegistrations, users, updateThesisRegistration } = useData();
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  const teachers = users.filter((u) => u.role === 'GV');
  const students = users.filter((u) => u.role === 'SV');
  const approvedRegistrations = thesisRegistrations.filter(
    (r) => r.type === 'KLTN' && (r.status === 'advisor_approved' || !!r.pdfUrl),
  );

  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.fullName || 'N/A';
  };

  const getAdvisorName = (advisorId: string) => {
    return teachers.find((t) => t.id === advisorId)?.fullName || 'N/A';
  };

  const handleAssign = async (regId: string) => {
    const reviewerId = assignments[regId];
    if (!reviewerId) {
      alert('Vui lòng chọn giảng viên phản biện');
      return;
    }

    updateThesisRegistration(regId, { reviewerId });

    const reg = thesisRegistrations.find((r) => r.id === regId);
    const student = students.find((s) => s.id === reg?.studentId);
    const reviewer = teachers.find((t) => t.id === reviewerId);

    if (reg && student?.email && reviewer?.email) {
      const statusQuery = query(
        collection(db, 'trangthaidetai'),
        where('emailSV', '==', student.email.toLowerCase()),
        where('loaidetai', '==', reg.type),
      );
      const statusSnap = await getDocs(statusQuery);
      for (const docSnap of statusSnap.docs) {
        await updateDoc(docSnap.ref, {
          emailReviewer: reviewer.email.toLowerCase(),
          updatedBy: 'TBM',
        });
      }
    }

    alert('Đã phân công phản biện');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="rounded-2xl border border-gray-300 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-gray-700">
                <th className="px-4 py-3 text-left font-semibold uppercase text-xs tracking-wide w-[19%]">Sinh viên</th>
                <th className="px-4 py-3 text-left font-semibold uppercase text-xs tracking-wide w-[24%]">Tên đề tài</th>
                <th className="px-4 py-3 text-left font-semibold uppercase text-xs tracking-wide w-[11%]">Lĩnh vực</th>
                <th className="px-4 py-3 text-left font-semibold uppercase text-xs tracking-wide w-[10%]">Đợt</th>
                <th className="px-4 py-3 text-left font-semibold uppercase text-xs tracking-wide w-[16%]">Giảng viên hướng dẫn</th>
                <th className="px-4 py-3 text-left font-semibold uppercase text-xs tracking-wide w-[20%]">Giảng viên phản biện</th>
              </tr>
            </thead>
            <tbody>
              {approvedRegistrations.map((reg) => (
                <tr key={reg.id} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{getStudentName(reg.studentId)}</div>
                    <div className="text-gray-500">{reg.studentId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 leading-5">{reg.title}</div>
                  </td>
                  <td className="px-4 py-3 text-blue-700">{reg.field || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{reg.period || '-'}</td>
                  <td className="px-4 py-3 text-gray-800">{getAdvisorName(reg.advisorId)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={assignments[reg.id] || reg.reviewerId || ''}
                        onChange={(e) => setAssignments({ ...assignments, [reg.id]: e.target.value })}
                        className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                      >
                        <option value="">Chọn GV phản biện</option>
                        {teachers
                          .filter((t) => t.id !== reg.advisorId)
                          .map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.fullName}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAssign(reg.id)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 inline-flex items-center gap-1 shrink-0"
                      >
                        <Save className="w-4 h-4" />
                        Lưu
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {approvedRegistrations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    Chưa có dữ liệu
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
