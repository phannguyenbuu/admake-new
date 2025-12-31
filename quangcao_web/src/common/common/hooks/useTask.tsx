import React, { createContext, useContext, useState } from 'react';
import type { Task, TasksResponse } from '../../@types/work-space.type';
import { useWorkSpaceQueryTaskById } from './work-space.hook';
import { useUser } from './useUser';
import { notification } from 'antd';
import type { QueryObserverResult, RefetchOptions } from '@tanstack/react-query';
import { useApiHost } from './useApiHost';

interface TaskContextType {
  taskDetail: Task | null;
  setTaskDetail: React.Dispatch<React.SetStateAction<Task | null>>;
  isLoading: boolean;
  tasksData: TasksResponse | undefined;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  updateTaskStatus: (taskId: string, newStatus: string) => Promise<void>;
  refetchTasks: (options?: RefetchOptions) => Promise<QueryObserverResult<TasksResponse, Error>>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [taskDetail, setTaskDetail] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const {workspaceId} = useUser();
  const { data: tasksData, refetch: refetchTasks } = useWorkSpaceQueryTaskById(workspaceId ?? '');

  // Hàm cập nhật trạng thái task không dùng mutation
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${useApiHost()}/task/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Update failed');

      notification.success({ message: 'Cập nhật trạng thái thành công!', description: newStatus });

      await refetchTasks(); // làm mới lại dữ liệu query
    } catch (error) {
      notification.error({ message: 'Có lỗi xảy ra khi cập nhật trạng thái!', description: newStatus });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TaskContext.Provider value={{ 
        taskDetail, setTaskDetail, 
        tasksData, isLoading, refetchTasks,
        setIsLoading, updateTaskStatus }}>
      {children}
    </TaskContext.Provider>
  );
};
