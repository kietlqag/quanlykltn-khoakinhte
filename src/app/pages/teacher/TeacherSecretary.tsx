import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { db } from '../../../lib/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { FileText, X } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import notoSansRegularUrl from '../../../assets/fonts/NotoSans-Regular.ttf?url';
import notoSansBoldUrl from '../../../assets/fonts/NotoSans-Bold.ttf?url';

/** Must use Vite ?url so .ttf is emitted to dist; do not use new URL(..., import.meta.url) — it breaks after bundle. */
async function fetchFontBytes(resolvedUrl: string): Promise<ArrayBuffer> {
  const res = await fetch(resolvedUrl);
  if (!res.ok) {
    throw new Error(`Không tải được font (${res.status}). Kiểm tra triển khai có copy thư mục assets.`);
  }
  const buf = await res.arrayBuffer();
  if (buf.byteLength < 4096) {
    throw new Error('File font không hợp lệ (quá nhỏ).');
  }
  return buf;
}

function sanitizeUploadSegment(value: string) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'file';
}

function normalizeText(value: string) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}

function wrapText(value: string, maxChars = 90) {
  const words = normalizeText(value).split(' ');
  const lines: string[] = [];
  let current = '';

  for (const w of words) {
    if (!w) continue;
    const next = current ? current + ' ' + w : w;
    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

type MinutesPdfPayload = {
  thesisTitle: string;
  studentName: string;
  studentId: string;
  major: string;
  cohort: string;
  section2Lines: string[];
  section3Lines: string[];
  section4Lines: string[];
  day: number;
  month: number;
  year: number;
};

async function createMinutesPdfBlob(payload: MinutesPdfPayload) {
  const pageWidth = 595;
  const pageHeight = 842;
  const left = 62;
  const right = 532;
  const centerX = (left + right) / 2;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const [regularFontBytes, boldFontBytes] = await Promise.all([
    fetchFontBytes(notoSansRegularUrl),
    fetchFontBytes(notoSansBoldUrl),
  ]);

  const regularFont = await pdfDoc.embedFont(regularFontBytes);
  const boldFont = await pdfDoc.embedFont(boldFontBytes);
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const textWidth = (value: string, fontSize: number, bold = false) =>
    (bold ? boldFont : regularFont).widthOfTextAtSize(normalizeText(value || ' '), fontSize);

  const drawText = (
    value: string,
    x: number,
    y: number,
    opts?: { size?: number; bold?: boolean; align?: 'left' | 'center' | 'right' },
  ) => {
    const clean = normalizeText(value || ' ');
    const size = opts?.size ?? 11;
    const isBold = Boolean(opts?.bold);
    let tx = x;

    if (opts?.align === 'center') tx = x - textWidth(clean, size, isBold) / 2;
    if (opts?.align === 'right') tx = x - textWidth(clean, size, isBold);

    page.drawText(clean, {
      x: tx,
      y,
      size,
      font: isBold ? boldFont : regularFont,
      color: rgb(0, 0, 0),
    });
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, dotted = false) => {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
      dashArray: dotted ? [1.5, 2] : undefined,
    });
  };

  const writingLineGap = 18;
  const textAboveLine = 3;

  const drawWritingArea = (startY: number, count: number, gap: number, lines: string[]) => {
    for (let i = 0; i < count; i++) {
      const y = startY - i * gap;
      drawLine(left, y, right, y, true);
      if (lines[i]) drawText(lines[i], left + 2, y + textAboveLine, { size: 10 });
    }
    return startY - count * gap;
  };

  drawText('\u0110\u1ea0I H\u1eccC C\u00d4NG NGH\u1ec6 K\u1ef8 THU\u1eacT TP.HCM', centerX, 812, {
    size: 10,
    bold: true,
    align: 'center',
  });
  drawText('KHOA KINH T\u1ebe', centerX, 798, { size: 10, bold: true, align: 'center' });
  drawText(`NG\u00c0NH ${payload.major || '..................................'}`, centerX, 784, {
    size: 10,
    align: 'center',
  });
  drawLine(left - 8, 778, right + 8, 778);

  drawText('BI\u00caN B\u1ea2N H\u1eccP H\u1ed8I \u0110\u1ed2NG \u0110\u00c1NH GI\u00c1 KH\u00d3A LU\u1eacN T\u1ed0T NGHI\u1ec6P', centerX, 746, {
    size: 11,
    bold: true,
    align: 'center',
  });
  drawText(`NG\u00c0NH ${payload.major || '...............'}   KH\u00d3A ${payload.cohort || '.........'}`, centerX, 732, {
    size: 10,
    bold: true,
    align: 'center',
  });

  drawText('1. Th\u00f4ng tin chung', left, 696, { size: 11, bold: true });
  drawText('T\u00ean kh\u00f3a lu\u1eadn:', left, 680, { size: 10 });
  drawLine(left, 668, right, 668, true);
  drawText(payload.thesisTitle, left + 2, 668 + textAboveLine, { size: 10 });

  drawText('Sinh vi\u00ean th\u1ef1c hi\u1ec7n:', left, 654, { size: 10 });
  drawLine(left, 642, right, 642, true);
  drawText(payload.studentName, left + 2, 642 + textAboveLine, { size: 10 });

  drawText('MSSV:', left, 628, { size: 10 });
  drawLine(left, 616, right, 616, true);
  drawText(payload.studentId, left + 2, 616 + textAboveLine, { size: 10 });

  drawText('2. Nh\u1eadn x\u00e9t c\u1ee7a c\u00e1c th\u00e0nh vi\u00ean h\u1ed9i \u0111\u1ed3ng', left, 597, { size: 11, bold: true });
  const afterSection2 = drawWritingArea(584, 15, writingLineGap, payload.section2Lines);

  drawText('3. Y\u00eau c\u1ea7u ch\u1ec9nh s\u1eeda', left, afterSection2 - 14, { size: 11, bold: true });
  const afterSection3 = drawWritingArea(afterSection2 - 26, 6, writingLineGap, payload.section3Lines);

  drawText(`Ng\u00e0y...${payload.day}...th\u00e1ng...${payload.month}...n\u0103m...${payload.year}....`, right - 2, afterSection3 - 7, {
    size: 10,
    align: 'right',
  });
  drawText('Ch\u1ee7 t\u1ecbch h\u1ed9i \u0111\u1ed3ng', left + 40, afterSection3 - 25, { size: 10, bold: true, align: 'center' });
  drawText('(k\u00fd, h\u1ecd v\u00e0 t\u00ean)', left + 40, afterSection3 - 38, { size: 9, align: 'center' });
  drawText('Th\u01b0 k\u00fd', right - 40, afterSection3 - 25, { size: 10, bold: true, align: 'center' });
  drawText('(k\u00fd, h\u1ecd v\u00e0 t\u00ean)', right - 40, afterSection3 - 38, { size: 9, align: 'center' });

  drawText('\u00dd KI\u1ebeN C\u1ee6A CH\u1ee6 T\u1ecaCH H\u1ed8I \u0110\u1ed2NG SAU KHI SINH VI\u00caN CH\u1ec8NH S\u1eeda', left, afterSection3 - 86, {
    size: 10,
    bold: true,
  });
  const afterSection4 = drawWritingArea(afterSection3 - 100, 3, writingLineGap, payload.section4Lines);

  drawText('Ng\u00e0y...th\u00e1ng...n\u0103m......', centerX, afterSection4 - 15, { size: 10, align: 'center' });
  drawText('Ch\u1ee7 t\u1ecbch h\u1ed9i \u0111\u1ed3ng', centerX, afterSection4 - 31, { size: 10, bold: true, align: 'center' });
  drawText('(k\u00fd, h\u1ecd v\u00e0 t\u00ean)', centerX, afterSection4 - 44, { size: 9, align: 'center' });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

async function uploadRawFile(params: {
  blob: Blob;
  fileName: string;
  folder: string;
  cloudName: string;
  uploadPreset: string;
}) {
  const { blob, fileName, folder, cloudName, uploadPreset } = params;
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    const file = new File([blob], fileName, { type: 'application/pdf' });
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);
    formData.append('public_id', fileName.replace(/\.pdf$/i, ''));

    xhr.onerror = () => reject(new Error('Upload PDF th\u1ea5t b\u1ea1i.'));  
    xhr.onabort = () => reject(new Error('Upload PDF \u0111\u00e3 b\u1ecb h\u1ee7y.')); 
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== XMLHttpRequest.DONE) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText) as { secure_url?: string; version?: number; public_id?: string };
          if (response.version && response.public_id) {
            resolve(`https://res.cloudinary.com/${cloudName}/raw/upload/v${response.version}/${String(response.public_id).replace(/^\/+/, '')}`);
            return;
          }
          if (response.secure_url) {
            resolve(response.secure_url);
            return;
          }
        } catch {
          reject(new Error('Kh\u00f4ng \u0111\u1ecdc \u0111\u01b0\u1ee3c ph\u1ea3n h\u1ed3i upload PDF.')); 
          return;
        }
      }
      reject(new Error('Upload PDF thất bại.'));
    };

    xhr.open('POST', endpoint);
    xhr.send(formData);
  });
}

