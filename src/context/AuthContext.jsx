import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as auth from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false); // false until Supabase has restored the session

  useEffect(() => {
    let active = true;
    const unsubscribe = auth.onAuthChange((s) => {
      if (!active) return;
      setSession(s);
      setReady(true);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (input) => {
    const s = await auth.login(input);
    setSession(s);
    return s;
  }, []);

  const signup = useCallback(async (input) => {
    const s = await auth.signup(input);
    setSession(s);
    return s;
  }, []);

  const logout = useCallback(async () => {
    await auth.logout();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isAdmin: session?.role === 'admin',
      isCandidate: session?.role === 'candidate',
      login,
      signup,
      logout,
    }),
    [session, login, signup, logout],
  );

  // Routes ko tab tak mat dikhao jab tak session load na ho, warna refresh par login redirect ho jayega
  if (!ready) {
    return <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>Loading…</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
