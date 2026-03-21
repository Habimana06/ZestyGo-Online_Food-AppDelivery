import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api';
import Modal from '../../components/Modal';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';

const STATUS_STYLE = {
  delivered:       { bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
  rejected:        { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  on_the_way:      { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  out_for_delivery:{ bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  picked:          { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  accepted:        { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  confirmed:       { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  preparing:       { bg: '#f3e8ff', color: '#7e22ce', dot: '#a855f7' },
  ready:           { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  pending:         { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
};

function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase();
  const s   = STATUS_STYLE[key] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  const label = key.replaceAll('_', ' ');
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full capitalize"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {label}
    </span>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15` }}>
        <i className={`fas ${icon} text-sm`} style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-black text-slate-800 leading-tight">{value}</p>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [selected, setSelected]   = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [q, setQ]                 = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const run = async () => {
      setLoading(true); setError('');
      try {
        const data = await api.admin.orders.getAll();
        setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || 'Failed to load orders');
        setOrders([]);
      } finally { setLoading(false); }
    };
    run();
  }, []);

  const stats = useMemo(() => ({
    total:     orders.length,
    revenue:   orders.reduce((s, o) => s + Number(o.total || 0), 0),
    delivered: orders.filter(o => o.status === 'delivered').length,
    pending:   orders.filter(o => o.status === 'pending').length,
  }), [orders]);

  const uniqueStatuses = useMemo(() => ['all', ...Array.from(new Set(orders.map(o => o.status).filter(Boolean)))], [orders]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return orders.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (!query) return true;
      return `${o.id||''} ${o.customerName||''} ${o.restaurantName||''} ${o.customerPhone||''}`.toLowerCase().includes(query);
    });
  }, [orders, q, statusFilter]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        * { font-family: 'Sora', sans-serif; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn .2s ease both; }
      `}</style>

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between sticky top-0 z-10"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
        <div>
          <h1 className="text-2xl font-black text-slate-800">All Orders</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Monitor all platform orders · click any row to view details</p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-500">{filtered.length} orders</span>
      </header>

      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen space-y-5">

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium fade-in">
            <i className="fas fa-exclamation-circle flex-shrink-0" /> {error}
          </div>
        )}

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon="fa-receipt"      label="Total orders" value={stats.total}                                                   color={BRAND}     />
          <StatCard icon="fa-coins"        label="Revenue"      value={`${stats.revenue.toLocaleString()} RWF`}                       color="#10b981"   />
          <StatCard icon="fa-check-circle" label="Delivered"    value={stats.delivered}                                               color="#6366f1"   />
          <StatCard icon="fa-clock"        label="Pending"      value={stats.pending}                                                 color="#f59e0b"   />
        </div>

        {/* ── TABLE CARD ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* toolbar */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input value={q} onChange={e => setQ(e.target.value)}
                placeholder="Search order, customer, restaurant…"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:border-orange-300 focus:bg-white transition" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {uniqueStatuses.map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
                  style={statusFilter === s
                    ? { background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, color: '#fff', borderColor: BRAND, boxShadow: `0 2px 8px ${BRAND}30` }
                    : { background: '#fff', color: '#64748b', borderColor: '#e2e8f0' }
                  }>
                  {s === 'all' ? 'All' : s.replaceAll('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center gap-3 text-slate-400">
              <span className="w-8 h-8 border-2 border-slate-200 border-t-orange-400 rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading orders…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 flex flex-col items-center gap-3 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">🛍️</div>
              <p className="font-bold text-slate-500">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Order', 'Customer', 'Restaurant', 'Status', 'Total', 'Date'].map((h, i) => (
                      <th key={h} className={`px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(o => (
                    <tr key={o.id} onClick={() => { setSelected(o); setDetailOpen(true); }}
                      className="hover:bg-slate-50 cursor-pointer transition-colors fade-in">
                      <td className="px-6 py-4">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">#{String(o.id).slice(-6)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-sm">{o.customerName || '—'}</p>
                        <p className="text-xs text-slate-400">{o.customerPhone || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-600">{o.restaurantName || '—'}</p>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-slate-800 text-sm">{Number(o.total || 0).toLocaleString()}</span>
                        <span className="text-xs text-slate-400 ml-1">RWF</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {o.orderDate ? new Date(o.orderDate).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── DETAIL MODAL ── */}
      <Modal
        open={detailOpen}
        title={`Order #${String(selected?.id || '').slice(-6)}`}
        onClose={() => setDetailOpen(false)}
        footer={
          <div className="flex justify-end">
            <button onClick={() => setDetailOpen(false)}
              className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300 transition">
              Close
            </button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">

            {/* customer + restaurant */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Customer',   main: selected.customerName,   sub: selected.customerPhone,              icon: 'fa-user' },
                { label: 'Restaurant', main: selected.restaurantName, sub: `#${selected.restaurantId || '—'}`, icon: 'fa-store' },
              ].map(({ label, main, sub, icon }) => (
                <div key={label} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <i className={`fas ${icon} mr-1`} />{label}
                  </p>
                  <p className="font-black text-slate-800 text-sm">{main || '—'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{sub || '—'}</p>
                </div>
              ))}
            </div>

            {/* status + date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                <StatusBadge status={selected.status} />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Placed</p>
                <p className="text-sm font-bold text-slate-700">
                  {selected.orderDate ? new Date(selected.orderDate).toLocaleString() : '—'}
                </p>
              </div>
            </div>

            {/* items */}
            <div className="rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Items</p>
              </div>
              <div className="p-4 space-y-2">
                {Array.isArray(selected.items) && selected.items.length ? (
                  selected.items.map((it, idx) => (
                    <div key={it.id || idx} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600">{it.quantity || 1}</span>
                        <span className="text-sm font-semibold text-slate-700">{it.name || 'Item'}</span>
                      </div>
                      <span className="text-sm font-black text-slate-800">
                        {Number((it.price || 0) * (it.quantity || 1)).toLocaleString()} RWF
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No items</p>
                )}
              </div>
            </div>

            {/* payment + totals */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment</p>
                <p className="text-sm font-bold text-slate-700 capitalize">{selected.paymentMethod || '—'}</p>
                <p className="text-xs text-slate-400 mt-0.5 capitalize">{selected.paymentStatus || '—'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Totals</p>
                {[
                  { label: 'Subtotal',  value: selected.subtotal,    prefix: '' },
                  { label: 'Delivery',  value: selected.deliveryFee, prefix: '' },
                  { label: 'Tax',       value: selected.tax,         prefix: '' },
                  { label: 'Discount',  value: selected.discount,    prefix: '−' },
                ].map(({ label, value, prefix }) => (
                  <div key={label} className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-bold text-slate-700">{prefix}{Number(value || 0).toLocaleString()} RWF</span>
                  </div>
                ))}
                <div className="pt-2 mt-1 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-black text-slate-700">Total</span>
                  <span className="text-base font-black" style={{ color: BRAND }}>{Number(selected.total || 0).toLocaleString()} RWF</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </Modal>
    </>
  );
}