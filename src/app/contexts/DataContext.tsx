import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  mockThesisRegistrations,
  mockCouncils,
  mockUsers,
  ThesisRegistration,
  Council,
  User,
} from '../data/mockData';

interface DataContextType {
  thesisRegistrations: ThesisRegistration[];
  councils: Council[];
  users: User[];
  addThesisRegistration: (registration: ThesisRegistration) => void;
  updateThesisRegistration: (id: string, updates: Partial<ThesisRegistration>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  addCouncil: (council: Council) => void;
  updateCouncil: (id: string, updates: Partial<Council>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [thesisRegistrations, setThesisRegistrations] = useState<ThesisRegistration[]>([]);
  const [councils, setCouncils] = useState<Council[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Load data from localStorage or use mock data
  useEffect(() => {
    const savedRegistrations = localStorage.getItem('thesisRegistrations');
    const savedCouncils = localStorage.getItem('councils');
    const savedUsers = localStorage.getItem('users');

    if (savedRegistrations) {
      setThesisRegistrations(JSON.parse(savedRegistrations));
    } else {
      setThesisRegistrations(mockThesisRegistrations);
    }

    if (savedCouncils) {
      setCouncils(JSON.parse(savedCouncils));
    } else {
      setCouncils(mockCouncils);
    }

    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      setUsers(mockUsers);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (thesisRegistrations.length > 0) {
      localStorage.setItem('thesisRegistrations', JSON.stringify(thesisRegistrations));
    }
  }, [thesisRegistrations]);

  useEffect(() => {
    if (councils.length > 0) {
      localStorage.setItem('councils', JSON.stringify(councils));
    }
  }, [councils]);

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('users', JSON.stringify(users));
    }
  }, [users]);

  const addThesisRegistration = (registration: ThesisRegistration) => {
    setThesisRegistrations((prev) => [...prev, registration]);
  };

  const updateThesisRegistration = (id: string, updates: Partial<ThesisRegistration>) => {
    setThesisRegistrations((prev) =>
      prev.map((reg) => (reg.id === id ? { ...reg, ...updates } : reg))
    );
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...updates } : user))
    );
    
    // Update current user in localStorage if it's the same user
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const parsed = JSON.parse(currentUser);
      if (parsed.id === id) {
        localStorage.setItem('currentUser', JSON.stringify({ ...parsed, ...updates }));
      }
    }
  };

  const addCouncil = (council: Council) => {
    setCouncils((prev) => [...prev, council]);
  };

  const updateCouncil = (id: string, updates: Partial<Council>) => {
    setCouncils((prev) =>
      prev.map((council) => (council.id === id ? { ...council, ...updates } : council))
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
