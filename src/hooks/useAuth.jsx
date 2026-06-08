import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';
const SESSION_KEY = 'sfm_admin_session';

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      const s = sessionStorage.getItem(SESSION_KEY);
      return s === 'true';
    } catch (_) { return false; }
  });
  const [error, setError] = useState('');

  const login = (password) => {
    if (ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setError('');
      try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch (_) {}
      return true;
    }
    setError('Incorrect password. Please try again.');
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    try { sessionStorage.removeItem(SESSION_KEY); } catch (_) {}
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
