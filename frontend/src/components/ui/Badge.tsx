import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'purple';
  size?: 'sm' | 'md';
  showDot?: boolean;
}

const variantStyles = {
  default: 'bg-zinc-100 text-zinc-800 border-zinc-200/80',
  secondary: 'bg-zinc-50 text-zinc-600 border-zinc-200/60',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
  destructive: 'bg-rose-50 text-rose-700 border-rose-200/80',
  outline: 'bg-transparent text-zinc-700 border-zinc-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
};

const dotColors = {
  default: 'bg-zinc-400',
  secondary: 'bg-zinc-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  destructive: 'bg-rose-500',
  outline: 'bg-zinc-400',
  purple: 'bg-purple-500',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  showDot = false,
  className,
  ...props
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium border rounded-md select-none transition-colors',
        size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;

