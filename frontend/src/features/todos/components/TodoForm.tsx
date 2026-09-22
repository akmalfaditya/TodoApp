import React, { useState } from 'react';
import { Plus, Calendar, AlertTriangle } from 'lucide-react';
import { useCreateTodo } from '../hooks/useTodos';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { TodoPriority } from '../../../types/todo';

export const TodoForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
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
      setIsExpanded(false);
    } catch {
      setError('Gagal menambahkan todo. Silakan coba lagi.');
    }
  };

  return (
    <Card className="border border-zinc-200/90 shadow-xs bg-white rounded-lg p-4 transition-all">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200/80 rounded-md text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick entry title line */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Tambah tugas baru... (e.g. Audit security logs backend)"
            value={title}
            onFocus={() => setIsExpanded(true)}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            disabled={createMutation.isPending}
            className="w-full text-sm font-medium text-zinc-900 placeholder:text-zinc-400 bg-transparent px-2.5 py-1.5 rounded-md border border-zinc-200/80 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors focus:outline-none"
          />

          {!isExpanded && (
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createMutation.isPending}
              className="shrink-0 gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </Button>
          )}
        </div>

        {/* Expandable details */}
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t border-zinc-100 animate-in fade-in duration-100">
            <div>
              <textarea
                rows={2}
                className="w-full px-2.5 py-1.5 text-xs text-zinc-900 rounded-md border border-zinc-200/80 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors placeholder-zinc-400"
                placeholder="Tambahkan detail atau catatan tugas (opsional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                {/* Priority Selector */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-medium text-zinc-500">Prioritas:</span>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TodoPriority)}
                    disabled={createMutation.isPending}
                    className="text-xs font-medium border border-zinc-200/90 rounded-md px-2 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                {/* Due Date Picker */}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={createMutation.isPending}
                    className="text-xs font-medium border border-zinc-200/90 rounded-md px-2 py-1 bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setIsExpanded(false)}
                  disabled={createMutation.isPending}
                  className="text-zinc-500 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="xs"
                  isLoading={createMutation.isPending}
                  className="gap-1 px-3"
                >
                  <Plus className="w-3 h-3" />
                  <span>Simpan Tugas</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </Card>
  );
};

export default TodoForm;
