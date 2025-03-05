import React from 'react';

// Button Component
export const Button = ({ 
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

// Card Component
export const Card = ({ className = '', children, ...props }) => {
  return (
    <div 
      className={`bg-dark-light/95 backdrop-blur border border-white/10 rounded-xl shadow-lg ${className}`}
      {...props}
    >
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

// Input Component
export const Input = ({ 
  icon,
  error,
  className = '',
  ...props 
}) => {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-primary">{icon}</span>
        </div>
      )}
      <input
        className={`
          w-full bg-white/5 border border-white/10 rounded-lg
          text-white placeholder-white/50
          focus:border-primary focus:ring-1 focus:ring-primary
          transition-all duration-300
          ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2
          ${error ? 'border-error focus:border-error focus:ring-error' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-error">{error}</p>
      )}
    </div>
  );
};

// Alert Component
export const Alert = ({ variant = 'error', className = '', children }) => {
  const variants = {
    error: 'bg-error/10 border-error/20 text-error',
    success: 'bg-success/10 border-success/20 text-success',
    warning: 'bg-warning/10 border-warning/20 text-warning',
  };

  return (
    <div className={`p-4 rounded-lg border ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

// Modal Component
export const Modal = ({ isOpen, onClose, title, children, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-light max-w-md w-full rounded-xl shadow-xl border border-white/10 transform transition-all">
        <div className="p-6">
          {title && (
            <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
          )}
          <div className="text-white/80">
            {children}
          </div>
          {actions && (
            <div className="mt-6 flex justify-end gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Table Component
export const Table = ({ headers, children, className = '' }) => {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-left ${className}`}>
        <thead className="bg-white/5 border-b border-white/10">
          <tr>
            {headers?.map((header, index) => (
              <th
                key={index}
                className="px-6 py-4 text-sm font-semibold text-white/70 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {children}
        </tbody>
      </table>
    </div>
  );
};