const Card = ({ className = '', children, ...props }) => {
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