import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { CheckSquare, Shield } from 'lucide-react';
import { Card } from '../ui/Card';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased selection:bg-zinc-900 selection:text-white">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2.5 text-zinc-900 font-bold text-xl tracking-tight group"
        >
          <div className="w-8 h-8 bg-zinc-900 text-white rounded-lg flex items-center justify-center shadow-xs group-hover:bg-zinc-800 transition-colors">
            <CheckSquare className="w-4 h-4" />
          </div>
          <span>TodoApp</span>
        </Link>
        <h2 className="mt-2 text-xs font-medium text-zinc-500 tracking-wide uppercase">
          Enterprise Task Management Platform
        </h2>
      </div>

      {/* Main Auth Container */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="p-6 sm:p-7 bg-white rounded-xl border border-zinc-200/80 shadow-subtle">
          <Outlet />
        </Card>

        {/* Security / Compliance Micro-badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
          <Shield className="w-3.5 h-3.5" />
          <span>Secure JWT Authentication &bull; Role-Based Access Control</span>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
