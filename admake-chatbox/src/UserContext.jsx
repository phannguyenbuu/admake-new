import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [username, setUsername] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [userIcon, setUserIcon] = useState('images/avatar.png');
  const [loading, setLoading] = useState(true);

  // Kiểm tra trạng thái đăng nhập khi app load
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/auth/status`)
      .then(res => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then(data => {
        setUserId(data.userId);
        setUsername(data.username);
        setUserRole(data.role);
        setUserIcon(data.icon);
        setLoading(false);
      })
      .catch(() => {
        setUserId(null);
        setUsername(null);
        setUserRole(null);
        setUserIcon(null);
        setLoading(false);
      });
  }, []);

  const login = async (credentials) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    setUserId(data.userId); // cập nhật userId khi đăng nhập thành công
    setUsername(data.username); // cập nhật userId khi đăng nhập thành công
    setUserRole(data.role);
    setUserIcon(data.icon);
  };

  const logout = async () => {
    await fetch(`${process.env.REACT_APP_API_URL}/api/auth/logout`, { method: 'POST' });
    setUserId(null);
    setUsername(null);
    setUserRole(null);
    setUserIcon(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <UserContext.Provider value={{ userId, username, userRole,userIcon, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
