import { useEffect, useMemo, useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../api';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';

const money = (n) => `RWF ${Number(n || 0).toLocaleString()}`;

function useCountUp(target, duration = 1100) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    let v = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      v += step;
      if (v >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(v));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return val;
}

function Sparkline({ data, color }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !data?.length) return;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => ({
      x: (i / Math.max(data.length - 1, 1)) * W,
      y: H - ((v - min) / range) * (H - 4) - 2,
    }));
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = color + '22';
    ctx.fill();
  }, [data, color]);
  return <canvas ref={ref} width={88} height={32} style={{ display: 'block' }} />;
}

const STATUS_STYLE = {
  pending:   { bg: '#fffbeb', color: '#d97706', icon: 'fa-clock' },
  approved:  { bg: '#f0fdf4', color: '#16a34a', icon: 'fa-check-circle' },
  completed: { bg: '#eff6ff', color: '#2563eb', icon: 'fa-check-double' },
  rejected:  { bg: '#fef2f2', color: '#dc2626', icon: 'fa-times-circle' },
  failed:    { bg: '#fef2f2', color: '#dc2626', icon: 'fa-ban' },
};

function WithdrawalRow({ w, idx }) {
  const s = String(w.status || 'pending').toLowerCase().replaceAll(' ', '_');
  const style = STATUS_STYLE[s] || STATUS_STYLE.pending;
  const method = String(w.method || '').toUpperCase();
  const date = w.createdAt ? new Date(w.createdAt) : null;

  return (
    <div className="wr-row" style={{ animationDelay: `${idx * 40}ms` }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`fas ${style.icon}`} style={{ color: style.color, fontSize: 15 }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 14, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>
          {money(w.amount)}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
          <span style={{ background: '#f1f5f9', borderRadius: 6, padding: '1px 6px', fontWeight: 600, marginRight: 6 }}>{method}</span>
          {w.account}
        </div>
      </div>

      {date && (
        <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', flexShrink: 0 }}>
          {date.toLocaleDateString('en-RW', { day: '2-digit', month: 'short' })}
          <div>{date.toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      )}

      <span style={{
        fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '4px 10px',
        background: style.bg, color: style.color, whiteSpace: 'nowrap', flexShrink: 0,
        textTransform: 'capitalize',
      }}>
        {s.replaceAll('_', ' ')}
      </span>
    </div>
  );
}

function QuickAmt({ value, balance, onClick }) {
  const pct = Math.round((value / balance) * 100);
  const disabled = value > balance;
  return (
    <button
      type="button"
      onClick={() => !disabled && onClick(value)}
      style={{
        flex: 1, padding: '8px 4px', borderRadius: 10, border: '1px solid',
        borderColor: disabled ? '#e2e8f0' : '#fde68a',
        background: disabled ? '#f8fafc' : '#fffbeb',
        color: disabled ? '#94a3b8' : '#b45309',
        fontSize: 12, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all .15s', textAlign: 'center',
      }}
    >
      <div>{pct}%</div>
      <div style={{ fontSize: 10, marginTop: 1, fontWeight: 500 }}>{money(value)}</div>
    </button>
  );
}

export default function RestaurantWallet() {
  const { user, loading: authLoading, isLoggedIn } = useAuth();
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [balance, setBalance]       = useState(0);
  const [withdrawals, setWithdrawals] = useState([]);
  const [open, setOpen]             = useState(false);
  const [form, setForm]             = useState({ amount: '', method: 'momo', account: '' });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter]         = useState('all');

  const animatedBalance = useCountUp(balance);

  const load = async () => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      setError('Please login to access wallet.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.restaurant.wallet();
      setBalance(Number(data?.balance || 0));
      setWithdrawals(Array.isArray(data?.withdrawals) ? data.withdrawals : []);
    } catch (e) {
      setError(e.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn || user?.role !== 'restaurant') return;
    load();
  }, [authLoading, isLoggedIn, user?.role]);

  if (!authLoading && (!isLoggedIn || user?.role !== 'restaurant')) {
    return <Navigate to="/login?redirect=/restaurant/wallet" replace />;
  }

  const canSubmit = useMemo(() => {
    const a = Number(String(form.amount || '').trim());
    return Number.isFinite(a) && a > 0 && a <= balance && String(form.account || '').trim().length > 0;
  }, [form.amount, form.account, balance]);

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.restaurant.withdraw({
        amount: Number(String(form.amount || '').trim()),
        method: form.method,
        account: String(form.account || '').trim(),
      });
      setOpen(false);
      setForm({ amount: '', method: 'momo', account: '' });
      await load();
    } catch (e) {
      setError(e.message || 'Withdrawal failed');
    } finally {
      setSubmitting(false);
    }
  };

  const totalWithdrawn = withdrawals
    .filter(w => ['approved','completed'].includes(String(w.status||'').toLowerCase()))
    .reduce((s, w) => s + Number(w.amount || 0), 0);

  const pendingCount = withdrawals.filter(w => String(w.status||'').toLowerCase() === 'pending').length;
  const sparkData = withdrawals.slice(0, 7).map(w => Number(w.amount || 0)).reverse();

  const filtered = filter === 'all'
    ? withdrawals
    : withdrawals.filter(w => String(w.status || '').toLowerCase().includes(filter));

  const quickAmounts = [
    Math.floor(balance * 0.25),
    Math.floor(balance * 0.5),
    Math.floor(balance * 0.75),
    balance,
  ].filter(Boolean);

  const today = useMemo(() =>
    new Date().toLocaleDateString('en-RW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  , []);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; }
    .wlt { font-family: 'DM Sans', sans-serif; background: #f8fafc; min-height: 100vh; }
    .wlt-hdr { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 18px 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; position: sticky; top: 0; z-index: 50; }
    .wlt-hdr h1 { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .wlt-hdr-sub { font-size: 12px; color: #94a3b8; margin-top: 3px; }
    .wlt-hdr-right { display: flex; align-items: center; gap: 10px; }
    .wlt-withdraw-btn { display: flex; align-items: center; gap: 8px; background: #f59e0b; color: #fff; font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 700; padding: 9px 20px; border-radius: 11px; border: none; cursor: pointer; transition: all .15s; }
    .wlt-withdraw-btn:hover:not(:disabled) { background: #d97706; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(217,119,6,.3); }
    .wlt-withdraw-btn:disabled { opacity: .5; cursor: not-allowed; }
    .wlt-ico-btn { width: 36px; height: 36px; border-radius: 9px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; font-size: 13px; }
    .wlt-ico-btn:hover { background: #f1f5f9; color: #0f172a; }
    .wlt-body { padding: 24px 32px 48px; }
    .wlt-err { background: #fff; border: 1px solid #fecaca; border-radius: 14px; padding: 14px 18px; color: #dc2626; font-size: 13px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
    .sec-lbl { font-size: 10px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: #94a3b8; margin-bottom: 12px; }
    .pending-banner { background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 1px solid #fde68a; border-radius: 14px; padding: 14px 20px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; animation: fu .4s ease both; }
    .pb-icon { width: 36px; height: 36px; border-radius: 10px; background: #fef3c7; display: flex; align-items: center; justify-content: center; color: #d97706; font-size: 16px; flex-shrink: 0; }
    .balance-card-wrap { perspective: 1200px; animation: fu .55s ease both; }
    .wallet-top-row { display: grid; grid-template-columns: 520px 1fr; gap: 16px; margin-bottom: 14px; align-items: start; }
    @media(max-width:1100px){ .wallet-top-row { grid-template-columns: 1fr; } }
    .side-panel { display: flex; flex-direction: column; gap: 12px; }
    .quick-actions { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px 20px; animation: fu .5s ease .08s both; }
    .qa-title { font-family: 'Sora',sans-serif; font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .qa-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
    .qa-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; padding: 14px 8px; border-radius: 14px; border: 1.5px solid #f1f5f9; background: #fafafa; cursor: pointer; transition: all .18s; text-align: center; }
    .qa-btn:hover:not(:disabled) { background: #fff; border-color: #e2e8f0; box-shadow: 0 6px 20px rgba(0,0,0,.07); transform: translateY(-2px); }
    .qa-btn:disabled { opacity: .4; cursor: not-allowed; }
    .qa-icon { width: 38px; height: 38px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
    .qa-lbl { font-size: 11px; font-weight: 700; color: #475569; line-height: 1.3; }
    .earnings-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px 20px; animation: fu .5s ease .14s both; }
    .ec-title { font-family: 'Sora',sans-serif; font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 14px; }
    .ec-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid #f8fafc; }
    .ec-row:last-child { border-bottom: none; padding-bottom: 0; }
    .ec-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
    .ec-bar-wrap { flex: 1; height: 5px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
    .ec-bar { height: 100%; border-radius: 99px; transition: width 1s ease; }
    .ec-lbl { font-size: 11px; font-weight: 600; color: #64748b; min-width: 64px; }
    .ec-val { font-family: 'Sora',sans-serif; font-size: 12px; font-weight: 800; color: #0f172a; min-width: 42px; text-align: right; }
    .balance-card { width: 100%; max-width: 520px; border-radius: 24px; padding: 32px 36px 28px; position: relative; overflow: hidden; background: linear-gradient(135deg, #92400e 0%, #b45309 40%, #d97706 70%, #f59e0b 100%); box-shadow: 0 24px 60px rgba(217,119,6,.35), 0 8px 20px rgba(0,0,0,.2); transition: transform .3s ease, box-shadow .3s ease; cursor: default; }
    .balance-card:hover { transform: translateY(-4px) rotateX(2deg); box-shadow: 0 32px 72px rgba(217,119,6,.4), 0 12px 28px rgba(0,0,0,.22); }
    .balance-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.07) 50%, transparent 60%); background-size: 200% 100%; animation: sweep 3.5s ease-in-out infinite; pointer-events: none; border-radius: 24px; }
    @keyframes sweep { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .balance-card::after { content: ''; position: absolute; width: 340px; height: 340px; border-radius: 50%; border: 60px solid rgba(255,255,255,.05); top: -100px; right: -100px; pointer-events: none; }
    .bc-ring { position: absolute; width: 220px; height: 220px; border-radius: 50%; border: 40px solid rgba(255,255,255,.04); bottom: -80px; left: -60px; pointer-events: none; }
    .bc-dots { position: absolute; top: 20px; left: 0; right: 0; display: flex; justify-content: flex-end; padding: 0 36px; gap: 6px; pointer-events: none; }
    .bc-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.15); }
    .bc-dot:last-child { background: rgba(255,255,255,.35); }
    .bc-chip { width: 44px; height: 34px; border-radius: 7px; background: linear-gradient(135deg, #fbbf24, #f59e0b); position: relative; margin-bottom: 28px; z-index: 1; box-shadow: 0 2px 8px rgba(0,0,0,.3); }
    .bc-chip::before { content: ''; position: absolute; inset: 0; border-radius: 7px; background: repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(0,0,0,.08) 8px, rgba(0,0,0,.08) 9px), repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0,0,0,.08) 10px, rgba(0,0,0,.08) 11px); }
    .bc-chip::after { content: ''; position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 20px; height: 20px; border-radius: 50%; border: 1px solid rgba(0,0,0,.15); }
    .bc-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; z-index: 1; position: relative; }
    .bc-logo { font-family: 'Sora',sans-serif; font-size: 13px; font-weight: 800; color: rgba(255,255,255,.9); letter-spacing: 1px; text-transform: uppercase; }
    .bc-status { display: flex; align-items: center; gap: 5px; background: rgba(255,255,255,.1); border-radius: 99px; padding: 4px 10px; font-size: 11px; font-weight: 700; color: rgba(255,255,255,.85); }
    .bc-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #fde68a; box-shadow: 0 0 0 3px rgba(253,230,138,.2); animation: pulse 2s infinite; }
    .bc-lbl { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,.45); margin-bottom: 6px; z-index: 1; position: relative; }
    .bc-amount { font-family: 'Sora',sans-serif; font-size: 42px; font-weight: 800; color: #fff; letter-spacing: -2.5px; line-height: 1; z-index: 1; position: relative; }
    .bc-currency { font-size: 16px; font-weight: 600; letter-spacing: 0; vertical-align: super; margin-right: 4px; opacity: .7; }
    .bc-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 28px; z-index: 1; position: relative; }
    .bc-footer-lbl { font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: rgba(255,255,255,.4); margin-bottom: 3px; }
    .bc-footer-val { font-family: 'Sora',sans-serif; font-size: 13px; font-weight: 700; color: rgba(255,255,255,.85); }
    .bc-withdraw-btn { display: flex; align-items: center; gap: 7px; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25); color: #fff; font-family: 'Sora',sans-serif; font-size: 12px; font-weight: 700; padding: 9px 18px; border-radius: 10px; cursor: pointer; transition: all .2s; backdrop-filter: blur(4px); }
    .bc-withdraw-btn:hover:not(:disabled) { background: rgba(255,255,255,.25); transform: translateY(-1px); }
    .bc-withdraw-btn:disabled { opacity: .4; cursor: not-allowed; }
    .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
    @media(max-width:700px){ .stat-row { grid-template-columns: 1fr; } }
    .stat-tile { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px; animation: fu .5s ease both; transition: transform .2s, box-shadow .2s; }
    .stat-tile:hover { transform: translateY(-3px); box-shadow: 0 14px 36px rgba(0,0,0,.07); }
    .stat-tile-icon { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; font-size: 16px; }
    .stat-tile-val { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.8px; margin-bottom: 4px; }
    .stat-tile-lbl { font-size: 12px; color: #94a3b8; font-weight: 500; }
    .hist-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 22px; animation: fu .5s ease .1s both; }
    .hist-hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 10px; }
    .hist-title { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; }
    .filter-tabs { display: flex; background: #f1f5f9; border-radius: 9px; padding: 3px; gap: 2px; }
    .wr-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f8fafc; animation: fu .4s ease both; transition: background .15s; }
    .wr-row:last-child { border-bottom: none; }
    .hist-empty { text-align: center; padding: 48px 0; color: #cbd5e1; }
    .hist-empty i { font-size: 32px; display: block; margin-bottom: 10px; }
    .hist-empty p { font-size: 13px; }
    .skel { background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size: 200% 100%; animation: sh 1.4s infinite; border-radius: 10px; }
    @keyframes sh { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    @keyframes fu  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    .wlt-input { width: 100%; padding: 12px 16px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #0f172a; outline: none; transition: border-color .15s; background: #fff; }
    .wlt-input:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,.12); }
    .wlt-label { display: block; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: .7px; margin-bottom: 6px; }
    .method-opt { flex: 1; padding: 12px 8px; border-radius: 12px; border: 1.5px solid; cursor: pointer; text-align: center; transition: all .15s; background: #fff; }
    .modal-cancel-btn { padding: 9px 20px; border-radius: 11px; border: 1.5px solid #e2e8f0; background: #fff; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; transition: all .15s; }
    .modal-cancel-btn:hover:not(:disabled) { background: #f1f5f9; }
    .modal-submit-btn { padding: 9px 22px; border-radius: 11px; border: none; background: #f59e0b; color: #fff; font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all .15s; display: flex; align-items: center; gap: 7px; }
    .modal-submit-btn:hover:not(:disabled) { background: #d97706; }
    .modal-submit-btn:disabled { opacity: .5; cursor: not-allowed; }
  `;

  const FILTERS = ['all', 'pending', 'approved', 'completed', 'rejected', 'failed'];

  return (
    <>
      <style>{css}</style>
      <div className="wlt">
        <header className="wlt-hdr">
          <div>
            <h1>My Wallet</h1>
            <div className="wlt-hdr-sub">
              <i className="fas fa-calendar-alt" style={{ marginRight: 5, color: '#94a3b8' }} />{today}
            </div>
          </div>
          <div className="wlt-hdr-right">
            <button className="wlt-ico-btn" title="Refresh" onClick={load}>
              <i className="fas fa-sync-alt" />
            </button>
            <button className="wlt-withdraw-btn" onClick={() => setOpen(true)} disabled={balance <= 0}>
              <i className="fas fa-arrow-up" />
              Withdraw
            </button>
          </div>
        </header>

        <div className="wlt-body">
          {error && <div className="wlt-err"><i className="fas fa-exclamation-circle" />{error}</div>}

          {pendingCount > 0 && (
            <div className="pending-banner">
              <div className="pb-icon"><i className="fas fa-hourglass-half" /></div>
              <div style={{ flex: 1, fontSize: 13, color: '#92400e', fontWeight: 500 }}>
                You have <strong>{pendingCount} pending withdrawal{pendingCount > 1 ? 's' : ''}</strong> under review.
              </div>
              <span style={{ fontFamily: 'Sora,sans-serif', fontSize: 18, fontWeight: 800, color: '#b45309' }}>{pendingCount}</span>
            </div>
          )}

          <div className="sec-lbl">Your Wallet</div>
          <div className="wallet-top-row">
            <div className="balance-card-wrap">
              <div className="balance-card">
                <div className="bc-ring" />
                <div className="bc-dots">
                  <div className="bc-dot" /><div className="bc-dot" /><div className="bc-dot" />
                </div>
                <div className="bc-top">
                  <div className="bc-logo">
                    <i className="fas fa-store" style={{ marginRight: 6, opacity: .7 }} />
                    Restaurant Wallet
                  </div>
                  <div className="bc-status">
                    <span className="bc-status-dot" />
                    Active
                  </div>
                </div>
                <div className="bc-chip" />
                <div className="bc-lbl">Available Balance</div>
                <div className="bc-amount">
                  <span className="bc-currency">RWF</span>
                  {animatedBalance.toLocaleString()}
                </div>
                <div className="bc-footer">
                  <div style={{ display: 'flex', gap: 28 }}>
                    <div>
                      <div className="bc-footer-lbl">Total Withdrawn</div>
                      <div className="bc-footer-val">RWF {totalWithdrawn.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="bc-footer-lbl">Requests</div>
                      <div className="bc-footer-val">{withdrawals.length}</div>
                    </div>
                    <div>
                      <div className="bc-footer-lbl">Pending</div>
                      <div className="bc-footer-val">{pendingCount}</div>
                    </div>
                  </div>
                  <button className="bc-withdraw-btn" onClick={() => setOpen(true)} disabled={balance <= 0}>
                    <i className="fas fa-arrow-up" />
                    Withdraw
                  </button>
                </div>
              </div>
            </div>

            <div className="side-panel">
              <div className="quick-actions">
                <div className="qa-title">
                  <i className="fas fa-bolt" style={{ color: '#f59e0b', marginRight: 7 }} />
                  Quick Actions
                </div>
                <div className="qa-grid">
                  {[
                    { icon: 'fa-arrow-up', bg: '#fffbeb', color: '#d97706', lbl: 'Withdraw', action: () => setOpen(true), disabled: balance <= 0 },
                    { icon: 'fa-sync-alt', bg: '#eff6ff', color: '#2563eb', lbl: 'Refresh', action: load, disabled: loading },
                    { icon: 'fa-history', bg: '#faf5ff', color: '#7c3aed', lbl: 'History', action: () => {}, disabled: false },
                  ].map(a => (
                    <button key={a.lbl} className="qa-btn" onClick={a.action} disabled={a.disabled}>
                      <div className="qa-icon" style={{ background: a.bg }}>
                        <i className={`fas ${a.icon}`} style={{ color: a.color }} />
                      </div>
                      <span className="qa-lbl">{a.lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="earnings-card">
                <div className="ec-title">
                  <i className="fas fa-chart-bar" style={{ color: '#6366f1', marginRight: 7 }} />
                  Breakdown
                </div>
                {(() => {
                  const total = balance + totalWithdrawn || 1;
                  const rows = [
                    { lbl: 'Available', val: `RWF ${balance.toLocaleString()}`, pct: Math.round(balance / total * 100), color: '#d97706', bg: '#fffbeb', icon: 'fa-wallet' },
                    { lbl: 'Withdrawn', val: `RWF ${totalWithdrawn.toLocaleString()}`, pct: Math.round(totalWithdrawn / total * 100), color: '#2563eb', bg: '#eff6ff', icon: 'fa-check-double' },
                    { lbl: 'Pending', val: `${pendingCount} req`, pct: pendingCount > 0 ? 30 : 0, color: '#ea580c', bg: '#fff7ed', icon: 'fa-clock' },
                  ];
                  return rows.map(r => (
                    <div className="ec-row" key={r.lbl}>
                      <div className="ec-icon" style={{ background: r.bg }}>
                        <i className={`fas ${r.icon}`} style={{ color: r.color }} />
                      </div>
                      <span className="ec-lbl">{r.lbl}</span>
                      <div className="ec-bar-wrap">
                        <div className="ec-bar" style={{ width: `${r.pct}%`, background: r.color }} />
                      </div>
                      <span className="ec-val">{r.pct}%</span>
                    </div>
                  ));
                })()}
              </div>

              <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1px solid #fde68a', borderRadius: 16, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start', animation: 'fu .5s ease .2s both' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="fas fa-lightbulb" style={{ color: '#fff', fontSize: 14 }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 3 }}>Pro Tip</div>
                  <div style={{ fontSize: 11, color: '#b45309', lineHeight: 1.55 }}>
                    Your restaurant balance increases when customer orders are completed. Withdraw anytime and track request status below.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="stat-row">
            <div className="stat-tile" style={{ animationDelay: '0ms' }}>
              <div className="stat-tile-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <i className="fas fa-check-double" />
              </div>
              <div className="stat-tile-val">RWF {totalWithdrawn.toLocaleString()}</div>
              <div className="stat-tile-lbl">Total withdrawn</div>
              <div style={{ height: 3, background: '#2563eb22', borderRadius: 99, marginTop: 14 }}>
                <div style={{ height: '100%', background: '#2563eb', borderRadius: 99, width: '45%' }} />
              </div>
            </div>
            <div className="stat-tile" style={{ animationDelay: '60ms' }}>
              <div className="stat-tile-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
                <i className="fas fa-clock" />
              </div>
              <div className="stat-tile-val">{pendingCount}</div>
              <div className="stat-tile-lbl">Pending requests</div>
              <div style={{ height: 3, background: '#d9770622', borderRadius: 99, marginTop: 14 }}>
                <div style={{ height: '100%', background: '#d97706', borderRadius: 99, width: pendingCount > 0 ? '80%' : '0%', transition: 'width .8s ease' }} />
              </div>
            </div>
            <div className="stat-tile" style={{ animationDelay: '120ms' }}>
              <div className="stat-tile-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <i className="fas fa-receipt" />
              </div>
              <div className="stat-tile-val">{withdrawals.length}</div>
              <div className="stat-tile-lbl">Total requests</div>
              <div style={{ height: 3, background: '#16a34a22', borderRadius: 99, marginTop: 14 }}>
                <div style={{ height: '100%', background: '#16a34a', borderRadius: 99, width: withdrawals.length > 0 ? '70%' : '0%', transition: 'width .8s ease' }} />
              </div>
            </div>
          </div>

          <div className="sec-lbl" style={{ marginTop: 4 }}>Withdrawal History</div>
          <div className="hist-card">
            <div className="hist-hdr">
              <div className="hist-title">
                <i className="fas fa-history" style={{ color: '#f59e0b', marginRight: 7 }} />
                All Requests
              </div>
              <div className="filter-tabs">
                {FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 7, border: 'none',
                      cursor: 'pointer', transition: 'all .15s',
                      background: filter === f ? '#0f172a' : 'transparent',
                      color: filter === f ? '#fff' : '#94a3b8',
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map(i => <div key={i} className="skel" style={{ height: 58 }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="hist-empty">
                <i className="fas fa-inbox" />
                <p>{filter === 'all' ? 'No withdrawals yet' : `No ${filter} withdrawals`}</p>
              </div>
            ) : (
              <div>
                {filtered.map((w, i) => (
                  <WithdrawalRow key={w.id || i} w={w} idx={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={open}
        title="Withdraw Funds"
        onClose={() => { if (submitting) return; setOpen(false); }}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="modal-cancel-btn" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </button>
            <button type="button" className="modal-submit-btn" onClick={submit} disabled={!canSubmit || submitting}>
              {submitting ? <><i className="fas fa-spinner fa-spin" />Submitting…</> : <><i className="fas fa-arrow-up" />Submit request</>}
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#92400e', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <i className="fas fa-info-circle" style={{ marginTop: 2, flexShrink: 0 }} />
            <span>Your request will be reviewed and marked as <strong>pending</strong> until processed by the team.</span>
          </div>

          <div>
            <label className="wlt-label">Payment Method</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { val: 'momo', icon: 'fa-mobile-alt', label: 'PayPack Mobile' },
                { val: 'bank', icon: 'fa-university', label: 'Bank' },
              ].map(opt => {
                const active = form.method === opt.val;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    className="method-opt"
                    onClick={() => setForm(f => ({ ...f, method: opt.val }))}
                    style={{
                      borderColor: active ? '#f59e0b' : '#e2e8f0',
                      background: active ? '#fffbeb' : '#fff',
                      color: active ? '#b45309' : '#64748b',
                    }}
                  >
                    <i className={`fas ${opt.icon}`} style={{ fontSize: 18, display: 'block', marginBottom: 4 }} />
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{opt.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="wlt-label">{form.method === 'bank' ? 'Bank Account' : 'Mobile Number (PayPack)'}</label>
            <input
              className="wlt-input"
              value={form.account}
              onChange={e => setForm(f => ({ ...f, account: e.target.value }))}
              placeholder={form.method === 'bank' ? 'Account number / IBAN' : '07xxxxxxxx'}
            />
          </div>

          <div>
            <label className="wlt-label">Amount (RWF)</label>
            <input
              type="number"
              min="1"
              step="1"
              className="wlt-input"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="e.g. 5000"
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Available: <strong style={{ color: '#b45309' }}>{money(balance)}</strong>
              </span>
              {form.amount && Number(form.amount) > balance && (
                <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
                  <i className="fas fa-exclamation-triangle" style={{ marginRight: 4 }} />
                  Exceeds balance
                </span>
              )}
            </div>
          </div>

          {balance > 0 && (
            <div>
              <label className="wlt-label">Quick Select</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {quickAmounts.map(v => (
                  <QuickAmt key={v} value={v} balance={balance} onClick={v => setForm(f => ({ ...f, amount: String(v) }))} />
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
