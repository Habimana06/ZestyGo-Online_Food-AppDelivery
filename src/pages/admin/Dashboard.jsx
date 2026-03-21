import { useEffect, useMemo, useState, useRef } from 'react';
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

/* Tiny sparkline drawn on canvas */
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
      x: (i / (data.length - 1)) * W,
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
  return <canvas ref={ref} width={80} height={32} style={{ display: 'block' }} />;
}

/* Stat card */
function StatCard({ label, numericValue, icon, accent, bg, sparkData, prefix = '', delay = 0 }) {
  const animated = useCountUp(numericValue ?? 0);
  return (
    <div className="sc" style={{ animationDelay: `${delay}ms` }}>
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
          {prefix}{animated.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5, fontWeight: 500 }}>{label}</div>
      </div>
      <Sparkline data={sparkData} color={accent} />
      <div style={{ height: 3, borderRadius: 99, background: accent + '22', marginTop: 10 }}>
        <div style={{ height: '100%', borderRadius: 99, background: accent, width: '55%', transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}

/* Doughnut legend row */
function StatusPill({ color, label, count, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #f8fafc' }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: 12, color: '#475569', textTransform: 'capitalize', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{Number(count).toLocaleString()}</div>
      <div style={{
        fontSize: 10, fontWeight: 700, minWidth: 36, textAlign: 'center',
        background: color + '18', color, borderRadius: 99, padding: '1px 6px',
      }}>{pct}%</div>
    </div>
  );
}

/* Period tab */
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

/* Chart type toggle */
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

/* ════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════ */
const PALETTE = ['#0ea5e9','#22c55e','#f97316','#a855f7','#ef4444','#64748b','#eab308'];

export default function AdminDashboard() {
  const [stats, setStats]           = useState({ totalUsers:0, totalRestaurants:0, totalOrders:0, totalRevenue:0 });
  const [sales, setSales]           = useState([]);
  const [orderStats, setOrderStats] = useState([]);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(true);
  const [chartType, setChartType]   = useState('line');
  const [period, setPeriod]         = useState('week');

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }, []);

  const today = useMemo(() =>
    new Date().toLocaleDateString('en-RW', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
  , []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [s, salesRows, orderRows] = await Promise.all([
          api.admin.stats(),
          api.admin.reports.sales(`?preset=${period}`),
          api.admin.reports.orderStats(`?preset=${period}`),
        ]);
        setStats(s);
        setSales(Array.isArray(salesRows) ? salesRows : []);
        setOrderStats(Array.isArray(orderRows) ? orderRows : []);
      } catch (e) {
        setError(e.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [period]);

  /* ── Derived ── */
  const totalOrdersWeek  = sales.reduce((s,r) => s + Number(r.orders  || 0), 0);
  const totalRevenueWeek = sales.reduce((s,r) => s + Number(r.revenue || 0), 0);
  const avgOrderValue    = stats.totalOrders > 0 ? Math.round(Number(stats.totalRevenue||0) / stats.totalOrders) : 0;
  const doughnutTotal    = orderStats.reduce((s,r) => s + Number(r.count || 0), 0);
  const revenueSparkData = sales.map(r => Number(r.revenue || 0));
  const ordersSparkData  = sales.map(r => Number(r.orders  || 0));

  const deliveredCount   = Number(orderStats.find(r => r.status === 'delivered')?.count || 0);
  const cancelledCount   = Number(orderStats.find(r => r.status === 'cancelled')?.count || 0);
  const peakDay          = sales.length
    ? (sales.reduce((a,b) => Number(a.revenue||0) > Number(b.revenue||0) ? a : b, sales[0])?.day ?? '—')
    : '—';

  /* ── Sales chart ── */
  const chartData = useMemo(() => {
    const labels  = sales.map(r => r.day);
    const revenue = sales.map(r => Number(r.revenue || 0));
    const orders  = sales.map(r => Number(r.orders  || 0));
    const isBar   = chartType === 'bar';
    return {
      labels,
      datasets: [
        {
          label: 'Revenue (RWF)',
          data: revenue,
          borderColor: '#16a34a',
          backgroundColor: isBar ? 'rgba(22,163,74,0.8)' : 'rgba(22,163,74,0.10)',
          tension: 0.42, fill: !isBar,
          pointBackgroundColor: '#16a34a', pointRadius: isBar ? 0 : 4, pointHoverRadius: 7,
          borderWidth: isBar ? 0 : 2.5,
          borderRadius: isBar ? 6 : 0,
          yAxisID: 'y',
        },
        {
          label: 'Orders',
          data: orders,
          borderColor: '#6366f1',
          backgroundColor: isBar ? 'rgba(99,102,241,0.8)' : 'rgba(99,102,241,0.10)',
          tension: 0.42, fill: !isBar,
          pointBackgroundColor: '#6366f1', pointRadius: isBar ? 0 : 4, pointHoverRadius: 7,
          borderWidth: isBar ? 0 : 2.5,
          borderRadius: isBar ? 6 : 0,
          yAxisID: 'y1',
        },
      ],
    };
  }, [sales, chartType]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    animation: { duration: 500, easing: 'easeOutQuart' },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, pointStyleWidth: 8, font: { family:'DM Sans', size:12 }, padding: 18, color:'#475569' },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family:'Sora', size:12, weight:'700' },
        bodyFont:  { family:'DM Sans', size:12 },
        padding: 14, cornerRadius: 12,
        callbacks: {
          label: (ctx) => ctx.datasetIndex === 0
            ? ` RWF ${Number(ctx.raw).toLocaleString()}`
            : ` ${ctx.raw} orders`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font:{ family:'DM Sans', size:11 }, color:'#94a3b8' },
        border: { display: false },
      },
      y: {
        grid: { color:'rgba(0,0,0,0.04)' },
        ticks: { font:{ family:'DM Sans', size:11 }, color:'#94a3b8', callback: v => `${(v/1000).toFixed(0)}k` },
        title: { display:true, text:'Revenue (RWF)', font:{ family:'DM Sans', size:11 }, color:'#94a3b8' },
        border: { display: false },
      },
      y1: {
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { font:{ family:'DM Sans', size:11 }, color:'#94a3b8' },
        title: { display:true, text:'Orders', font:{ family:'DM Sans', size:11 }, color:'#94a3b8' },
        border: { display: false },
      },
    },
  }), []);

  /* ── Doughnut ── */
  const doughnutData = useMemo(() => ({
    labels: orderStats.map(r => String(r.status||'').replaceAll('_',' ')),
    datasets: [{
      data: orderStats.map(r => Number(r.count||0)),
      backgroundColor: orderStats.map((_,i) => PALETTE[i % PALETTE.length]),
      borderWidth: 0, hoverOffset: 10,
    }],
  }), [orderStats]);

  const doughnutOptions = {
    responsive: true, cutout: '73%',
    animation: { duration: 700, easing:'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor:'#0f172a', titleFont:{ family:'Sora', size:12, weight:'700' },
        bodyFont:{ family:'DM Sans', size:12 }, padding:14, cornerRadius:12,
      },
    },
  };

  const ChartComp = chartType === 'bar' ? Bar : Line;

  /* ════ STYLES ═══════════════════════════════════════════════════════ */
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; }

    .adm { font-family:'DM Sans',sans-serif; background:#f8fafc; min-height:100vh; }

    /* ── Header ── */
    .adm-hdr {
      background:#fff; border-bottom:1px solid #e2e8f0;
      padding:18px 32px; display:flex; justify-content:space-between; align-items:center;
      position:sticky; top:0; z-index:50;
    }
    .adm-hdr h1 { font-family:'Sora',sans-serif; font-size:20px; font-weight:800; color:#0f172a; letter-spacing:-0.5px; }
    .adm-hdr-sub { font-size:12px; color:#94a3b8; margin-top:3px; }
    .adm-hdr-right { display:flex; align-items:center; gap:10px; }
    .adm-status-badge { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:99px; padding:6px 14px; font-size:12px; color:#16a34a; font-weight:600; display:flex; align-items:center; gap:6px; }
    .adm-ico-btn { width:36px; height:36px; border-radius:9px; border:1px solid #e2e8f0; background:#fff; color:#64748b; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; font-size:13px; }
    .adm-ico-btn:hover { background:#f1f5f9; color:#0f172a; }

    /* ── Body ── */
    .adm-body { padding:24px 32px 48px; }

    /* ── Section label ── */
    .sec-lbl { font-size:10px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#94a3b8; margin-bottom:12px; }

    /* ── Error ── */
    .adm-err { background:#fff; border:1px solid #fecaca; border-radius:14px; padding:14px 18px; color:#dc2626; font-size:13px; margin-bottom:20px; display:flex; align-items:center; gap:10px; }

    /* ── Health strip ── */
    .h-strip { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
    @media(max-width:900px){ .h-strip{grid-template-columns:repeat(2,1fr);} }
    .h-tile { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:14px 18px; display:flex; justify-content:space-between; align-items:center; animation:fu .4s ease both; }
    .h-tile-lbl { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.9px; }
    .h-tile-val { font-family:'Sora',sans-serif; font-size:15px; font-weight:800; color:#0f172a; margin-top:3px; }
    .dot-green { width:8px; height:8px; border-radius:50%; background:#22c55e; display:inline-block; margin-right:5px; box-shadow:0 0 0 3px #dcfce7; animation:pulse 2s infinite; }
    @keyframes pulse { 0%,100%{box-shadow:0 0 0 3px #dcfce7} 50%{box-shadow:0 0 0 6px #dcfce7} }

    /* ── Stat cards ── */
    .sc-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }
    @media(max-width:1100px){ .sc-grid{grid-template-columns:repeat(2,1fr);} }
    @media(max-width:600px){ .sc-grid{grid-template-columns:1fr;} }
    .sc { background:#fff; border:1px solid #e2e8f0; border-radius:18px; padding:20px; animation:fu .5s ease both; transition:transform .2s,box-shadow .2s; }
    .sc:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,.08); }

    /* ── Chart layout ── */
    .chart-row { display:grid; grid-template-columns:1.7fr 1fr; gap:14px; margin-bottom:14px; }
    @media(max-width:1000px){ .chart-row{grid-template-columns:1fr;} }
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:18px; padding:22px; animation:fu .5s ease both; }
    .card-hdr { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; gap:12px; flex-wrap:wrap; }
    .card-title { font-family:'Sora',sans-serif; font-size:15px; font-weight:700; color:#0f172a; letter-spacing:-0.3px; }
    .card-sub { font-size:11px; color:#94a3b8; margin-top:3px; }
    .card-controls { display:flex; align-items:center; gap:8px; flex-shrink:0; }

    /* ── Period tabs ── */
    .period-tabs { display:flex; background:#f1f5f9; border-radius:9px; padding:3px; gap:2px; }

    /* ── Chart empty ── */
    .chart-mt { text-align:center; padding:50px 0; color:#cbd5e1; font-size:13px; }
    .chart-mt i { font-size:30px; display:block; margin-bottom:8px; }

    /* ── Doughnut ── */
    .donut-wrap { position:relative; max-width:200px; margin:0 auto 4px; }
    .donut-ctr { position:absolute; top:50%; left:50%; transform:translate(-50%,-66%); text-align:center; pointer-events:none; }
    .donut-ctr-n { font-family:'Sora',sans-serif; font-size:28px; font-weight:800; color:#0f172a; line-height:1; }
    .donut-ctr-l { font-size:11px; color:#94a3b8; margin-top:3px; }

    /* ── Summary tiles ── */
    .sum-row { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:14px; }
    @media(max-width:700px){ .sum-row{grid-template-columns:1fr;} }
    .sum-tile { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:18px 20px; animation:fu .5s ease .12s both; }
    .sum-tile-lbl { font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:.9px; margin-bottom:6px; }
    .sum-tile-val { font-family:'Sora',sans-serif; font-size:22px; font-weight:800; color:#0f172a; letter-spacing:-0.5px; }
    .sum-tile-sub { font-size:11px; color:#94a3b8; margin-top:3px; }

    /* ── Actions ── */
    .act-card { background:#fff; border:1px solid #e2e8f0; border-radius:18px; padding:22px; animation:fu .5s ease .18s both; }
    .act-card h2 { font-family:'Sora',sans-serif; font-size:15px; font-weight:700; color:#0f172a; letter-spacing:-0.3px; margin-bottom:14px; }
    .act-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:11px; }
    @media(max-width:700px){ .act-grid{grid-template-columns:1fr;} }
    .act-tile { border:1px solid #f1f5f9; border-radius:14px; padding:16px; cursor:pointer; transition:all .18s; background:#fafafa; display:flex; flex-direction:column; gap:10px; }
    .act-tile:hover { background:#fff; border-color:#e2e8f0; box-shadow:0 8px 24px rgba(0,0,0,.07); transform:translateY(-2px); }
    .act-tile-top { display:flex; justify-content:space-between; align-items:flex-start; }
    .act-icon-box { width:38px; height:38px; border-radius:11px; display:flex; align-items:center; justify-content:center; font-size:15px; }
    .act-tile-title { font-size:13px; font-weight:600; color:#0f172a; }
    .act-tile-desc { font-size:12px; color:#94a3b8; line-height:1.55; margin-top:3px; }

    /* ── Skeleton ── */
    .skel { background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size:200% 100%; animation:sh 1.4s infinite; border-radius:10px; }
    @keyframes sh { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    @keyframes fu  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="adm">

        {/* ── Header ── */}
        <header className="adm-hdr">
          <div>
            <h1>Admin Dashboard</h1>
            <div className="adm-hdr-sub">{greeting}, Admin 👋 &nbsp;·&nbsp; {today}</div>
          </div>
          <div className="adm-hdr-right">
            <div className="adm-status-badge">
              <span className="dot-green" style={{ margin: 0 }} />
              All systems operational
            </div>
            <button className="adm-ico-btn" title="Refresh" onClick={() => window.location.reload()}>
              <i className="fas fa-sync-alt" />
            </button>
          </div>
        </header>

        <div className="adm-body">
          {error && <div className="adm-err"><i className="fas fa-exclamation-circle" />{error}</div>}

          {/* ── Health strip ── */}
          <div className="sec-lbl">Platform Status</div>
          <div className="h-strip">
            {[
              { lbl:'System Status',     val:<><span className="dot-green"/>Operational</> },
              { lbl:'Avg. Order Value',  val: avgOrderValue ? `RWF ${avgOrderValue.toLocaleString()}` : '—' },
              { lbl:`Revenue (${period})`, val:`RWF ${totalRevenueWeek.toLocaleString()}` },
              { lbl:`Orders (${period})`, val: totalOrdersWeek.toLocaleString() },
            ].map((h, i) => (
              <div className="h-tile" key={h.lbl} style={{ animationDelay:`${i*40}ms` }}>
                <div>
                  <div className="h-tile-lbl">{h.lbl}</div>
                  <div className="h-tile-val">{h.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Stat cards ── */}
          <div className="sec-lbl" style={{ marginTop:4 }}>Key Metrics</div>
          <div className="sc-grid">
            <StatCard label="Total Users"          numericValue={Number(stats.totalUsers)}       icon="fa-users"   accent="#4f46e5" bg="#eef2ff" sparkData={ordersSparkData}  delay={0}   />
            <StatCard label="Total Restaurants"    numericValue={Number(stats.totalRestaurants)} icon="fa-store"   accent="#9333ea" bg="#faf5ff" sparkData={revenueSparkData} delay={60}  />
            <StatCard label="Total Orders"         numericValue={Number(stats.totalOrders)}      icon="fa-receipt" accent="#2563eb" bg="#eff6ff" sparkData={ordersSparkData}  delay={120} />
            <StatCard label="Revenue (Delivered)"  numericValue={Number(stats.totalRevenue||0)}  icon="fa-coins"   accent="#16a34a" bg="#f0fdf4" sparkData={revenueSparkData} prefix="RWF " delay={180} />
          </div>

          {/* ── Charts ── */}
          <div className="sec-lbl" style={{ marginTop:4 }}>Analytics</div>
          <div className="chart-row">

            {/* Sales chart */}
            <div className="card">
              <div className="card-hdr">
                <div>
                  <div className="card-title">
                    <i className="fas fa-chart-area" style={{ color:'#16a34a', marginRight:7 }}/>
                    Sales Performance
                  </div>
                  <div className="card-sub">
                    Revenue &amp; orders —{' '}
                    {period==='week' ? 'last 7 days' : period==='month' ? 'last 30 days' : 'last year'}
                  </div>
                </div>
                <div className="card-controls">
                  <div className="period-tabs">
                    {['week','month','year'].map(p => (
                      <PeriodTab key={p} label={p[0].toUpperCase()+p.slice(1)} active={period===p} onClick={() => setPeriod(p)} />
                    ))}
                  </div>
                  <ChartToggle value={chartType} onChange={setChartType} />
                </div>
              </div>
              {loading
                ? <div className="skel" style={{ height:260 }}/>
                : sales.length
                  ? <ChartComp data={chartData} options={chartOptions} />
                  : <div className="chart-mt"><i className="fas fa-inbox"/>No data yet</div>
              }
            </div>

            {/* Doughnut */}
            <div className="card">
              <div className="card-hdr">
                <div>
                  <div className="card-title">
                    <i className="fas fa-circle-notch" style={{ color:'#6366f1', marginRight:7 }}/>
                    Order Status
                  </div>
                  <div className="card-sub">Breakdown across all statuses</div>
                </div>
              </div>
              {loading
                ? <div className="skel" style={{ height:220 }}/>
                : orderStats.length
                  ? <>
                      <div className="donut-wrap">
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                        <div className="donut-ctr">
                          <div className="donut-ctr-n">{doughnutTotal.toLocaleString()}</div>
                          <div className="donut-ctr-l">orders</div>
                        </div>
                      </div>
                      <div style={{ marginTop:12 }}>
                        {orderStats.map((r,i) => (
                          <StatusPill
                            key={r.status}
                            color={PALETTE[i % PALETTE.length]}
                            label={String(r.status||'').replaceAll('_',' ')}
                            count={Number(r.count||0)}
                            total={doughnutTotal}
                          />
                        ))}
                      </div>
                    </>
                  : <div className="chart-mt"><i className="fas fa-inbox"/>No data yet</div>
              }
            </div>
          </div>

          {/* ── Summary tiles ── */}
          <div className="sum-row">
            <div className="sum-tile">
              <div className="sum-tile-lbl">Completion Rate</div>
              <div className="sum-tile-val" style={{ color:'#16a34a' }}>
                {doughnutTotal ? `${Math.round(deliveredCount/doughnutTotal*100)}%` : '—'}
              </div>
              <div className="sum-tile-sub">Delivered vs all orders</div>
            </div>
            <div className="sum-tile">
              <div className="sum-tile-lbl">Peak Revenue Day</div>
              <div className="sum-tile-val">{peakDay}</div>
              <div className="sum-tile-sub">Best performing day this period</div>
            </div>
            <div className="sum-tile">
              <div className="sum-tile-lbl">Cancellation Rate</div>
              <div className="sum-tile-val" style={{ color: cancelledCount/doughnutTotal > .1 ? '#dc2626' : '#0f172a' }}>
                {doughnutTotal ? `${Math.round(cancelledCount/doughnutTotal*100)}%` : '—'}
              </div>
              <div className="sum-tile-sub">Cancelled vs all orders</div>
            </div>
          </div>

          {/* ── Next actions ── */}
          <div className="act-card">
            <h2><i className="fas fa-bolt" style={{ color:'#f59e0b', marginRight:8 }}/>Next Actions</h2>
            <div className="act-grid">
              {[
                { icon:'fa-user-check', color:'#6366f1', bg:'#eef2ff', title:'Verify pending accounts',  desc:'Approve restaurant and delivery registrations.',    tag:'Accounts' },
                { icon:'fa-file-export',color:'#0ea5e9', bg:'#f0f9ff', title:'Review reports',            desc:'Export CSV/PDF for any date range.',                tag:'Reports'  },
                { icon:'fa-headset',    color:'#f59e0b', bg:'#fffbeb', title:'System Assistant inbox',   desc:'Answer escalated customer questions in Messages.',  tag:'Support'  },
              ].map(a => (
                <div className="act-tile" key={a.title}>
                  <div className="act-tile-top">
                    <div className="act-icon-box" style={{ background:a.bg, color:a.color }}>
                      <i className={`fas ${a.icon}`}/>
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, borderRadius:99, padding:'2px 8px', background:a.bg, color:a.color, letterSpacing:.3, textTransform:'uppercase' }}>
                      {a.tag}
                    </span>
                  </div>
                  <div>
                    <div className="act-tile-title">{a.title}</div>
                    <div className="act-tile-desc">{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}