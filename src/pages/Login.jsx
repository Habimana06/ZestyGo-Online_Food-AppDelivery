import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../../image/ChatGPT Image Mar 15, 2026, 05_05_02 PM.png';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';

const HERO_IMAGES = [
  "url('https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1400')",
  "url('https://images.unsplash.com/photo-1550547660-d9450f859349?w=1400')",
  "url('https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1400')",
];

const HERO_CAPTIONS = [
  { title: 'Delicious food,',   accent: 'faster than ever.',    sub: 'Discover top restaurants and get hot meals at your doorstep.' },
  { title: 'Fresh burgers,',    accent: 'every single time.',   sub: 'From flame-grilled classics to craft creations — all in one app.' },
  { title: 'Your favourite',    accent: 'restaurant awaits.',   sub: 'Browse hundreds of menus and order with just a few taps.' },
];

/* ── Styled input with orange focus ring ── */
function Input({ label, children, id }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function FocusInput({ focusStyle = true, ...props }) {
  const [f, setF] = useState(false);
  return (
    <input
      {...props}
      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white outline-none transition-all"
      style={{ borderColor: f ? BRAND : undefined, boxShadow: f ? `0 0 0 3px ${BRAND}18` : undefined }}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════════════ */
export default function Login() {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [heroIdx, setHeroIdx]         = useState(0);

  const { login, user } = useAuth();
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const redirect        = searchParams.get('redirect') || '/';

  useEffect(() => {
    const id = setInterval(() => setHeroIdx(i => (i + 1) % HERO_IMAGES.length), 8000);
    return () => clearInterval(id);
  }, []);

  if (user) {
    const role = user?.role;
    const to   = role === 'admin'      ? '/admin/dashboard'
               : role === 'restaurant' ? '/restaurant/dashboard'
               : role === 'delivery'   ? '/delivery/dashboard'
               : role === 'system_assistant' ? '/system-assistant/dashboard'
               : redirect;
    return <Navigate to={to} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data?.needsOtp && data?.purpose === 'login_2fa') {
        navigate(`/verify-otp?purpose=login_2fa&email=${encodeURIComponent(email)}`);
        return;
      }
      if (data?.needsOtp && data?.purpose === 'verify_email') {
        navigate(`/verify-otp?purpose=verify_email&email=${encodeURIComponent(email)}&intent=${encodeURIComponent(data?.intentToken || '')}`);
        return;
      }
      const role = data?.user?.role;
      if (role === 'customer') {
        localStorage.setItem('customer_welcome_popup_pending', '1');
        navigate('/');
        return;
      }
      navigate(
        role === 'admin'
          ? '/admin/dashboard'
          : role === 'restaurant'
            ? '/restaurant/dashboard'
            : role === 'delivery'
              ? '/delivery/dashboard'
              : role === 'system_assistant'
                ? '/system-assistant/dashboard'
                : redirect,
      );
    } catch (err) {
      const msg = err.message || 'Invalid email or password';
      if (String(msg).toLowerCase().includes('otp') || String(msg).toLowerCase().includes('not verified')) {
        navigate(`/verify-otp?purpose=verify_email&email=${encodeURIComponent(email)}`);
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const caption = HERO_CAPTIONS[heroIdx];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        @keyframes fadeSlide { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes heroZoom  { from{transform:scale(1)} to{transform:scale(1.06)} }
        .hero-zoom { animation: heroZoom 8s ease-in-out forwards; }
        .caption-anim { animation: fadeSlide .5s ease both; }
      `}</style>

      <section className="min-h-screen flex" style={{ fontFamily: 'Sora,sans-serif' }}>

        {/* ── LEFT — HERO ── */}
        <div className="hidden lg:flex lg:w-3/5 min-h-screen relative overflow-hidden"
          style={{ background: '#0f172a' }}>

          {/* slides */}
          {HERO_IMAGES.map((bg, idx) => (
            <div
              key={bg}
              className={`absolute inset-5 rounded-[32px] bg-cover bg-center overflow-hidden transition-opacity duration-700 ${idx === heroIdx ? 'opacity-100' : 'opacity-0'}`}
              style={{ backgroundImage: bg }}
            >
              {idx === heroIdx && <div className="absolute inset-0 hero-zoom" style={{ backgroundImage: bg, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-[32px]" />
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
                  <i className="fas fa-clock" style={{ color: BRAND }} /> Under 30 min delivery
                </span>
                <span className="flex items-center gap-2 text-white/70">
                  <i className="fas fa-star text-yellow-400" /> Loved by foodies
                </span>
              </div>
            </div>

            {/* slide dots */}
            <div className="flex gap-2 mt-8">
              {HERO_IMAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroIdx(i)}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: i === heroIdx ? 24 : 6, background: i === heroIdx ? BRAND : 'rgba(255,255,255,0.3)' }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT — FORM ── */}
        <div className="w-full lg:w-2/5 flex items-center justify-center p-8 lg:p-12 bg-slate-50">
          <div className="w-full max-w-[380px]">

            {/* logo */}
            <Link to="/" className="flex items-center gap-3 mb-10">
              <img src={logo} alt="ZestyGo" className="h-11 w-11 rounded-full object-cover shadow-md" />
              <span className="text-2xl font-black text-slate-800 tracking-tight">ZestyGo</span>
            </Link>

            {/* heading */}
            <div className="mb-8">
              <h1 className="text-3xl font-black text-slate-800 mb-2">Welcome back 👋</h1>
              <p className="text-slate-500 text-sm leading-relaxed">
                Log in to track your orders and enjoy lightning-fast delivery.
              </p>
            </div>

            {/* divider */}
            <div className="flex items-center gap-4 mb-7">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">sign in with email</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input label="Email" id="email">
                <FocusInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                />
              </Input>

              <Input label="Password" id="password">
                <div className="relative">
                  <FocusInput
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                  </button>
                </div>
              </Input>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-500 font-medium">
                  <input type="checkbox" className="rounded border-slate-300 accent-orange-500" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="font-bold transition" style={{ color: BRAND }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                  Forgot password?
                </Link>
              </div>

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
                  color: loading ? '#94a3b8' : '#fff',
                  boxShadow: loading ? 'none' : `0 6px 20px ${BRAND}40`,
                }}
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" /> Signing in…</>
                  : <><i className="fas fa-arrow-right-to-bracket text-xs" /> Sign In</>
                }
              </button>
            </form>

            {/* register link */}
            <p className="text-center text-sm text-slate-500 mt-6">
              New here?{' '}
              <Link to="/register" className="font-bold" style={{ color: BRAND }}>
                Create an account
              </Link>
            </p>

            {/* trust note */}
            <p className="text-center text-[11px] text-slate-400 mt-8 flex items-center justify-center gap-1.5">
              <i className="fas fa-shield-alt" style={{ color: BRAND }} />
              Your data is encrypted and never shared
            </p>
          </div>
        </div>

      </section>
    </>
  );
}