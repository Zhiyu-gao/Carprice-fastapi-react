import React, { createContext, useContext, useMemo, useState } from 'react';

import { UserMe, getMe, login } from '@/lib/api';

type AuthState = {
  token: string | null;
  me: UserMe | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  refreshMe: () => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await login(email, password);
      setToken(res.access_token);
      try {
        const profile = await getMe(res.access_token);
        setMe(profile);
      } catch (e: any) {
        // 登录已成功，/me 失败时保留 token 并给出明确错误
        setError(`登录成功，但获取用户信息失败: ${e?.message || 'unknown error'}`);
      }
      return true;
    } catch (e: any) {
      setError(`登录失败: ${e?.message || 'unknown error'}`);
      setToken(null);
      setMe(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshMe = async () => {
    if (!token) return;
    try {
      const profile = await getMe(token);
      setMe(profile);
    } catch (e: any) {
      setError(e?.message || '获取用户失败');
    }
  };

  const signOut = () => {
    setToken(null);
    setMe(null);
    setError(null);
  };

  const value = useMemo(
    () => ({ token, me, loading, error, signIn, refreshMe, signOut }),
    [token, me, loading, error]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
