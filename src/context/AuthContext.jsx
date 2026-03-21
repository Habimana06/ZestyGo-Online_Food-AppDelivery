import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setSession = (token, nextUser = null) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    if (nextUser) setUser(nextUser);
  };

  const refreshMe = async () => {
    const me = await api.auth.me();
    setUser(me);
    return me;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.auth
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await api.auth.login(email, password);
    // If login requires OTP, do not set session token yet.
    if (data?.needsOtp) {
      localStorage.removeItem('token');
      setUser(null);
      return data;
    }
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const data = await api.auth.register(userData);
    if (data?.needsOtp) {
      localStorage.removeItem('token');
      setUser(null);
      return data;
    }
    // If account requires verification, do not log the user in yet.
    if (data?.user?.isApproved === false && (data?.user?.role === 'delivery' || data?.user?.role === 'restaurant')) {
      localStorage.removeItem('token');
      setUser(null);
      return data;
    }
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setSession, refreshMe, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
