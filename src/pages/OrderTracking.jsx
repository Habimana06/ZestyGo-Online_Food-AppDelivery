import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

const BRAND = '#F56230';
const CUSTOMER_HERO_BG = 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1600&auto=format&fit=crop&q=80';

const STATUS_ORDER  = ['pending','accepted','preparing','ready','picked','on_the_way','delivered'];
const STATUS_LABELS = {
  pending:    'Order Placed',
  accepted:   'Accepted',
  preparing:  'Preparing',
  ready:      'Ready for pickup',
  picked:     'Picked up',
  on_the_way: 'On the Way',
  delivered:  'Delivered',
};
const STATUS_ICONS = {
  pending:    'fa-clock',
  accepted:   'fa-thumbs-up',
  preparing:  'fa-fire',
  ready:      'fa-store',
  picked:     'fa-box-open',
  on_the_way: 'fa-motorcycle',
  delivered:  'fa-check-circle',
};
const STATUS_COLORS = {
  pending:    { bg: 'bg-orange-50',  text: 'text-orange-500',  ring: 'ring-orange-200'  },
  accepted:   { bg: 'bg-blue-50',   text: 'text-blue-600',    ring: 'ring-blue-200'    },
  preparing:  { bg: 'bg-purple-50', text: 'text-purple-600',  ring: 'ring-purple-200'  },
  ready:      { bg: 'bg-emerald-50',text: 'text-emerald-600', ring: 'ring-emerald-200' },
  picked:     { bg: 'bg-amber-50',  text: 'text-amber-600',   ring: 'ring-amber-200'   },
  on_the_way: { bg: 'bg-blue-50',   text: 'text-blue-600',    ring: 'ring-blue-200'    },
  delivered:  { bg: 'bg-green-50',  text: 'text-green-600',   ring: 'ring-green-200'   },
};

const money = (n) => `RWF ${Number(n || 0).toLocaleString()}`;

const PAYMENT_LABELS = {
  card:   'Credit / Debit Card',
  mobile: 'Mobile Money',
  bank:   'Bank Transfer',
  cash:   'Cash on Delivery',
};

