import React, { createContext, useContext, useState } from "react";
import { useApiHost } from "./useApiHost";
import type { WorkDaysProps } from "../../@types/workpoint";

interface WorkpointInforContextType {
  workpointEl: WorkDaysProps | null;
  loading: boolean;
  error: Error | null;
  fetchWorkpointEl: (userId: string) => Promise<void>;
}

const WorkpointInforContext = createContext<WorkpointInforContextType | undefined>(undefined);

export const WorkpointInforProvider = ({ children }: { children: React.ReactNode }) => {
  const [workpointEl, setWorkpointEl] = useState<WorkDaysProps | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkpointEl = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
        
      const response = await fetch(`${useApiHost()}/workpoint/by_user/${userId}`);
      console.log('GHI', response);
      if (!response.ok) throw new Error("Không lấy được dữ liệu workpoint cho user");
      
      const data: WorkDaysProps = await response.json();
      setWorkpointEl(data);
    } catch (err) {
      setError(err as Error);
      setWorkpointEl(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <WorkpointInforContext.Provider value={{ workpointEl, loading, error, fetchWorkpointEl }}>
      {children}
    </WorkpointInforContext.Provider>
  );
};

export const useWorkpointInfor = (): WorkpointInforContextType => {
  const context = useContext(WorkpointInforContext);
  if (!context) {
    throw new Error("useWorkpointInfor must be used within a WorkpointInforProvider");
  }
  return context;
};
