import React from 'react';
import { Users, ShieldCheck } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

export const AdminUsersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-purple-600" />
            Manajemen Pengguna & Role
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Area khusus administrator sistem TodoApp.
          </p>
        </div>
      </div>

      <Card className="text-center py-12 space-y-4 border-purple-100">
        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900">Area Admin (Spec 13)</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Fitur tabel pengguna, ubah role (User ↔ Admin), toggle kunci akun (lockout), dan hapus akun pengguna akan dibangun pada Spec 13.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdminUsersPage;

