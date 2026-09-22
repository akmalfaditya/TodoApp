import React from 'react';
import { Lock, Unlock, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { Badge } from '../../../components/ui/Badge';
import type { UserSummary } from '../../../types/admin';

export interface UserTableProps {
  users: UserSummary[];
  onRoleChange: (user: UserSummary, newRole: string) => void;
  onToggleLock: (user: UserSummary) => void;
  onDelete: (user: UserSummary) => void;
  isUpdating?: boolean;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  onRoleChange,
  onToggleLock,
  onDelete,
  isUpdating = false,
}) => {
  const currentUser = useAuthStore((state) => state.user);

  return (
    <div className="overflow-hidden bg-white rounded-lg border border-zinc-200/80 shadow-xs">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200/80 text-left text-xs">
          <thead className="bg-zinc-50/80 text-[11px] uppercase font-semibold text-zinc-500 tracking-wider">
            <tr>
              <th scope="col" className="px-5 py-3">
                Pengguna
              </th>
              <th scope="col" className="px-5 py-3">
                Role
              </th>
              <th scope="col" className="px-5 py-3">
                Status
              </th>
              <th scope="col" className="px-5 py-3">
                Terdaftar
              </th>
              <th scope="col" className="px-5 py-3 text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {users.map((u) => {
              const isSelf =
                (currentUser?.id && currentUser.id === u.id) ||
                (currentUser?.email &&
                  currentUser.email.toLowerCase() === u.email.toLowerCase());

              const hasAdminRole = u.roles.includes('Admin');
              const primaryRole = hasAdminRole ? 'Admin' : 'User';

              const initial = u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U';

              return (
                <tr
                  key={u.id}
                  className={`transition-colors ${
                    isSelf ? 'bg-zinc-50/50' : 'hover:bg-zinc-50/80'
                  }`}
                >
                  {/* User info */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 flex items-center justify-center font-mono font-semibold text-xs shrink-0">
                        {initial}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                          <span>{u.fullName || 'Tanpa Nama'}</span>
                          {isSelf && (
                            <span className="text-[10px] font-mono bg-zinc-100 text-zinc-700 font-semibold px-1.5 py-0.2 rounded border border-zinc-200/60">
                              Anda
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">{u.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role badges */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {u.roles.map((r) => (
                        <Badge
                          key={r}
                          size="sm"
                          variant={r === 'Admin' ? 'purple' : 'secondary'}
                          showDot={r === 'Admin'}
                        >
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </td>

                  {/* Lock status */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {u.isLocked ? (
                      <Badge size="sm" variant="destructive" showDot>
                        <Lock className="w-2.5 h-2.5 mr-0.5" />
                        Terkunci
                      </Badge>
                    ) : (
                      <Badge size="sm" variant="success" showDot>
                        <Unlock className="w-2.5 h-2.5 mr-0.5" />
                        Aktif
                      </Badge>
                    )}
                  </td>

                  {/* Registered date */}
                  <td className="px-5 py-3.5 whitespace-nowrap text-[11px] font-mono text-zinc-500">
                    {new Date(u.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    {isSelf ? (
                      <span className="text-[11px] text-zinc-400 italic">
                        Tidak dapat diubah
                      </span>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Role selector dropdown */}
                        <select
                          value={primaryRole}
                          onChange={(e) => onRoleChange(u, e.target.value)}
                          disabled={isUpdating}
                          className="text-xs font-medium border border-zinc-200/90 rounded-md px-2 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
                          title="Ubah Role"
                        >
                          <option value="User">User</option>
                          <option value="Admin">Admin</option>
                        </select>

                        {/* Lock/Unlock button */}
                        <button
                          type="button"
                          onClick={() => onToggleLock(u)}
                          disabled={isUpdating}
                          className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                            u.isLocked
                              ? 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                          }`}
                          title={u.isLocked ? 'Buka Kunci Akun' : 'Kunci Akun'}
                        >
                          {u.isLocked ? (
                            <Unlock className="w-3.5 h-3.5" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => onDelete(u)}
                          disabled={isUpdating}
                          className="p-1.5 rounded-md border border-rose-200/80 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
