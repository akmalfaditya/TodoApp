import React from 'react';
import { Calendar, Trash2, Edit2, Check, Clock, User, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { useToggleComplete, useDeleteTodo } from '../hooks/useTodos';
import { Badge } from '../../../components/ui/Badge';
import type { Todo, TodoPriority } from '../../../types/todo';

export interface TodoItemProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
}

const priorityVariants: Record<TodoPriority, 'destructive' | 'warning' | 'secondary'> = {
  High: 'destructive',
  Medium: 'warning',
  Low: 'secondary',
};

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onEdit }) => {
  const isAdmin = useAuthStore((state) => state.isAdmin());
  const toggleMutation = useToggleComplete();
  const deleteMutation = useDeleteTodo();

  const handleToggle = () => {
    toggleMutation.mutate(todo.id);
  };

  const handleDelete = () => {
    if (window.confirm(`Hapus tugas "${todo.title}"?`)) {
      deleteMutation.mutate(todo.id);
    }
  };

  const isOverdue =
    todo.dueDate &&
    !todo.isCompleted &&
    new Date(todo.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);

  const formattedDueDate = todo.dueDate
    ? new Date(todo.dueDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div
      className={`p-3.5 rounded-lg border transition-all duration-150 shadow-xs group ${
        todo.isCompleted
          ? 'border-zinc-200/60 bg-zinc-50/60 text-zinc-400'
          : 'border-zinc-200/90 hover:border-zinc-300 bg-white hover:shadow-subtle'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Custom Toggle Checkbox */}
        <button
          type="button"
          role="checkbox"
          aria-checked={todo.isCompleted}
          onClick={handleToggle}
          disabled={toggleMutation.isPending}
          className={`mt-0.5 w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
            todo.isCompleted
              ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
              : 'border-zinc-300 hover:border-zinc-600 bg-white'
          }`}
          title={todo.isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'}
        >
          {todo.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
        </button>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4
              className={`text-sm font-medium break-words leading-tight ${
                todo.isCompleted ? 'line-through text-zinc-400' : 'text-zinc-900'
              }`}
            >
              {todo.title}
            </h4>

            {/* Priority Badge */}
            <Badge
              size="sm"
              variant={priorityVariants[todo.priority]}
              showDot
            >
              {todo.priority}
            </Badge>

            {/* Admin-only Owner Tag */}
            {isAdmin && todo.ownerId && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-mono bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200/60"
                title={`Pemilik Todo: ${todo.ownerId}`}
              >
                <User className="w-2.5 h-2.5" />
                Owner: {todo.ownerId.length > 8 ? `${todo.ownerId.substring(0, 8)}...` : todo.ownerId}
              </span>
            )}
          </div>

          {/* Description */}
          {todo.description && (
            <p
              className={`text-xs mt-0.5 mb-2 break-words leading-normal ${
                todo.isCompleted ? 'line-through text-zinc-400' : 'text-zinc-600'
              }`}
            >
              {todo.description}
            </p>
          )}

          {/* Metadata Footer */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 pt-0.5">
            {formattedDueDate && (
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  isOverdue ? 'text-rose-600 font-semibold' : 'text-zinc-500'
                }`}
                title={isOverdue ? 'Tugas telah melewati tenggat waktu!' : 'Tenggat Waktu'}
              >
                {isOverdue ? (
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                ) : (
                  <Calendar className="w-3 h-3 text-zinc-400" />
                )}
                {formattedDueDate}
                {isOverdue && ' (Terlambat)'}
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-zinc-400">
              <Clock className="w-3 h-3 text-zinc-400" />
              Dibuat {new Date(todo.createdAt).toLocaleDateString('id-ID')}
            </span>
          </div>
        </div>

        {/* Actions (Edit & Delete) */}
        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(todo)}
            className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
            title="Edit Tugas"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
            title="Hapus Tugas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoItem;
