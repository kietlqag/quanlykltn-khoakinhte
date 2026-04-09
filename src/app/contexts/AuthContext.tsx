import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../data/mockData';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

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
      quota: typeof quotaValue === 'number' ? quotaValue : undefined,
    };
  };

  // Keep login state scoped to the current browser tab.
  useEffect(() => {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', normalizedEmail),
        limit(1),
      );
      const snapshot = await getDocs(usersQuery);
      if (snapshot.empty) {
        return false;
      }

      const doc = snapshot.docs[0];
      const docData = doc.data();
      if (String(docData.password ?? '') !== password) {
        return false;
      }

      const loggedInUser = mapFirestoreUser(doc.id, docData);
      setUser(loggedInUser);
      sessionStorage.setItem('currentUser', JSON.stringify(loggedInUser));
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
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
