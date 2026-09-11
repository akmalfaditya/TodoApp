import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useRegister } from '../hooks/useAuth';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [clientErrors, setClientErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    const errors: typeof clientErrors = {};

    if (!fullName.trim()) {
      errors.fullName = 'Nama lengkap wajib diisi.';
    }

    if (!email.trim()) {
      errors.email = 'Email wajib diisi.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Format email tidak valid.';
    }

    if (!password) {
      errors.password = 'Password wajib diisi.';
    } else if (password.length < 8) {
      errors.password = 'Password minimal 8 karakter.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Konfirmasi password wajib diisi.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Password dan konfirmasi password tidak cocok.';
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) {
      return;
    }

    try {
      await registerMutation.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });
      navigate('/', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.data?.errors && Array.isArray(err.response.data.errors) && err.response.data.errors.length > 0) {
          setApiError(err.response.data.errors.join(' '));
        } else if (err.response?.data?.error) {
          setApiError(err.response.data.error);
        } else if (err.response?.data?.message) {
          setApiError(err.response.data.message);
        } else {
          setApiError('Gagal mendaftar akun baru. Pastikan server backend aktif.');
        }
      } else {
        setApiError('Terjadi kesalahan yang tidak terduga.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600" />
          Daftar Akun Baru
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Lengkapi data diri untuk membuat akun TodoApp
        </p>
      </div>

      {apiError && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Nama Lengkap"
          type="text"
          placeholder="e.g. John Doe"
          autoComplete="name"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (clientErrors.fullName) setClientErrors((prev) => ({ ...prev, fullName: undefined }));
          }}
          error={clientErrors.fullName}
          disabled={registerMutation.isPending}
        />

        <Input
          label="Email"
          type="email"
          placeholder="nama@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (clientErrors.email) setClientErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={clientErrors.email}
          disabled={registerMutation.isPending}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Minimal 8 karakter"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (clientErrors.password) setClientErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={clientErrors.password}
          helperText="Minimal 8 karakter, huruf besar, kecil, dan angka."
          disabled={registerMutation.isPending}
        />

        <Input
          label="Konfirmasi Password"
          type="password"
          placeholder="Ulangi password di atas"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (clientErrors.confirmPassword) setClientErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }}
          error={clientErrors.confirmPassword}
          disabled={registerMutation.isPending}
        />

        <Button
          type="submit"
          variant="primary"
          isLoading={registerMutation.isPending}
          className="w-full mt-2"
        >
          Daftar Sekarang
        </Button>
      </form>

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
