import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';
import { Card } from '../ui/Card';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/login" className="inline-flex items-center gap-2 text-blue-600 font-extrabold text-2xl tracking-tight">
          <div className="p-2 bg-blue-100 rounded-xl text-blue-600 shadow-sm">
            <CheckSquare className="w-7 h-7" />
          </div>
          <span>TodoApp</span>
        </Link>
        <p className="mt-2 text-sm text-gray-500">
          Kelola tugas Anda dengan mudah, rapi, dan efisien.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-lg border-gray-200">
          <Outlet />
        </Card>
      </div>
    </div>
  );
};

export default AuthLayout;

