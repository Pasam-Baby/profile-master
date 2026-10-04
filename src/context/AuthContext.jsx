import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const readStoredUser = () => {
  const storageUser = localStorage.getItem('profile_master_user');
  if (storageUser) {
    try {
      return JSON.parse(storageUser);
    } catch {
      return null;
    }
  }

  const userId = localStorage.getItem('user_id');
  const email = localStorage.getItem('email');
  if (userId && email) {
    return { id: Number(userId), email, name: email.split('@')[0] || 'User' };
  }

  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = readStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const nextUser = {
      id: userData.user_id,
      email: userData.email,
      name: userData.name || userData.email?.split('@')[0] || 'User',
      role: userData.role || '',
      experience: userData.experience || '',
    };

    localStorage.setItem('user_id', String(userData.user_id));
    localStorage.setItem('email', userData.email);
    localStorage.setItem('profile_master_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('email');
    localStorage.removeItem('profile_master_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const fetchWithAuth = async (url, options = {}) => {
  const userId = localStorage.getItem('user_id');
  const headers = {
    ...options.headers,
    Authorization: userId || '',
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem('user_id');
    localStorage.removeItem('email');
    localStorage.removeItem('profile_master_user');
    window.location.href = '/login';
  }
  return response;
};
