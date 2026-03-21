import { useEffect, useState, useMemo, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

/* ── Brand ── */
const BRAND   = '#F56230';
const BRAND_D = '#d94e22';
const BRAND_L = '#fff4f0';
const CUSTOMER_HERO_BG = 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1600&auto=format&fit=crop&q=80';

const money = (n) => `RWF ${Number(n || 0).toLocaleString()}`;

const STATUS_MAP = {
  pending:          { bg: '#fff8f0', color: '#F56230', icon: 'fa-clock',        label: 'Pending'          },
  accepted:         { bg: '#eff6ff', color: '#2563eb', icon: 'fa-thumbs-up',    label: 'Accepted'         },
  preparing:        { bg: '#faf5ff', color: '#7c3aed', icon: 'fa-fire',         label: 'Preparing'        },
  ready:            { bg: '#ecfdf5', color: '#059669', icon: 'fa-store',        label: 'Ready'            },
  picked:           { bg: '#fff7ed', color: '#ea580c', icon: 'fa-box-open',     label: 'Picked'           },
  on_the_way:       { bg: '#eff6ff', color: '#2563eb', icon: 'fa-motorcycle',   label: 'On the Way'       },
  out_for_delivery: { bg: '#eff6ff', color: '#2563eb', icon: 'fa-motorcycle',   label: 'Out for Delivery' },
  delivered:        { bg: '#f0fdf4', color: '#16a34a', icon: 'fa-check-circle', label: 'Delivered'        },
  confirmed:        { bg: '#f0fdf4', color: '#16a34a', icon: 'fa-check',        label: 'Confirmed'        },
  cancelled:        { bg: '#fef2f2', color: '#dc2626', icon: 'fa-times-circle', label: 'Cancelled'        },
  rejected:         { bg: '#fef2f2', color: '#dc2626', icon: 'fa-ban',          label: 'Rejected'         },
};
const getSt = (s) => STATUS_MAP[String(s||'').toLowerCase()] || { bg:'#f1f5f9', color:'#64748b', icon:'fa-circle', label: s };

/* ── Progress steps ── */
const STEPS        = ['accepted','preparing','ready','picked','on_the_way','delivered'];
const STEP_LABELS  = ['Accepted','Preparing','Ready','Picked','On the Way','Delivered'];
const STEP_ICONS   = ['fa-thumbs-up','fa-fire','fa-store','fa-box-open','fa-motorcycle','fa-check-circle'];

function getStep(status) {
  const s = String(status||'').toLowerCase();
  if (s === 'out_for_delivery') return STEPS.indexOf('on_the_way');
  return STEPS.indexOf(s);
}

function ProgressBar({ status }) {
  const step = getStep(status);
  if (step < 0) return null;
  return (
    <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid #f1f5f9' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 12 }}>
        Order Progress
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {STEPS.map((_, i) => {
          const done   = i <= step;
          const active = i === step;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: done ? BRAND : '#f1f5f9',
                border: active ? `3px solid ${BRAND}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? `0 0 0 5px ${BRAND}22` : 'none',
                transition: 'all .35s', position: 'relative', zIndex: 1,
              }}>
                <i className={`fas ${STEP_ICONS[i]}`} style={{ fontSize: 11, color: done ? '#fff' : '#cbd5e1' }} />
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 3, background: i < step ? BRAND : '#f1f5f9', margin: '0 2px', borderRadius: 99, transition: 'background .4s' }} />
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        {STEP_LABELS.map((l, i) => (
          <div key={l} style={{ fontSize: 9, fontWeight: i === step ? 800 : 500, color: i <= step ? BRAND : '#cbd5e1', textAlign: 'center', width: 32, lineHeight: 1.3 }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Count-up hook ── */
function useCountUp(target, dur = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!target) { setV(0); return; }
    let cur = 0;
    const step = target / (dur / 16);
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { setV(target); clearInterval(t); }
      else setV(Math.floor(cur));
    }, 16);
    return () => clearInterval(t);
  }, [target]);
  return v;
}

/* ── Tiny sparkline ── */
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
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = color + '22'; ctx.fill();
  }, [data, color]);
  return <canvas ref={ref} width={80} height={28} style={{ display: 'block' }} />;
}

/* ── Stat card ── */
function StatChip({ icon, iconColor, iconBg, label, value, spark, delay }) {
  const num = typeof value === 'number' ? value : null;
  const animated = useCountUp(num ?? 0);
  return (
    <div className="sum-chip" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`fas ${icon}`} style={{ color: iconColor, fontSize: 15 }} />
        </div>
        {spark && <Sparkline data={spark} color={iconColor} />}
      </div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: -1, lineHeight: 1 }}>
        {num !== null ? num.toLocaleString() : value}
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

/* ── Order card ── */
function OrderCard({ o, idx, onDeleteCancelledOrder, deletingOrderId }) {
  const [expanded, setExpanded] = useState(false);
  const st      = getSt(o.status);
  const step    = getStep(o.status);
  const isActive= step >= 0 && String(o.status).toLowerCase() !== 'delivered';
  const isCancelled = ['cancelled', 'rejected'].includes(String(o.status || '').toLowerCase());
  const deleting = deletingOrderId === o.id;
  const date    = o.orderDate ? new Date(o.orderDate) : null;

  return (
    <div className="ord-card" style={{ animationDelay: `${idx * 45}ms` }}>

      {/* orange top accent stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: isActive ? `linear-gradient(90deg,${BRAND},${BRAND_D})` : 'transparent', borderRadius: '20px 20px 0 0' }} />

      {/* ── Top ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', paddingTop: isActive ? 8 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 0 4px ${st.color}11` }}>
            <i className={`fas ${st.icon}`} style={{ color: st.color, fontSize: 18 }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
              <span style={{ fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: -.3 }}>
                Order #{o.id}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: st.bg, color: st.color }}>
                {st.label}
              </span>
              {isActive && (
                <span style={{ fontSize: 10, fontWeight: 700, color: BRAND, background: BRAND_L, border: `1px solid ${BRAND}33`, borderRadius: 99, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: BRAND, display: 'inline-block', animation: 'dp 1.5s infinite' }} />
                  Live
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              <i className="fas fa-store" style={{ marginRight: 5, color: '#94a3b8', fontSize: 10 }} />
              {o.restaurantName || '—'}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: -.5 }}>
            {money(o.total)}
          </div>
          {date && (
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
              {date.toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' })}
              {' · '}{date.toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      {/* ── Progress ── */}
      {step >= 0 && <ProgressBar status={o.status} />}

      {/* ── Items preview ── */}
      {o.items?.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: step >= 0 ? 'none' : '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(expanded ? o.items : o.items.slice(0, 4)).map(it => (
              <span key={it.id} style={{ fontSize: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 8, padding: '4px 10px', color: '#475569', fontWeight: 500 }}>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{it.quantity}×</span> {it.name}
              </span>
            ))}
            {!expanded && o.items.length > 4 && (
              <button onClick={() => setExpanded(true)} style={{ fontSize: 12, color: BRAND, background: BRAND_L, border: `1px solid ${BRAND}33`, borderRadius: 8, padding: '4px 10px', fontWeight: 700, cursor: 'pointer' }}>
                +{o.items.length - 4} more
              </button>
            )}
            {expanded && o.items.length > 4 && (
              <button onClick={() => setExpanded(false)} style={{ fontSize: 12, color: '#94a3b8', background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '4px 10px', fontWeight: 700, cursor: 'pointer' }}>
                Show less
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 8 }}>
        {/* delivery fee / items count meta */}
        <div style={{ display: 'flex', gap: 14 }}>
          {o.items?.length > 0 && (
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
              <i className="fas fa-bag-shopping" style={{ marginRight: 4, fontSize: 10 }} />
              {o.items.length} item{o.items.length !== 1 ? 's' : ''}
            </span>
          )}
          {o.deliveryFee != null && (
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
              <i className="fas fa-motorcycle" style={{ marginRight: 4, fontSize: 10 }} />
              Delivery: {money(o.deliveryFee)}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {isCancelled && (
            <button
              type="button"
              onClick={() => onDeleteCancelledOrder?.(o.id)}
              disabled={deleting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 12,
                fontWeight: 700,
                color: deleting ? '#94a3b8' : '#dc2626',
                background: deleting ? '#f8fafc' : '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 10,
                padding: '8px 14px',
                cursor: deleting ? 'not-allowed' : 'pointer',
              }}
            >
              <i className={`fas ${deleting ? 'fa-spinner fa-spin' : 'fa-trash-alt'}`} style={{ fontSize: 11 }} />
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <Link
            to={`/order-tracking/${o.id}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              fontSize: 12, fontWeight: 700, color: '#fff',
              background: `linear-gradient(135deg,${BRAND},${BRAND_D})`,
              borderRadius: 10, padding: '8px 18px', textDecoration: 'none',
              boxShadow: `0 4px 14px ${BRAND}33`, transition: 'all .15s',
            }}
          >
            <i className="fas fa-map-marker-alt" style={{ fontSize: 11 }} />
            {isActive ? 'Track Live' : 'View Details'}
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════════════ */
const FILTER_DEFS = [
  { id: 'all',       label: 'All Orders', icon: 'fa-list'         },
  { id: 'active',    label: 'Active',     icon: 'fa-road'         },
  { id: 'delivered', label: 'Delivered',  icon: 'fa-check-circle' },
  { id: 'cancelled', label: 'Cancelled',  icon: 'fa-times-circle' },
];

export default function Orders() {
  const [orders, setOrders]   = useState([]);
  const [error, setError]     = useState('');
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [pendingDeleteOrderId, setPendingDeleteOrderId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [sort, setSort]       = useState('newest');
  const { isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) return;
    setError('');
    api.orders.getMyOrders()
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .catch(e => { setError(e.message || 'Failed to load orders'); setOrders([]); });
  }, [isLoggedIn]);

  if (!loading && !isLoggedIn) return <Navigate to="/login?redirect=/orders" replace />;

  /* Derived buckets */
  const activeOrders    = orders.filter(o => getStep(o.status) >= 0 && String(o.status).toLowerCase() !== 'delivered');
  const deliveredOrders = orders.filter(o => String(o.status).toLowerCase() === 'delivered');
  const cancelledOrders = orders.filter(o => ['cancelled','rejected'].includes(String(o.status).toLowerCase()));
  const totalSpend      = deliveredOrders.reduce((s, o) => s + Number(o.total || 0), 0);
  const totalItems      = orders.reduce((s, o) => s + (o.items?.length || 0), 0);
  const spendSpark      = deliveredOrders.slice(-7).map(o => Number(o.total || 0));

  const filtered = useMemo(() => {
    let list = { all: orders, active: activeOrders, delivered: deliveredOrders, cancelled: cancelledOrders }[filter] ?? orders;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        String(o.id).includes(q) ||
        String(o.restaurantName||'').toLowerCase().includes(q) ||
        (o.items||[]).some(i => String(i.name||'').toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      if (sort === 'newest') return new Date(b.orderDate||0) - new Date(a.orderDate||0);
      if (sort === 'oldest') return new Date(a.orderDate||0) - new Date(b.orderDate||0);
      if (sort === 'highest') return Number(b.total||0) - Number(a.total||0);
      if (sort === 'lowest')  return Number(a.total||0) - Number(b.total||0);
      return 0;
    });
  }, [orders, filter, search, sort]);

  const handleDeleteCancelledOrder = async (orderId) => {
    setDeletingOrderId(orderId);
    setPendingDeleteOrderId(null);
    setError('');
    try {
      await api.orders.remove(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setToastMessage('Cancelled order deleted successfully.');
    } catch (e) {
      setError(e.message || 'Failed to delete order');
    } finally {
      setDeletingOrderId(null);
    }
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; }
    .ords { font-family: 'DM Sans',sans-serif; background: #f8fafc; min-height: 100vh; }

    /* ── Hero banner ── */
    .ords-hero {
      background-image:
        linear-gradient(135deg, rgba(245,98,48,.92) 0%, rgba(217,78,34,.92) 100%),
        url('${CUSTOMER_HERO_BG}');
      background-size: cover;
      background-position: center;
      padding: 36px 20px 56px; position: relative; overflow: hidden;
    }
    .ords-hero::before {
      content:''; position:absolute; width:320px; height:320px; border-radius:50%;
      background:rgba(255,255,255,.06); top:-100px; right:-80px; pointer-events:none;
    }
    .ords-hero::after {
      content:''; position:absolute; width:200px; height:200px; border-radius:50%;
      background:rgba(255,255,255,.04); bottom:-70px; left:-50px; pointer-events:none;
    }
    .ords-hero-inner { max-width: 860px; margin: 0 auto; position: relative; z-index: 1; }
    .ords-hero h1 { font-family:'Sora',sans-serif; font-size:28px; font-weight:800; color:#fff; letter-spacing:-1px; margin-bottom:6px; }
    .ords-hero-sub { font-size:14px; color:rgba(255,255,255,.7); }

    /* ── Body ── */
    .ords-body { max-width: 860px; margin: -32px auto 0; padding: 0 20px 60px; position: relative; z-index: 2; }

    /* ── Summary strip ── */
    .sum-strip { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
    @media(max-width:700px){ .sum-strip { grid-template-columns: repeat(2,1fr); } }
    .sum-chip { background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:18px; animation:fu .45s ease both; transition: transform .2s, box-shadow .2s; }
    .sum-chip:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.07); }

    /* ── Toolbar ── */
    .toolbar { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:14px; flex-wrap:wrap; }
    .tabs-wrap { display:flex; background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:5px; gap:4px; flex-wrap:wrap; }
    .tab-btn { display:flex; align-items:center; gap:5px; padding:7px 13px; border-radius:10px; border:none; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; cursor:pointer; transition:all .15s; }
    .tab-btn.active { background:#F56230; color:#fff; box-shadow:0 4px 12px #F5623033; }
    .tab-btn:not(.active) { background:transparent; color:#64748b; }
    .tab-btn:not(.active):hover { background:#f1f5f9; }
    .tab-count { font-size:10px; font-weight:800; padding:1px 6px; border-radius:99px; }
    .tab-btn.active .tab-count { background:rgba(255,255,255,.25); color:#fff; }
    .tab-btn:not(.active) .tab-count { background:#f1f5f9; color:#94a3b8; }

    .toolbar-right { display:flex; align-items:center; gap:8px; }
    .search-wrap { position:relative; }
    .search-wrap i { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:12px; pointer-events:none; }
    .search-input { padding:9px 14px 9px 32px; border-radius:11px; border:1.5px solid #e2e8f0; font-family:'DM Sans',sans-serif; font-size:13px; color:#0f172a; outline:none; transition:border-color .15s; width:190px; background:#fff; }
    .search-input:focus { border-color:#F56230; box-shadow:0 0 0 3px #F5623011; }
    .sort-select { padding:9px 12px; border-radius:11px; border:1.5px solid #e2e8f0; font-family:'DM Sans',sans-serif; font-size:12px; color:#475569; background:#fff; outline:none; cursor:pointer; transition:border-color .15s; }
    .sort-select:focus { border-color:#F56230; }

    /* ── Order card ── */
    .ord-card { background:#fff; border:1px solid #e2e8f0; border-radius:20px; padding:22px; animation:fu .45s ease both; transition:transform .2s,box-shadow .2s; position:relative; overflow:hidden; }
    .ord-card:hover { transform:translateY(-2px); box-shadow:0 12px 36px rgba(0,0,0,.08); }
    .ord-list { display:flex; flex-direction:column; gap:12px; }

    /* ── Empty / error ── */
    .ords-state { text-align:center; padding:80px 20px; max-width:480px; margin:0 auto; }
    .ords-state-icon { font-size:64px; display:block; margin-bottom:20px; }
    .ords-state h2 { font-family:'Sora',sans-serif; font-size:22px; font-weight:800; color:#0f172a; margin-bottom:8px; }
    .ords-state p { font-size:14px; color:#94a3b8; margin-bottom:28px; line-height:1.6; }
    .ords-cta { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#F56230,#d94e22); color:#fff; font-family:'Sora',sans-serif; font-size:13px; font-weight:700; padding:12px 28px; border-radius:12px; text-decoration:none; box-shadow:0 6px 20px #F5623033; transition:all .15s; }
    .ords-cta:hover { transform:translateY(-1px); box-shadow:0 10px 28px #F5623044; }

    .ord-empty { background:#fff; border:1px solid #e2e8f0; border-radius:20px; padding:60px 20px; text-align:center; animation:fu .4s ease both; }
    .ord-empty i { font-size:36px; color:#e2e8f0; display:block; margin-bottom:14px; }
    .ord-empty-title { font-family:'Sora',sans-serif; font-size:16px; font-weight:700; color:#0f172a; margin-bottom:4px; }
    .ord-empty-sub { font-size:13px; color:#94a3b8; }

    /* ── Skeleton ── */
    .skel { background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size:200% 100%; animation:sh 1.4s infinite; border-radius:20px; }
    @keyframes sh { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    @keyframes dp { 0%,100%{opacity:1} 50%{opacity:.2} }
    @keyframes fu  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  `;

  if (error) return (
    <>
      <style>{css}</style>
      <div className="ords">
        <div className="ords-state">
          <i className="fas fa-triangle-exclamation ords-state-icon" style={{ color: '#fca5a5' }} />
          <h2>Couldn't load your orders</h2>
          <p>{error}</p>
          <Link to="/menu" className="ords-cta"><i className="fas fa-utensils" />Browse Menu</Link>
        </div>
      </div>
    </>
  );

  if (!loading && orders.length === 0) return (
    <>
      <style>{css}</style>
      <div className="ords">
        <div className="ords-state">
          <i className="fas fa-bag-shopping ords-state-icon" style={{ color: `${BRAND}55` }} />
          <h2>No orders yet</h2>
          <p>Your order history will appear here. Start by browsing our menu and placing your first order!</p>
          <Link to="/menu" className="ords-cta"><i className="fas fa-utensils" />Browse Menu</Link>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="ords">
        <ConfirmDialog
          open={Boolean(pendingDeleteOrderId)}
          title="Delete cancelled order?"
          message="This removes the cancelled order from your history."
          confirmText="Delete"
          cancelText="Keep"
          confirmType="danger"
          loading={Boolean(pendingDeleteOrderId && deletingOrderId === pendingDeleteOrderId)}
          onCancel={() => setPendingDeleteOrderId(null)}
          onConfirm={() => handleDeleteCancelledOrder(pendingDeleteOrderId)}
        />
        <Toast
          message={toastMessage}
          type="success"
          duration={2500}
          position="top-right"
          onClose={() => setToastMessage('')}
        />

        {/* ── Hero banner ── */}
        <div className="ords-hero">
          <div className="ords-hero-inner">
            <h1>
              <i className="fas fa-receipt" style={{ marginRight: 10, opacity: .85 }} />
              My Orders
            </h1>
            <div className="ords-hero-sub">
              {orders.length} order{orders.length !== 1 ? 's' : ''} · {activeOrders.length} active right now
            </div>
          </div>
        </div>

        <div className="ords-body">

          {/* ── Stat chips ── */}
          <div className="sum-strip">
            <StatChip icon="fa-list"         iconColor={BRAND}     iconBg={BRAND_L}  label="Total Orders"  value={orders.length}         spark={null}       delay={0}   />
            <StatChip icon="fa-road"         iconColor="#2563eb"   iconBg="#eff6ff"  label="Active"         value={activeOrders.length}   spark={null}       delay={60}  />
            <StatChip icon="fa-check-circle" iconColor="#16a34a"   iconBg="#f0fdf4"  label="Delivered"      value={deliveredOrders.length} spark={null}      delay={120} />
            <StatChip icon="fa-coins"        iconColor="#d97706"   iconBg="#fffbeb"  label="Total Spent"    value={money(totalSpend)}      spark={spendSpark} delay={180} />
          </div>

          {/* ── Active orders callout ── */}
          {activeOrders.length > 0 && (
            <div style={{
              background: `linear-gradient(135deg,${BRAND_L},#fff4ec)`,
              border: `1px solid ${BRAND}33`, borderRadius: 16,
              padding: '14px 20px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 12,
              animation: 'fu .4s ease both',
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fas fa-motorcycle" style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                  {activeOrders.length} order{activeOrders.length > 1 ? 's' : ''} in progress
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Track your deliveries live below.</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: BRAND, background: '#fff', border: `1px solid ${BRAND}33`, borderRadius: 99, padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, background: BRAND, borderRadius: '50%', display: 'inline-block', animation: 'dp 1.5s infinite' }} />
                Live
              </span>
            </div>
          )}

          {/* ── Toolbar ── */}
          <div className="toolbar">
            <div className="tabs-wrap">
              {FILTER_DEFS.map(t => {
                const cnt = { all: orders.length, active: activeOrders.length, delivered: deliveredOrders.length, cancelled: cancelledOrders.length }[t.id];
                return (
                  <button key={t.id} className={`tab-btn${filter === t.id ? ' active' : ''}`} onClick={() => setFilter(t.id)}>
                    <i className={`fas ${t.icon}`} style={{ fontSize: 11 }} />
                    {t.label}
                    {cnt > 0 && <span className="tab-count">{cnt}</span>}
                  </button>
                );
              })}
            </div>
            <div className="toolbar-right">
              <div className="search-wrap">
                <i className="fas fa-search" />
                <input className="search-input" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest amount</option>
                <option value="lowest">Lowest amount</option>
              </select>
            </div>
          </div>

          {/* ── Orders ── */}
          {loading
            ? [1,2,3].map(i => <div key={i} className="skel" style={{ height: 180, marginBottom: 12, animationDelay:`${i*80}ms` }} />)
            : filtered.length === 0
              ? (
                <div className="ord-empty">
                  <i className="fas fa-inbox" />
                  <div className="ord-empty-title">No orders found</div>
                  <div className="ord-empty-sub">{search ? `No results for "${search}"` : `No ${filter} orders yet`}</div>
                </div>
              )
              : (
                <div className="ord-list">
                  {filtered.map((o, i) => (
                    <OrderCard
                      key={o.id}
                      o={o}
                      idx={i}
                      onDeleteCancelledOrder={setPendingDeleteOrderId}
                      deletingOrderId={deletingOrderId}
                    />
                  ))}
                </div>
              )
          }

        </div>
      </div>
    </>
  );
}