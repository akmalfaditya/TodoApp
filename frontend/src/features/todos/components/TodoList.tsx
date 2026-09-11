import React, { useMemo } from 'react';
import { ClipboardList, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useTodosQuery } from '../hooks/useTodos';
import { useTodoUiStore } from '../store/todoUiStore';
import { TodoItem } from './TodoItem';
import { Button } from '../../../components/ui/Button';
import type { Todo } from '../../../types/todo';

export interface TodoListProps {
  onEdit: (todo: Todo) => void;
}

const priorityWeight: Record<string, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

export const TodoList: React.FC<TodoListProps> = ({ onEdit }) => {
  const { data: todos, isLoading, isError, error, refetch } = useTodosQuery();
  const { filter, sortBy, sortOrder, searchQuery } = useTodoUiStore();

  const processedTodos = useMemo(() => {
    if (!todos) return [];

    let result = [...todos];

    // 1. Status Filtering
    if (filter === 'active') {
      result = result.filter((t) => !t.isCompleted);
    } else if (filter === 'completed') {
      result = result.filter((t) => t.isCompleted);
    }

    // 2. Search Query Filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // 3. Sorting
    result.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'priority') {
        const weightA = priorityWeight[a.priority] ?? 0;
        const weightB = priorityWeight[b.priority] ?? 0;
        comparison = weightB - weightA;
      } else if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) comparison = 0;
        else if (!a.dueDate) comparison = 1;
        else if (!b.dueDate) comparison = -1;
        else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else {
        // createdAt default
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return result;
  }, [todos, filter, sortBy, sortOrder, searchQuery]);

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="p-4 rounded-xl border border-gray-200 bg-white animate-pulse space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-100 rounded w-16" />
            </div>
            <div className="h-3 bg-gray-100 rounded w-2/3 ml-8" />
            <div className="h-3 bg-gray-100 rounded w-24 ml-8" />
          </div>
        ))}
      </div>
    );
  }

  // Error State with Retry Button
  if (isError) {
    return (
      <div className="p-8 rounded-2xl border border-red-200 bg-red-50 text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-red-900">
            Gagal Memuat Daftar Tugas
          </h4>
          <p className="text-sm text-red-600 max-w-md mx-auto">
            {error instanceof Error
              ? error.message
              : 'Terjadi gangguan saat mengambil data dari server backend.'}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          className="gap-2 mx-auto text-red-700 hover:text-red-900 border-red-200"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  // Empty State (No todos in database)
  if (!todos || todos.length === 0) {
    return (
      <div className="p-12 rounded-2xl border-2 border-dashed border-gray-200 bg-white text-center space-y-3">
        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
          <ClipboardList className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-gray-800">Belum ada tugas</h4>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Tambahkan tugas pertama Anda melalui formulir di atas untuk mulai produktif!
        </p>
      </div>
    );
  }

  // Filter Empty State (Todos exist, but none match current filter/search)
  if (processedTodos.length === 0) {
    return (
      <div className="p-12 rounded-2xl border border-gray-200 bg-white text-center space-y-3">
        <div className="w-12 h-12 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-gray-800">
          Tidak ada tugas yang cocok
        </h4>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Tidak ada tugas yang memenuhi kriteria filter atau pencarian Anda saat ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {processedTodos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onEdit={onEdit} />
      ))}
    </div>
  );
};

export default TodoList;