export function TeacherSecretary() {
  const { user } = useAuth();
  const { thesisRegistrations, councils, users, updateThesisRegistration } = useData();
  const [editingMinutes, setEditingMinutes] = useState<string | null>(null);
  const [councilComments, setCouncilComments] = useState<string>('');

  const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const secretaryCouncils = councils.filter((c) => c.secretaryId === user?.id);
  const councilIds = secretaryCouncils.map((c) => c.id);
  const councilStudents = thesisRegistrations.filter((r) => r.councilId && councilIds.includes(r.councilId));

  const getStudentName = (studentId: string) => users.find((u) => u.id === studentId)?.fullName || 'N/A';
  const getStudentMajor = (studentId: string) =>
    users.find((u) => u.id === studentId)?.expertise?.[0] || '';
  const getStudentCohort = (studentId: string) => {
    const digits = String(studentId || '').replace(/\D/g, '');
    const yy = digits.slice(0, 2);
    if (yy.length === 2) return `20${yy}`;
    return '';
  };

  const getMssv6Digits = (value?: string) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return String(value || '-').slice(0, 6);
    return digits.slice(0, 6);
  };

  const calculateFinalScore = (reg: any): string => {
    const scores = [reg.advisorScore, reg.reviewerScore, reg.councilScore].filter((s) => s !== undefined);
    return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 'N/A';
  };

  const calculateFinalScoreNumber = (reg: any): number | null => {
    const scores = [reg.advisorScore, reg.reviewerScore, reg.councilScore].filter((s) => typeof s === 'number') as number[];
    if (scores.length === 0) return null;
    return Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
  };

  const handleSaveMinutes = async (regId: string) => {
    const reg = councilStudents.find((r) => r.id === regId);
    if (!reg) return;

    const finalScore = calculateFinalScore(reg);
    const finalScoreNumber = finalScore === 'N/A' ? null : Number(finalScore);

    const activeCouncil = councils.find((c) => c.id === reg.councilId);
    const chairmanName = users.find((u) => u.id === activeCouncil?.chairmanId)?.fullName || '...';
    const secretaryName = users.find((u) => u.id === activeCouncil?.secretaryId)?.fullName || '...';
    const tv1Id = activeCouncil?.members?.[0];
    const tv2Id = activeCouncil?.members?.[1];
    const tv1Name = users.find((u) => u.id === tv1Id)?.fullName || 'TV1';
    const tv2Name = users.find((u) => u.id === tv2Id)?.fullName || 'TV2';

    const chairmanComment = reg.chairmanComments || '\u0043h\u01b0a c\u00f3 g\u00f3p \u00fd';
    const tv1Comment = (tv1Id && reg.councilMemberComments?.[tv1Id]) || '\u0043h\u01b0a c\u00f3 g\u00f3p \u00fd';
    const tv2Comment = (tv2Id && reg.councilMemberComments?.[tv2Id]) || '\u0043h\u01b0a c\u00f3 g\u00f3p \u00fd';

    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const section2Lines = [
      ...wrapText(`\u0043h\u1ee7 t\u1ecbch (${chairmanName}): ${chairmanComment}`, 95),
      ...wrapText(`${tv1Name}: ${tv1Comment}`, 95),
      ...wrapText(`${tv2Name}: ${tv2Comment}`, 95),
    ].slice(0, 15);
    const section3Lines = (councilComments.trim() ? wrapText(councilComments, 95) : ['\u004b\u0068\u00f4ng c\u00f3']).slice(0, 6);
    const section4Lines: string[] = [];

    try {
      if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
        throw new Error('Thi\u1ebfu c\u1ea5u h\u00ecnh Cloudinary \u0111\u1ec3 l\u01b0u PDF bi\u00ean b\u1ea3n.');
      }

      const pdfBlob = await createMinutesPdfBlob({
        thesisTitle: reg.title || '-',
        studentName: getStudentName(reg.studentId),
        studentId: getMssv6Digits(reg.studentId),
        major: getStudentMajor(reg.studentId),
        cohort: getStudentCohort(reg.studentId),
        section2Lines,
        section3Lines,
        section4Lines,
        day,
        month,
        year,
      });
      const timestamp = Date.now();
      const fileName = `${sanitizeUploadSegment(getMssv6Digits(reg.studentId))}-${sanitizeUploadSegment(reg.title).slice(0, 30)}-bien-ban-hoi-dong-${timestamp}.pdf`;
      const folder = [
        'truc_project',
        'minutes',
        sanitizeUploadSegment(reg.type),
        sanitizeUploadSegment(reg.id),
      ].join('/');

      const pdfUrl = await uploadRawFile({
        blob: pdfBlob,
        fileName,
        folder,
        cloudName: cloudinaryCloudName,
        uploadPreset: cloudinaryUploadPreset,
      });

      await setDoc(
        doc(db, 'bienban', regId),
        {
          registrationId: regId,
          studentId: reg.studentId,
          title: reg.title,
          councilComments,
          chairmanComments: reg.chairmanComments || '',
          councilMemberComments: reg.councilMemberComments || {},
          advisorScore: reg.advisorScore ?? null,
          reviewerScore: reg.reviewerScore ?? null,
          councilScore: reg.councilScore ?? null,
          finalScore: finalScoreNumber,
          pdfUrl,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      updateThesisRegistration(regId, {
        councilMinutesUrl: pdfUrl,
        councilComments,
        finalScore: finalScoreNumber ?? undefined,
        status: finalScoreNumber !== null ? 'defended' : reg.status,
      });

      setEditingMinutes(null);
      setCouncilComments('');
      alert('\u0110\u00e3 l\u01b0u bi\u00ean b\u1ea3n PDF th\u00e0nh c\u00f4ng');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'L\u01b0u bi\u00ean b\u1ea3n PDF th\u1ea5t b\u1ea1i';
      alert(message);
    }
  };

  const handleToggleScoreLock = (regId: string, nextLocked: boolean) => {
    updateThesisRegistration(regId, { scoreLocked: nextLocked });
    alert(nextLocked ? 'Đã khóa điểm' : 'Đã mở khóa điểm');
  };

  const handleFinishCouncil = (councilId: string) => {
    const students = councilStudents.filter((r) => r.councilId === councilId);
    students.forEach((reg) => {
      if (!reg.councilMinutesUrl) return;
      const finalScoreNumber = calculateFinalScoreNumber(reg);
      if (finalScoreNumber === null) return;
      updateThesisRegistration(reg.id, {
        finalScore: finalScoreNumber,
        status: finalScoreNumber >= 5 ? 'completed' : 'defended',
      });
    });
    alert('Đã kết thúc hội đồng');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {(secretaryCouncils.length > 0
        ? secretaryCouncils.map((c) => ({ id: c.id, name: c.name }))
        : [{ id: '__empty__', name: 'Chưa có hội đồng' }]
      ).map((council) => {
        const students = council.id === '__empty__' ? [] : councilStudents.filter((r) => r.councilId === council.id);

        return (
          <div key={council.id}>
            <div className="inline-flex px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold mb-3">
              {council.name}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="hidden md:grid md:grid-cols-[2fr_2.7fr_2.4fr_1fr_1.5fr] gap-4 px-6 py-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <div>Sinh viên</div>
                <div>Bảng điểm</div>
                <div>Điểm tổng kết</div>
                <div className="text-center">Biên bản hội đồng</div>
                <div className="text-center">Thao tác</div>
              </div>

              <div className="divide-y divide-gray-200">
                {students.map((reg) => {
                  const activeCouncil = councils.find((c) => c.id === reg.councilId);
                  const tv1Id = activeCouncil?.members?.[0];
                  const tv2Id = activeCouncil?.members?.[1];
                  const tv1Score = tv1Id ? reg.councilMemberScores?.[tv1Id] : undefined;
                  const tv2Score = tv2Id ? reg.councilMemberScores?.[tv2Id] : undefined;
                  const chairmanScore = reg.chairmanScore;

                  return (
                  <div key={reg.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_2.7fr_2.4fr_1fr_1.5fr] md:items-center">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 leading-snug truncate">
                          {getStudentName(reg.studentId)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1.5 leading-snug truncate">{reg.studentId}</div>
                      </div>

                      <div className="text-xs text-gray-700">
                        <div className="grid w-fit grid-cols-5 gap-x-2 gap-y-2">
                          <span className="text-center font-semibold text-gray-500">HD</span>
                          <span className="text-center font-semibold text-gray-500">PB</span>
                          <span className="text-center font-semibold text-gray-500">CT</span>
                          <span className="text-center font-semibold text-gray-500">TV1</span>
                          <span className="text-center font-semibold text-gray-500">TV2</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full text-center">{reg.advisorScore ?? '-'}</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full text-center">{reg.reviewerScore ?? '-'}</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full text-center">{chairmanScore ?? '-'}</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full text-center">{tv1Score ?? '-'}</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full text-center">{tv2Score ?? '-'}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-2xl font-bold text-blue-600">{calculateFinalScore(reg)}</span>
                      </div>

                      <div className="md:text-center">
                        <button
                          onClick={() => {
                            setEditingMinutes(reg.id);
                            setCouncilComments(reg.councilComments || '');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 rounded-full text-xs font-semibold text-red-700 hover:bg-red-200"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {reg.councilMinutesUrl ? 'Sửa' : 'Tạo'}
                        </button>
                      </div>

                      <div className="md:text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleScoreLock(reg.id, !Boolean(reg.scoreLocked))}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            reg.scoreLocked
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          }`}
                        >
                          {reg.scoreLocked ? 'Mở khóa điểm' : 'Khóa điểm'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
                })}

                {students.length === 0 && (
                  <div className="px-6 py-10 text-center text-sm text-gray-500">Chưa có dữ liệu</div>
                )}
              </div>
            </div>

            {council.id !== '__empty__' && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => handleFinishCouncil(council.id)}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700"
                >
                  KẾT THÚC
                </button>
              </div>
            )}
          </div>
        );
      })}

      {editingMinutes && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {(() => {
              const reg = councilStudents.find((item) => item.id === editingMinutes);
              if (!reg) return null;
              const activeCouncil = councils.find((c) => c.id === reg.councilId);
              const tv1Id = activeCouncil?.members?.[0];
              const tv2Id = activeCouncil?.members?.[1];
              const chairmanComment = reg.chairmanComments || 'Chưa có góp ý';
              const tv1Comment = (tv1Id && reg.councilMemberComments?.[tv1Id]) || 'Chưa có góp ý';
              const tv2Comment = (tv2Id && reg.councilMemberComments?.[tv2Id]) || 'Chưa có góp ý';

              return (
                <>
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Biên bản hội đồng</h3>
                    <button
                      onClick={() => {
                        setEditingMinutes(null);
                        setCouncilComments('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">Họ tên sinh viên</p>
                          <p className="font-medium text-gray-900">{getStudentName(reg.studentId)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">MSSV</p>
                          <p className="font-medium text-gray-900">{getMssv6Digits(reg.studentId)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-600">Tên đề tài</p>
                          <p className="font-medium text-gray-900">{reg.title}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Góp ý của Chủ tịch</label>
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">{chairmanComment}</div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Góp ý của Thành viên 1</label>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">{tv1Comment}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Góp ý của Thành viên 2</label>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">{tv2Comment}</div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Yêu cầu chỉnh sửa</label>
                      <textarea
                        value={councilComments}
                        onChange={(e) => setCouncilComments(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập yêu cầu chỉnh sửa cho sinh viên..."
                      />
                    </div>


                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={() => handleSaveMinutes(reg.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Lưu biên bản
                      </button>
                      <button
                        onClick={() => {
                          setEditingMinutes(null);
                          setCouncilComments('');
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
