import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-md border border-gray-100 p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

