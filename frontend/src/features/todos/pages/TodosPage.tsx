import React from 'react';
import React, { useState } from 'react';
import { ListTodo, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { Card } from '../../../components/ui/Card';
import { useTodosQuery } from '../hooks/useTodos';
import { TodoForm } from '../components/TodoForm';
import { TodoFilterBar } from '../components/TodoFilterBar';
import { TodoList } from '../components/TodoList';
import { TodoEditModal } from '../components/TodoEditModal';
import type { Todo } from '../../../types/todo';

export const TodosPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { data: todos } = useTodosQuery();
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const completedCount = todos?.filter((t) => t.isCompleted).length ?? 0;
  const totalCount = todos?.length ?? 0;

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingTodo(null);
  };

  return (
    <div className="space-y-6">
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <ListTodo className="w-7 h-7 text-blue-600" />
            Daftar Tugas (Todos)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Selamat datang kembali, <span className="font-semibold text-gray-800">{user?.fullName || user?.email}</span>!
            Kelola dan pantau progres aktivitas harian Anda
          </p>
        </div>

        {totalCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700 self-start sm:self-auto">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>
              {completedCount} dari {totalCount} tugas selesai
            </span>
          </div>
        )}
      </div>

      <Card className="text-center py-12 space-y-4">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900">Modul Todos Sedang Dipersiapkan</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Fitur lengkap CRUD todo, filter prioritas (Low/Medium/High), filter status, dan toggle penyelesaian akan diimplementasikan pada Spec 12.
          </p>
        </div>
      </Card>
      {/* Create Todo Form */}
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

