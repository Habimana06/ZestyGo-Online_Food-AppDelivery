export default function ConfirmDialog({
  open,
  title = 'Please confirm',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmType = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const confirmPalette =
    confirmType === 'danger'
      ? { bg: '#dc2626', hover: '#b91c1c' }
      : { bg: '#F56230', hover: '#d94e22' };

  return (
    <div className="fixed inset-0 z-[3500] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-[420px] max-w-full bg-white rounded-[22px] border border-slate-100 shadow-2xl p-6">
        <h3 className="text-lg font-black text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white font-black transition disabled:opacity-60"
            style={{ background: confirmPalette.bg }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = confirmPalette.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = confirmPalette.bg;
            }}
          >
            {loading ? 'Working…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
