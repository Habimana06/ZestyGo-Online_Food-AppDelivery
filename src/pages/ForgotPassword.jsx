import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import logo from '../../image/ChatGPT Image Mar 15, 2026, 05_05_02 PM.png';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';

const HERO_IMAGES = [
  "url('https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1400')",
  "url('https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1400')",
  "url('https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=1400')",
];

const HERO_CAPTIONS = [
  { title: 'Forgot your',   accent: 'password?',        sub: 'No worries — enter your email and we\'ll send you a reset link in seconds.' },
  { title: 'Back to your',  accent: 'favourite meals.', sub: 'One quick step and you\'ll be ordering again before you know it.'           },
  { title: 'We\'ve got',    accent: 'you covered.',     sub: 'Your account is safe. Reset your password and get back in the kitchen.'     },
];

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{label}</label>
      {children}
    </div>
  );
}

const baseInput = `w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white outline-none transition-all`;

function FocusInput({ ...props }) {
  const [f, setF] = useState(false);
  return (
    <input
      {...props}
      className={baseInput}
      style={{
        borderColor: f ? BRAND : undefined,
        boxShadow:   f ? `0 0 0 3px ${BRAND}18` : undefined,
        ...props.style,
      }}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
    />
  );
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [step, setStep] = useState('email'); // email -> otp -> new-password -> done
  const [loading, setLoading] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    const id = setInterval(() => setHeroIdx(i => (i + 1) % HERO_IMAGES.length), 8000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email) return setError('Email is required');
    setLoading(true);
    try {
      await api.auth.requestOtp(String(email).trim(), 'reset_password');
      setInfo('A 6-digit code has been sent to your verified email.');
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const cleanCode = String(code || '').trim();
    if (!/^\d{6}$/.test(cleanCode)) return setError('Enter the 6-digit code');
    setLoading(true);
    try {
      const out = await api.auth.verifyOtp(String(email).trim(), 'reset_password', cleanCode);
      const t = String(out?.token || '');
      if (!t) throw new Error('Reset session not created. Please try again.');
      setResetToken(t);
      setInfo('Code verified. You can now set a new password.');
      setStep('new-password');
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?]).{8,}$/;
    if (!strongPassword.test(newPassword)) {
      return setError('New password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
    }
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    if (!resetToken) return setError('Reset session expired. Please request a new code.');
    setLoading(true);
    try {
      await api.auth.resetPassword(resetToken, newPassword);
      setStep('done');
      setInfo('Password updated successfully. Redirecting to login...');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      setError(err.message || 'Failed to update password');
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

          <div className="relative z-10 flex flex-col justify-end h-full px-12 pb-12">
            <div key={heroIdx} className="caption-anim">
              <span
                className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-5 border"
                style={{ color: BRAND, background: `${BRAND}20`, borderColor: `${BRAND}40` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND }} />
                🔐 Secure password reset
              </span>
              <h2 className="text-4xl font-black text-white mb-3 leading-tight">
                {caption.title}<br />
                <span style={{ color: BRAND }}>{caption.accent}</span>
              </h2>
              <p className="text-white/60 mb-8 leading-relaxed max-w-sm">{caption.sub}</p>
              <div className="flex items-center gap-5 text-sm">
                <span className="flex items-center gap-2 text-white/70">
                  <i className="fas fa-envelope-open-text" style={{ color: BRAND }} /> Email link
                </span>
                <span className="flex items-center gap-2 text-white/70">
                  <i className="fas fa-shield-halved" style={{ color: BRAND }} /> Encrypted & safe
                </span>
              </div>
            </div>
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

        {/* ── RIGHT — FORM (vertically centered) ── */}
        <div className="w-full lg:w-2/5 bg-slate-50 flex items-center justify-center min-h-screen">
          <div className="w-full max-w-[400px] px-8 lg:px-12">

            {/* logo */}
            <Link to="/" className="flex items-center gap-3 mb-8">
              <img src={logo} alt="ZestyGo" className="h-11 w-11 rounded-full object-cover shadow-md" />
              <span className="text-2xl font-black text-slate-800 tracking-tight">ZestyGo</span>
            </Link>

            {/* heading */}
            <div className="mb-7">
              <h1 className="text-3xl font-black text-slate-800 mb-2">Reset password</h1>
              <p className="text-slate-500 text-sm leading-relaxed">
                Enter the email associated with your account and we'll send you instructions to reset your password.
              </p>
            </div>

            {/* divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">enter your email</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {step === 'done' ? (
              <div className="space-y-5">
                <div className="flex flex-col items-center text-center px-4 py-8 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: `${BRAND}15` }}
                  >
                    <i className="fas fa-paper-plane text-xl" style={{ color: BRAND }} />
                  </div>
                  <h2 className="text-lg font-black text-slate-800 mb-2">Password updated</h2>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Your password for <span className="font-bold text-slate-700">{email}</span> has been reset successfully.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-medium">
                  <i className="fas fa-circle-info mt-0.5 flex-shrink-0" />
                  <span>You will be redirected to login. Please sign in with your new password.</span>
                </div>

                <button
                  onClick={() => navigate('/login', { replace: true })}
                  className="w-full py-3 text-sm font-bold rounded-2xl border-2 transition-all"
                  style={{ borderColor: BRAND, color: BRAND, background: `${BRAND}08` }}
                >
                  Go to login
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                ) : null}
                {info ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{info}</div>
                ) : null}

                {step === 'email' ? (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <Field label="Email">
                      <FocusInput
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="your@email.com"
                      />
                    </Field>

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
                        ? <><span className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" /> Sending code…</>
                        : <><i className="fas fa-paper-plane text-xs" /> Send reset code</>
                      }
                    </button>
                  </form>
                ) : null}

                {step === 'otp' ? (
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <Field label="Email">
                      <FocusInput type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </Field>
                    <Field label="OTP code">
                      <FocusInput
                        inputMode="numeric"
                        pattern="\d{6}"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replaceAll(/\D/g, '').slice(0, 6))}
                        required
                        placeholder="Enter 6-digit code"
                      />
                    </Field>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep('email')}
                        className="w-1/2 py-3 text-sm font-bold rounded-2xl border border-slate-300 text-slate-600"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-1/2 py-3 text-white font-black text-sm rounded-2xl"
                        style={{ background: loading ? '#e2e8f0' : `linear-gradient(135deg,${BRAND},${BRAND_D})`, color: loading ? '#94a3b8' : '#fff' }}
                      >
                        {loading ? 'Verifying…' : 'Verify code'}
                      </button>
                    </div>
                  </form>
                ) : null}

                {step === 'new-password' ? (
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <Field label="New password">
                      <FocusInput
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Min. 8 chars, Aa1!"
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Use at least 8 characters with uppercase, lowercase, number, and special character.
                      </p>
                    </Field>
                    <Field label="Confirm password">
                      <FocusInput
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Re-enter new password"
                      />
                    </Field>
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
                        ? <><span className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" /> Updating…</>
                        : <><i className="fas fa-key text-xs" /> Update password</>
                      }
                    </button>
                  </form>
                ) : null}
              </div>
            )}

            <p className="text-center text-sm text-slate-500 mt-6">
              Remembered your password?{' '}
              <Link to="/login" className="font-bold" style={{ color: BRAND }}>Back to login</Link>
            </p>

            <p className="text-center text-[11px] text-slate-400 mt-6 flex items-center justify-center gap-1.5">
              <i className="fas fa-shield-alt" style={{ color: BRAND }} />
              Your data is encrypted and never shared
            </p>

          </div>
        </div>
      </section>
    </>
  );
}