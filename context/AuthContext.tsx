import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppUser, AuthSession } from '@/lib/types';
import { getSession, signIn as storeSignIn, signOut as storeSignOut, signUp as storeSignUp } from '@/lib/localStore';

interface AuthContextType {
  session: AuthSession | null;
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (input: { fullName: string; email: string; phone: string; password: string }) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(getSession());
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await storeSignIn(email, password);
    if (!error) {
      setSession(getSession());
    }
    return error ?? null;
  };

  const signUp = async (input: { fullName: string; email: string; phone: string; password: string }) => {
    const { error } = await storeSignUp(input);
    if (!error) {
      setSession(getSession());
    }
    return error ?? null;
  };

  const signOut = async () => {
    await storeSignOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
