import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { getToken, setToken } from '../api/client';

const USER_KEY = 'vorynza_user';
const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      localStorage.removeItem(USER_KEY);
      setUser(null);
    }
  }, [token]);

  const persistSession = (nextToken, nextUser) => {
    setToken(nextToken);
    setTokenState(nextToken);
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Drop any stale token so login/register never send a bad Bearer header
      setToken(null);
      setTokenState(null);
      const res = await authApi.login(email, password);
      persistSession(res.data.token, res.data.user);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const res = await authApi.register(payload);
      persistSession(res.data.token, res.data.user);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // clear local session even if API call fails
    }
    persistSession(null, null);
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    }
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
      updateUser,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
