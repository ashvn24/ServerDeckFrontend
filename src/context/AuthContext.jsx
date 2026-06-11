import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, usersAPI } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isPlatformOwner, setIsPlatformOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('serverdeck_token');
    localStorage.removeItem('serverdeck_user');
    localStorage.removeItem('serverdeck_is_platform_owner');
    setUser(null);
    setIsPlatformOwner(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('serverdeck_token');
    const savedUser = localStorage.getItem('serverdeck_user');
    const savedIsPlatformOwner = localStorage.getItem('serverdeck_is_platform_owner');
    
    if (token) {
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setIsPlatformOwner(savedIsPlatformOwner === 'true');
        } catch {
          // ignore parsing error
        }
      }
      
      const fetchProfile = async () => {
        try {
          if (savedIsPlatformOwner === 'true') {
            setLoading(false);
            return;
          }
          const res = await usersAPI.me();
          localStorage.setItem('serverdeck_user', JSON.stringify(res.data));
          setUser(res.data);
        } catch (err) {
          console.error("Failed to sync profile:", err);
          if (err.response?.status === 401) {
            logout();
          }
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { access_token, user: userData, is_platform_owner } = res.data;
    localStorage.setItem('serverdeck_token', access_token);
    localStorage.setItem('serverdeck_user', JSON.stringify(userData));
    localStorage.setItem('serverdeck_is_platform_owner', String(!!is_platform_owner));
    setUser(userData);
    setIsPlatformOwner(!!is_platform_owner);
    return userData;
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    const { access_token, user: userData, is_platform_owner } = res.data;
    localStorage.setItem('serverdeck_token', access_token);
    localStorage.setItem('serverdeck_user', JSON.stringify(userData));
    localStorage.setItem('serverdeck_is_platform_owner', String(!!is_platform_owner));
    setUser(userData);
    setIsPlatformOwner(!!is_platform_owner);
    return userData;
  };



  return (
    <AuthContext.Provider value={{ user, isPlatformOwner, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
