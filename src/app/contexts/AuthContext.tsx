import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../data/mockData';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

type LoginResult = {
  success: boolean;
  message?: string;
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const normalizeRole = (role: string): User['role'] => {
    if (role === 'SV' || role.toLowerCase() === 'student') return 'SV';
    if (role === 'GV' || role.toLowerCase() === 'lecturer') return 'GV';
    if (role === 'TBM') return 'TBM';
    return 'SV';
  };

  const mapFirestoreUser = (id: string, data: Record<string, unknown>): User => {
    const email = String(data.email ?? '').trim().toLowerCase();
    const fullName = String(data.name ?? data.ten ?? '').trim();
    const faculty = String(data.faculty ?? data.khoa ?? '').trim();
    const major = String(data.major ?? '').trim();
    const heDaoTao = String(data.heDaoTao ?? data.hedaotao ?? '').trim();
    const role = normalizeRole(String(data.role ?? 'SV'));
    const quotaValue = data.quota;

    return {
      id,
      username: email,
      password: String(data.password ?? ''),
      role,
      fullName,
      email,
      faculty: faculty || undefined,
      expertise: major ? [major] : [],
      heDaoTao: heDaoTao || undefined,
      quota: typeof quotaValue === 'number' ? quotaValue : undefined,
    };
  };

  const loadAppUserByEmail = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const usersQuery = query(collection(db, 'users'), where('email', '==', normalizedEmail), limit(1));
    const snapshot = await getDocs(usersQuery);
    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    return mapFirestoreUser(docSnap.id, docSnap.data());
  };

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('currentUser');
      if (!storedUser) {
        setUser(null);
      } else {
        const parsed = JSON.parse(storedUser) as User;
        setUser(parsed);
      }
    } catch (error) {
      console.error('Restore local session failed:', error);
      setUser(null);
      sessionStorage.removeItem('currentUser');
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      let appUser: User | null = null;
      try {
        appUser = await loadAppUserByEmail(normalizedEmail);
      } catch (error) {
        console.error('Load app user failed:', error);
        return { success: false, message: 'Không đọc được dữ liệu users. Kiểm tra Firestore rules.' };
      }

      if (!appUser) {
        return { success: false, message: 'Không tìm thấy email trong collection users.' };
      }

      if (appUser.password !== password) {
        return { success: false, message: 'Mật khẩu không đúng.' };
      }

      setUser(appUser);
      sessionStorage.setItem('currentUser', JSON.stringify(appUser));
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: 'Đăng nhập thất bại do lỗi không xác định.' };
    }
  };

  const logout = async () => {
    try {
      // Keep signature async for existing callers.
    } finally {
      setUser(null);
      sessionStorage.removeItem('currentUser');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isAuthReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
