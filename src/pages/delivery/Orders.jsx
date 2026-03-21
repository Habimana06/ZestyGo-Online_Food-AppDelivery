import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';

const money = (n) => `RWF ${Number(n || 0).toLocaleString()}`;

const STATUS_MAP = {
  delivered:        { bg: '#f0fdf4', color: '#16a34a', icon: 'fa-check-circle' },
  on_the_way:       { bg: '#eff6ff', color: '#2563eb', icon: 'fa-road' },
  out_for_delivery: { bg: '#eff6ff', color: '#2563eb', icon: 'fa-road' },
  picked:           { bg: '#faf5ff', color: '#7c3aed', icon: 'fa-box-open' },
  ready:            { bg: '#ecfdf5', color: '#059669', icon: 'fa-store' },
  accepted:         { bg: '#fff7ed', color: '#ea580c', icon: 'fa-clock' },
  preparing:        { bg: '#fefce8', color: '#ca8a04', icon: 'fa-fire' },
  cancelled:        { bg: '#fef2f2', color: '#dc2626', icon: 'fa-times-circle' },
};

const getStatus = (s) => STATUS_MAP[String(s || '').toLowerCase()] || { bg: '#f1f5f9', color: '#64748b', icon: 'fa-circle' };

const TABS = [
  { id: 'available', label: 'Available', icon: 'fa-store' },
  { id: 'assigned',  label: 'Assigned',  icon: 'fa-motorcycle' },
  { id: 'on_the_way',label: 'On the Way',icon: 'fa-road' },
  { id: 'delivered', label: 'Delivered', icon: 'fa-check-circle' },
  { id: 'all',       label: 'All',       icon: 'fa-list' },
];

/* ── Order card ── */
function OrderCard({ o, savingId, onPick, onUpdate }) {
  const status  = String(o.status || '').toLowerCase();
  const st      = getStatus(status);
  const isSaving = savingId === o.id;

  const canPickNow  = status === 'ready';
  const canOnTheWay = status === 'picked';
  const canDelivered= status === 'on_the_way' || status === 'out_for_delivery';

  return (
    <div className="ord-card">
      {/* ── Top row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`fas ${st.icon}`} style={{ color: st.color, fontSize: 15 }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 14, fontWeight: 800, color: '#0f172a', letterSpacing: -.3 }}>
              Order #{o.id}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>
              {o.customerName || 'Customer'}
              {o.customerPhone && (
                <>
                  {' · '}
                  <a href={`tel:${o.customerPhone}`} style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>
                    <i className="fas fa-phone" style={{ fontSize: 10, marginRight: 3 }} />
                    {o.customerPhone}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .7 }}>Total</div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{money(o.total)}</div>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99,
            background: st.bg, color: st.color, textTransform: 'capitalize', whiteSpace: 'nowrap',
          }}>
            {status.replaceAll('_', ' ')}
          </span>
        </div>
      </div>

      {/* ── Info grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
        {/* Delivery address */}
        <div className="info-tile">
          <div className="info-tile-hdr">
            <i className="fas fa-map-marker-alt" style={{ color: '#10b981' }} />
            Delivery Address
          </div>
          <div className="info-tile-val">{o.deliveryAddress || '—'}</div>
        </div>

        {/* Restaurant */}
        <div className="info-tile">
          <div className="info-tile-hdr">
            <i className="fas fa-store" style={{ color: '#6366f1' }} />
            Restaurant
          </div>
          <div className="info-tile-val">
            <strong style={{ color: '#0f172a' }}>{o.restaurantName || '—'}</strong>
            {o.restaurantPhone && (
              <div style={{ marginTop: 3 }}>
                <a href={`tel:${o.restaurantPhone}`} style={{ color: '#10b981', fontWeight: 600, fontSize: 12, textDecoration: 'none' }}>
                  <i className="fas fa-phone" style={{ fontSize: 10, marginRight: 4 }} />
                  {o.restaurantPhone}
                </a>
              </div>
            )}
            {o.restaurantAddress && (
              <div style={{ marginTop: 3, color: '#64748b', fontSize: 12 }}>{o.restaurantAddress}</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 10, flexWrap: 'wrap' }}>
        <Link to={`/delivery/orders/${o.id}`} style={{ fontSize: 13, fontWeight: 700, color: '#10b981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="fas fa-arrow-right" style={{ fontSize: 11 }} />
          View details
        </Link>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canPickNow && (
            <ActionBtn onClick={() => onPick(o.id)} disabled={isSaving} color="#d97706" bg="#fffbeb" icon="fa-box-open" label={isSaving ? 'Saving…' : 'Pick Order'} />
          )}
          {canOnTheWay && (
            <ActionBtn onClick={() => onUpdate(o.id, 'on_the_way')} disabled={isSaving} color="#2563eb" bg="#eff6ff" icon="fa-road" label={isSaving ? 'Saving…' : 'On the Way'} />
          )}
          {canDelivered && (
            <ActionBtn onClick={() => onUpdate(o.id, 'delivered')} disabled={isSaving} color="#fff" bg="#16a34a" icon="fa-check" label={isSaving ? 'Saving…' : 'Mark Delivered'} solid />
          )}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ onClick, disabled, color, bg, icon, label, solid }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 10, border: solid ? 'none' : `1.5px solid ${color}22`,
        background: solid ? bg : bg, color: solid ? color : color,
        fontFamily: 'Sora,sans-serif', fontSize: 12, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .55 : 1,
        transition: 'all .15s',
      }}
    >
      {disabled
        ? <i className="fas fa-spinner fa-spin" style={{ fontSize: 11 }} />
        : <i className={`fas ${icon}`} style={{ fontSize: 11 }} />
      }
      {label}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════════════ */
