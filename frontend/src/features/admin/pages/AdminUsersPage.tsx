import React from 'react';
import { Users, ShieldCheck } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import React, { useState, useMemo } from 'react';
import { Users, Search, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import {
  useUsersQuery,
  useUpdateUserRole,
  useToggleLockUser,
  useDeleteUser,
} from '../hooks/useAdminUsers';
import { UserTable } from '../components/UserTable';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Toast, type ToastType } from '../../../components/ui/Toast';
import { Button } from '../../../components/ui/Button';
import type { UserSummary } from '../../../types/admin';

export const AdminUsersPage: React.FC = () => {
  const { data: users, isLoading, isError, error, refetch } = useUsersQuery();
  const updateRoleMutation = useUpdateUserRole();
  const toggleLockMutation = useToggleLockUser();
  const deleteMutation = useDeleteUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserSummary | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const isMutating =
    updateRoleMutation.isPending ||
    toggleLockMutation.isPending ||
    deleteMutation.isPending;

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery.trim()) return users;

    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.fullName && u.fullName.toLowerCase().includes(q))
    );
  }, [users, searchQuery]);

  const handleRoleChange = async (user: UserSummary, newRole: string) => {
    try {
      await updateRoleMutation.mutateAsync({ id: user.id, role: newRole });
      setToast({
        type: 'success',
        message: `Role pengguna ${user.fullName || user.email} berhasil diubah ke ${newRole}.`,
      });
    } catch (err: unknown) {
      let msg = 'Gagal mengubah role pengguna.';
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        msg = err.response.data.error;
      }
      setToast({ type: 'error', message: msg });
    }
  };

  const handleToggleLock = async (user: UserSummary) => {
    try {
      await toggleLockMutation.mutateAsync(user.id);
      const actionText = user.isLocked ? 'dibuka' : 'dikunci';
      setToast({
        type: 'success',
        message: `Akses pengguna ${user.fullName || user.email} berhasil ${actionText}.`,
      });
    } catch (err: unknown) {
      let msg = 'Gagal mengubah status akses pengguna.';
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        msg = err.response.data.error;
      }
      setToast({ type: 'error', message: msg });
    }
  };

  const handleDeleteClick = (user: UserSummary) => {
    setUserToDelete(user);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await deleteMutation.mutateAsync(userToDelete.id);
      setToast({
        type: 'success',
        message: `Pengguna ${userToDelete.fullName || userToDelete.email} beserta seluruh tugasnya telah berhasil dihapus.`,
      });
      setIsConfirmOpen(false);
      setUserToDelete(null);
    } catch (err: unknown) {
      let msg = 'Gagal menghapus pengguna.';
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        msg = err.response.data.error;
      }
      setToast({ type: 'error', message: msg });
    }
  };

  return (
    <div className="space-y-6">
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-purple-600" />
            Manajemen Pengguna & Role
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Area khusus administrator sistem TodoApp.
            Kelola hak akses, peranan (role), dan status pengguna TodoApp
          </p>
        </div>

        {users && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-50 border border-purple-100 text-xs font-semibold text-purple-700 self-start sm:self-auto">
            <ShieldAlert className="w-4 h-4 text-purple-600" />
            <span>Total Pengguna: {users.length}</span>
          </div>
        )}
      </div>

      <Card className="text-center py-12 space-y-4 border-purple-100">
        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
      {/* Search Input Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari pengguna berdasarkan nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900">Area Admin (Spec 13)</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Fitur tabel pengguna, ubah role (User ↔ Admin), toggle kunci akun (lockout), dan hapus akun pengguna akan dibangun pada Spec 13.
          </p>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="gap-1.5 text-xs text-gray-600"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Segarkan
        </Button>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-12 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </Card>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-8 rounded-2xl border border-red-200 bg-red-50 text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-semibold text-red-900">
              Gagal Memuat Data Pengguna
            </h4>
            <p className="text-sm text-red-600 max-w-md mx-auto">
              {error instanceof Error
                ? error.message
                : 'Terjadi gangguan koneksi saat menghubungi server backend.'}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            className="gap-2 mx-auto text-red-700 hover:text-red-900 border-red-200"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </Button>
        </div>
      )}

      {/* User Table */}
      {!isLoading && !isError && (
        <>
          {filteredUsers.length === 0 ? (
            <div className="p-12 rounded-2xl border border-gray-200 bg-white text-center text-sm text-gray-500">
              Tidak ada pengguna yang cocok dengan pencarian &quot;{searchQuery}&quot;.
            </div>
          ) : (
            <UserTable
              users={filteredUsers}
              onRoleChange={handleRoleChange}
              onToggleLock={handleToggleLock}
              onDelete={handleDeleteClick}
              isUpdating={isMutating}
            />
          )}
        </>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Hapus Pengguna"
        message={`Apakah Anda yakin ingin menghapus akun "${
          userToDelete?.fullName || userToDelete?.email
        }"? Seluruh tugas yang dimiliki pengguna ini juga akan dihapus secara permanen.`}
        confirmLabel="Hapus Permanen"
        cancelLabel="Batal"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsConfirmOpen(false);
          setUserToDelete(null);
        }}
      />
    </div>
  );
};

export default AdminUsersPage;

