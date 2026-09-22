import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { useUpdateTodo } from '../hooks/useTodos';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { Todo, TodoPriority } from '../../../types/todo';

export interface TodoEditModalProps {
  todo: Todo | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TodoEditModal: React.FC<TodoEditModalProps> = ({
  todo,
  isOpen,
  onClose,
}) => {
  const updateMutation = useUpdateTodo();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description ?? '');
      setPriority(todo.priority);
      setDueDate(
        todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : ''
      );
      setIsCompleted(todo.isCompleted);
      setError(null);
    }
  }, [todo]);

  if (!isOpen || !todo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul tugas wajib diisi.');
      return;
    }
    setError(null);

    try {
      await updateMutation.mutateAsync({
        id: todo.id,
        payload: {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          isCompleted,
        },
      });
      onClose();
    } catch {
      setError('Gagal memperbarui tugas. Silakan coba lagi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg max-w-lg w-full p-5 shadow-dropdown border border-zinc-200/90 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h3 className="text-base font-semibold text-zinc-900">Edit Tugas</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200/80 rounded-md text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Judul Tugas"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={updateMutation.isPending}
          />

          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-700">
              Deskripsi
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-md border border-zinc-200/90 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors placeholder-zinc-400"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-700">
                Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TodoPriority)}
                disabled={updateMutation.isPending}
                className="w-full px-2.5 py-1.5 text-xs font-medium rounded-md border border-zinc-200/90 bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
              >
                <option value="Low">Low (Rendah)</option>
                <option value="Medium">Medium (Sedang)</option>
                <option value="High">High (Tinggi)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-700">
                Tenggat Waktu
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={updateMutation.isPending}
                className="w-full px-2.5 py-1.5 text-xs font-medium rounded-md border border-zinc-200/90 bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="edit-is-completed"
              checked={isCompleted}
              onChange={(e) => setIsCompleted(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
            />
            <label
              htmlFor="edit-is-completed"
              className="text-xs font-medium text-zinc-700 cursor-pointer"
            >
              Tandai tugas ini telah selesai
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={updateMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={updateMutation.isPending}
              className="gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TodoEditModal;
