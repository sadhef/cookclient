const Modal = ({ isOpen, onClose, title, children, actions }) => {
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