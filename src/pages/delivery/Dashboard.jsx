import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
);

/* ════════════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════════════ */
const isInProgress = (status) => {
  const s = String(status || '').toLowerCase();
  return s === 'picked' || s === 'on_the_way' || s === 'out_for_delivery';
};

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
  return <canvas ref={ref} width={80} height={30} style={{ display: 'block' }} />;
}

function StatCard({ label, numericValue, icon, accent, bg, sparkData, delay = 0 }) {
  const animated = useCountUp(numericValue ?? 0);
  return (
    <div className="dsc" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`fas ${icon}`} style={{ color: accent, fontSize: 17 }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', borderRadius: 99, padding: '2px 8px' }}>
          ● Live
        </span>
      </div>
      <div style={{ marginTop: 14, marginBottom: 10 }}>
        <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: -1.2, lineHeight: 1 }}>
          {animated.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5, fontWeight: 500 }}>{label}</div>
      </div>
      <Sparkline data={sparkData} color={accent} />
      <div style={{ height: 3, borderRadius: 99, background: accent + '22', marginTop: 10 }}>
        <div style={{ height: '100%', borderRadius: 99, background: accent, width: '60%', transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}

function StatusPill({ color, label, count, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #f8fafc' }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: 12, color: '#475569', textTransform: 'capitalize', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{Number(count).toLocaleString()}</div>
      <div style={{ fontSize: 10, fontWeight: 700, minWidth: 36, textAlign: 'center', background: color + '18', color, borderRadius: 99, padding: '1px 6px' }}>{pct}%</div>
    </div>
  );
}

function PeriodTab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 11, fontWeight: 600, padding: '4px 11px', borderRadius: 7, border: 'none',
      cursor: 'pointer', transition: 'all .15s',
      background: active ? '#0f172a' : 'transparent',
      color: active ? '#fff' : '#94a3b8',
    }}>{label}</button>
  );
}

function ChartToggle({ value, onChange }) {
  return (
    <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 2 }}>
      {[['line', 'fa-chart-line'], ['bar', 'fa-chart-bar']].map(([v, ic]) => (
        <button key={v} onClick={() => onChange(v)} style={{
          width: 30, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer',
          background: value === v ? '#fff' : 'transparent',
          color: value === v ? '#0f172a' : '#94a3b8',
          boxShadow: value === v ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
          transition: 'all .15s', fontSize: 11,
        }}>
          <i className={`fas ${ic}`} />
        </button>
      ))}
    </div>
  );
}

