import { useEffect } from 'react';

export default function Toast({
  message,
  type = 'success',
  duration = 2500,
  position = 'top-right',
  onClose,
}) {
  useEffect(() => {
    if (!message || !onClose) return undefined;
    const timer = setTimeout(() => onClose(), duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isError = type === 'error';
  const palette = isError
    ? {
        bg: '#fef2f2',
        text: '#991b1b',
        border: '#fecaca',
        icon: 'fa-circle-exclamation',
      }
    : {
        bg: '#ecfdf5',
        text: '#166534',
        border: '#bbf7d0',
        icon: 'fa-check-circle',
      };

  const posStyle =
    position === 'top-left'
      ? { top: 20, left: 20 }
      : position === 'bottom-right'
        ? { bottom: 20, right: 20 }
        : position === 'bottom-left'
          ? { bottom: 20, left: 20 }
          : { top: 20, right: 20 };

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 4000,
        background: palette.bg,
        color: palette.text,
        border: `1px solid ${palette.border}`,
        borderRadius: 12,
        padding: '10px 14px',
        boxShadow: '0 8px 20px rgba(0,0,0,.08)',
        fontSize: 12,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        ...posStyle,
      }}
    >
      <i className={`fas ${palette.icon}`} />
      {message}
    </div>
  );
}