/* ── ETA Countdown ── */
function Countdown({ estimatedAt }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (!estimatedAt) return;
    const tick = () => {
      const diff = new Date(estimatedAt) - Date.now();
      if (diff <= 0) { setLabel('Arriving now'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(`${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [estimatedAt]);
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 rounded-full px-3 py-1">
      <i className="fas fa-hourglass-half text-[9px]" />
      ETA {label}
    </span>
  );
}

/* ── Pulse dot ── */
function PulseDot({ color = '#F56230' }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: color }} />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: color }} />
    </span>
  );
}

/* ── Map placeholder with animated rider ── */
function MapPanel({ status, address }) {
  const isMoving = ['picked','on_the_way','out_for_delivery'].includes(status);
  return (
    <div className="relative h-56 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
      {/* grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* mock road */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 bg-white/50 rounded-full mx-6" />
      {/* destination pin */}
      <div className="absolute right-10 top-1/2 -translate-y-full flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg ring-4 ring-green-200">
          <i className="fas fa-home text-white text-xs" />
        </div>
        <div className="w-1 h-3 bg-green-500 rounded-b" />
      </div>
      {/* rider icon */}
      <div className={`absolute top-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-700 ${isMoving ? 'left-1/3' : 'left-1/4'}`}>
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shadow-xl ring-4"
          style={{ background: BRAND, ringColor: '#F5623044' }}
        >
          <i className={`fas ${STATUS_ICONS[status] || 'fa-motorcycle'} text-white text-base ${isMoving ? 'animate-bounce' : ''}`} />
        </div>
        {isMoving && (
          <div className="mt-1 text-[9px] font-bold text-orange-500 bg-white rounded-full px-2 py-0.5 shadow">On the way</div>
        )}
      </div>
      {/* address chip */}
      {address && (
        <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2 shadow">
          <i className="fas fa-map-marker-alt text-orange-500 text-xs" />
          <span className="text-xs text-slate-600 truncate font-medium">{address}</span>
        </div>
      )}
    </div>
  );
}

/* ── Progress stepper ── */
function Stepper({ currentStatus }) {
  const idx = STATUS_ORDER.indexOf(currentStatus);
  return (
    <div className="w-full">
      {/* horizontal track */}
      <div className="flex items-center mb-3">
        {STATUS_ORDER.map((s, i) => {
          const done   = i <= idx;
          const active = i === idx;
          return (
            <div key={s} className="flex items-center" style={{ flex: i < STATUS_ORDER.length - 1 ? 1 : 'none' }}>
              <div
                className={`relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${done ? 'text-white shadow-md' : 'bg-slate-100 text-slate-300'} ${active ? 'ring-4 scale-110' : ''}`}
                style={{
                  background: done ? BRAND : undefined,
                  ringColor: active ? `${BRAND}33` : undefined,
                  boxShadow: active ? `0 0 0 5px ${BRAND}22` : undefined,
                }}
              >
                <i className={`fas ${STATUS_ICONS[s]} text-[10px]`} />
                {active && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-400 ring-2 ring-white animate-pulse" />
                )}
              </div>
              {i < STATUS_ORDER.length - 1 && (
                <div
                  className="flex-1 h-[3px] mx-0.5 rounded-full transition-all duration-500"
                  style={{ background: i < idx ? BRAND : '#e2e8f0' }}
                />
              )}
            </div>
          );
        })}
      </div>
      {/* labels */}
      <div className="flex justify-between">
        {STATUS_ORDER.map((s, i) => (
          <div
            key={s}
            className={`text-center transition-all duration-300 ${i === idx ? 'font-black' : 'font-medium'}`}
            style={{ width: 32, fontSize: 8, lineHeight: 1.3, color: i <= idx ? BRAND : '#cbd5e1' }}
          >
            {STATUS_LABELS[s]}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Timeline log ── */
function Timeline({ order }) {
  const idx    = STATUS_ORDER.indexOf(order.status);
  const events = STATUS_ORDER.slice(0, idx + 1).reverse();
  return (
    <div className="space-y-0">
      {events.map((s, i) => {
        const isFirst = i === 0;
        const cols = STATUS_COLORS[s] || { bg: 'bg-slate-50', text: 'text-slate-500', ring: 'ring-slate-200' };
        return (
          <div key={s} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ${cols.bg} ${cols.text} ${cols.ring} ${isFirst ? 'shadow-md' : ''}`}>
                <i className={`fas ${STATUS_ICONS[s]} text-[11px]`} />
              </div>
              {i < events.length - 1 && <div className="w-px flex-1 bg-slate-100 my-1" />}
            </div>
            <div className={`pb-4 pt-1 ${i < events.length - 1 ? '' : ''}`}>
              <div className={`text-sm font-bold ${isFirst ? 'text-slate-800' : 'text-slate-400'}`}>
                {STATUS_LABELS[s]}
                {isFirst && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                    <PulseDot /> Current
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {isFirst && order.updatedAt
                  ? new Date(order.updatedAt).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })
                  : order.orderDate
                    ? new Date(order.orderDate).toLocaleDateString('en-RW', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Share button ── */
function ShareButton({ orderId }) {
  const [copied, setCopied] = useState(false);
  const share = () => {
    const url = `${window.location.origin}/order-tracking/${orderId}`;
    if (navigator.share) {
      navigator.share({ title: `Order #${orderId}`, url });
    } else {
      navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    }
  };
  return (
    <button
      onClick={share}
      className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-3 py-2 transition-all duration-150"
    >
      <i className={`fas ${copied ? 'fa-check text-green-500' : 'fa-share-alt'}`} />
      {copied ? 'Link copied!' : 'Share'}
    </button>
  );
}

/* ── Receipt row ── */
function ReceiptRow({ label, value, bold, accent }) {
  return (
    <div className={`flex justify-between items-center py-2 ${bold ? 'border-t border-slate-100 mt-1 pt-3' : 'border-b border-slate-50'}`}>
      <span className={`text-sm ${bold ? 'font-bold text-slate-800' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-sm font-bold ${accent ? 'text-orange-500 text-base' : bold ? 'text-slate-800' : 'text-slate-700'}`}>{value}</span>
    </div>
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename || 'download' });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ════════════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════════════ */
export default function OrderTracking() {
  const { id }   = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);
  const pollRef = useRef(null);

  const [cancelLoading, setCancelLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fetchOrder = () => {
    api.orders.getById(id)
      .then(d => { setOrder(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  };

  useEffect(() => {
    fetchOrder();
    /* auto-poll every 30 s for active orders */
    pollRef.current = setInterval(fetchOrder, 30000);
    return () => clearInterval(pollRef.current);
  }, [id]);

  /* stop polling once delivered / cancelled */
  useEffect(() => {
    if (!order) return;
    const done = ['delivered','cancelled','rejected'].includes(String(order.status).toLowerCase());
    if (done) clearInterval(pollRef.current);
  }, [order?.status]);

  /* ── Loading skeleton ── */
  if (loading) return (
    <section className="max-w-[1100px] mx-auto px-5 py-12">
      <div className="h-36 rounded-[20px] bg-gradient-to-r from-slate-200 to-slate-100 animate-pulse mb-8" />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[250, 180, 120].map(h => (
            <div key={h} className="rounded-[20px] bg-slate-100 animate-pulse" style={{ height: h }} />
          ))}
        </div>
        <div className="space-y-4">
          {[220, 140, 90].map(h => (
            <div key={h} className="rounded-[20px] bg-slate-100 animate-pulse" style={{ height: h }} />
          ))}
        </div>
      </div>
    </section>
  );

  /* ── Error ── */
  if (error || !order) return (
    <section className="max-w-[480px] mx-auto px-5 py-24 text-center">
      <i className="fas fa-triangle-exclamation text-6xl text-red-300 mb-6 block" />
      <h2 className="font-black text-2xl text-slate-800 mb-2" style={{ fontFamily: 'Sora,sans-serif' }}>Order not found</h2>
      <p className="text-slate-400 mb-8 text-sm">We couldn't load this order. It may have been removed or the link is incorrect.</p>
      <Link to="/orders" className="inline-flex items-center gap-2 font-bold text-sm text-white rounded-xl px-6 py-3" style={{ background: `linear-gradient(135deg,${BRAND},#d94e22)`, boxShadow: '0 6px 20px #F5623033' }}>
        <i className="fas fa-arrow-left" /> Back to Orders
      </Link>
    </section>
  );

  const st         = STATUS_COLORS[order.status] || { bg: 'bg-slate-50', text: 'text-slate-500', ring: 'ring-slate-200' };
  const isDone     = order.status === 'delivered';
  const isCancelled= ['cancelled','rejected'].includes(String(order.status).toLowerCase());
  const isActive   = !isDone && !isCancelled;
  const subtotal   = order.subtotal ?? (order.items || []).reduce((s, i) => s + i.price * i.quantity, 0);

  const statusLc = String(order.status || '').toLowerCase();
  const canCancel = statusLc === 'pending';
  // Show receipt only after restaurant acceptance (or later outcomes).
  // Hide for customer-cancelled orders while still `pending`.
  const receiptAvailable = [
    'accepted',
    'preparing',
    'ready',
    'picked',
    'on_the_way',
    'out_for_delivery',
    'delivered',
    'rejected',
    'confirmed',
  ].includes(statusLc);

  const handleCancelOrder = async () => {
    if (!canCancel || cancelLoading) return;
    setShowCancelConfirm(false);
    setToastMessage('');
    setCancelLoading(true);
    try {
      await api.orders.cancel(order.id);
      setToastType('success');
      setToastMessage('Order cancelled successfully.');
      fetchOrder();
    } catch (e) {
      setToastType('error');
      setToastMessage(e.message || 'Failed to cancel order.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptAvailable || receiptLoading) return;
    setToastMessage('');
    setReceiptLoading(true);
    try {
      const d = await api.orders.downloadReceipt(order.id);
      downloadBlob(d.blob, d.filename || `receipt_${order.id}.pdf`);
      setToastType('success');
      setToastMessage('Receipt downloaded.');
    } catch (e) {
      setToastType('error');
      setToastMessage(e.message || 'Failed to download receipt.');
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleSendReceiptEmail = async () => {
    if (!receiptAvailable || emailLoading) return;
    setToastMessage('');
    setEmailLoading(true);
    try {
      await api.orders.emailReceipt(order.id);
      setToastType('success');
      setToastMessage('Receipt sent to your email.');
    } catch (e) {
      setToastType('error');
      setToastMessage(e.message || 'Failed to send email receipt.');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <section className="max-w-[1100px] mx-auto px-5 py-12">
      <Toast
        message={toastMessage}
        type={toastType}
        duration={2500}
        position="top-right"
        onClose={() => setToastMessage('')}
      />
      <ConfirmDialog
        open={showCancelConfirm}
        title="Cancel order?"
        message="You can cancel only before the restaurant accepts it."
        confirmText="Yes, cancel order"
        cancelText="Keep order"
        confirmType="danger"
        loading={cancelLoading}
        onCancel={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelOrder}
      />

      {/* ── Hero banner ── */}
      <div
        className="relative rounded-[24px] text-white p-8 mb-8 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, ${BRAND} 0%, #d94e22 100%), url(${CUSTOMER_HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* decorative blobs */}
        <div className="absolute w-72 h-72 rounded-full bg-white/5 -top-20 -right-16 pointer-events-none" />
        <div className="absolute w-44 h-44 rounded-full bg-white/[0.04] -bottom-14 -left-10 pointer-events-none" />

        <div className="relative z-10 flex flex-wrap justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Sora,sans-serif' }}>
                <i className="fas fa-motorcycle mr-2 opacity-80" />
                Track Your Delivery
              </h1>
              {isActive && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 border border-white/30 rounded-full px-3 py-1">
                  <PulseDot color="#fff" /> Live
                </span>
              )}
            </div>
            <p className="text-white/70 text-sm mb-3">Real-time updates for your order</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-sm font-bold">
                Order #{order.id}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/20 rounded-full text-sm font-bold`}>
                <i className={`fas ${STATUS_ICONS[order.status] || 'fa-circle'} text-[11px]`} />
                {STATUS_LABELS[order.status] || order.status}
              </span>
              {/* ETA countdown */}
              {isActive && order.estimatedDelivery && (
                <Countdown estimatedAt={order.estimatedDelivery} />
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-3xl font-black tracking-tight" style={{ fontFamily: 'Sora,sans-serif' }}>
              {money(order.total)}
            </div>
            <div className="text-white/60 text-xs">
              {order.orderDate && new Date(order.orderDate).toLocaleDateString('en-RW', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
            <ShareButton orderId={order.id} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* ══ Left column ══ */}
        <div className="lg:col-span-2 space-y-6">

          {/* Map */}
          <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">
                <i className="fas fa-map-marked-alt mr-2" style={{ color: BRAND }} />
                Live Location
              </h3>
              {isActive && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                  <PulseDot color="#16a34a" /> Tracking
                </span>
              )}
              {isDone && (
                <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                  <i className="fas fa-check-circle mr-1" /> Delivered
                </span>
              )}
            </div>
            <div className="p-4">
              <MapPanel status={order.status} address={order.deliveryAddress} />
            </div>
          </div>

          {/* Stepper progress */}
          <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-sm">Order Progress</h3>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ring-1 ${st.bg} ${st.text} ${st.ring}`}>
                <i className={`fas ${STATUS_ICONS[order.status]} text-[10px]`} />
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            <Stepper currentStatus={order.status} />
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 text-sm mb-5">
              <i className="fas fa-history mr-2" style={{ color: BRAND }} />
              Status History
            </h3>
            <Timeline order={order} />
          </div>
        </div>

        {/* ══ Right column ══ */}
        <div className="space-y-5">

          {/* Order summary / receipt */}
          <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">
                <i className="fas fa-receipt mr-2" style={{ color: BRAND }} />
                Order Summary
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {order.orderDate && new Date(order.orderDate).toLocaleDateString('en-RW', { day: '2-digit', month: 'short' })}
              </span>
            </div>

            {/* Items */}
            <div className="px-5 py-4 space-y-1 max-h-56 overflow-y-auto">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-start py-2 border-b border-slate-50 last:border-0 gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="flex-shrink-0 w-5 h-5 rounded-md text-[10px] font-black text-white flex items-center justify-center" style={{ background: BRAND }}>
                      {item.quantity}
                    </span>
                    <span className="text-sm text-slate-700 font-medium truncate">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 flex-shrink-0">
                    {money(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="px-5 pb-5 bg-slate-50">
              <ReceiptRow label="Subtotal"     value={money(subtotal)}          />
              <ReceiptRow label="Delivery fee" value={money(order.deliveryFee)} />
              {order.discount > 0 && (
                <ReceiptRow label="Discount" value={`-${money(order.discount)}`} />
              )}
              <ReceiptRow label="Total" value={money(order.total)} bold accent />
            </div>
          </div>

          {/* Delivery details */}
          <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-slate-800 text-sm mb-4">
              <i className="fas fa-map-marker-alt mr-2" style={{ color: BRAND }} />
              Delivery Details
            </h3>
            {order.deliveryAddress && (
              <div className="flex gap-2 text-sm">
                <i className="fas fa-location-dot text-slate-300 mt-0.5 text-xs" />
                <span className="text-slate-600">{order.deliveryAddress}</span>
              </div>
            )}
            {order.paymentMethod && (
              <div className="flex gap-2 text-sm items-center">
                <i className="fas fa-credit-card text-slate-300 text-xs" />
                <span className="text-slate-600">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span>
              </div>
            )}
            {order.note && (
              <div className="flex gap-2 text-sm">
                <i className="fas fa-comment-dots text-slate-300 text-xs mt-0.5" />
                <span className="text-slate-500 italic">{order.note}</span>
              </div>
            )}
            {/* restaurant */}
            {order.restaurantName && (
              <div className="flex gap-2 text-sm items-center">
                <i className="fas fa-store text-slate-300 text-xs" />
                <span className="text-slate-600 font-medium">{order.restaurantName}</span>
              </div>
            )}
          </div>

          {/* Support + rating nudge */}
          {isDone && (
            <div
              className="rounded-[20px] p-5 text-center"
              style={{ background: `linear-gradient(135deg,#fff4f0,#fff9f7)`, border: `1px solid ${BRAND}22` }}
            >
              <div className="text-2xl mb-2">🎉</div>
              <div className="font-black text-slate-800 text-sm mb-1" style={{ fontFamily: 'Sora,sans-serif' }}>
                Order Delivered!
              </div>
              <div className="text-xs text-slate-400 mb-4">Hope you enjoyed your meal.</div>
              <Link
                to="/orders"
                className="inline-flex items-center gap-2 text-xs font-bold text-white rounded-xl px-5 py-2.5 w-full justify-center"
                style={{ background: `linear-gradient(135deg,${BRAND},#d94e22)`, boxShadow: `0 4px 14px ${BRAND}33` }}
              >
                <i className="fas fa-star" /> Rate this Order
              </Link>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            {canCancel && (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                disabled={cancelLoading}
                className="flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-[12px] border-2 transition-all duration-150 hover:opacity-90"
                style={{ borderColor: '#dc2626', color: '#dc2626', background: cancelLoading ? '#fef2f2' : 'white' }}
              >
                <i className="fas fa-xmark" />
                {cancelLoading ? 'Cancelling…' : 'Cancel Order'}
              </button>
            )}

            {receiptAvailable && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  disabled={receiptLoading}
                  className="flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-[12px] border-2 transition-all duration-150 hover:opacity-90"
                  style={{ borderColor: BRAND, color: BRAND, background: receiptLoading ? `${BRAND}12` : 'white' }}
                >
                  <i className="fas fa-file-pdf" />
                  {receiptLoading ? 'Downloading…' : 'Download Receipt'}
                </button>
                <button
                  type="button"
                  onClick={handleSendReceiptEmail}
                  disabled={emailLoading}
                  className="flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-[12px] border-2 transition-all duration-150 hover:opacity-90"
                  style={{ borderColor: BRAND, color: BRAND, background: emailLoading ? `${BRAND}12` : 'white' }}
                >
                  <i className="fas fa-envelope" />
                  {emailLoading ? 'Sending…' : 'Send to Email'}
                </button>
              </>
            )}

            <Link
              to="/orders"
              className="flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-[12px] border-2 transition-all duration-150 hover:opacity-80"
              style={{ borderColor: BRAND, color: BRAND }}
              onMouseEnter={e => { e.currentTarget.style.background = BRAND; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = BRAND; }}
            >
              <i className="fas fa-list" /> My Orders
            </Link>
            <Link
              to="/menu"
              className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-white rounded-[12px] transition-all duration-150"
              style={{ background: `linear-gradient(135deg,${BRAND},#d94e22)`, boxShadow: `0 4px 14px ${BRAND}33` }}
            >
              <i className="fas fa-utensils" /> Order Again
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}