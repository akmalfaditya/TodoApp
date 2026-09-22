import React, { useState, useMemo } from 'react';
import { Users, Search, RefreshCw, AlertCircle, Shield, ShieldCheck, Lock, UserCheck } from 'lucide-react';
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
import { Card } from '../../../components/ui/Card';
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

  const totalUsers = users?.length ?? 0;
  const adminCount = users?.filter((u) => u.roles.includes('Admin')).length ?? 0;
  const lockedCount = users?.filter((u) => u.isLocked).length ?? 0;
  const activeCount = totalUsers - lockedCount;

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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Enterprise Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              Manajemen Pengguna & Role
            </h1>
            <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
              IAM Admin
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Area khusus administrator sistem. Kelola hak akses, role, dan keamanan akun organisasi.
          </p>
        </div>

        {users && (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200/80 text-xs font-medium text-zinc-700 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
            <span>Total Pengguna: {totalUsers}</span>
          </div>
        )}
      </div>

      {/* Admin IAM Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 bg-white border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Total Pengguna</span>
            <Users className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900 font-mono">
            {totalUsers}
          </div>
        </Card>

        <Card className="p-3.5 bg-white border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Administrator</span>
            <Shield className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-purple-700 font-mono">
            {adminCount}
          </div>
        </Card>

        <Card className="p-3.5 bg-white border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Pengguna Aktif</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-2xl font-bold tracking-tight text-emerald-700 font-mono">
            {activeCount}
          </div>
        </Card>

        <Card className="p-3.5 bg-white border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Akun Terkunci</span>
            <Lock className={`w-3.5 h-3.5 ${lockedCount > 0 ? 'text-rose-500' : 'text-zinc-400'}`} />
          </div>
          <div className={`mt-1.5 text-2xl font-bold tracking-tight font-mono ${lockedCount > 0 ? 'text-rose-600' : 'text-zinc-900'}`}>
            {lockedCount}
          </div>
        </Card>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-3 rounded-lg border border-zinc-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari pengguna berdasarkan nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs text-zinc-900 rounded-md border border-zinc-200/80 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 placeholder-zinc-400 transition-colors"
          />
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="gap-1.5 text-xs text-zinc-600 hover:text-zinc-900"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Segarkan
        </Button>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="p-6 bg-white rounded-lg border border-zinc-200/80 shadow-xs space-y-3">
          <div className="h-3.5 bg-zinc-200 rounded w-1/4 animate-pulse" />
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-10 bg-zinc-100 rounded-md animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-6 rounded-lg border border-rose-200/80 bg-rose-50/50 text-center space-y-3">
          <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-md flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-rose-900">
              Gagal Memuat Data Pengguna
            </h4>
            <p className="text-xs text-rose-600 max-w-md mx-auto">
              {error instanceof Error
                ? error.message
                : 'Terjadi gangguan koneksi saat menghubungi server backend.'}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5 mx-auto text-rose-700 hover:text-rose-900 border-rose-200 hover:bg-rose-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Lagi
          </Button>
        </div>
      )}

      {/* User Table */}
      {!isLoading && !isError && (
        <>
          {filteredUsers.length === 0 ? (
            <div className="p-10 rounded-lg border border-zinc-200/80 bg-white text-center text-xs text-zinc-500">
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
