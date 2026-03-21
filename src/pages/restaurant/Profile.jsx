import { useEffect, useState } from 'react';
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

function FocusTextarea({ ...props }) {
  const [f, setF] = useState(false);
  return (
    <textarea
      {...props}
      className={`${baseInput} min-h-[90px] resize-none`}
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

function Toggle({ checked, onChange, label, sublabel }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div className="relative flex-shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <div className="w-11 h-6 rounded-full transition-all duration-200" style={{ background: checked ? BRAND : '#e2e8f0' }} />
        <div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200" style={{ left: checked ? '23px' : '4px' }} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-700">{label}</p>
        {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
      </div>
    </label>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${BRAND}15` }}>
          <i className={`fas ${icon} text-sm`} style={{ color: BRAND }} />
        </div>
        <h2 className="text-base font-black text-slate-800">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function RestaurantProfile() {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');
  const [form, setForm] = useState({
    name: '', cuisine: '', image: '', address: '',
    phone: '', description: '', deliveryTime: '',
    minOrder: 0, deliveryFee: 0, badge: '', isOpen: true,
  });

  useEffect(() => {
    setLoading(true); setError('');
    api.restaurant.profile()
      .then(data => setForm(f => ({ ...f, ...data })))
      .catch(e => setError(e.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setNum = k => e => setForm(p => ({ ...p, [k]: Number(e.target.value) }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.restaurant.updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const uploadLogo = async (file) => {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const data = await api.uploads.restaurantLogo(file);
      setForm(f => ({ ...f, image: data.url || '' }));
    } catch (e) {
      setError(e.message || 'Logo upload failed');
    } finally { setUploading(false); }
  };

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
          <h1 className="text-2xl font-black text-slate-800">Restaurant Profile</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Manage your restaurant's public info and settings</p>
        </div>
        {/* open/closed pill */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border"
          style={form.isOpen
            ? { background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }
            : { background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' }
          }
        >
          <span className="w-2 h-2 rounded-full" style={{ background: form.isOpen ? '#22c55e' : '#ef4444' }} />
          {form.isOpen ? 'Open for orders' : 'Closed'}
        </div>
      </header>

      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <span className="w-8 h-8 border-2 border-slate-200 border-t-orange-400 rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading profile…</span>
          </div>
        ) : (
          <form onSubmit={save} className="space-y-5 max-w-3xl">

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

            {/* ── BRANDING ── */}
            <Section icon="fa-store" title="Branding & Identity">
              <div className="space-y-5">
                {/* logo preview + upload */}
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {form.image
                      ? <img src={form.image} alt="" className="w-full h-full object-cover" />
                      : <i className="fas fa-store text-2xl text-slate-300" />
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
                        <p className="text-sm font-bold text-slate-700">{uploading ? 'Uploading…' : 'Upload logo'}</p>
                        <p className="text-xs text-slate-400">PNG, JPG, WEBP · max 3 MB</p>
                      </div>
                      {uploading && <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin flex-shrink-0" style={{ borderColor: BRAND }} />}
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                        onChange={e => uploadLogo(e.target.files?.[0] || null)} disabled={uploading} />
                    </label>
                    <FocusInput type="text" value={form.image || ''} onChange={set('image')} placeholder="Or paste image URL…" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <Field label="Restaurant Name">
                    <FocusInput type="text" value={form.name} onChange={set('name')} placeholder="e.g. Mama Africa Kitchen" required />
                  </Field>
                  <Field label="Cuisine">
                    <FocusInput type="text" value={form.cuisine || ''} onChange={set('cuisine')} placeholder="e.g. Rwandan, Italian" />
                  </Field>
                  <Field label="Badge">
                    <FocusInput type="text" value={form.badge || ''} onChange={set('badge')} placeholder="e.g. Top Rated, New" />
                  </Field>
                  <Field label="Delivery Time">
                    <FocusInput type="text" value={form.deliveryTime || ''} onChange={set('deliveryTime')} placeholder="e.g. 25–35 min" />
                  </Field>
                </div>

                <Field label="Description">
                  <FocusTextarea value={form.description || ''} onChange={set('description')} placeholder="Tell customers what makes your restaurant special…" />
                </Field>
              </div>
            </Section>

            {/* ── CONTACT & LOCATION ── */}
            <Section icon="fa-location-dot" title="Contact & Location">
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Phone">
                  <FocusInput type="tel" value={form.phone || ''} onChange={set('phone')} placeholder="+250 7XX XXX XXX" />
                </Field>
                <Field label="Address">
                  <FocusInput type="text" value={form.address || ''} onChange={set('address')} placeholder="Street / district in Kigali" />
                </Field>
              </div>
            </Section>

            {/* ── DELIVERY SETTINGS ── */}
            <Section icon="fa-motorcycle" title="Delivery Settings">
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Min Order (RWF)">
                  <FocusInput type="number" min={0} value={form.minOrder ?? 0} onChange={setNum('minOrder')} placeholder="0" />
                </Field>
                <Field label="Delivery Fee (RWF)">
                  <FocusInput type="number" min={0} value={form.deliveryFee ?? 0} onChange={setNum('deliveryFee')} placeholder="0" />
                </Field>
              </div>
            </Section>

            {/* ── STATUS ── */}
            <Section icon="fa-power-off" title="Restaurant Status">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700">Accept orders</p>
                  <p className="text-xs text-slate-400 mt-0.5">Toggle this off when your restaurant is closed or unavailable</p>
                </div>
                <Toggle
                  checked={!!form.isOpen}
                  onChange={e => setForm(p => ({ ...p, isOpen: e.target.checked }))}
                  label=""
                />
              </div>
              <div className="mt-4 flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-medium border"
                style={form.isOpen
                  ? { background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }
                  : { background: '#fff7ed', color: '#9a3412', borderColor: '#fed7aa' }
                }>
                <i className={`fas ${form.isOpen ? 'fa-circle-check' : 'fa-circle-pause'}`} />
                {form.isOpen
                  ? 'Your restaurant is visible and accepting new orders.'
                  : 'Your restaurant is hidden from customers and not accepting orders.'
                }
              </div>
            </Section>

            {/* ── SAVE BUTTON ── */}
            <div className="flex items-center gap-3 pb-4">
              <button
                type="submit"
                disabled={saving || uploading}
                className="inline-flex items-center gap-2 px-8 py-3.5 text-white font-black text-sm rounded-2xl transition-all disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg,${BRAND},${BRAND_D})`,
                  boxShadow: `0 6px 20px ${BRAND}40`,
                }}
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
        )}
      </div>
    </>
  );
}