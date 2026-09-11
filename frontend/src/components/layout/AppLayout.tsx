import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ListTodo, Users, LogOut, CheckSquare } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isAdmin());
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-semibold'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo & Navigation Links */}
            <div className="flex items-center gap-8">
              <NavLink to="/" className="flex items-center gap-2.5 text-blue-600 font-bold text-xl tracking-tight">
                <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <span>TodoApp</span>
              </NavLink>

              <nav className="hidden sm:flex items-center gap-1">
                <NavLink to="/" end className={navLinkClass}>
                  <ListTodo className="w-4 h-4" />
                  Todos
                </NavLink>

                {isAdmin && (
                  <NavLink to="/admin/users" className={navLinkClass}>
                    <Users className="w-4 h-4" />
                    Kelola User
                  </NavLink>
                )}
              </nav>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-sm font-medium text-gray-900 leading-tight">
                    {user.fullName || user.email}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {user.roles?.map((role) => (
                      <span
                        key={role}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          role === 'Admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5 text-gray-600 hover:text-red-600 hover:border-red-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="sm:hidden border-t border-gray-100 px-4 py-2 flex items-center gap-2 bg-gray-50">
          <NavLink to="/" end className={navLinkClass}>
            <ListTodo className="w-4 h-4" />
            Todos
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin/users" className={navLinkClass}>
              <Users className="w-4 h-4" />
              Kelola User
            </NavLink>
          )}
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} TodoApp &bull; Clean Architecture .NET 8 & React
      </footer>
    </div>
  );
};

export default AppLayout;

