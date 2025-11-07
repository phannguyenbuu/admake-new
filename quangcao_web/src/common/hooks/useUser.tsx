import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useApiHost } from './useApiHost';
import type { Role } from '../../@types/role.type';
import WebFont from 'webfontloader';
import { notification } from 'antd';
import type { WorkSpace } from '../../@types/work-space.type';

interface UserContextProps {
  userId: string | null;
  username: string | null;
  userRoleId: number;
  userRole: Role | null;
  userIcon: string | null;
  userLeadId: number;
  workspaces: WorkSpace[];
  isMobile: boolean;
  setUserRoleId: React.Dispatch<React.SetStateAction<number>>;
  setWorkspaces: React.Dispatch<React.SetStateAction<WorkSpace[]>>;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    WebFont.load({
      google: {
        families: ['Oswald','Poppins']
      }
    });
  }, []);

  const [workspaces, setWorkspaces] = useState<WorkSpace[]>([]);
  
  const [userLeadId, setUserLeadId] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [username, setUsername] = useState<string | null>(null);
  const [userRoleId, setUserRoleId] = useState<number>(0);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userIcon, setUserIcon] = useState<string | null>('images/avatar.png');
  const isLoggingOutRef = useRef(false);

  const API_HOST = useApiHost();
  const breakpoint = 786;
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth < breakpoint);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener("resize", handleResize);
    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  const login = async ({ username, password }: { username: string; password: string }) => {
    try {
      // console.log('LOGIN 1');
      const res = await fetch(`${API_HOST}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      // console.log('LOGIN 2');

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Login failed:', errorData);
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await res.json();
      // console.log('JWT:', data);

      if (!data.access_token) {
        throw new Error('No access token in response');
      }

      sessionStorage.setItem('accessToken', data.access_token);

      setUserId(data.id);
      setUsername(data.username);
      setUserRoleId(data.role_id);
      setUserRole(data.role);
      setUserIcon(data.icon ?? 'images/avatar.png');
      setUserLeadId(data.lead_id ?? null);

      // Sau khi đăng nhập thành công, bạn có thể redirect đến trang chính
      window.location.href = '/dashboard'; // hoặc route bạn muốn
    } catch (error) {
      notification.error({message:'Login error:', description: `${error}` || ''});
      // alert(error instanceof Error ? error.message : 'Login failed');
    }
  };


  const logout = async () => {
    if(window.location.href.endsWith('/login') 
      || window.location.href.includes('/chat/')
      || window.location.href.includes('/point/'))
    {
      sessionStorage.removeItem('accessToken');
      setUserId(null);
      setUsername(null);

      let roleId = -1;
      const href = window.location.href;
      
      if(href.includes('/chat/'))
      {
        const ls = href.split('/');
        if(ls.pop()?.startsWith('a'))
          roleId = 0;
      }

      console.log('roleId', roleId);
      setUserRoleId(roleId);

      setUserRole(null);
      setUserIcon(null);
      return;
    }

    try {
      const accessToken = sessionStorage.getItem('accessToken');
      await fetch(`${API_HOST}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken || ''}`,
        },
      });
    } catch (error) {
      console.error('Logout request failed', error);
    }
    sessionStorage.removeItem('accessToken');
    setUserId(null);
    setUsername(null);
    setUserRoleId(0);
    setUserRole(null);
    setUserIcon(null);
    setUserLeadId(0);

    isLoggingOutRef.current = false;
    window.location.href = '/login';
  };


  const checkAuthStatus = async () => {
    const accessToken = sessionStorage.getItem("accessToken");

    if (!accessToken) {
      if (!isLoggingOutRef.current) {
        // alert("Invalid access token!" + window.location.href);
        isLoggingOutRef.current = true;
        await logout();
      }
      return;
    }

    console.log("Sending token:", accessToken);


    try {
      const res = await fetch(`${API_HOST}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      

      if (res.ok) {
        const data = await res.json();
        console.log("Auth Status", data);
        setUserId(data.userId);
        setUsername(data.username);
        setUserRoleId(data.role_id ?? 0);
        setUserRole(data.role ?? null);
        setUserIcon(data.icon ?? 'images/avatar.png');
        setUserLeadId(data.lead_id ?? null);
      } else if (res.status === 401) {
        // Token hết hạn hoặc không hợp lệ, xóa token, chuyển về login
        console.warn("Access token expired or invalid, logging out.");
        await logout();
      } else {
        setUserId(null);
        setUsername(null);
        setUserRoleId(0);
        setUserRole(null);
        setUserIcon(null);
        setUserLeadId(0);
      }
    } catch (error) {
      console.error("Failed to check auth status:", error);
      logout();
    }
  };


  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <UserContext.Provider value={{ isMobile, userId, username, 
      userRoleId, setUserRoleId, userRole, userLeadId, workspaces, setWorkspaces,
      userIcon, login, logout, checkAuthStatus }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextProps => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
