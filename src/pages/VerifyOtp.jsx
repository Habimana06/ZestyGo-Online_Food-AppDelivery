import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import logo from '../../image/ChatGPT Image Mar 15, 2026, 05_05_02 PM.png';

const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

export default function VerifyOtp() {
  const q = useQuery();
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [email, setEmail] = useState(() => q.get('email') || '');
  const [purpose, setPurpose] = useState(() => q.get('purpose') || 'verify_email');
  const [intent, setIntent] = useState(() => q.get('intent') || '');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    const p = q.get('purpose');
    const e = q.get('email');
    const it = q.get('intent');
    if (typeof p === 'string' && p) setPurpose(p);
    if (typeof e === 'string' && e) setEmail(e);
    if (typeof it === 'string' && it) setIntent(it);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title =
    purpose === 'reset_password'
      ? 'Password reset verification'
      : purpose === 'login_2fa'
        ? 'Login verification'
        : 'Email verification';

  const requestCode = async () => {
    setError('');
    setInfo('');
    const e = String(email || '').trim();
    if (!e) return setError('Email is required');
    setSending(true);
    try {
      await api.auth.requestOtp(e, purpose);
      setInfo('We sent a 6-digit code to your email.');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setSending(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const em = String(email || '').trim();
    const c = String(code || '').trim();
    if (!em) return setError('Email is required');
    if (!/^\d{6}$/.test(c)) return setError('Enter the 6-digit code');
    setVerifying(true);
    try {
      const out = await api.auth.verifyOtp(em, purpose, c, purpose === 'verify_email' && intent ? { intentToken: intent } : {});
      if (purpose === 'verify_email') {
        if (out?.next === 'login_2fa') {
          setInfo('Email verified. We sent a login OTP to your email.');
          setPurpose('login_2fa');
          setCode('');
          return;
        }
        setInfo('Email verified successfully. You can now sign in.');
        setTimeout(() => navigate('/login', { replace: true }), 900);
      } else if (purpose === 'reset_password') {
        // Future: reset password page can use this token.
        const t = out?.token;
        if (t) sessionStorage.setItem('otp_reset_token', t);
        setInfo('OTP verified. Continue to reset password.');
        setTimeout(() => navigate('/forgot-password', { replace: true }), 700);
      } else if (purpose === 'login_2fa') {
        const t = out?.token;
        if (!t) throw new Error('Missing OTP token');
        const login = await api.auth.completeLogin(t);
        if (login?.token) setSession(login.token, login?.user || null);
        const role = login?.user?.role;
        const to =
          role === 'admin'
            ? '/admin/dashboard'
            : role === 'restaurant'
              ? '/restaurant/dashboard'
              : role === 'delivery'
                ? '/delivery/dashboard'
                : role === 'system_assistant'
                  ? '/system-assistant/dashboard'
                : '/';
        if (role === 'customer') localStorage.setItem('customer_welcome_popup_pending', '1');
        setInfo('Login verified. Redirecting…');
        setTimeout(() => navigate(to, { replace: true }), 600);
      } else {
        setInfo('OTP verified.');
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center px-6 py-12 bg-gray-50">
      <div className="w-full max-w-[420px] bg-white rounded-[22px] shadow-custom p-8">
        <Link to="/" className="flex items-center gap-3 mb-6">
          <img src={logo} alt="ZestyGo" className="h-11 w-11 rounded-full object-cover shadow-md" />
          <span className="text-2xl font-extrabold text-secondary tracking-tight">ZestyGo</span>
        </Link>

        <h1 className="text-2xl font-bold text-secondary mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">Enter the 6-digit code we sent to your email.</p>

        {error ? <div className="mb-4 rounded-[14px] bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div> : null}
        {info ? <div className="mb-4 rounded-[14px] bg-green-50 border border-green-200 p-4 text-sm text-green-700">{info}</div> : null}

        <form onSubmit={verify} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">OTP code</label>
            <input
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(ev) => setCode(ev.target.value.replaceAll(/\D/g, '').slice(0, 6))}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-[12px] focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white tracking-[0.35em] text-center font-extrabold text-lg"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={verifying}
            className="w-full py-3 bg-primary text-white font-semibold rounded-[12px] hover:bg-primary-dark disabled:opacity-60"
          >
            {verifying ? 'Verifying…' : 'Verify'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={requestCode}
            disabled={sending}
            className="px-4 py-2 rounded-[12px] border border-gray-200 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Resend code'}
          </button>
          <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </section>
  );
}

