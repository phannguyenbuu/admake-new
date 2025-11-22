import React, { createContext, useState } from 'react';

interface UpdateButtonContextType {
  showUpdateButton: number;
  setShowUpdateButton: (value: number) => void;
}

export const UpdateButtonContext = createContext<UpdateButtonContextType | undefined>(undefined);

export const UpdateButtonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showUpdateButton, setShowUpdateButton] = useState(0);

  return (
    <UpdateButtonContext.Provider value={{
      showUpdateButton,
      setShowUpdateButton: setShowUpdateButton,
    }}>
      {children}
    </UpdateButtonContext.Provider>
  );
};
