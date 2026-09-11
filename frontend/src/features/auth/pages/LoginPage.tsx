import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, UserCheck, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { Button } from '../../../components/ui/Button';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  // Dev helpers for testing route protection & role redirection
  const handleSimulateLoginUser = () => {
    setAuth('mock-user-token-xyz', {
      id: 'usr-1',
      email: 'john.doe@todoapp.local',
      fullName: 'John Doe',
      roles: ['User'],
    });
    navigate(from, { replace: true });
  };

  const handleSimulateLoginAdmin = () => {
    setAuth('mock-admin-token-xyz', {
      id: 'adm-1',
      email: 'admin@todoapp.local',
      fullName: 'Administrator',
      roles: ['Admin'],
    });
    navigate(from, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <LogIn className="w-5 h-5 text-blue-600" />
          Masuk ke Akun
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Halaman login lengkap dengan validasi dan API akan diimplementasikan di Spec 11.
        </p>
      </div>

      <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 text-center text-sm text-gray-600">
        <p className="font-medium text-gray-700 mb-2">Simulasi Pengujian Routing (Dev Only):</p>
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            onClick={handleSimulateLoginUser}
            className="w-full text-sm gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Simulasi Login sebagai User Biasa
          </Button>

          <Button
            variant="secondary"
            onClick={handleSimulateLoginAdmin}
            className="w-full text-sm gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-purple-600" />
            Simulasi Login sebagai Admin
          </Button>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500">
        Belum punya akun?{' '}
        <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 underline">
          Daftar di sini
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;

