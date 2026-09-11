import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 mt-2">Halaman Tidak Ditemukan</h2>
      <p className="text-sm text-gray-500 max-w-sm mt-1 mb-6">
        Halaman yang Anda tuju tidak ditemukan atau URL mungkin salah ketik.
      </p>
      <Link to="/">
        <Button variant="primary" className="gap-2">
          <Home className="w-4 h-4" />
          Kembali ke Beranda
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;

