'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthChange, isFirebaseConfigured, type User } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  enterGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isGuest: false, enterGuestMode: () => {} });

const GUEST_KEY = 'mf-guest-mode';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const enterGuestMode = useCallback(() => {
    const guestUser = {
      uid: 'guest-' + Math.random().toString(36).slice(2, 10),
      email: 'guest@demo.local',
      displayName: 'אורח',
      photoURL: null,
      isGuest: true,
      getIdToken: async () => '',
    } as unknown as User;
    if (typeof window !== 'undefined') localStorage.setItem(GUEST_KEY, '1');
    setUser(guestUser);
    setIsGuest(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(GUEST_KEY) === '1') {
      enterGuestMode();
      return;
    }

    if (!isFirebaseConfigured()) {
      enterGuestMode();
      return;
    }

    return onAuthChange((u) => {
      setUser(u);
      setIsGuest(!isFirebaseConfigured());
      setLoading(false);
    });
  }, [enterGuestMode]);

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, enterGuestMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
