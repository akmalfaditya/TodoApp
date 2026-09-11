import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  type,
  message,
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      bg: 'bg-green-50 border-green-200 text-green-800',
      icon: <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />,
    },
    error: {
      bg: 'bg-red-50 border-red-200 text-red-800',
      icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
    },
  }[type];

  return (
    <div
      role="alert"
      className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-md transition-all animate-in slide-in-from-top-2 ${config.bg}`}
    >
      <div className="flex items-center gap-2.5">
        {config.icon}
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-black/5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;

