import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600" />
          Daftar Akun Baru
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Halaman registrasi lengkap dengan validasi form akan dibangun di Spec 11.
        </p>
      </div>

      <div className="rounded-lg p-6 bg-blue-50 border border-blue-100 text-center text-sm text-blue-700">
        Registrasi akun baru (Full Name, Email, Password) akan terhubung ke endpoint backend <code>/api/auth/register</code>.
      </div>

      <div className="text-center text-sm text-gray-500">
        Sudah memiliki akun?{' '}
        <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 underline">
          Masuk di sini
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;

