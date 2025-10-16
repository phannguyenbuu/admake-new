import React, { createContext, useState } from 'react';

interface UpdateButtonContextType {
  showUpdateButton: number;
  setShowUpdateButtonMode: (value: number) => void;
}

export const UpdateButtonContext = createContext<UpdateButtonContextType | undefined>(undefined);

export const UpdateButtonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showUpdateButton, setShowUpdateButton] = useState(0);

  return (
    <UpdateButtonContext.Provider value={{
      showUpdateButton,
      setShowUpdateButtonMode: setShowUpdateButton,
    }}>
      {children}
    </UpdateButtonContext.Provider>
  );
};
