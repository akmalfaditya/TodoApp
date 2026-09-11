import React from 'react';
import { Lock, Unlock, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
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
    <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3.5">
                Pengguna
              </th>
              <th scope="col" className="px-6 py-3.5">
                Role
              </th>
              <th scope="col" className="px-6 py-3.5">
                Status
              </th>
              <th scope="col" className="px-6 py-3.5">
                Terdaftar
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {users.map((u) => {
              const isSelf =
                (currentUser?.id && currentUser.id === u.id) ||
                (currentUser?.email &&
                  currentUser.email.toLowerCase() === u.email.toLowerCase());

              const hasAdminRole = u.roles.includes('Admin');
              const primaryRole = hasAdminRole ? 'Admin' : 'User';

              return (
                <tr
                  key={u.id}
                  className={`transition-colors ${
                    isSelf ? 'bg-blue-50/40' : 'hover:bg-gray-50/80'
                  }`}
                >
                  {/* User info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          <span>{u.fullName || 'Tanpa Nama'}</span>
                          {isSelf && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                              Anda
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role badges */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {u.roles.map((r) => (
                        <span
                          key={r}
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border ${
                            r === 'Admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {r === 'Admin' ? (
                            <Shield className="w-3 h-3 text-purple-600" />
                          ) : (
                            <UserIcon className="w-3 h-3 text-blue-600" />
                          )}
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Lock status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {u.isLocked ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-red-100 text-red-700 border border-red-200">
                        <Lock className="w-3 h-3 text-red-600" />
                        Terkunci
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-700 border border-green-200">
                        <Unlock className="w-3 h-3 text-green-600" />
                        Aktif
                      </span>
                    )}
                  </td>

                  {/* Registered date */}
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {isSelf ? (
                      <span className="text-xs text-gray-400 italic">
                        Tidak dapat diubah
                      </span>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        {/* Role selector dropdown */}
                        <select
                          value={primaryRole}
                          onChange={(e) => onRoleChange(u, e.target.value)}
                          disabled={isUpdating}
                          className="text-xs font-medium border border-gray-300 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className={`p-1.5 rounded-lg border transition-colors ${
                            u.isLocked
                              ? 'text-green-600 border-green-300 hover:bg-green-50'
                              : 'text-amber-600 border-amber-300 hover:bg-amber-50'
                          }`}
                          title={u.isLocked ? 'Buka Kunci Akun' : 'Kunci Akun'}
                        >
                          {u.isLocked ? (
                            <Unlock className="w-4 h-4" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => onDelete(u)}
                          disabled={isUpdating}
                          className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-4 h-4" />
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