/* Order row in live list */
function OrderRow({ order, idx }) {
  const s = String(order.status || '').toLowerCase();
  const statusColor = {
    delivered:      { bg: '#f0fdf4', color: '#16a34a' },
    on_the_way:     { bg: '#eff6ff', color: '#2563eb' },
    out_for_delivery:{ bg: '#eff6ff', color: '#2563eb' },
    picked:         { bg: '#faf5ff', color: '#7c3aed' },
    accepted:       { bg: '#fff7ed', color: '#ea580c' },
    preparing:      { bg: '#fefce8', color: '#ca8a04' },
    cancelled:      { bg: '#fef2f2', color: '#dc2626' },
  }[s] || { bg: '#f1f5f9', color: '#475569' };

  return (
    <div className="order-row" style={{ animationDelay: `${idx * 30}ms` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="fas fa-box" style={{ fontSize: 13, color: '#64748b' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Order #{order.id || order._id || '—'}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
            {order.restaurantName || order.restaurant?.name || 'Restaurant'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {order.totalAmount != null && (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', fontFamily: 'Sora,sans-serif' }}>
            RWF {Number(order.totalAmount).toLocaleString()}
          </span>
        )}
        <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '3px 10px', background: statusColor.bg, color: statusColor.color, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
          {s.replaceAll('_', ' ')}
        </span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════ */
const PALETTE = ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#64748b', '#eab308'];

export default function DeliveryDashboard() {
  const [orders, setOrders]         = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [orderStats, setOrderStats] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [chartType, setChartType]   = useState('line');
  const [period, setPeriod]         = useState('week');

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }, []);

  const today = useMemo(() =>
    new Date().toLocaleDateString('en-RW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  , []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const [data, dRows, sRows] = await Promise.all([
          api.delivery.getOrders(''),
          api.delivery.reports.deliveries(`?preset=${period}`),
          api.delivery.reports.orderStats(`?preset=${period}`),
        ]);
        setOrders(Array.isArray(data) ? data : []);
        setDeliveries(Array.isArray(dRows) ? dRows : []);
        setOrderStats(Array.isArray(sRows) ? sRows : []);
      } catch (e) {
        setError(e.message || 'Failed to load delivery orders');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [period]);

  /* ── Derived stats ── */
  const stats = useMemo(() => {
    const assigned = orders.filter(o => ['accepted', 'preparing'].includes(String(o.status || '').toLowerCase())).length;
    const inProgress = orders.filter(o => isInProgress(o.status)).length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const completedToday = orders.filter(o => {
      const s = String(o.status || '').toLowerCase();
      if (s !== 'delivered') return false;
      const d = o.orderDate ? new Date(o.orderDate) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      return d.toISOString().slice(0, 10) === todayStr;
    }).length;
    return { assigned, inProgress, completedToday };
  }, [orders]);

  const deliveriesSparkData = deliveries.map(r => Number(r.deliveries || 0));
  const doughnutTotal       = orderStats.reduce((s, r) => s + Number(r.count || 0), 0);
  const totalDelivered      = deliveries.reduce((s, r) => s + Number(r.deliveries || 0), 0);
  const deliveredCount      = Number(orderStats.find(r => r.status === 'delivered')?.count || 0);
  const cancelledCount      = Number(orderStats.find(r => r.status === 'cancelled')?.count || 0);
  const peakDay             = deliveries.length
    ? (deliveries.reduce((a, b) => Number(a.deliveries || 0) > Number(b.deliveries || 0) ? a : b, deliveries[0])?.day ?? '—')
    : '—';

  /* Active orders for the live list */
  const activeOrders = orders.filter(o => {
    const s = String(o.status || '').toLowerCase();
    return ['accepted', 'preparing', 'picked', 'on_the_way', 'out_for_delivery'].includes(s);
  }).slice(0, 6);

  /* ── Deliveries chart ── */
  const chartData = useMemo(() => {
    const labels = deliveries.map(r => r.day);
    const data   = deliveries.map(r => Number(r.deliveries || 0));
    const isBar  = chartType === 'bar';
    return {
      labels,
      datasets: [{
        label: 'Deliveries',
        data,
        borderColor: '#10b981',
        backgroundColor: isBar ? 'rgba(16,185,129,0.8)' : 'rgba(16,185,129,0.12)',
        tension: 0.42, fill: !isBar,
        pointBackgroundColor: '#10b981', pointRadius: isBar ? 0 : 4, pointHoverRadius: 7,
        borderWidth: isBar ? 0 : 2.5, borderRadius: isBar ? 6 : 0,
      }],
    };
  }, [deliveries, chartType]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    animation: { duration: 500, easing: 'easeOutQuart' },
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, pointStyleWidth: 8, font: { family: 'DM Sans', size: 12 }, padding: 18, color: '#475569' } },
      tooltip: {
        backgroundColor: '#0f172a', titleFont: { family: 'Sora', size: 12, weight: '700' },
        bodyFont: { family: 'DM Sans', size: 12 }, padding: 14, cornerRadius: 12,
        callbacks: { label: ctx => ` ${ctx.raw} deliveries` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 11 }, color: '#94a3b8' }, border: { display: false } },
      y: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { family: 'DM Sans', size: 11 }, color: '#94a3b8', stepSize: 1 },
        title: { display: true, text: 'Deliveries', font: { family: 'DM Sans', size: 11 }, color: '#94a3b8' },
        border: { display: false },
      },
    },
  }), []);

  /* ── Doughnut ── */
  const doughnutData = useMemo(() => ({
    labels: orderStats.map(r => String(r.status || '').replaceAll('_', ' ')),
    datasets: [{
      data: orderStats.map(r => Number(r.count || 0)),
      backgroundColor: orderStats.map((_, i) => PALETTE[i % PALETTE.length]),
      borderWidth: 0, hoverOffset: 10,
    }],
  }), [orderStats]);

  const doughnutOptions = {
    responsive: true, cutout: '73%',
    animation: { duration: 700, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a', titleFont: { family: 'Sora', size: 12, weight: '700' },
        bodyFont: { family: 'DM Sans', size: 12 }, padding: 14, cornerRadius: 12,
      },
    },
  };

  const ChartComp = chartType === 'bar' ? Bar : Line;

  /* ════ STYLES ═══════════════════════════════════════════════════════ */
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; }

    .dbd { font-family: 'DM Sans', sans-serif; background: #f8fafc; min-height: 100vh; }

    /* ── Header ── */
    .dbd-hdr {
      background: #fff; border-bottom: 1px solid #e2e8f0;
      padding: 18px 32px; display: flex; justify-content: space-between; align-items: center;
      position: sticky; top: 0; z-index: 50;
    }
    .dbd-hdr h1 { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .dbd-hdr-sub { font-size: 12px; color: #94a3b8; margin-top: 3px; }
    .dbd-hdr-right { display: flex; align-items: center; gap: 10px; }
    .dbd-status-badge { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 99px; padding: 6px 14px; font-size: 12px; color: '#16a34a'; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .dbd-cta {
      display: flex; align-items: center; gap: 7px;
      background: #10b981; color: #fff; font-size: 13px; font-weight: 700;
      padding: 9px 18px; border-radius: 11px; text-decoration: none;
      transition: background .15s, transform .15s;
    }
    .dbd-cta:hover { background: #059669; transform: translateY(-1px); }
    .dbd-ico-btn { width: 36px; height: 36px; border-radius: 9px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; font-size: 13px; }
    .dbd-ico-btn:hover { background: #f1f5f9; color: #0f172a; }

    /* ── Body ── */
    .dbd-body { padding: 24px 32px 48px; }

    /* ── In-progress banner ── */
    .inprogress-banner {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      border: 1px solid #bfdbfe; border-radius: 14px;
      padding: 14px 20px; margin-bottom: 20px;
      display: flex; align-items: center; gap: 12px;
      animation: fu .4s ease both;
    }
    .inprogress-icon { width: 36px; height: 36px; border-radius: 10px; background: #dbeafe; display: flex; align-items: center; justify-content: center; color: #2563eb; font-size: 16px; flex-shrink: 0; }
    .inprogress-text { flex: 1; font-size: 13px; color: '#1e40af'; font-weight: 500; }
    .inprogress-count { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 800; color: #1d4ed8; }

    /* ── Section label ── */
    .sec-lbl { font-size: 10px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: #94a3b8; margin-bottom: 12px; }

    /* ── Error ── */
    .dbd-err { background: #fff; border: 1px solid #fecaca; border-radius: 14px; padding: 14px 18px; color: #dc2626; font-size: 13px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }

    /* ── Health strip ── */
    .h-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    @media(max-width:900px){ .h-strip { grid-template-columns: repeat(2,1fr); } }
    .h-tile { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; animation: fu .4s ease both; }
    .h-tile-lbl { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .9px; }
    .h-tile-val { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 3px; }
    .dot-green { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block; margin-right: 5px; box-shadow: 0 0 0 3px #dcfce7; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{box-shadow:0 0 0 3px #dcfce7} 50%{box-shadow:0 0 0 6px #dcfce7} }

    /* ── Stat cards ── */
    .dsc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
    @media(max-width:900px){ .dsc-grid { grid-template-columns: repeat(2,1fr); } }
    @media(max-width:600px){ .dsc-grid { grid-template-columns: 1fr; } }
    .dsc { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px; animation: fu .5s ease both; transition: transform .2s, box-shadow .2s; }
    .dsc:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,.08); }

    /* ── Main layout ── */
    .main-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
    @media(max-width:1000px){ .main-row { grid-template-columns: 1fr; } }

    /* ── Chart layout ── */
    .chart-row { display: grid; grid-template-columns: 1.7fr 1fr; gap: 14px; margin-bottom: 14px; }
    @media(max-width:1000px){ .chart-row { grid-template-columns: 1fr; } }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 22px; animation: fu .5s ease both; }
    .card-hdr { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 12px; flex-wrap: wrap; }
    .card-title { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; }
    .card-sub { font-size: 11px; color: #94a3b8; margin-top: 3px; }
    .card-controls { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .period-tabs { display: flex; background: #f1f5f9; border-radius: 9px; padding: 3px; gap: 2px; }
    .chart-mt { text-align: center; padding: 50px 0; color: #cbd5e1; font-size: 13px; }
    .chart-mt i { font-size: 30px; display: block; margin-bottom: 8px; }

    /* ── Doughnut ── */
    .donut-wrap { position: relative; max-width: 200px; margin: 0 auto 4px; }
    .donut-ctr { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -66%); text-align: center; pointer-events: none; }
    .donut-ctr-n { font-family: 'Sora', sans-serif; font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1; }
    .donut-ctr-l { font-size: 11px; color: #94a3b8; margin-top: 2px; }

    /* ── Active orders list ── */
    .order-list { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; }
    .order-list::-webkit-scrollbar { width: 4px; }
    .order-list::-webkit-scrollbar-track { background: transparent; }
    .order-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
    .order-row {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      background: #fafafa; border: 1px solid #f1f5f9; border-radius: 12px; padding: 10px 14px;
      animation: fu .4s ease both; transition: all .15s; cursor: default;
    }
    .order-row:hover { background: #fff; border-color: #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,.06); }
    .order-empty { text-align: center; padding: 32px 0; color: #cbd5e1; font-size: 13px; }
    .order-empty i { font-size: 28px; display: block; margin-bottom: 8px; }

    /* ── Summary tiles ── */
    .sum-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 14px; }
    @media(max-width:700px){ .sum-row { grid-template-columns: 1fr; } }
    .sum-tile { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; animation: fu .5s ease .12s both; }
    .sum-tile-lbl { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: .9px; margin-bottom: 6px; }
    .sum-tile-val { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .sum-tile-sub { font-size: 11px; color: #94a3b8; margin-top: 3px; }

    /* ── Skeleton ── */
    .skel { background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size: 200% 100%; animation: sh 1.4s infinite; border-radius: 10px; }
    @keyframes sh { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    @keyframes fu  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="dbd">

        {/* ── Header ── */}
        <header className="dbd-hdr">
          <div>
            <h1>Delivery Dashboard</h1>
            <div className="dbd-hdr-sub">{greeting} 👋 &nbsp;·&nbsp; {today}</div>
          </div>
          <div className="dbd-hdr-right">
            <div className="dbd-status-badge" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 99, padding: '6px 14px', fontSize: 12, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="dot-green" style={{ margin: 0 }} />
              On Duty
            </div>
            <button className="dbd-ico-btn" title="Refresh" onClick={() => window.location.reload()}>
              <i className="fas fa-sync-alt" />
            </button>
            <Link to="/delivery/orders" className="dbd-cta">
              <i className="fas fa-motorcycle" />
              My Deliveries
            </Link>
          </div>
        </header>

        <div className="dbd-body">
          {error && <div className="dbd-err"><i className="fas fa-exclamation-circle" />{error}</div>}

          {/* ── In-progress banner ── */}
          {stats.inProgress > 0 && (
            <div className="inprogress-banner">
              <div className="inprogress-icon"><i className="fas fa-road" /></div>
              <div className="inprogress-text" style={{ color: '#1e40af' }}>
                You have <strong>{stats.inProgress} order{stats.inProgress > 1 ? 's' : ''}</strong> currently in progress. Keep it up!
              </div>
              <div className="inprogress-count">{stats.inProgress}</div>
            </div>
          )}

          {/* ── Health strip ── */}
          <div className="sec-lbl">At a Glance</div>
          <div className="h-strip">
            {[
              { lbl: 'Status',               val: <><span className="dot-green" />On Duty</> },
              { lbl: 'Assigned',             val: stats.assigned },
              { lbl: `Delivered (${period})`, val: totalDelivered },
              { lbl: 'Completed Today',       val: stats.completedToday },
            ].map((h, i) => (
              <div className="h-tile" key={h.lbl} style={{ animationDelay: `${i * 40}ms` }}>
                <div>
                  <div className="h-tile-lbl">{h.lbl}</div>
                  <div className="h-tile-val">{h.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Stat cards ── */}
          <div className="sec-lbl" style={{ marginTop: 4 }}>Today's Status</div>
          <div className="dsc-grid">
            <StatCard label="Assigned Orders"  numericValue={stats.assigned}       icon="fa-motorcycle"  accent="#10b981" bg="#ecfdf5" sparkData={deliveriesSparkData} delay={0}   />
            <StatCard label="In Progress"       numericValue={stats.inProgress}     icon="fa-road"        accent="#2563eb" bg="#eff6ff" sparkData={deliveriesSparkData} delay={70}  />
            <StatCard label="Completed Today"   numericValue={stats.completedToday} icon="fa-check-circle" accent="#7c3aed" bg="#faf5ff" sparkData={deliveriesSparkData} delay={140} />
          </div>

          {/* ── Active orders + doughnut ── */}
          <div className="sec-lbl" style={{ marginTop: 4 }}>Live Orders</div>
          <div className="main-row" style={{ marginBottom: 14 }}>

            {/* Active orders list */}
            <div className="card">
              <div className="card-hdr">
                <div>
                  <div className="card-title">
                    <i className="fas fa-stream" style={{ color: '#10b981', marginRight: 7 }} />
                    Active Orders
                  </div>
                  <div className="card-sub">Orders assigned or in progress right now</div>
                </div>
                <Link to="/delivery/orders" style={{ fontSize: 12, fontWeight: 600, color: '#10b981', textDecoration: 'none' }}>
                  View all <i className="fas fa-arrow-right" style={{ fontSize: 10 }} />
                </Link>
              </div>
              {loading
                ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1,2,3].map(i => <div key={i} className="skel" style={{ height: 54 }} />)}
                  </div>
                : activeOrders.length
                  ? <div className="order-list">
                      {activeOrders.map((o, i) => <OrderRow key={o.id || o._id || i} order={o} idx={i} />)}
                    </div>
                  : <div className="order-empty">
                      <i className="fas fa-check-double" style={{ color: '#10b981' }} />
                      <div>No active orders right now</div>
                    </div>
              }
            </div>

            {/* Doughnut */}
            <div className="card">
              <div className="card-hdr">
                <div>
                  <div className="card-title">
                    <i className="fas fa-circle-notch" style={{ color: '#6366f1', marginRight: 7 }} />
                    Orders by Status
                  </div>
                  <div className="card-sub">Breakdown across all statuses</div>
                </div>
              </div>
              {loading
                ? <div className="skel" style={{ height: 220 }} />
                : orderStats.length
                  ? <>
                      <div className="donut-wrap">
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                        <div className="donut-ctr">
                          <div className="donut-ctr-n">{doughnutTotal.toLocaleString()}</div>
                          <div className="donut-ctr-l">orders</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        {orderStats.map((r, i) => (
                          <StatusPill
                            key={r.status}
                            color={PALETTE[i % PALETTE.length]}
                            label={String(r.status || '').replaceAll('_', ' ')}
                            count={Number(r.count || 0)}
                            total={doughnutTotal}
                          />
                        ))}
                      </div>
                    </>
                  : <div className="chart-mt"><i className="fas fa-inbox" />No data yet</div>
              }
            </div>
          </div>

          {/* ── Deliveries line chart ── */}
          <div className="sec-lbl">Performance</div>
          <div style={{ marginBottom: 14 }}>
            <div className="card">
              <div className="card-hdr">
                <div>
                  <div className="card-title">
                    <i className="fas fa-chart-area" style={{ color: '#10b981', marginRight: 7 }} />
                    Deliveries Over Time
                  </div>
                  <div className="card-sub">
                    Completed deliveries —{' '}
                    {period === 'week' ? 'last 7 days' : period === 'month' ? 'last 30 days' : 'last year'}
                  </div>
                </div>
                <div className="card-controls">
                  <div className="period-tabs">
                    {['week', 'month', 'year'].map(p => (
                      <PeriodTab key={p} label={p[0].toUpperCase() + p.slice(1)} active={period === p} onClick={() => setPeriod(p)} />
                    ))}
                  </div>
                  <ChartToggle value={chartType} onChange={setChartType} />
                </div>
              </div>
              {loading
                ? <div className="skel" style={{ height: 220 }} />
                : deliveries.length
                  ? <ChartComp data={chartData} options={chartOptions} />
                  : <div className="chart-mt"><i className="fas fa-inbox" />No data yet</div>
              }
            </div>
          </div>

          {/* ── Summary insights ── */}
          <div className="sum-row">
            <div className="sum-tile">
              <div className="sum-tile-lbl">Completion Rate</div>
              <div className="sum-tile-val" style={{ color: '#16a34a' }}>
                {doughnutTotal ? `${Math.round(deliveredCount / doughnutTotal * 100)}%` : '—'}
              </div>
              <div className="sum-tile-sub">Delivered vs all orders</div>
            </div>
            <div className="sum-tile">
              <div className="sum-tile-lbl">Peak Day</div>
              <div className="sum-tile-val">{peakDay}</div>
              <div className="sum-tile-sub">Most deliveries this period</div>
            </div>
            <div className="sum-tile">
              <div className="sum-tile-lbl">Cancellation Rate</div>
              <div className="sum-tile-val" style={{ color: doughnutTotal && (cancelledCount / doughnutTotal) > 0.1 ? '#dc2626' : '#0f172a' }}>
                {doughnutTotal ? `${Math.round(cancelledCount / doughnutTotal * 100)}%` : '—'}
              </div>
              <div className="sum-tile-sub">Cancelled vs all orders</div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}