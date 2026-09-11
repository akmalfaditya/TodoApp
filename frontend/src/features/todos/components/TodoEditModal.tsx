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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-bold text-gray-900">Edit Tugas</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Judul Tugas"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={updateMutation.isPending}
          />

          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
              Deskripsi
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">
                Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TodoPriority)}
                disabled={updateMutation.isPending}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low (Rendah)</option>
                <option value="Medium">Medium (Sedang)</option>
                <option value="High">High (Tinggi)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">
                Tenggat Waktu
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={updateMutation.isPending}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="edit-is-completed"
              checked={isCompleted}
              onChange={(e) => setIsCompleted(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label
              htmlFor="edit-is-completed"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              Tandai tugas ini telah selesai
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
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
              <Save className="w-4 h-4" />
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TodoEditModal;

