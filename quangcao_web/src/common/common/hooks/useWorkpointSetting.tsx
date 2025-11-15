import React, { createContext, useContext, useState, useEffect } from "react";
import { notification } from "antd";
import { useApiHost } from "./useApiHost";
import { useUser } from "./useUser";
// import { useLocation } from "react-router-dom";
import { useParams } from 'react-router-dom';

interface DefaultState {
  morning_in_hour: number;
  morning_in_minute: number;
  morning_out_hour: number;
  morning_out_minute: number;
  noon_in_hour: number;
  noon_in_minute: number;
  noon_out_hour: number;
  noon_out_minute: number;
  work_in_saturday_noon: boolean;
  multiply_in_night_overtime: number;
  multiply_in_sun_overtime: number;
  [key: string]: number | boolean;
}

interface WorkpointSettingContextType {
  workpointSetting: DefaultState | null;
  setWorkpointSetting: React.Dispatch<React.SetStateAction<DefaultState | null>>;
  reloadWorkpointSetting: () => void;
  loading: boolean;
  error: string | null;
}

const WorkpointSettingContext = createContext<WorkpointSettingContextType | undefined>(undefined);

export const WorkpointSettingProvider = ({ children }: {children: React.ReactNode}) => {
  const [workpointSetting, setWorkpointSetting] = useState<DefaultState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
    const {userLeadId, userId, setUserLeadId } = useUser();
    // const { workpointEl, fetchWorkpointEl } = useWorkpointInfor();

    console.log('LeadId', userLeadId);

    

  const fetchWorkpointSetting = () => {
    setLoading(true);
    
    fetch(`${useApiHost()}/workpoint/setting/${userLeadId}/`)
      .then(res => {
        if (!res.ok) {
          notification.error({ message: 'Không lấy được dữ liệu setting' });
          throw new Error('Fetch error');
        }
        return res.json();
      })
      .then(data => {
        setWorkpointSetting(data);
        console.log('Setting Data', data);
        setError(null);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  

  useEffect(() => {
    const route = window.location.href.split('/')[1];

    
    console.log('Setting', location, userLeadId);

    if (userLeadId) {
      fetchWorkpointSetting();
    }
  }, [userLeadId]);

  return (
    <WorkpointSettingContext.Provider value={{ 
            workpointSetting, setWorkpointSetting, 
            reloadWorkpointSetting: fetchWorkpointSetting, loading, error }}>
      {children}
    </WorkpointSettingContext.Provider>
  );
};

export const useWorkpointSetting = (): WorkpointSettingContextType => {
  const context = useContext(WorkpointSettingContext);
  if (!context) {
    throw new Error("useWorkpointSetting must be used within a WorkpointSettingProvider");
  }
  return context;
};