export default function DeliveryOrders() {
  const [tab, setTab]         = useState('assigned');
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [savingId, setSavingId] = useState('');
  const [search, setSearch]   = useState('');

  const query = useMemo(() => (tab === 'all' ? '' : `?status=${encodeURIComponent(tab)}`), [tab]);

  const today = useMemo(() =>
    new Date().toLocaleDateString('en-RW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  , []);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const data = await api.delivery.getOrders(query);
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [query]);

  const update = async (id, status) => {
    setSavingId(id); setError('');
    try { await api.delivery.updateStatus(id, status); await load(); }
    catch (e) { setError(e.message || 'Failed to update status'); }
    finally { setSavingId(''); }
  };

  const pick = async (id) => {
    setSavingId(id); setError('');
    try { await api.delivery.pick(id); await load(); }
    catch (e) { setError(e.message || 'Failed to pick order'); }
    finally { setSavingId(''); }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(o =>
      String(o.id).includes(q) ||
      String(o.customerName || '').toLowerCase().includes(q) ||
      String(o.restaurantName || '').toLowerCase().includes(q) ||
      String(o.deliveryAddress || '').toLowerCase().includes(q)
    );
  }, [orders, search]);

  /* counts per tab for badges */
  const counts = useMemo(() => {
    const c = {};
    orders.forEach(o => {
      const s = String(o.status || '').toLowerCase();
      c[s] = (c[s] || 0) + 1;
    });
    return c;
  }, [orders]);

  /* ════ STYLES ══════════════════════════════════════════════════════ */
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; }

    .dord { font-family: 'DM Sans', sans-serif; background: #f8fafc; min-height: 100vh; }

    /* ── Header ── */
    .dord-hdr {
      background: #fff; border-bottom: 1px solid #e2e8f0;
      padding: 18px 32px; display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 12px; position: sticky; top: 0; z-index: 50;
    }
    .dord-hdr h1 { font-family: 'Sora',sans-serif; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -.5px; }
    .dord-hdr-sub { font-size: 12px; color: #94a3b8; margin-top: 3px; }
    .dord-hdr-right { display: flex; align-items: center; gap: 10px; }
    .dord-ico-btn { width: 36px; height: 36px; border-radius: 9px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; font-size: 13px; }
    .dord-ico-btn:hover { background: #f1f5f9; color: #0f172a; }

    /* ── Body ── */
    .dord-body { padding: 24px 32px 48px; }

    /* ── Error ── */
    .dord-err { background: #fff; border: 1px solid #fecaca; border-radius: 14px; padding: 14px 18px; color: #dc2626; font-size: 13px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }

    /* ── Sec label ── */
    .sec-lbl { font-size: 10px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: #94a3b8; margin-bottom: 12px; }

    /* ── Summary strip ── */
    .sum-strip { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
    @media(max-width:900px){ .sum-strip { grid-template-columns: repeat(2,1fr); } }
    .sum-chip { background: #fff; border: 1px solid #e2e8f0; border-radius: 13px; padding: 13px 16px; display: flex; align-items: center; gap: 10px; animation: fu .4s ease both; }
    .sum-chip-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
    .sum-chip-val { font-family: 'Sora',sans-serif; font-size: 18px; font-weight: 800; color: #0f172a; line-height: 1; }
    .sum-chip-lbl { font-size: 11px; color: #94a3b8; margin-top: 2px; }

    /* ── Toolbar (tabs + search) ── */
    .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .tabs-wrap { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 5px; display: flex; gap: 4px; flex-wrap: wrap; }
    .tab-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 10px; border: none;
      font-family: 'DM Sans',sans-serif; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: all .15s;
    }
    .tab-btn.active { background: #0f172a; color: #fff; }
    .tab-btn:not(.active) { background: transparent; color: '#64748b'; }
    .tab-btn:not(.active):hover { background: #f1f5f9; }
    .tab-count { font-size: 10px; font-weight: 800; background: rgba(255,255,255,.2); border-radius: 99px; padding: 1px 6px; min-width: 18px; text-align: center; }
    .tab-btn:not(.active) .tab-count { background: #f1f5f9; color: '#94a3b8'; }

    .search-wrap { position: relative; flex-shrink: 0; }
    .search-wrap i { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 12px; pointer-events: none; }
    .search-input {
      padding: 9px 14px 9px 34px; border-radius: 11px; border: 1.5px solid #e2e8f0;
      font-family: 'DM Sans',sans-serif; font-size: 13px; color: #0f172a;
      outline: none; transition: border-color .15s; width: 220px;
      background: #fff;
    }
    .search-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.08); }

    /* ── Order card ── */
    .ord-card {
      background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px;
      animation: fu .45s ease both; transition: transform .2s, box-shadow .2s;
    }
    .ord-card:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(0,0,0,.07); }

    /* ── Info tile ── */
    .info-tile { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 13px; padding: 14px; }
    .info-tile-hdr { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .9px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
    .info-tile-val { font-size: 13px; color: #475569; font-weight: 500; line-height: 1.55; white-space: pre-wrap; }

    /* ── Orders list ── */
    .ord-list { display: flex; flex-direction: column; gap: 12px; }

    /* ── Empty state ── */
    .ord-empty { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 64px 32px; text-align: center; animation: fu .4s ease both; }
    .ord-empty-icon { width: 64px; height: 64px; border-radius: 20px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px; color: #cbd5e1; }
    .ord-empty-title { font-family: 'Sora',sans-serif; font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
    .ord-empty-sub { font-size: 13px; color: #94a3b8; }

    /* ── Skeleton ── */
    .skel { background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size: 200% 100%; animation: sh 1.4s infinite; border-radius: 18px; }
    @keyframes sh { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    @keyframes fu  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

    .dot-pulse { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block; margin-right: 5px; box-shadow: 0 0 0 3px #dcfce7; animation: dp 2s infinite; }
    @keyframes dp { 0%,100%{box-shadow:0 0 0 3px #dcfce7} 50%{box-shadow:0 0 0 6px #dcfce7} }

    @media(max-width:640px){ .info-tile + .info-tile { grid-column: span 1; } }
  `;

  const assignedCount  = orders.filter(o => ['assigned','accepted','preparing'].includes(String(o.status||'').toLowerCase())).length;
  const inProgressCount= orders.filter(o => ['picked','on_the_way','out_for_delivery'].includes(String(o.status||'').toLowerCase())).length;
  const deliveredCount = orders.filter(o => String(o.status||'').toLowerCase() === 'delivered').length;
  const availableCount = orders.filter(o => String(o.status||'').toLowerCase() === 'ready').length;

  return (
    <>
      <style>{css}</style>
      <div className="dord">

        {/* ── Header ── */}
        <header className="dord-hdr">
          <div>
            <h1>My Deliveries</h1>
            <div className="dord-hdr-sub">
              <span className="dot-pulse" />
              {today}
            </div>
          </div>
          <div className="dord-hdr-right">
            <button className="dord-ico-btn" title="Refresh" onClick={load}>
              <i className="fas fa-sync-alt" />
            </button>
          </div>
        </header>

        <div className="dord-body">
          {error && <div className="dord-err"><i className="fas fa-exclamation-circle" />{error}</div>}

          {/* ── Summary strip ── */}
          <div className="sec-lbl">Today's Overview</div>
          <div className="sum-strip">
            {[
              { lbl: 'Available',   val: availableCount,  bg: '#ecfdf5', color: '#059669', icon: 'fa-store',        delay: 0   },
              { lbl: 'Assigned',    val: assignedCount,   bg: '#fff7ed', color: '#ea580c', icon: 'fa-motorcycle',   delay: 50  },
              { lbl: 'In Progress', val: inProgressCount, bg: '#eff6ff', color: '#2563eb', icon: 'fa-road',         delay: 100 },
              { lbl: 'Delivered',   val: deliveredCount,  bg: '#f0fdf4', color: '#16a34a', icon: 'fa-check-circle', delay: 150 },
            ].map(s => (
              <div className="sum-chip" key={s.lbl} style={{ animationDelay: `${s.delay}ms` }}>
                <div className="sum-chip-icon" style={{ background: s.bg }}>
                  <i className={`fas ${s.icon}`} style={{ color: s.color }} />
                </div>
                <div>
                  <div className="sum-chip-val">{s.val}</div>
                  <div className="sum-chip-lbl">{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Toolbar ── */}
          <div className="toolbar">
            <div className="tabs-wrap">
              {TABS.map(t => {
                const tCount = t.id === 'all'
                  ? orders.length
                  : orders.filter(o => String(o.status||'').toLowerCase() === t.id || (t.id === 'available' && String(o.status||'').toLowerCase() === 'ready')).length;
                return (
                  <button
                    key={t.id}
                    className={`tab-btn${tab === t.id ? ' active' : ''}`}
                    onClick={() => setTab(t.id)}
                    style={{ color: tab === t.id ? '#fff' : '#64748b' }}
                  >
                    <i className={`fas ${t.icon}`} style={{ fontSize: 11 }} />
                    {t.label}
                    {tCount > 0 && <span className="tab-count">{tCount}</span>}
                  </button>
                );
              })}
            </div>

            <div className="search-wrap">
              <i className="fas fa-search" />
              <input
                className="search-input"
                placeholder="Search orders…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* ── Orders list ── */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skel" style={{ height: 200, animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="ord-empty">
              <div className="ord-empty-icon">
                <i className="fas fa-inbox" />
              </div>
              <div className="ord-empty-title">No orders found</div>
              <div className="ord-empty-sub">
                {search ? `No results for "${search}"` : `No ${tab === 'all' ? '' : tab} orders right now`}
              </div>
            </div>
          ) : (
            <div className="ord-list">
              {filtered.map((o, i) => (
                <div key={o.id} style={{ animationDelay: `${i * 40}ms` }}>
                  <OrderCard o={o} savingId={savingId} onPick={pick} onUpdate={update} />
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}