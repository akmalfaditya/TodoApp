import React, { useState } from 'react';
import { PlusCircle, Calendar, AlertTriangle } from 'lucide-react';
import { useCreateTodo } from '../hooks/useTodos';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { TodoPriority } from '../../../types/todo';

export const TodoForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateTodo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul tugas wajib diisi.');
      return;
    }
    setError(null);

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });

      setTitle('');
      setDescription('');
      setPriority('Medium');
      setDueDate('');
    } catch {
      setError('Gagal menambahkan todo. Silakan coba lagi.');
    }
  };

  return (
    <Card className="border-blue-100 shadow-sm hover:shadow-md transition-shadow">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <PlusCircle className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Tambah Tugas Baru</h3>
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          placeholder="Apa yang ingin Anda selesaikan hari ini?"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError(null);
          }}
          disabled={createMutation.isPending}
        />

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">
            Deskripsi (Opsional)
          </label>
          <textarea
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
            placeholder="Tambahkan catatan detail tugas jika diperlukan..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={createMutation.isPending}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Priority selector */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
              Prioritas
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TodoPriority)}
              disabled={createMutation.isPending}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Low">Low (Rendah)</option>
              <option value="Medium">Medium (Sedang)</option>
              <option value="High">High (Tinggi)</option>
            </select>
          </div>

          {/* Due date picker */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Tenggat Waktu (Opsional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={createMutation.isPending}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            variant="primary"
            isLoading={createMutation.isPending}
            className="gap-2 text-sm px-5"
          >
            <PlusCircle className="w-4 h-4" />
            Simpan Tugas
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default TodoForm;

