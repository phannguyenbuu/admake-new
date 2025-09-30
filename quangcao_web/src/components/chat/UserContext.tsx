import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useApiHost } from '../../common/hooks/useApiHost';

interface UserContextProps {
  userId: string | null;
  username: string | null;
  userRole: string | null;
  userIcon: string | null;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>('user');
  const [userIcon, setUserIcon] = useState<string | null>('images/avatar.png');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(`${useApiHost()}/api/auth/status`)
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

  const login = async (credentials: any) => {
    const res = await fetch(`${useApiHost()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    setUserId(data.userId);
    setUsername(data.username);
    setUserRole(data.role);
    setUserIcon(data.icon);
  };

  const logout = async () => {
    await fetch(`${useApiHost()}/api/auth/logout`, { method: 'POST' });
    setUserId(null);
    setUsername(null);
    setUserRole(null);
    setUserIcon(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <UserContext.Provider value={{ userId, username, userRole, userIcon, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextProps => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
