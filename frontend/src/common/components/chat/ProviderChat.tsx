import React, { createContext, useContext, useState } from 'react';
import type { WorkSpace } from '../../@types/work-space.type';

interface ChatGroupContextType {
  workspaceEl: WorkSpace | null;
  setWorkspaceEl: (value: WorkSpace | null) => void;
}

const ChatGroupContext = createContext<ChatGroupContextType | undefined>(undefined);

interface ChatGroupProviderProps {
  children: React.ReactNode;
}

export const ChatGroupProvider: React.FC<ChatGroupProviderProps> = ({ children }) => {
  const [workspaceEl, setWorkspaceEl] = useState<WorkSpace | null>(null);

  return (
    <ChatGroupContext.Provider value={{ workspaceEl, setWorkspaceEl }}>
      {children}
    </ChatGroupContext.Provider>
  );
};

// Hook dùng trong các component con để truy cập context
export const useChatGroup = (): ChatGroupContextType => {
  const context = useContext(ChatGroupContext);
  if (context === undefined) {
    throw new Error('useChatGroup must be used within a ChatGroupProvider');
  }
  return context;
};
