import { useEffect, useMemo, useState, Fragment } from 'react';
import { api } from '../../api';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';

const money        = (n) => `${Number(n || 0).toLocaleString()} RWF`;
const compactMoney = (n) => {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M RWF`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}K RWF`;
  return money(v);
};
const today = () => new Date().toISOString().slice(0, 10);

const STATUS_STYLE = {
  delivered:        { bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
  pending:          { bg: '#fef9c3', color: '#a16207', dot: '#ca8a04' },
  preparing:        { bg: '#f3e8ff', color: '#7e22ce', dot: '#a855f7' },
  accepted:         { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  confirmed:        { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  rejected:         { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  on_the_way:       { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  out_for_delivery: { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  picked:           { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  ready:            { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
};

function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase();
  const s   = STATUS_STYLE[key] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full capitalize"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {key.replaceAll('_', ' ')}
    </span>
  );
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: filename || 'download' });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const DOWNLOADS = [
  { id: 'ordersCsv',            label: 'Orders',          fmt: 'CSV' },
  { id: 'ordersPdf',            label: 'Orders',          fmt: 'PDF' },
  { id: 'ordersDetailedCsv',    label: 'Orders Detailed', fmt: 'CSV' },
  { id: 'ordersDetailedPdf',    label: 'Orders Detailed', fmt: 'PDF' },
  { id: 'salesCsv',             label: 'Sales',           fmt: 'CSV' },
  { id: 'salesPdf',             label: 'Sales',           fmt: 'PDF' },
  { id: 'salesByRestaurantCsv', label: 'By Restaurant',   fmt: 'CSV' },
  { id: 'salesByRestaurantPdf', label: 'By Restaurant',   fmt: 'PDF' },
];

function SectionCard({ icon, title, subtitle, right, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${BRAND}15` }}>
            <i className={`fas ${icon} text-sm`} style={{ color: BRAND }} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="p-10 flex flex-col items-center gap-2 text-slate-400">
      <div className="text-2xl">📭</div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-10 flex flex-col items-center gap-3 text-slate-400">
      <span className="w-7 h-7 border-2 border-slate-200 border-t-orange-400 rounded-full animate-spin" />
      <span className="text-sm font-medium">Loading…</span>
    </div>
  );
}

function FocusDateInput({ label, value, onChange }) {
  const [f, setF] = useState(false);
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
      <input type="date" value={value} onChange={onChange}
        className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white outline-none transition-all"
        style={{ borderColor: f ? BRAND : undefined, boxShadow: f ? `0 0 0 3px ${BRAND}18` : undefined }}
        onFocus={() => setF(true)} onBlur={() => setF(false)} />
    </div>
  );
}

export default function AdminReports() {
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); });
  const [to, setTo]     = useState(() => today());

  const [sales, setSales]                       = useState([]);
  const [stats, setStats]                       = useState([]);
  const [salesByRestaurant, setSalesByRestaurant] = useState([]);
  const [ordersDetailed, setOrdersDetailed]     = useState([]);
  const [q, setQ]                               = useState('');
  const [expanded, setExpanded]                 = useState(() => new Set());
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState('');
  const [downloading, setDownloading]           = useState('');

  const params = useMemo(() => `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, [from, to]);

  useEffect(() => {
    const run = async () => {
      setLoading(true); setError('');
      try {
        const [s1, s2, s3, s4] = await Promise.all([
          api.admin.reports.sales(params),
          api.admin.reports.orderStats(params),
          api.admin.reports.salesByRestaurant(params),
          api.admin.reports.ordersDetailed(params),
        ]);
        setSales(Array.isArray(s1) ? s1 : []);
        setStats(Array.isArray(s2) ? s2 : []);
        setSalesByRestaurant(Array.isArray(s3) ? s3 : []);
        setOrdersDetailed(Array.isArray(s4) ? s4 : []);
      } catch (e) {
        setError(e.message || 'Failed to load reports');
        setSales([]); setStats([]); setSalesByRestaurant([]); setOrdersDetailed([]);
      } finally { setLoading(false); }
    };
    run();
  }, [params]);

  const totals = useMemo(() => ({
    revenue: sales.reduce((s, r) => s + Number(r.revenue || 0), 0),
    orders:  sales.reduce((s, r) => s + Number(r.orders  || 0), 0),
  }), [sales]);

  const restaurantTotals = useMemo(() => ({
    revenue: salesByRestaurant.reduce((s, r) => s + Number(r.revenue || 0), 0),
    orders:  salesByRestaurant.reduce((s, r) => s + Number(r.orders  || 0), 0),
  }), [salesByRestaurant]);

  const filteredOrders = useMemo(() => {
    const query = String(q || '').trim().toLowerCase();
    if (!query) return ordersDetailed;
    return ordersDetailed.filter(o =>
      [o?.id, o?.status, o?.customer?.name, o?.customer?.email, o?.customer?.phone,
       o?.restaurant?.name, o?.delivery?.name, o?.delivery?.phone]
        .filter(Boolean).join(' ').toLowerCase().includes(query)
    );
  }, [ordersDetailed, q]);

  const toggleExpanded = (id) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const applyPreset = (preset) => {
    const end = today(); const start = new Date();
    if (preset === 'week')  start.setDate(start.getDate() - 7);
    if (preset === 'month') start.setDate(start.getDate() - 30);
    if (preset === 'year')  start.setDate(start.getDate() - 365);
    setFrom(start.toISOString().slice(0, 10)); setTo(end);
  };

  const downloadReport = async (kind) => {
    setDownloading(kind); setError('');
    try {
      const downloader = api.admin?.reports?.downloads?.[kind];
      if (typeof downloader !== 'function') {
        throw new Error(`Download action is not configured for ${kind}`);
      }
      const { blob, filename } = await downloader(params);
      downloadBlob(blob, filename);
    } catch (e) { setError(e.message || 'Download failed'); }
    finally { setDownloading(''); }
  };

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
          <h1 className="text-2xl font-black text-slate-800">Reports</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Sales analytics and order statistics</p>
        </div>
      </header>

      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen space-y-5">

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium fade-in">
            <i className="fas fa-exclamation-circle flex-shrink-0" /> {error}
          </div>
        )}

        {/* ── DATE FILTER ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Quick range</label>
              <div className="flex gap-2">
                {[{ id: 'week', label: '7 days' }, { id: 'month', label: '30 days' }, { id: 'year', label: '1 year' }].map(p => (
                  <button key={p.id} onClick={() => applyPreset(p.id)}
                    className="px-4 py-2.5 text-sm font-bold rounded-xl border-2 transition-all"
                    style={{ borderColor: BRAND, color: BRAND, background: `${BRAND}08` }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <FocusDateInput label="From" value={from} onChange={e => setFrom(e.target.value)} />
            <FocusDateInput label="To"   value={to}   onChange={e => setTo(e.target.value)}   />
            <div className="flex-1" />
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Delivered revenue</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{compactMoney(totals.revenue)}</p>
              <p className="text-xs text-slate-400 mt-0.5">{totals.orders} delivered orders</p>
            </div>
          </div>

          {/* download buttons */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Downloads</p>
            <div className="flex flex-wrap gap-2">
              {DOWNLOADS.map(d => (
                <button key={d.id} onClick={() => downloadReport(d.id)} disabled={!!downloading}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border-2 transition-all disabled:opacity-50"
                  style={d.fmt === 'PDF'
                    ? { borderColor: BRAND,      color: BRAND,      background: downloading === d.id ? `${BRAND}08` : '#fff' }
                    : { borderColor: '#10b981',  color: '#065f46',  background: downloading === d.id ? '#f0fdf4'    : '#fff' }
                  }>
                  {downloading === d.id
                    ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <i className={`fas ${d.fmt === 'PDF' ? 'fa-file-pdf' : 'fa-file-csv'} text-[10px]`} />
                  }
                  {d.label} {d.fmt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── SALES + STATS SIDE BY SIDE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <SectionCard icon="fa-chart-line" title="Daily Sales" subtitle="Delivered orders grouped by day">
            {loading ? <LoadingState /> : sales.length === 0 ? <EmptyState message="No sales data." /> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Day', 'Orders', 'Revenue'].map((h, i) => (
                        <th key={h} className={`px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sales.map(r => (
                      <tr key={r.day} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 text-sm text-slate-600">{r.day}</td>
                        <td className="px-6 py-3 text-right font-bold text-slate-800">{Number(r.orders || 0)}</td>
                        <td className="px-6 py-3 text-right font-black text-sm" style={{ color: BRAND }}>{money(r.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard icon="fa-chart-pie" title="Order Statistics" subtitle="Count by status">
            {loading ? <LoadingState /> : stats.length === 0 ? <EmptyState message="No stats data." /> : (
              <div className="p-4 space-y-3">
                {stats.map(r => {
                  const total = stats.reduce((s, x) => s + Number(x.count || 0), 0);
                  const pct   = total ? Math.round((Number(r.count || 0) / total) * 100) : 0;
                  return (
                    <div key={r.status}>
                      <div className="flex items-center justify-between mb-1">
                        <StatusBadge status={r.status} />
                        <span className="text-sm font-black text-slate-700">{Number(r.count || 0)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${BRAND},${BRAND_D})` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── SALES BY RESTAURANT ── */}
        <SectionCard icon="fa-store" title="Sales by Restaurant" subtitle="Delivered orders per restaurant"
          right={
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-slate-400">Total revenue</p>
              <p className="text-xl font-black text-slate-800">{compactMoney(restaurantTotals.revenue)}</p>
              <p className="text-xs text-slate-400">{restaurantTotals.orders} orders</p>
            </div>
          }>
          {loading ? <LoadingState /> : salesByRestaurant.length === 0 ? <EmptyState message="No restaurant sales data." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Restaurant', 'Orders', 'Subtotal', 'Delivery', 'Tax', 'Discount', 'Revenue'].map((h, i) => (
                      <th key={h} className={`px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {salesByRestaurant.map(r => (
                    <tr key={String(r.restaurantId)} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800 text-sm">{r.restaurantName}</p>
                        <p className="text-xs text-slate-400">#{r.restaurantId}</p>
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-slate-700">{Number(r.orders || 0)}</td>
                      <td className="px-5 py-4 text-right text-sm text-slate-500">{compactMoney(r.subtotal)}</td>
                      <td className="px-5 py-4 text-right text-sm text-slate-500">{compactMoney(r.deliveryFee)}</td>
                      <td className="px-5 py-4 text-right text-sm text-slate-500">{compactMoney(r.tax)}</td>
                      <td className="px-5 py-4 text-right text-sm text-slate-500">{compactMoney(r.discount)}</td>
                      <td className="px-5 py-4 text-right font-black text-sm" style={{ color: BRAND }}>{money(r.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* ── ORDERS DETAILED ── */}
        <SectionCard icon="fa-list-check" title="Orders (Full Details)" subtitle="Customer · restaurant · delivery · items · totals"
          right={
            <div className="relative">
              <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input value={q} onChange={e => setQ(e.target.value)}
                placeholder="Search order, customer, restaurant…"
                className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:border-orange-300 focus:bg-white transition w-60" />
            </div>
          }>
          {loading ? <LoadingState /> : filteredOrders.length === 0
            ? <EmptyState message={q ? 'No orders match your search.' : 'No orders in this date range.'} />
            : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Order', 'Customer', 'Restaurant', 'Delivery', 'Total', 'Status', 'Items'].map((h, i) => (
                        <th key={h} className={`px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-widest ${i >= 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredOrders.map(o => {
                      const isOpen = expanded.has(o.id);
                      const items  = Array.isArray(o.items) ? o.items : [];
                      return (
                        <Fragment key={o.id}>
                          <tr key={o.id} className="hover:bg-slate-50 transition-colors fade-in">
                            <td className="px-5 py-4">
                              <button type="button" onClick={() => toggleExpanded(o.id)} className="text-left">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: isOpen ? `${BRAND}15` : '#f1f5f9' }}>
                                    <i className={`fas ${isOpen ? 'fa-minus' : 'fa-plus'} text-[9px]`}
                                      style={{ color: isOpen ? BRAND : '#94a3b8' }} />
                                  </div>
                                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">#{String(o.id).slice(-6)}</span>
                                </div>
                                {o.orderDate && <p className="text-[10px] text-slate-400 mt-1 ml-8">{new Date(o.orderDate).toLocaleString()}</p>}
                              </button>
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-800 text-sm">{o?.customer?.name || '—'}</p>
                              <p className="text-xs text-slate-400">{o?.customer?.email || '—'}</p>
                              <p className="text-xs text-slate-400">{o?.customer?.phone || '—'}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-700 text-sm">{o?.restaurant?.name || '—'}</p>
                              <p className="text-xs text-slate-400">{o?.restaurant?.phone || '—'}</p>
                            </td>
                            <td className="px-5 py-4">
                              {o.delivery
                                ? <><p className="font-bold text-slate-700 text-sm">{o.delivery.name || `#${o.delivery.id}`}</p>
                                    <p className="text-xs text-slate-400">{o.delivery.phone || '—'}</p></>
                                : <span className="text-xs text-slate-400">Not assigned</span>
                              }
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="font-black text-slate-800 text-sm">{Number(o.total || 0).toLocaleString()}</span>
                              <span className="text-xs text-slate-400 ml-1">RWF</span>
                            </td>
                            <td className="px-5 py-4 text-right"><StatusBadge status={o.status} /></td>
                            <td className="px-5 py-4 text-right font-bold text-slate-700">{items.length}</td>
                          </tr>

                          {isOpen && (
                            <tr key={`${o.id}-detail`}>
                              <td colSpan={7} className="px-5 pb-5 bg-slate-50/60">
                                <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
                                  <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-1.5">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Totals</p>
                                    {[['Subtotal', o.subtotal], ['Delivery fee', o.deliveryFee], ['Tax', o.tax], ['Discount', o.discount]].map(([label, val]) => (
                                      <div key={label} className="flex justify-between text-xs">
                                        <span className="text-slate-500">{label}</span>
                                        <span className="font-bold text-slate-700">{money(val)}</span>
                                      </div>
                                    ))}
                                    <div className="pt-2 border-t border-slate-100 flex justify-between">
                                      <span className="text-sm font-black text-slate-700">Total</span>
                                      <span className="text-sm font-black" style={{ color: BRAND }}>{money(o.total)}</span>
                                    </div>
                                  </div>

                                  <div className="lg:col-span-2 p-4 rounded-2xl bg-white border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Items</p>
                                    {items.length === 0 ? <p className="text-sm text-slate-400">No items.</p> : (
                                      <table className="w-full">
                                        <thead>
                                          <tr className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                            {['Item', 'Qty', 'Price', 'Line'].map((h, i) => (
                                              <th key={h} className={`pb-2 ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                          {items.map((it, idx) => {
                                            const qty   = Number(it?.qty ?? it?.quantity ?? 1) || 1;
                                            const price = Number(it?.price ?? 0);
                                            const line  = Number(it?.total ?? price * qty) || price * qty;
                                            return (
                                              <tr key={idx}>
                                                <td className="py-1.5 text-sm font-semibold text-slate-700">{it?.name || it?.title || `Item ${idx + 1}`}</td>
                                                <td className="py-1.5 text-right text-xs text-slate-500">{qty}</td>
                                                <td className="py-1.5 text-right text-xs text-slate-500">{money(price)}</td>
                                                <td className="py-1.5 text-right text-sm font-black text-slate-800">{money(line)}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    )}
                                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                                      <p><span className="font-bold text-slate-600">Delivery address:</span> {o.deliveryAddress || '—'}</p>
                                      <p><span className="font-bold text-slate-600">Payment:</span> {o.paymentMethod || '—'} ({o.paymentStatus || '—'})</p>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </SectionCard>

      </div>
    </>
  );
}