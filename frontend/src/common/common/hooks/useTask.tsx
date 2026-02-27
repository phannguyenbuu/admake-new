import React, { createContext, useContext, useState, useMemo } from 'react';
import type { Task, TasksResponse, TaskGroup } from '../../@types/work-space.type';
import { useWorkSpaceQueryTaskById } from './work-space.hook';
import { useUser } from './useUser';
import { notification } from 'antd';
import type { QueryObserverResult, RefetchOptions } from '@tanstack/react-query';
import { useApiHost } from './useApiHost';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

interface TaskContextType {
  taskDetail: Task | null;
  setTaskDetail: React.Dispatch<React.SetStateAction<Task | null>>;
  isLoading: boolean;
  tasksData: TasksResponse | undefined;
  originalTasksData: TasksResponse | undefined;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  updateTaskStatus: (taskId: string, newType: string) => Promise<void>;
  refetchTasks: (options?: RefetchOptions) => Promise<QueryObserverResult<TasksResponse, Error>>;
  selectedMonth: string | null;
  setSelectedMonth: (month: string | null) => void;
  filterDateType: 'start' | 'end' | 'all';
  setFilterDateType: (type: 'start' | 'end' | 'all') => void;
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
  const [selectedMonth, setSelectedMonth] = useState<string | null>('all');
  const [filterDateType, setFilterDateType] = useState<'start' | 'end' | 'all'>('all');

  const {workspaceId} = useUser();
  const { data: originalTasksData, refetch: refetchTasks } = useWorkSpaceQueryTaskById(workspaceId ?? '');

  const tasksData = useMemo(() => {
    if (!originalTasksData) return undefined;

    const filteredData: TasksResponse = {};

    Object.keys(originalTasksData).forEach((status) => {
      const group = originalTasksData[status];
      const filteredTasks = group.tasks.filter((task) => {
        // If filtering by end date, only show tasks that actually have an end date
        if (filterDateType === 'end' && !task.end_time) {
          return false;
        }

        // If "All months" is selected, we only apply the end-date filter constraint if applicable
        if (!selectedMonth || selectedMonth === 'all') {
          return true;
        }

        if (filterDateType === 'all') {
          const taskStart = task.start_time ? dayjs(task.start_time).format('YYYY-MM') : null;
          const taskEnd = task.end_time ? dayjs(task.end_time).format('YYYY-MM') : null;
          return (taskStart === selectedMonth) || (taskEnd === selectedMonth);
        }

        const dateToCompare = filterDateType === 'start' ? task.start_time : task.end_time;
        if (!dateToCompare) return false;

        const taskMonth = dayjs(dateToCompare).format('YYYY-MM');
        return taskMonth === selectedMonth;
      });

      filteredData[status] = {
        ...group,
        tasks: filteredTasks,
        count: filteredTasks.length
      };
    });

    return filteredData;
  }, [originalTasksData, selectedMonth, filterDateType]);

  const updateTaskStatus = async (taskId: string, newType: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${useApiHost()}/task/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newType }),
      });
      if (!response.ok) throw new Error('Update failed');
      console.log("RS",response);

      const data = await response.json();
      console.log("data",data);
      const newTitle = data.new_status;

      notification.success({ message: `Sang ${newTitle} thành công!`, description: "Cập nhật" });

      await refetchTasks(); // làm mới lại dữ liệu query
    } catch (error) {
      notification.error({ message: 'Có lỗi xảy ra khi cập nhật trạng thái!', description: "" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TaskContext.Provider value={{ 
        taskDetail, setTaskDetail, 
        tasksData, originalTasksData,
        isLoading, refetchTasks,
        selectedMonth, setSelectedMonth,
        filterDateType, setFilterDateType,
        setIsLoading, updateTaskStatus }}>
      {children}
    </TaskContext.Provider>
  );
};
