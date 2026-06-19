'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange, isFirebaseConfigured, type User } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isGuest: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    return onAuthChange((u) => {
      setUser(u);
      // Check if user is a guest (Firebase not configured)
      setIsGuest(!isFirebaseConfigured());
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
