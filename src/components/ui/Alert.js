const Alert = ({ variant = 'error', className = '', children }) => {
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