import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../../image/ChatGPT Image Mar 15, 2026, 05_05_02 PM.png';
import Modal from '../components/Modal';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';

const API_URL = String(import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const HERO_IMAGES = [
  "url('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1400')",
  "url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1400')",
  "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400')",
];

const HERO_CAPTIONS = [
  { title: 'Join thousands of',  accent: 'happy food lovers.',    sub: 'Create your ZestyGo account and start exploring top-rated restaurants.' },
  { title: 'Exclusive deals,',   accent: 'just for you.',         sub: 'New members get 50% off their first order with code FIRST50.'            },
  { title: 'Your favourite',     accent: 'restaurant awaits.',    sub: 'Browse hundreds of menus and order with just a few taps.'                },
];

/* ── Labelled field wrapper ── */
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{label}</label>
      {children}
    </div>
  );
}

/* ── Input with orange focus ring ── */
const baseInput = `w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white outline-none transition-all`;

function FocusInput({ ...props }) {
  const [f, setF] = useState(false);
  return (
    <input
      {...props}
      className={baseInput + (props.className ? ' ' + props.className : '')}
      style={{ borderColor: f ? BRAND : undefined, boxShadow: f ? `0 0 0 3px ${BRAND}18` : undefined, ...props.style }}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
    />
  );
}

function FocusSelect({ children, value, onChange, required }) {
  const [f, setF] = useState(false);
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        required={required}
        className={`${baseInput} appearance-none pr-9 cursor-pointer`}
        style={{ borderColor: f ? BRAND : undefined, boxShadow: f ? `0 0 0 3px ${BRAND}18` : undefined }}
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
      >
        {children}
      </select>
      <i className="fas fa-chevron-down text-[10px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder = '••••••••', ...props }) {
  const [show, setShow] = useState(false);
  const [f, setF]       = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={baseInput}
        style={{ paddingRight: '3rem', borderColor: f ? BRAND : undefined, boxShadow: f ? `0 0 0 3px ${BRAND}18` : undefined }}
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
      >
        <i className={`fas ${show ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════════════ */
export default function Register() {
  const [form, setForm] = useState({
    role: 'customer', firstName: '', lastName: '', email: '',
    phone: '', restaurantName: '', restaurantImage: '',
    cuisine: '', address: '', password: '', confirmPassword: '', terms: false,
  });
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [heroIdx, setHeroIdx]           = useState(0);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [pendingRole, setPendingRole]   = useState('');

  const { register, user } = useAuth();
  const navigate           = useNavigate();

  useEffect(() => {
    const id = setInterval(() => setHeroIdx(i => (i + 1) % HERO_IMAGES.length), 8000);
    return () => clearInterval(id);
  }, []);

  if (user) {
    const role = user?.role;
    const to   = role === 'admin'      ? '/admin/dashboard'
               : role === 'restaurant' ? '/restaurant/dashboard'
               : role === 'delivery'   ? '/delivery/dashboard'
               : '/';
    return <Navigate to={to} replace />;
  }

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?]).{8,}$/;
    if (!strongPassword.test(form.password)) {
      return setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
    }
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (!form.terms)                       return setError('Please accept the Terms & Privacy Policy.');
    if ((form.role === 'delivery' || form.role === 'restaurant') && !form.phone.trim())
      return setError('Phone number is required for this role.');
    if (form.role === 'restaurant' && !form.restaurantName.trim())
      return setError('Restaurant name is required.');
    setLoading(true);
    try {
      const data = await register({
        name: `${form.firstName} ${form.lastName}`,
        email: form.email, phone: form.phone,
        password: form.password, role: form.role,
        ...(form.role === 'restaurant' ? {
          restaurantName: form.restaurantName,
          restaurantImage: form.restaurantImage,
          cuisine: form.cuisine, address: form.address,
        } : {}),
      });
      if (data?.needsOtp) {
        navigate(`/verify-otp?purpose=${encodeURIComponent(data?.purpose || 'verify_email')}&email=${encodeURIComponent(form.email)}`);
        return;
      }
      const role      = data?.user?.role || form.role;
      const isPending = data?.user?.isApproved === false && (role === 'restaurant' || role === 'delivery');
      if (isPending) { setPendingRole(role); setPendingModalOpen(true); return; }
      navigate(role === 'admin' ? '/admin/dashboard' : role === 'restaurant' ? '/restaurant/dashboard' : role === 'delivery' ? '/delivery/dashboard' : '/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploadRestaurantLogo = async (file) => {
    if (!file) return;
    setLogoUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res  = await fetch(`/api/uploads/restaurant-logo`, { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setForm(f => ({ ...f, restaurantImage: data.url || '' }));
    } catch (e) {
      setError(e.message || 'Logo upload failed');
    } finally {
      setLogoUploading(false);
    }
  };

  const caption = HERO_CAPTIONS[heroIdx];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        @keyframes fadeSlide { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes heroZoom  { from{transform:scale(1)} to{transform:scale(1.06)} }
        .hero-zoom    { animation: heroZoom 8s ease-in-out forwards; }
        .caption-anim { animation: fadeSlide .5s ease both; }
      `}</style>

      <section className="min-h-screen flex" style={{ fontFamily: 'Sora,sans-serif' }}>

        {/* ── LEFT — HERO ── */}
        <div className="hidden lg:flex lg:w-3/5 min-h-screen relative overflow-hidden"
          style={{ background: '#0f172a' }}>

          {HERO_IMAGES.map((bg, idx) => (
            <div
              key={bg}
              className={`absolute inset-5 rounded-[32px] overflow-hidden transition-opacity duration-700 ${idx === heroIdx ? 'opacity-100' : 'opacity-0'}`}
            >
              {idx === heroIdx && (
                <div className="absolute inset-0 hero-zoom bg-cover bg-center" style={{ backgroundImage: bg }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent rounded-[32px]" />
            </div>
          ))}

          {/* caption */}
          <div className="relative z-10 flex flex-col justify-end h-full px-12 pb-12">
            <div key={heroIdx} className="caption-anim">
              <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-5 border"
                style={{ color: BRAND, background: `${BRAND}20`, borderColor: `${BRAND}40` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND }} />
                🍴 Fast delivery across Kigali
              </span>
              <h2 className="text-4xl font-black text-white mb-3 leading-tight">
                {caption.title}<br />
                <span style={{ color: BRAND }}>{caption.accent}</span>
              </h2>
              <p className="text-white/60 mb-8 leading-relaxed max-w-sm">{caption.sub}</p>
              <div className="flex items-center gap-5 text-sm">
                <span className="flex items-center gap-2 text-white/70">
                  <i className="fas fa-store" style={{ color: BRAND }} /> 500+ partners
                </span>
                <span className="flex items-center gap-2 text-white/70">
                  <i className="fas fa-gift" style={{ color: BRAND }} /> Welcome discounts
                </span>
              </div>
            </div>
            {/* slide dots */}
            <div className="flex gap-2 mt-8">
              {HERO_IMAGES.map((_, i) => (
                <button key={i} onClick={() => setHeroIdx(i)}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: i === heroIdx ? 24 : 6, background: i === heroIdx ? BRAND : 'rgba(255,255,255,0.3)' }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT — FORM ── */}
        <div className="w-full lg:w-2/5 bg-slate-50 lg:h-screen lg:overflow-y-auto">
          <div className="flex items-start justify-center px-8 lg:px-12">
            <div className="w-full max-w-[400px] py-8">

              {/* logo */}
              <Link to="/" className="flex items-center gap-3 mb-8">
                <img src={logo} alt="ZestyGo" className="h-11 w-11 rounded-full object-cover shadow-md" />
                <span className="text-2xl font-black text-slate-800 tracking-tight">ZestyGo</span>
              </Link>

              {/* heading */}
              <div className="mb-7">
                <h1 className="text-3xl font-black text-slate-800 mb-2">Create your account</h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Sign up in a few steps and start ordering your favourite meals.
                </p>
              </div>

              {/* divider */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">fill in your details</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* role */}
                <Field label="Sign up as">
                  <FocusSelect value={form.role} onChange={set('role')}>
                    <option value="customer">Customer</option>
                    <option value="restaurant">Restaurant Owner</option>
                    <option value="delivery">Delivery Rider</option>
                  </FocusSelect>
                  {(form.role === 'delivery' || form.role === 'restaurant') && (
                    <div className="mt-2.5 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                      <i className="fas fa-clock-rotate-left mt-0.5 flex-shrink-0" />
                      This role requires admin verification — approval usually takes <strong className="ml-1">2–3 business days</strong>.
                    </div>
                  )}
                </Field>

                {/* name */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label={form.role === 'restaurant' ? 'Owner First Name' : 'First Name'}>
                    <FocusInput type="text" value={form.firstName} onChange={set('firstName')} required placeholder="John" />
                  </Field>
                  <Field label={form.role === 'restaurant' ? 'Owner Last Name' : 'Last Name'}>
                    <FocusInput type="text" value={form.lastName} onChange={set('lastName')} required placeholder="Doe" />
                  </Field>
                </div>

                {/* email */}
                <Field label="Email">
                  <FocusInput type="email" value={form.email} onChange={set('email')} required placeholder="your@email.com" />
                </Field>

                {/* phone */}
                <Field label={`Phone${form.role === 'customer' ? ' (optional)' : ''}`}>
                  <FocusInput
                    type="tel"
                    value={form.phone}
                    onChange={set('phone')}
                    required={form.role === 'delivery' || form.role === 'restaurant'}
                    placeholder="+250 7XX XXX XXX"
                  />
                </Field>

                {/* restaurant-specific fields */}
                {form.role === 'restaurant' && (
                  <div className="space-y-5 pt-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <div className="flex-1 h-px bg-slate-200" />
                      Restaurant details
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    <Field label="Restaurant Name">
                      <FocusInput type="text" value={form.restaurantName} onChange={set('restaurantName')} required placeholder="e.g. Mama Africa Kitchen" />
                    </Field>

                    <Field label="Restaurant Logo / Avatar">
                      <div className="space-y-3">
                        <label
                          className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-orange-300 transition-colors bg-white"
                          style={{ borderColor: logoUploading ? BRAND : undefined }}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${BRAND}12` }}>
                            <i className="fas fa-upload text-xs" style={{ color: BRAND }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-700">
                              {logoUploading ? 'Uploading…' : 'Upload image'}
                            </p>
                            <p className="text-xs text-slate-400">PNG, JPG, WEBP · max 3 MB</p>
                          </div>
                          {logoUploading && <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin flex-shrink-0" style={{ borderColor: BRAND }} />}
                          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                            onChange={e => uploadRestaurantLogo(e.target.files?.[0] || null)} disabled={logoUploading} />
                        </label>

                        <FocusInput type="text" value={form.restaurantImage} onChange={set('restaurantImage')} placeholder="Or paste an image URL" />

                        {form.restaurantImage && (
                          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
                            <img src={form.restaurantImage} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-slate-700">Preview</p>
                              <p className="text-[10px] text-slate-400">This will appear on customer pages</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </Field>

                    <Field label="Cuisine (optional)">
                      <FocusInput type="text" value={form.cuisine} onChange={set('cuisine')} placeholder="e.g. Rwandan, African, Italian" />
                    </Field>

                    <Field label="Address (optional)">
                      <FocusInput type="text" value={form.address} onChange={set('address')} placeholder="Street / district in Kigali" />
                    </Field>
                  </div>
                )}

                {/* passwords */}
                <Field label="Password">
                  <PasswordInput value={form.password} onChange={set('password')} required minLength={8} placeholder="Min. 8 chars, Aa1!" />
                  <p className="mt-2 text-xs text-slate-500">
                    Use at least 8 characters with uppercase, lowercase, number, and special character.
                  </p>
                </Field>

                <Field label="Confirm Password">
                  <PasswordInput value={form.confirmPassword} onChange={set('confirmPassword')} required placeholder="Repeat your password" />
                </Field>

                {/* ── TERMS CHECKBOX (fixed: removed duplicate onClick from div) ── */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={form.terms}
                      onChange={e => setForm(p => ({ ...p, terms: e.target.checked }))}
                      className="sr-only"
                    />
                    <div
                      className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                      style={{
                        background:  form.terms ? BRAND : 'white',
                        borderColor: form.terms ? BRAND : '#e2e8f0',
                        boxShadow:   form.terms ? `0 0 0 3px ${BRAND}20` : 'none',
                      }}
                    >
                      {form.terms && <i className="fas fa-check text-white" style={{ fontSize: 9 }} />}
                    </div>
                  </div>
                  <span className="text-sm text-slate-600 leading-relaxed">
                    I agree to the{' '}
                    <a href="#" className="font-bold" style={{ color: BRAND }}>Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="font-bold" style={{ color: BRAND }}>Privacy Policy</a>
                  </span>
                </label>

                {/* error */}
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                    <i className="fas fa-exclamation-circle flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: loading ? '#e2e8f0' : `linear-gradient(135deg,${BRAND},${BRAND_D})`,
                    color:      loading ? '#94a3b8' : '#fff',
                    boxShadow:  loading ? 'none' : `0 6px 20px ${BRAND}40`,
                  }}
                >
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" /> Creating account…</>
                    : <><i className="fas fa-user-plus text-xs" /> Create Account</>
                  }
                </button>
              </form>

              {/* login link */}
              <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="font-bold" style={{ color: BRAND }}>Sign In</Link>
              </p>

              {/* trust note */}
              <p className="text-center text-[11px] text-slate-400 mt-6 flex items-center justify-center gap-1.5">
                <i className="fas fa-shield-alt" style={{ color: BRAND }} />
                Your data is encrypted and never shared
              </p>

            </div>
          </div>
        </div>
      </section>

      {/* ── PENDING APPROVAL MODAL ── */}
      <Modal
        open={pendingModalOpen}
        title="Registration submitted!"
        onClose={() => { setPendingModalOpen(false); navigate('/login'); }}
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => { setPendingModalOpen(false); navigate('/login'); }}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-white font-bold text-sm rounded-xl"
              style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 4px 14px ${BRAND}33` }}
            >
              <i className="fas fa-arrow-right-to-bracket text-xs" /> Go to Login
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-slate-700">
          <p className="text-sm leading-relaxed">
            Your <strong>{pendingRole === 'restaurant' ? 'restaurant' : 'delivery rider'}</strong> account has been created
            and is now <strong>pending admin verification</strong>.
          </p>
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
            <i className="fas fa-clock-rotate-left mt-0.5 flex-shrink-0" />
            <span>Please wait <strong>2–3 business days</strong> for approval. Once verified you can log in and access your dashboard.</span>
          </div>
        </div>
      </Modal>
    </>
  );
}