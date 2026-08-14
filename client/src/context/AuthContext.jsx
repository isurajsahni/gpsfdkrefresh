import { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    let parsed = null;
    if (stored) {
      try { parsed = JSON.parse(stored); } catch { parsed = null; }
      if (parsed) setUser(parsed);
    }
    setLoading(false);

    // Refresh role/profile from the server on load. A user's role is changed
    // admin-side (PUT /auth/users/:id/role) and the JWT only carries the user
    // id — the role is NOT in the token — so a role change would otherwise not
    // reach the person's browser until they manually log out and back in. That
    // left, e.g., a demoted admin still seeing the "Admin Panel" nav link from
    // their stale localStorage copy. Re-fetch /auth/me and merge, preserving the
    // token (getMe doesn't return one). Silent + best-effort: offline or a
    // transient error just keeps the cached user.
    if (parsed?.token) {
      API.get('/auth/me', { silent: true })
        .then(({ data }) => {
          if (data && data._id) {
            const merged = { ...parsed, ...data, token: parsed.token };
            localStorage.setItem('user', JSON.stringify(merged));
            setUser(merged);
          }
        })
        .catch(() => { /* keep cached user on network/transient failure */ });
    }
  }, []);

  // Sync React state when the API layer detects a 401 and clears localStorage.
  // Without this, ProtectedRoute would still see the stale user and the app
  // would keep firing failing requests instead of redirecting cleanly.
  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (name, email, password, phone) => {
    const { data } = await API.post('/auth/register', { name, email, password, phone });
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
