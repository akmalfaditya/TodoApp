import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useLogin } from '../hooks/useAuth';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clientErrors, setClientErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'Email wajib diisi.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Format email tidak valid.';
    }

    if (!password) {
      errors.password = 'Password wajib diisi.';
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
      await loginMutation.mutateAsync({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setApiError(err.response.data?.error || 'Email atau password salah.');
        } else if (err.response?.data?.error) {
          setApiError(err.response.data.error);
        } else if (err.response?.data?.message) {
          setApiError(err.response.data.message);
        } else {
          setApiError('Gagal terhubung ke server backend. Pastikan server aktif.');
        }
      } else {
        setApiError('Terjadi kesalahan yang tidak terduga.');
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
          Masuk ke Akun
        </h2>
        <p className="text-xs text-zinc-500">
          Masukkan kredensial Anda untuk mengakses workspace
        </p>
      </div>

      {apiError && (
        <div className="flex items-start gap-2.5 p-3 rounded-md bg-rose-50 border border-rose-200/80 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        <Input
          label="Email"
          type="email"
          placeholder="nama@perusahaan.com"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (clientErrors.email) setClientErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={clientErrors.email}
          disabled={loginMutation.isPending}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (clientErrors.password) setClientErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={clientErrors.password}
          disabled={loginMutation.isPending}
        />

        <Button
          type="submit"
          variant="primary"
          isLoading={loginMutation.isPending}
          className="w-full mt-1.5"
        >
          Masuk
        </Button>
      </form>

      <div className="pt-2 text-center text-xs text-zinc-500 border-t border-zinc-100">
        Belum punya akun?{' '}
        <Link
          to="/register"
          className="font-medium text-zinc-900 hover:text-zinc-700 underline underline-offset-2 transition-colors"
        >
          Daftar di sini
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
