import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';

const baseInput = `w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white outline-none transition-all`;

function FocusInput({ ...props }) {
  const [f, setF] = useState(false);
  return (
    <input
      {...props}
      className={baseInput}
      style={{ borderColor: f ? BRAND : undefined, boxShadow: f ? `0 0 0 3px ${BRAND}18` : undefined }}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
    />
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{label}</label>
      {children}
    </div>
  );
}

export default function DeliveryProfile() {
  const { user } = useAuth();
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');
  const [form, setForm] = useState({ name: '', phone: '', avatar: '' });

  useEffect(() => {
    setForm({ name: user?.name || '', phone: user?.phone || '', avatar: user?.avatar || '' });
  }, [user?.name, user?.phone, user?.avatar]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const uploadAvatar = async (file) => {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const data = await api.profile.uploadAvatar(file);
      setForm(f => ({ ...f, avatar: data?.url || '' }));
    } catch (e) {
      setError(e.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.profile.update({ name: form.name, phone: form.phone, avatar: form.avatar });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const initials = (form.name || 'D').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        * { font-family: 'Sora', sans-serif; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn .25s ease both; }
      `}</style>

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between sticky top-0 z-10"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Delivery Profile</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Update your personal info and avatar</p>
        </div>
      </header>

      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
        <form onSubmit={save} className="max-w-xl space-y-5">

          {/* alerts */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium fade-in">
              <i className="fas fa-exclamation-circle flex-shrink-0" /> {error}
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-medium fade-in">
              <i className="fas fa-check-circle flex-shrink-0" /> Profile saved successfully!
            </div>
          )}

          {/* ── AVATAR CARD ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${BRAND}15` }}>
                <i className="fas fa-image text-sm" style={{ color: BRAND }} />
              </div>
              <h2 className="text-base font-black text-slate-800">Avatar</h2>
            </div>
            <div className="p-6 flex items-center gap-5">
              {/* avatar preview */}
              <div className="w-20 h-20 rounded-full flex-shrink-0 overflow-hidden border-2 border-slate-200 flex items-center justify-center"
                style={{ background: form.avatar ? undefined : `${BRAND}15` }}>
                {form.avatar
                  ? <img src={form.avatar} alt="" className="w-full h-full object-cover" />
                  : <span className="text-xl font-black" style={{ color: BRAND }}>{initials}</span>
                }
              </div>

              <div className="flex-1 space-y-2">
                <label
                  className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-orange-300 transition-colors bg-slate-50"
                  style={{ borderColor: uploading ? BRAND : undefined }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${BRAND}12` }}>
                    <i className="fas fa-upload text-xs" style={{ color: BRAND }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700">{uploading ? 'Uploading…' : 'Upload photo'}</p>
                    <p className="text-xs text-slate-400">PNG, JPG, WEBP · max 3 MB</p>
                  </div>
                  {uploading && <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin flex-shrink-0" style={{ borderColor: BRAND }} />}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                    onChange={e => uploadAvatar(e.target.files?.[0] || null)} disabled={uploading} />
                </label>
                <FocusInput type="text" value={form.avatar} onChange={set('avatar')} placeholder="Or paste image URL…" />
              </div>
            </div>
          </div>

          {/* ── PERSONAL INFO CARD ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${BRAND}15` }}>
                <i className="fas fa-user text-sm" style={{ color: BRAND }} />
              </div>
              <h2 className="text-base font-black text-slate-800">Personal Info</h2>
            </div>
            <div className="p-6 space-y-5">
              <Field label="Full Name">
                <FocusInput type="text" value={form.name} onChange={set('name')} placeholder="Your full name" required />
              </Field>
              <Field label="Phone">
                <FocusInput type="tel" value={form.phone} onChange={set('phone')} placeholder="+250 7XX XXX XXX" />
              </Field>
            </div>
          </div>

          {/* ── SAVE ── */}
          <div className="flex items-center gap-3 pb-4">
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 px-8 py-3.5 text-white font-black text-sm rounded-2xl transition-all disabled:opacity-50"
              style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 6px 20px ${BRAND}40` }}
            >
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
                : <><i className="fas fa-floppy-disk text-xs" /> Save Changes</>
              }
            </button>
            {saved && (
              <span className="text-sm font-bold text-green-600 flex items-center gap-1.5 fade-in">
                <i className="fas fa-check-circle" /> Saved!
              </span>
            )}
          </div>

        </form>
      </div>
    </>
  );
}