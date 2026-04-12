import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ThesisRegistration,
  Council,
  User,
} from '../data/mockData';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  deleteDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface DataContextType {
  thesisRegistrations: ThesisRegistration[];
  councils: Council[];
  users: User[];
  addThesisRegistration: (registration: ThesisRegistration) => void;
  updateThesisRegistration: (id: string, updates: Partial<ThesisRegistration>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  addCouncil: (council: Council) => void;
  updateCouncil: (id: string, updates: Partial<Council>) => void;
  deleteCouncil: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [thesisRegistrations, setThesisRegistrations] = useState<ThesisRegistration[]>([]);
  const [councils, setCouncils] = useState<Council[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const normalizeRole = (role: string): User['role'] => {
      const normalized = String(role || '').trim().toUpperCase();
      if (normalized === 'SV' || normalized === 'STUDENT') return 'SV';
      if (normalized === 'GV' || normalized === 'LECTURER') return 'GV';
      if (normalized === 'TBM') return 'TBM';
      return 'SV';
    };

    const mapStatus = (value: string): ThesisRegistration['status'] => {
      const raw = String(value || '').trim().toLowerCase();
      if (!raw) return 'pending';
      if (
        raw.includes('không') ||
        raw.includes('tu choi') ||
        raw.includes('rejected') ||
        raw.includes('reject')
      ) {
        return 'advisor_rejected';
      }
      if (raw.includes('cho') && raw.includes('duyet')) return 'pending';
      if (
        raw.includes('duyet') ||
        raw.includes('đồng ý') ||
        raw.includes('dong y') ||
        raw.includes('approved') ||
        raw === 'yes'
      ) {
        return 'advisor_approved';
      }
      if (raw.includes('cham') || raw.includes('graded') || raw.includes('diem')) return 'graded';
      if (raw.includes('bao ve') || raw.includes('defended') || raw.includes('hoi dong')) return 'defended';
      if (raw.includes('hoan thanh') || raw.includes('completed') || raw === 'pass') return 'completed';
      if (raw.includes('revision') || raw.includes('chinh sua')) return 'revision_pending';
      if (
        raw.includes('submitted') ||
        raw.includes('da nop') ||
        raw.includes('ná»™p') ||
        raw.includes('nop')
      )
        return 'submitted';
      return 'pending';
    };

    const mapLoaiDetai = (value: string): 'BCTT' | 'KLTN' =>
      String(value || '').trim().toUpperCase().includes('KLTN') ? 'KLTN' : 'BCTT';

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const mappedUsers: User[] = snapshot.docs.map((d) => {
        const data = d.data();
        const major = String(data.major || '').trim();
        const heDaoTao = String(data.heDaoTao || data.hedaotao || '').trim();
        return {
          id: d.id,
          username: String(data.email || '').trim().toLowerCase(),
          password: String(data.password || ''),
          role: normalizeRole(String(data.role || 'SV')),
          fullName: String(data.name || '').trim(),
          email: String(data.email || '').trim().toLowerCase(),
          faculty: String(data.faculty || '').trim() || undefined,
          expertise: major ? [major] : [],
          heDaoTao: heDaoTao || undefined,
          quota: typeof data.quota === 'number' ? data.quota : undefined,
        };
      });

      setUsers(mappedUsers);
    });

    const unsubscribeCouncils = onSnapshot(collection(db, 'councils'), (snapshot) => {
      const mappedCouncils: Council[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: String(data.name || ''),
          chairmanId: String(data.chairmanId || ''),
          secretaryId: String(data.secretaryId || ''),
          members: Array.isArray(data.members) ? data.members.map(String) : [],
          period: String(data.period || ''),
          location: String(data.location || '') || undefined,
          time: String(data.time || '') || undefined,
          isFinished: Boolean(data.isFinished),
        };
      });
      setCouncils(mappedCouncils);
    });

    const unsubscribeRegistrations = onSnapshot(
      query(collection(db, 'thesis_registrations'), orderBy('period')),
      (snapshot) => {
        const mapped: ThesisRegistration[] = snapshot.docs.map((d) => {
          const data = d.data();
          const createdAtRaw = data.createdAt as { toDate?: () => Date } | undefined;
          const registeredAt =
            String(data.registeredAt || '').trim() ||
            (createdAtRaw?.toDate ? createdAtRaw.toDate().toISOString().split('T')[0] : '');
          return {
            id: d.id,
            studentId: String(data.studentId || ''),
            type: mapLoaiDetai(String(data.type || data.loaiDeTai || 'BCTT')),
            title: String(data.title || ''),
            registeredAt: registeredAt || undefined,
            companyName: String(data.companyName || '') || undefined,
            field: String(data.field || ''),
            advisorId: String(data.advisorId || ''),
            reviewerId: String(data.reviewerId || '') || undefined,
            councilId: String(data.councilId || '') || undefined,
            period: String(data.period || ''),
            status: mapStatus(String(data.status || 'pending')),
            submittedAt: String(data.submittedAt || '') || undefined,
            pdfUrl: String(data.pdfUrl || '') || undefined,
            internshipCertUrl: String(data.internshipCertUrl || '') || undefined,
            turnitinUrl: String(data.turnitinUrl || '') || undefined,
            advisorScore: typeof data.advisorScore === 'number' ? data.advisorScore : undefined,
            reviewerScore: typeof data.reviewerScore === 'number' ? data.reviewerScore : undefined,
            councilScore: typeof data.councilScore === 'number' ? data.councilScore : undefined,
            chairmanScore: typeof data.chairmanScore === 'number' ? data.chairmanScore : undefined,
            chairmanCriteriaScores:
              data.chairmanCriteriaScores && typeof data.chairmanCriteriaScores === 'object'
                ? (data.chairmanCriteriaScores as Record<string, number>)
                : undefined,
            councilMemberScores:
              data.councilMemberScores && typeof data.councilMemberScores === 'object'
                ? (data.councilMemberScores as Record<string, number>)
                : undefined,
            councilMemberCriteriaScores:
              data.councilMemberCriteriaScores && typeof data.councilMemberCriteriaScores === 'object'
                ? (data.councilMemberCriteriaScores as Record<string, Record<string, number>>)
                : undefined,
            finalScore: typeof data.finalScore === 'number' ? data.finalScore : undefined,
            scoreLocked: typeof data.scoreLocked === 'boolean' ? data.scoreLocked : undefined,
            defenseDate: String(data.defenseDate || '') || undefined,
            defenseLocation: String(data.defenseLocation || '') || undefined,
            councilMinutesUrl: String(data.councilMinutesUrl || '') || undefined,
            revisedPdfUrl: String(data.revisedPdfUrl || '') || undefined,
            revisionExplanationUrl: String(data.revisionExplanationUrl || '') || undefined,
            advisorApprovalRevision:
              typeof data.advisorApprovalRevision === 'boolean'
                ? data.advisorApprovalRevision
                : undefined,
            chairmanApprovalRevision:
              typeof data.chairmanApprovalRevision === 'boolean'
                ? data.chairmanApprovalRevision
                : undefined,
            advisorComments: String(data.advisorComments || '') || undefined,
            reviewerComments: String(data.reviewerComments || '') || undefined,
            councilComments: String(data.councilComments || '') || undefined,
            chairmanComments: String(data.chairmanComments || '') || undefined,
            chairmanPostRevisionComment: String(data.chairmanPostRevisionComment || '') || undefined,
            councilMemberComments:
              data.councilMemberComments && typeof data.councilMemberComments === 'object'
                ? Object.fromEntries(
                    Object.entries(data.councilMemberComments as Record<string, unknown>).map(([k, v]) => [k, String(v || '')]),
                  )
                : undefined,
            submissionDeadline: String(data.submissionDeadline || '') || undefined,
            advisorCriteriaScores:
              data.advisorCriteriaScores && typeof data.advisorCriteriaScores === 'object'
                ? (data.advisorCriteriaScores as Record<string, number>)
                : undefined,
            reviewerCriteriaScores:
              data.reviewerCriteriaScores && typeof data.reviewerCriteriaScores === 'object'
                ? (data.reviewerCriteriaScores as Record<string, number>)
                : undefined,
            councilCriteriaScores:
              data.councilCriteriaScores && typeof data.councilCriteriaScores === 'object'
                ? (data.councilCriteriaScores as Record<string, number>)
                : undefined,
          };
        });

        setThesisRegistrations(mapped);
      },
    );

    const bootstrapFromImportedCollections = async () => {
      try {
        const existingRegs = await getDocs(query(collection(db, 'thesis_registrations'), limit(1)));
        if (!existingRegs.empty) return;

        const [usersSnap, topicsSnap, statusSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'tendetai')),
          getDocs(collection(db, 'trangthaidetai')),
        ]);

        if (topicsSnap.empty) return;

        const emailToUserId = new Map<string, string>();
        usersSnap.docs.forEach((d) => {
          const email = String(d.data().email || '').trim().toLowerCase();
          if (email) emailToUserId.set(email, d.id);
        });

        const statusByStudentAndType = new Map<string, Record<string, unknown>>();
        statusSnap.docs.forEach((d) => {
          const data = d.data();
          const emailSV = String(data.emailsv || '').trim().toLowerCase();
          const loai = mapLoaiDetai(String(data.loaidetai || 'BCTT'));
          if (emailSV) {
            statusByStudentAndType.set(`${emailSV}__${loai}`, data);
          }
        });

        for (const topicDoc of topicsSnap.docs) {
          const data = topicDoc.data();
          const emailSV = String(data.emailsv || '').trim().toLowerCase();
          const loai = mapLoaiDetai(String(data.loaidetai || 'BCTT'));
          const statusData = statusByStudentAndType.get(`${emailSV}__${loai}`) || {};
          const studentId = emailToUserId.get(emailSV) || emailSV;
          const advisorId = emailToUserId.get(String(statusData.emailgv || '').trim().toLowerCase()) || '';

          await setDoc(
            doc(db, 'thesis_registrations', topicDoc.id),
            {
              studentId,
              type: loai,
              title: String(data.tendetai || ''),
              field: String(data.field || ''),
              advisorId,
              period: String(data.dothk || ''),
              status: mapStatus(
                String(
                  statusData.trangthaiduyet ||
                    statusData.trangthai ||
                    statusData.status ||
                    'pending',
                ),
              ),
              pdfUrl: String(data.linkbai || '') || null,
              internshipCertUrl: String(data.linkxacnhan || '') || null,
              submissionDeadline: String(statusData.end || '') || null,
              advisorScore:
                typeof statusData.diem === 'number' ? Number(statusData.diem) : null,
              reviewerScore:
                typeof statusData.diempb === 'number' ? Number(statusData.diempb) : null,
              councilScore:
                typeof statusData.diemhd === 'number' ? Number(statusData.diemhd) : null,
              finalScore:
                typeof statusData.diemtb === 'number' ? Number(statusData.diemtb) : null,
              defenseDate: String(statusData.ngayhd || '') || null,
              defenseLocation: String(statusData.diadiem || '') || null,
              councilMinutesUrl: String(statusData.linkbb || '') || null,
              advisorApprovalRevision:
                typeof statusData.gvhdok === 'boolean'
                  ? statusData.gvhdok
                  : ['true', '1', 'yes', 'y'].includes(
                      String(statusData.gvhdok || '').trim().toLowerCase(),
                    )
                    ? true
                    : null,
              chairmanApprovalRevision:
                typeof statusData.cthdok === 'boolean'
                  ? statusData.cthdok
                  : ['true', '1', 'yes', 'y'].includes(
                      String(statusData.cthdok || '').trim().toLowerCase(),
                    )
                    ? true
                    : null,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
        }
      } catch (error) {
        console.error('Bootstrap thesis registrations failed:', error);
      }
    };

    void bootstrapFromImportedCollections();

    return () => {
      unsubscribeUsers();
      unsubscribeCouncils();
      unsubscribeRegistrations();
    };
  }, []);

  const addThesisRegistration = (registration: ThesisRegistration) => {
    const advisorEmailCandidate = registration.advisorId.includes('@')
      ? registration.advisorId.toLowerCase()
      : (users.find((u) => u.id === registration.advisorId)?.email || '').toLowerCase();

    void (async () => {
      try {
        await runTransaction(db, async (tx) => {
          const regCollection = collection(db, 'thesis_registrations');
          const existedRegQuery = query(
            regCollection,
            where('studentId', '==', registration.studentId),
            where('type', '==', registration.type),
            limit(1),
          );
          const existedReg = await getDocs(existedRegQuery);
          if (!existedReg.empty) {
            throw new Error(`Bạn đã đăng ký ${registration.type} rồi.`);
          }

          if (registration.type === 'KLTN') {
            const bcttQuery = query(
              regCollection,
              where('studentId', '==', registration.studentId),
              where('type', '==', 'BCTT'),
              where('status', '==', 'completed'),
              limit(1),
            );
            const bcttDone = await getDocs(bcttQuery);
            if (bcttDone.empty) {
              throw new Error('Bạn cần hoàn thành BCTT trước khi đăng ký KLTN.');
            }
          }
          const quotaSnap = await getDocs(collection(db, 'quota'));
          const quotaDoc = quotaSnap.docs.find((docSnap) => {
            const quotaData = docSnap.data();
            const email = String(
              quotaData.emailGV || quotaData.emailgv || quotaData.email || '',
            )
              .trim()
              .toLowerCase();
            return email === advisorEmailCandidate;
          });
          if (quotaDoc) {
            const quotaData = quotaDoc.data();
            const approved = Boolean(quotaData.approved);
            const hasApprovedFlag = quotaData.approved !== undefined && quotaData.approved !== null;
            const available = Number(quotaData.available ?? NaN);
            const usedSlot = Number(quotaData.usedSlot ?? quotaData.usedslot ?? 0);
            const maxSlot = Number(quotaData.maxSlot ?? quotaData.maxslot ?? quotaData.quota ?? 0);
            if (hasApprovedFlag && !approved) {
              throw new Error('Gi?ng vi?n ch?a ???c TBM m? slot cho ??t n?y.');
            }
            if (Number.isFinite(available)) {
              if (available <= 0) {
                throw new Error('Gi?ng vi?n ?? h?t slot h??ng d?n cho ??t n?y.');
              }
              tx.update(quotaDoc.ref, {
                available: available - 1,
                usedSlot: usedSlot + 1,
                updatedAt: serverTimestamp(),
              });
            } else if (maxSlot > 0) {
              const advisorRegQuery = query(
                regCollection,
                where('advisorId', '==', registration.advisorId),
                where('period', '==', registration.period),
              );
              const advisorRegSnap = await getDocs(advisorRegQuery);
              const usedCount = advisorRegSnap.docs.filter(
                (docSnap) => String(docSnap.data().status || '') !== 'advisor_rejected',
              ).length;
              if (usedCount >= maxSlot) {
                throw new Error('Gi?ng vi?n ?? h?t slot h??ng d?n cho ??t n?y.');
              }
            }
          }

          const regRef = doc(collection(db, 'thesis_registrations'));
          const cleanRegistration = Object.fromEntries(
            Object.entries(registration).filter(([, value]) => value !== undefined),
          );

          tx.set(regRef, {
            ...cleanRegistration,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          const topicRef = doc(collection(db, 'tendetai'));
          tx.set(topicRef, {
            emailSV: registration.studentId,
            tendetai: registration.title,
            dothk: registration.period,
            loaidetai: registration.type,
            version: 'v1',
            linkbai: '',
            linkxacnhan: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          const statusRef = doc(collection(db, 'trangthaidetai'));
          tx.set(statusRef, {
            emailSV: registration.studentId,
            emailGV: registration.advisorId,
            role: 'SV',
            trangthaiduyet: 'pending',
            loaidetai: registration.type,
            end: registration.submissionDeadline || null,
            gvhdok: false,
            cthdok: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
      } catch (error) {
        console.error('Add thesis registration failed:', error);
        if (error instanceof Error) {
          alert(error.message);
        }
      }
    })();
  };

  const updateThesisRegistration = (id: string, updates: Partial<ThesisRegistration>) => {
    void (async () => {
      try {
        await runTransaction(db, async (tx) => {
          const ref = doc(db, 'thesis_registrations', id);
          const snap = await tx.get(ref);
          if (!snap.exists()) {
            throw new Error('Không tìm thấy hồ sơ đăng ký.');
          }
          const current = snap.data() as ThesisRegistration;
          if (
            updates.chairmanApprovalRevision === true &&
            updates.advisorApprovalRevision !== true &&
            current.advisorApprovalRevision !== true
          ) {
            throw new Error('Chủ tịch chỉ được duyệt sau khi GVHD đã duyệt.');
          }

          tx.update(ref, {
            ...updates,
            updatedAt: serverTimestamp(),
          });

          const titleOrTypeChanged = updates.title || updates.type || updates.period;
          if (titleOrTypeChanged) {
            const topicQuery = query(
              collection(db, 'tendetai'),
              where('emailSV', '==', current.studentId),
              where('loaidetai', '==', current.type),
              limit(1),
            );
            const topicSnap = await getDocs(topicQuery);
            if (!topicSnap.empty) {
              tx.update(topicSnap.docs[0].ref, {
                tendetai: updates.title ?? current.title,
                loaidetai: updates.type ?? current.type,
                dothk: updates.period ?? current.period,
                updatedAt: serverTimestamp(),
              });
            }
          }

          const mirroredTopicUpdates: Record<string, unknown> = {};
          if (typeof updates.pdfUrl === 'string') mirroredTopicUpdates.linkbai = updates.pdfUrl;
          if (typeof updates.internshipCertUrl === 'string')
            mirroredTopicUpdates.linkxacnhan = updates.internshipCertUrl;

          if (Object.keys(mirroredTopicUpdates).length > 0) {
            const topicQuery = query(
              collection(db, 'tendetai'),
              where('emailSV', '==', current.studentId),
              where('loaidetai', '==', current.type),
              limit(1),
            );
            const topicSnap = await getDocs(topicQuery);
            if (!topicSnap.empty) {
              tx.update(topicSnap.docs[0].ref, {
                ...mirroredTopicUpdates,
                updatedAt: serverTimestamp(),
              });
            }
          }
        });
      } catch (error) {
        console.error('Update thesis registration failed:', error);
        if (error instanceof Error) {
          alert(error.message);
        }
      }
    })();
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    const payload: Record<string, unknown> = {};
    if (typeof updates.fullName === 'string') payload.name = updates.fullName;
    if (typeof updates.email === 'string') payload.email = updates.email;
    if (typeof updates.faculty === 'string') payload.faculty = updates.faculty;
    if (typeof updates.heDaoTao === 'string') payload.heDaoTao = updates.heDaoTao;
    if (Array.isArray(updates.expertise)) payload.expertise = updates.expertise;
    if (typeof updates.quota === 'number') payload.quota = updates.quota;
    payload.updatedAt = serverTimestamp();

    void updateDoc(doc(db, 'users', id), payload).catch((error) =>
      console.error('Update user failed:', error),
    );

    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
      const parsed = JSON.parse(currentUser);
      if (parsed.id === id) {
        sessionStorage.setItem('currentUser', JSON.stringify({ ...parsed, ...updates }));
      }
    }
  };

  const addCouncil = (council: Council) => {
    void setDoc(doc(db, 'councils', council.id), {
      ...council,
      isFinished: Boolean(council.isFinished),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch((error) => console.error('Add council failed:', error));
  };

  const updateCouncil = (id: string, updates: Partial<Council>) => {
    void updateDoc(doc(db, 'councils', id), {
      ...updates,
      updatedAt: serverTimestamp(),
    }).catch((error) => console.error('Update council failed:', error));
  };

  const deleteCouncil = (id: string) => {
    void deleteDoc(doc(db, 'councils', id)).catch((error) =>
      console.error('Delete council failed:', error),
    );
  };

  return (
    <DataContext.Provider
      value={{
        thesisRegistrations,
        councils,
        users,
        addThesisRegistration,
        updateThesisRegistration,
        updateUser,
        addCouncil,
        updateCouncil,
        deleteCouncil,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

