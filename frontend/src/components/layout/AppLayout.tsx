import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CheckSquare, ListTodo, Users, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isAdmin());
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
      isActive
        ? 'bg-zinc-100 text-zinc-900 shadow-xs border border-zinc-200/80'
        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
    }`;

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white">
      {/* Enterprise Top Navbar */}
      <header className="bg-white border-b border-zinc-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            {/* Brand Logo & Main Navigation */}
            <div className="flex items-center gap-6">
              <NavLink
                to="/"
                className="flex items-center gap-2.5 text-zinc-900 font-semibold tracking-tight group"
              >
                <div className="w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center shadow-xs group-hover:bg-zinc-800 transition-colors">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold tracking-tight">TodoApp</span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200/60">
                  Enterprise
                </span>
              </NavLink>

              <div className="h-4 w-px bg-zinc-200 hidden sm:block" />

              <nav className="hidden sm:flex items-center gap-1.5">
                <NavLink to="/" end className={navLinkClass}>
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>Todos</span>
                </NavLink>

                {isAdmin && (
                  <NavLink to="/admin/users" className={navLinkClass}>
                    <Users className="w-3.5 h-3.5" />
                    <span>Kelola User</span>
                  </NavLink>
                )}
              </nav>
            </div>

            {/* User Profile & Actions */}
            <div className="flex items-center gap-3">
              {user && (
                <div className="flex items-center gap-2.5 pl-2">
                  <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 font-mono text-[11px] font-semibold flex items-center justify-center shrink-0">
                    {userInitials}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-semibold text-zinc-900 leading-tight">
                      {user.fullName || user.email}
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                      {user.roles?.map((role) => (
                        <Badge
                          key={role}
                          size="sm"
                          variant={role === 'Admin' ? 'purple' : 'secondary'}
                          showDot={role === 'Admin'}
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5 text-zinc-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 text-xs"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="sm:hidden border-t border-zinc-100 px-4 py-2 flex items-center gap-2 bg-zinc-50/70">
          <NavLink to="/" end className={navLinkClass}>
            <ListTodo className="w-3.5 h-3.5" />
            <span>Todos</span>
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin/users" className={navLinkClass}>
              <Users className="w-3.5 h-3.5" />
              <span>Kelola User</span>
            </NavLink>
          )}
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Modern Minimalist Footer */}
      <footer className="bg-white border-t border-zinc-200/80 py-4 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-700">TodoApp</span>
            <span className="text-zinc-300">&bull;</span>
            <span className="text-zinc-500">Enterprise Edition</span>
          </div>
          <p className="text-zinc-400">
            &copy; {new Date().getFullYear()} Clean Architecture .NET 8 &bull; React &bull; Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
