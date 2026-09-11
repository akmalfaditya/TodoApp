import React from 'react';
import { Calendar, Trash2, Edit2, Check, Clock, User } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { useToggleComplete, useDeleteTodo } from '../hooks/useTodos';
import type { Todo, TodoPriority } from '../../../types/todo';

export interface TodoItemProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
}

const priorityBadgeStyles: Record<TodoPriority, string> = {
  High: 'bg-red-100 text-red-700 border-red-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low: 'bg-gray-100 text-gray-700 border-gray-200',
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
      className={`p-4 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md bg-white ${
        todo.isCompleted
          ? 'border-gray-200 bg-gray-50/70 opacity-80'
          : 'border-gray-200 hover:border-blue-300'
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
          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
            todo.isCompleted
              ? 'bg-green-600 border-green-600 text-white shadow-sm'
              : 'border-gray-300 hover:border-blue-500 bg-white'
          }`}
          title={todo.isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'}
        >
          {todo.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4
              className={`text-base font-medium break-words ${
                todo.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'
              }`}
            >
              {todo.title}
            </h4>

            {/* Priority Badge */}
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                priorityBadgeStyles[todo.priority]
              }`}
            >
              {todo.priority}
            </span>

            {/* Admin-only Owner Tag */}
            {isAdmin && todo.ownerId && (
              <span
                className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200"
                title={`Pemilik Todo: ${todo.ownerId}`}
              >
                <User className="w-3 h-3" />
                Owner: {todo.ownerId.length > 8 ? `${todo.ownerId.substring(0, 8)}...` : todo.ownerId}
              </span>
            )}
          </div>

          {/* Description */}
          {todo.description && (
            <p
              className={`text-sm mb-2 break-words ${
                todo.isCompleted ? 'line-through text-gray-400' : 'text-gray-600'
              }`}
            >
              {todo.description}
            </p>
          )}

          {/* Metadata Footer */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
            {formattedDueDate && (
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'
                }`}
                title={isOverdue ? 'Tugas telah melewati tenggat waktu!' : 'Tenggat Waktu'}
              >
                <Calendar className="w-3.5 h-3.5" />
                {formattedDueDate}
                {isOverdue && ' (Terlambat)'}
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              Dibuat {new Date(todo.createdAt).toLocaleDateString('id-ID')}
            </span>
          </div>
        </div>

        {/* Actions (Edit & Delete) */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            type="button"
            onClick={() => onEdit(todo)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Tugas"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus Tugas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoItem;

