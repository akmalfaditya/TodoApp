import React from 'react';
import { ListTodo, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { Card } from '../../../components/ui/Card';

export const TodosPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <ListTodo className="w-7 h-7 text-blue-600" />
            Daftar Tugas (Todos)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Selamat datang kembali, <span className="font-semibold text-gray-800">{user?.fullName || user?.email}</span>!
          </p>
        </div>
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
    </div>
  );
};

export default TodosPage;

