import React from 'react';
import { clsx } from 'clsx';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variantClasses = {
  primary:
    'bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 focus:ring-zinc-900 disabled:bg-zinc-300 disabled:text-zinc-500 shadow-xs border border-transparent',
  secondary:
    'bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 focus:ring-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-400 border border-zinc-200/90 shadow-xs',
  outline:
    'border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 focus:ring-zinc-400 disabled:opacity-50',
  ghost:
    'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 focus:ring-zinc-400 disabled:opacity-50 border border-transparent',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500 disabled:bg-rose-300 shadow-xs border border-transparent',
};

const sizeClasses = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-3.5 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed cursor-pointer select-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {isLoading && (
        <Spinner size={size === 'lg' ? 'md' : 'sm'} className="mr-1.5" />
      )}
      {children}
    </button>
  );
};

export default Button;
