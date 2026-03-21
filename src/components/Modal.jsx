import { useEffect } from 'react';

export default function Modal({ open, title, children, onClose, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={() => onClose?.()}
        type="button"
      />
      <div className="relative w-full max-w-2xl bg-white rounded-[20px] shadow-custom overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
          <div>
            <div className="text-lg font-semibold text-secondary">{title}</div>
          </div>
          <button
            onClick={() => onClose?.()}
            className="h-10 w-10 rounded-[12px] bg-gray-100 hover:bg-gray-200 text-gray-700"
            type="button"
            aria-label="Close modal"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer ? <div className="p-6 border-t border-gray-100 bg-gray-50">{footer}</div> : null}
      </div>
    </div>
  );
}

