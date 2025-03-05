const Input = ({ 
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