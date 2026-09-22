import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, Layers } from 'lucide-react';
import { useTodosQuery } from '../hooks/useTodos';
import { TodoForm } from '../components/TodoForm';
import { TodoFilterBar } from '../components/TodoFilterBar';
import { TodoList } from '../components/TodoList';
import { TodoEditModal } from '../components/TodoEditModal';
import { Card } from '../../../components/ui/Card';
import type { Todo } from '../../../types/todo';

export const TodosPage: React.FC = () => {
  const { data: todos } = useTodosQuery();
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const totalCount = todos?.length ?? 0;
  const completedCount = todos?.filter((t) => t.isCompleted).length ?? 0;
  const activeCount = totalCount - completedCount;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const overdueCount =
    todos?.filter(
      (t) =>
        t.dueDate &&
        !t.isCompleted &&
        new Date(t.dueDate).getTime() < new Date().setHours(0, 0, 0, 0)
    ).length ?? 0;

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingTodo(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Enterprise Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              Daftar Tugas (Todos)
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Workspace manajemen tugas dan tracking progres harian
          </p>
        </div>

        {totalCount > 0 && (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200/80 text-xs font-medium text-zinc-700 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {completedCount} dari {totalCount} tugas selesai ({completionPercentage}%)
            </span>
          </div>
        )}
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 bg-white border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Total Tugas</span>
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900 font-mono">
            {totalCount}
          </div>
        </Card>

        <Card className="p-3.5 bg-white border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Tugas Aktif</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900 font-mono">
            {activeCount}
          </div>
        </Card>

        <Card className="p-3.5 bg-white border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Selesai</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-emerald-700 font-mono">
            {completedCount}
          </div>
        </Card>

        <Card className="p-3.5 bg-white border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Terlambat</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${overdueCount > 0 ? 'text-rose-500' : 'text-zinc-400'}`} />
          </div>
          <div className={`mt-1.5 text-2xl font-bold tracking-tight font-mono ${overdueCount > 0 ? 'text-rose-600' : 'text-zinc-900'}`}>
            {overdueCount}
          </div>
        </Card>
      </div>

      {/* Quick Add Todo Form */}
      <TodoForm />

      {/* Filters & Sorting */}
      <TodoFilterBar />

      {/* Main Todo List */}
      <TodoList onEdit={handleEdit} />

      {/* Edit Todo Modal */}
      <TodoEditModal
        todo={editingTodo}
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default TodosPage;
