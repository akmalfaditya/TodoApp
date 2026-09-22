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
      <div className="space-y-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="p-3.5 rounded-lg border border-zinc-200/80 bg-white animate-pulse space-y-2.5"
          >
            <div className="flex items-center gap-3">
              <div className="w-4.5 h-4.5 bg-zinc-200 rounded" />
              <div className="h-3.5 bg-zinc-200 rounded w-1/3" />
              <div className="h-3.5 bg-zinc-100 rounded w-16" />
            </div>
            <div className="h-3 bg-zinc-100 rounded w-2/3 ml-7.5" />
          </div>
        ))}
      </div>
    );
  }

  // Error State with Retry Button
  if (isError) {
    return (
      <div className="p-6 rounded-lg border border-rose-200/80 bg-rose-50/50 text-center space-y-3">
        <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-md flex items-center justify-center mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-rose-900">
            Gagal Memuat Daftar Tugas
          </h4>
          <p className="text-xs text-rose-600 max-w-md mx-auto">
            {error instanceof Error
              ? error.message
              : 'Terjadi gangguan saat mengambil data dari server backend.'}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5 mx-auto text-rose-700 hover:text-rose-900 border-rose-200 hover:bg-rose-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  // Empty State (No todos in database)
  if (!todos || todos.length === 0) {
    return (
      <div className="p-10 rounded-lg border border-dashed border-zinc-300 bg-white text-center space-y-2.5">
        <div className="w-10 h-10 bg-zinc-100 text-zinc-500 rounded-md flex items-center justify-center mx-auto border border-zinc-200/60">
          <ClipboardList className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-semibold text-zinc-900">Belum ada tugas</h4>
        <p className="text-xs text-zinc-500 max-w-xs mx-auto">
          Tambahkan tugas pertama Anda melalui formulir di atas untuk mulai produktif!
        </p>
      </div>
    );
  }

  // Filter Empty State (Todos exist, but none match current filter/search)
  if (processedTodos.length === 0) {
    return (
      <div className="p-8 rounded-lg border border-zinc-200/80 bg-white text-center space-y-2">
        <div className="w-9 h-9 bg-zinc-100 text-zinc-400 rounded-md flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-semibold text-zinc-800">
          Tidak ada tugas yang cocok
        </h4>
        <p className="text-xs text-zinc-500 max-w-xs mx-auto">
          Tidak ada tugas yang memenuhi kriteria filter atau pencarian Anda saat ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {processedTodos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onEdit={onEdit} />
      ))}
    </div>
  );
};

export default TodoList;
