import { useEffect, useMemo, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';

const STATUS_LABEL = {
  pending:    'New',
  accepted:   'Accepted',
  preparing:  'Preparing',
  ready:      'Ready for pickup',
  picked:     'Picked',
  on_the_way: 'On the way',
  delivered:  'Delivered',
  rejected:   'Rejected',
};

const STATUS_STYLE = {
  pending:    { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04' },
  accepted:   { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  preparing:  { bg: '#f3e8ff', color: '#7e22ce', dot: '#a855f7' },
  ready:      { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  picked:     { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  on_the_way: { bg: '#e0e7ff', color: '#3730a3', dot: '#6366f1' },
  delivered:  { bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
  rejected:   { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
};

const STATUS_STEPS = ['pending', 'accepted', 'preparing', 'ready', 'picked', 'on_the_way', 'delivered'];

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {STATUS_LABEL[status] || status}
    </span>
  );
}

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

export default function RestaurantOrders() {
  const { user, loading } = useAuth();
  const [orders, setOrders]       = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError]         = useState('');
  const [tab, setTab]             = useState('new');
  const [updating, setUpdating]   = useState('');
  const [acceptOpen, setAcceptOpen]   = useState(false);
  const [acceptOrderId, setAcceptOrderId] = useState('');
  const [acceptFee, setAcceptFee] = useState('');
  const [expanded, setExpanded]   = useState({});

  if (!loading && user?.role !== 'restaurant') return <Navigate to="/login" replace />;

  const load = async (t = tab) => {
    setPageLoading(true); setError('');
    try {
      const data = await api.restaurant.orders.getAll(t === 'new' ? '?status=new' : '');
      setOrders(data);
    } catch (e) {
      setError(e.message || 'Failed to load orders');
      setOrders([]);
    } finally { setPageLoading(false); }
  };

  useEffect(() => { load('new'); }, []);
  useEffect(() => { load(tab); }, [tab]);

  const updateStatus = async (id, status, extra = undefined) => {
    setUpdating(id + status); setError('');
    try {
      await api.restaurant.orders.updateStatus(id, status, extra || {});
      setOrders(prev => prev.map(o =>
        o.id === id ? {
          ...o, status,
          ...(extra?.deliveryFee != null ? {
            deliveryFee: Number(extra.deliveryFee),
            total: Number(o.subtotal || 0) + Number(o.tax || 0) - Number(o.discount || 0) + Number(extra.deliveryFee),
          } : {}),
        } : o
      ));
    } catch (e) {
      setError(e.message || 'Update failed');
    } finally { setUpdating(''); }
  };

  const openAccept = (order) => {
    setAcceptOrderId(order?.id || '');
    setAcceptFee(String(order?.deliveryFee ?? ''));
    setAcceptOpen(true);
  };

  const confirmAccept = async () => {
    const fee = Number(String(acceptFee || '').trim());
    if (!Number.isFinite(fee) || fee < 0) { setError('Delivery fee must be a number (>= 0)'); return; }
    if (!acceptOrderId) return;
    await updateStatus(acceptOrderId, 'accepted', { deliveryFee: fee });
    setAcceptOpen(false); setAcceptOrderId(''); setAcceptFee('');
  };

  const totals = useMemo(() => ({
    count: orders.length,
    sum: orders.reduce((s, o) => s + Number(o.total || 0), 0),
  }), [orders]);

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        * { font-family: 'Sora', sans-serif; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn .2s ease both; }
      `}</style>

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-slate-100 px-8 py-5 flex flex-wrap gap-4 justify-between items-center sticky top-0 z-10"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Order Management</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Accept, reject and update order statuses</p>
        </div>

        {/* tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
          {[{ id: 'new', label: '🔔 New Orders' }, { id: 'all', label: '📋 All Orders' }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-5 py-2 rounded-xl text-sm font-bold transition-all"
              style={tab === t.id
                ? { background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, color: '#fff', boxShadow: `0 3px 10px ${BRAND}40` }
                : { color: '#64748b' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-6 lg:p-8 space-y-5 bg-slate-50 min-h-screen">

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            <i className="fas fa-exclamation-circle flex-shrink-0" /> {error}
          </div>
        )}

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total orders', value: totals.count, icon: 'fa-receipt', color: BRAND },
            { label: 'Total value', value: `${totals.sum.toLocaleString()} RWF`, icon: 'fa-coins', color: '#10b981' },
            { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, icon: 'fa-clock', color: '#f59e0b' },
            { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon: 'fa-check-circle', color: '#6366f1' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${stat.color}15` }}>
                <i className={`fas ${stat.icon} text-sm`} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{stat.label}</p>
                <p className="text-lg font-black text-slate-800 leading-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── ORDER LIST ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${BRAND}15` }}>
                <i className="fas fa-bag-shopping text-sm" style={{ color: BRAND }} />
              </div>
              <h2 className="text-base font-black text-slate-800">{tab === 'new' ? 'New orders' : 'All orders'}</h2>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-500">{totals.count} orders</span>
          </div>

          {pageLoading ? (
            <div className="p-12 flex flex-col items-center gap-3 text-slate-400">
              <span className="w-8 h-8 border-2 border-slate-200 border-t-orange-400 rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading orders…</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 flex flex-col items-center gap-3 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">🛍️</div>
              <p className="font-bold text-slate-500">No orders found</p>
              <p className="text-sm text-slate-400">New orders will appear here when customers place them.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {orders.map(o => {
                const isExpanded = !!expanded[o.id];
                const stepIdx    = STATUS_STEPS.indexOf(o.status);
                const isRejected = o.status === 'rejected';

                return (
                  <div key={o.id} className="fade-in">
                    {/* ── ORDER ROW ── */}
                    <div className="px-6 py-4 flex flex-wrap lg:flex-nowrap gap-4 items-start">

                      {/* left: info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">#{String(o.id).slice(-6)}</span>
                          <StatusBadge status={o.status} />
                          <span className="text-xs text-slate-400">{new Date(o.orderDate).toLocaleString()}</span>
                        </div>
                        <p className="font-black text-slate-800 text-sm">{o.customerName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{o.customerPhone} · {o.deliveryAddress}</p>

                        {/* progress bar */}
                        {!isRejected && (
                          <div className="mt-3 flex items-center gap-1">
                            {STATUS_STEPS.map((s, i) => (
                              <div
                                key={s}
                                className="flex-1 h-1.5 rounded-full transition-all"
                                style={{ background: i <= stepIdx ? BRAND : '#e2e8f0' }}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* center: total */}
                      <div className="text-right flex-shrink-0 hidden sm:block">
                        <p className="text-lg font-black text-slate-800">{Number(o.total || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">RWF</span></p>
                        <p className="text-xs text-slate-400">{o.items?.length || 0} item{o.items?.length !== 1 ? 's' : ''}</p>
                      </div>

                      {/* right: actions */}
                      <div className="flex flex-col gap-2 w-full lg:w-52 flex-shrink-0">
                        {o.status === 'pending' ? (
                          <>
                            <button
                              disabled={!!updating}
                              onClick={() => openAccept(o)}
                              className="w-full py-2.5 text-white text-sm font-black rounded-xl flex items-center justify-center gap-2 transition-all"
                              style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 4px 12px ${BRAND}40` }}
                            >
                              <i className="fas fa-check text-xs" /> Accept + Set fee
                            </button>
                            <button
                              disabled={!!updating}
                              onClick={() => updateStatus(o.id, 'rejected')}
                              className="w-full py-2.5 text-sm font-bold rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {updating === o.id + 'rejected'
                                ? <span className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                                : <><i className="fas fa-xmark text-xs" /> Reject</>}
                            </button>
                          </>
                        ) : (
                          <>
                            {['preparing', 'ready'].map(s => {
                              const past = STATUS_STEPS.indexOf(o.status) >= STATUS_STEPS.indexOf(s);
                              return (
                                <button
                                  key={s}
                                  disabled={!!updating || past || isRejected}
                                  onClick={() => updateStatus(o.id, s)}
                                  className="w-full py-2.5 text-sm font-bold rounded-xl border-2 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                  style={past ? { borderColor: '#e2e8f0', color: '#94a3b8', background: '#f8fafc' } : { borderColor: BRAND, color: BRAND, background: `${BRAND}08` }}
                                >
                                  {updating === o.id + s
                                    ? <span className="w-4 h-4 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin" />
                                    : past
                                      ? <><i className="fas fa-check text-xs" /> {STATUS_LABEL[s]}</>
                                      : <>{s === 'preparing' ? '👨‍🍳' : '✅'} Mark {STATUS_LABEL[s]}</>
                                  }
                                </button>
                              );
                            })}
                          </>
                        )}

                        {/* expand toggle */}
                        <button
                          onClick={() => toggleExpand(o.id)}
                          className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1.5 transition"
                        >
                          {isExpanded ? 'Hide details' : 'View details'}
                          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-[9px]`} />
                        </button>
                      </div>
                    </div>

                    {/* ── EXPANDED DETAILS ── */}
                    {isExpanded && (
                      <div className="px-6 pb-5 space-y-3 fade-in">

                        {/* items */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Order Items</p>
                          <div className="space-y-2">
                            {o.items?.map(i => (
                              <div key={i.id} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600">{i.quantity}</span>
                                  <span className="text-sm font-semibold text-slate-700">{i.name}</span>
                                </div>
                                <span className="text-sm font-black text-slate-800">
                                  {(Number(i.price || 0) * Number(i.quantity || 0)).toLocaleString()} RWF
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                            <span className="text-sm font-black text-slate-700">Total</span>
                            <span className="text-base font-black" style={{ color: BRAND }}>{Number(o.total || 0).toLocaleString()} RWF</span>
                          </div>
                        </div>

                        {/* delivery driver */}
                        {o.deliveryId && (
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Delivery Driver</p>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg">🛵</div>
                                <div>
                                  <p className="text-sm font-black text-slate-800">{o.deliveryName || `Driver #${o.deliveryId}`}</p>
                                  {o.deliveryPhone && (
                                    <a href={`tel:${o.deliveryPhone}`} className="text-xs font-bold hover:underline" style={{ color: BRAND }}>{o.deliveryPhone}</a>
                                  )}
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    Score: <span className="font-bold text-slate-600">{o.deliveryScore ?? '—'}</span>
                                    {o.deliveryDeliveredCount != null ? ` · ${Number(o.deliveryDeliveredCount)} delivered` : ''}
                                    {o.deliveryAvgMinutes != null ? ` · avg ${Number(o.deliveryAvgMinutes).toFixed(0)} min` : ''}
                                  </p>
                                </div>
                              </div>
                              <Link
                                to={`/restaurant/messages?with=${encodeURIComponent(String(o.deliveryId))}&orderId=${encodeURIComponent(String(o.id))}`}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl text-white transition"
                                style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 3px 10px ${BRAND}30` }}
                              >
                                <i className="fas fa-message text-xs" /> Message
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ACCEPT MODAL ── */}
      <Modal
        open={acceptOpen}
        title="Accept order"
        onClose={() => { setAcceptOpen(false); setAcceptOrderId(''); setAcceptFee(''); }}
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => { setAcceptOpen(false); setAcceptOrderId(''); setAcceptFee(''); }}
              className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmAccept}
              disabled={!acceptOrderId || !!updating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-black transition disabled:opacity-50"
              style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 4px 14px ${BRAND}40` }}
            >
              {updating ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <i className="fas fa-check text-xs" />}
              Confirm & Accept
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            <i className="fas fa-circle-info mt-0.5 flex-shrink-0" />
            <span>Set the delivery fee for this order. This amount will be credited to the delivery driver upon completion.</span>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Delivery fee (RWF)</label>
            <FocusInput
              type="number" min="0" step="1"
              value={acceptFee}
              onChange={e => setAcceptFee(e.target.value)}
              placeholder="e.g. 2000"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}