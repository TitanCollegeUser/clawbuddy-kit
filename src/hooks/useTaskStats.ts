import { useMemo } from 'react';
import { useTasks, Task } from './useTasks';
import { useBoardColumns } from './useBoardColumns';
import { useAuth } from '@/contexts/AuthContext';

export interface TaskStats {
  total: number;
  done: number;
  myTasks: number;
  bujjiTasks: number;
  needsInput: number;
}

export const useTaskStats = () => {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: columns = [], isLoading: columnsLoading } = useBoardColumns();
  const { user } = useAuth();

  const stats = useMemo((): TaskStats => {
    if (!tasks.length || !columns.length) {
      return {
        total: 0,
        done: 0,
        myTasks: 0,
        bujjiTasks: 0,
        needsInput: 0,
      };
    }

    const doneColumn = columns.find(c => c.name.toLowerCase() === 'done');
    const needsInputColumn = columns.find(c => c.name.toLowerCase() === 'needs input');

    return {
      total: tasks.length,
      done: doneColumn ? tasks.filter(t => t.board_column_id === doneColumn.id).length : 0,
      myTasks: user ? tasks.filter(t => t.created_by === user.id).length : 0,
      bujjiTasks: tasks.filter(t => t.created_by_bujji === true).length,
      needsInput: needsInputColumn ? tasks.filter(t => t.board_column_id === needsInputColumn.id).length : 0,
    };
  }, [tasks, columns, user]);

  return {
    stats,
    isLoading: tasksLoading || columnsLoading,
  };
};
