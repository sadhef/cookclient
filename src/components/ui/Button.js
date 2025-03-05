import React from 'react';

const Button = ({ 
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark';
  
  const variants = {
    primary: 'bg-primary text-dark hover:bg-primary/90 active:transform active:scale-95 focus:ring-primary/50',
    secondary: 'bg-transparent border-2 border-primary text-primary hover:bg-primary/10 focus:ring-primary/50',
    danger: 'bg-error hover:bg-error/90 text-white focus:ring-error/50',
    ghost: 'bg-white/5 text-white hover:bg-white/10 focus:ring-white/50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};