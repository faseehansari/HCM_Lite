import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { authService } from '../services/endpoints';
import { clearSession } from '../services/api';

const AuthContext = createContext(null);

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [role, setRole] = useState(() => localStorage.getItem('role'));
  const [user, setUser] = useState(readUser);

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login({ email, password });
    const payload = data?.data || data;
    const jwt = payload?.token || payload?.accessToken;
    const u = payload?.user || payload?.employee || null;
    const r = (u?.role || payload?.role || 'employee').toLowerCase();
    if (!jwt) throw new Error('Login response did not include a token.');

    localStorage.setItem('token', jwt);
    localStorage.setItem('role', r);
    if (u) localStorage.setItem('user', JSON.stringify(u));
    setToken(jwt);
    setRole(r);
    setUser(u);
    return r;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setRole(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      role,
      user,
      isAuthenticated: !!token,
      isPrivileged: role === 'admin' || role === 'hr',
      login,
      logout,
    }),
    [token, role, user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
