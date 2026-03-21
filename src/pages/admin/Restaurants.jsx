import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';

const money = (n) => `${Number(n || 0).toLocaleString()} RWF`;

function EmptyState({ message }) {
  return (
    <div className="p-10 flex flex-col items-center gap-2 text-slate-400">
      <div className="text-2xl">🍽️</div>
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

function ApprovalBadge({ approved }) {
  return approved ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
      style={{ background: '#d1fae5', color: '#065f46' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
      style={{ background: '#fef9c3', color: '#a16207' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
      Pending
    </span>
  );
}

function FieldLabel({ children }) {
  return <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{children}</label>;
}

function StyledInput({ className = '', ...props }) {
  const [f, setF] = useState(false);
  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 border rounded-xl text-sm text-slate-700 bg-white outline-none transition-all ${className}`}
      style={{ borderColor: f ? BRAND : '#e2e8f0', boxShadow: f ? `0 0 0 3px ${BRAND}18` : undefined }}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
    />
  );
}

function StyledTextarea({ ...props }) {
  const [f, setF] = useState(false);
  return (
    <textarea
      {...props}
      className="w-full px-4 py-2.5 border rounded-xl text-sm text-slate-700 bg-white outline-none transition-all min-h-[96px]"
      style={{ borderColor: f ? BRAND : '#e2e8f0', boxShadow: f ? `0 0 0 3px ${BRAND}18` : undefined }}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
    />
  );
}

export default function AdminRestaurants() {
  const [restaurants, setRestaurants]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [savingId, setSavingId]         = useState('');
  const [q, setQ]                       = useState('');
  const [filter, setFilter]             = useState('all');

  const [createOpen, setCreateOpen]     = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError]   = useState('');
  const [createForm, setCreateForm]     = useState({
    restaurantName: '', cuisine: '', address: '', restaurantPhone: '',
    restaurantImage: '', ownerName: '', ownerEmail: '', ownerPhone: '', ownerPassword: '',
  });
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [logoUploading, setLogoUploading]         = useState(false);

  const [detailOpen, setDetailOpen]     = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError]   = useState('');
  const [selected, setSelected]         = useState(null);

  const [editOpen, setEditOpen]         = useState(false);
  const [editSaving, setEditSaving]     = useState(false);
  const [editError, setEditError]       = useState('');
  const [form, setForm]                 = useState({
    name: '', cuisine: '', address: '', phone: '',
    deliveryFee: '', minOrder: '', deliveryTime: '',
    badge: '', description: '', isOpen: true, isApproved: false,
  });
  const [pendingRemoveId, setPendingRemoveId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const data = await api.admin.restaurants.getAll();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load restaurants');
      setRestaurants([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!error) return;
    setToastType('error');
    setToastMessage(error);
  }, [error]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return restaurants.filter((r) => {
      const okStatus = filter === 'all' ? true : filter === 'approved' ? !!r.isApproved : !r.isApproved;
      if (!okStatus) return false;
      if (!query) return true;
      return `${r.name || ''} ${r.cuisine || ''} ${r.address || ''} ${r.phone || ''}`.toLowerCase().includes(query);
    });
  }, [restaurants, q, filter]);

  const counts = useMemo(() => ({
    all: restaurants.length,
    approved: restaurants.filter(r => r.isApproved).length,
    pending: restaurants.filter(r => !r.isApproved).length,
  }), [restaurants]);

  const openDetail = async (id) => {
    setSelected(null); setDetailOpen(true); setDetailLoading(true); setDetailError('');
    try { setSelected(await api.admin.restaurants.getById(id)); }
    catch (e) { setDetailError(e.message || 'Failed to load restaurant'); }
    finally { setDetailLoading(false); }
  };

  const openEdit = async (id) => {
    setEditError(''); setEditOpen(true);
    const fill = (d) => setForm({
      name: d.name || '', cuisine: d.cuisine || '', address: d.address || '',
      phone: d.phone || '', deliveryFee: d.deliveryFee ?? '', minOrder: d.minOrder ?? '',
      deliveryTime: d.deliveryTime || '', badge: d.badge || '', description: d.description || '',
      isOpen: !!d.isOpen, isApproved: !!d.isApproved,
    });
    if (selected?.id === id) { fill(selected); return; }
    try { const data = await api.admin.restaurants.getById(id); setSelected(data); fill(data); }
    catch (e) { setEditError(e.message || 'Failed to load restaurant'); }
  };

  const saveEdit = async () => {
    if (!selected?.id) return;
    setEditSaving(true); setEditError('');
    try {
      await api.admin.restaurants.update(selected.id, {
        name: form.name, cuisine: form.cuisine, address: form.address, phone: form.phone,
        deliveryFee: form.deliveryFee, minOrder: form.minOrder, deliveryTime: form.deliveryTime,
        badge: form.badge, description: form.description, isOpen: !!form.isOpen, isApproved: !!form.isApproved,
      });
      setEditOpen(false); await load();
      setSelected(await api.admin.restaurants.getById(selected.id));
      setToastType('success');
      setToastMessage('Restaurant updated successfully.');
    } catch (e) { setEditError(e.message || 'Failed to update restaurant'); }
    finally { setEditSaving(false); }
  };

  const setApproved = async (id, approved) => {
    setSavingId(String(id)); setError('');
    try {
      await api.admin.restaurants.approve(id, approved);
      await load();
      setToastType('success');
      setToastMessage(approved ? 'Restaurant approved.' : 'Restaurant unapproved.');
    }
    catch (e) { setError(e.message || 'Failed to update approval'); }
    finally { setSavingId(''); }
  };

  const remove = async (id) => {
    setSavingId(String(id)); setError('');
    setPendingRemoveId(null);
    try {
      await api.admin.restaurants.remove(id);
      await load();
      setToastType('success');
      setToastMessage('Restaurant removed.');
    }
    catch (e) { setError(e.message || 'Failed to remove restaurant'); }
    finally { setSavingId(''); }
  };

  const resetCreate = () => setCreateForm({
    restaurantName: '', cuisine: '', address: '', restaurantPhone: '',
    restaurantImage: '', ownerName: '', ownerEmail: '', ownerPhone: '', ownerPassword: '',
  });

  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        duration={2800}
        position="top-right"
        onClose={() => { setToastMessage(''); setError(''); }}
      />
      <ConfirmDialog
        open={Boolean(pendingRemoveId)}
        title="Remove restaurant?"
        message="This cannot be undone."
        confirmText="Remove"
        cancelText="Cancel"
        confirmType="danger"
        loading={Boolean(pendingRemoveId && savingId === String(pendingRemoveId))}
        onCancel={() => setPendingRemoveId(null)}
        onConfirm={() => remove(pendingRemoveId)}
      />
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
          <h1 className="text-2xl font-black text-slate-800">Restaurants</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Manage and verify restaurant partners</p>
        </div>
        <button type="button"
          onClick={() => { setCreateError(''); resetCreate(); setCreateOpen(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all"
          style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 4px 14px ${BRAND}40` }}>
          <i className="fas fa-plus text-xs" /> New Restaurant
        </button>
      </header>

      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen space-y-5">
        {/* ── FILTER BAR ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex flex-wrap items-center gap-3">
            {/* tab filters */}
            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              {[
                { id: 'all',      label: 'All',      count: counts.all      },
                { id: 'pending',  label: 'Pending',  count: counts.pending  },
                { id: 'approved', label: 'Approved', count: counts.approved },
              ].map((f) => (
                <button key={f.id} type="button" onClick={() => setFilter(f.id)}
                  className="px-4 py-2 text-sm font-bold transition-all flex items-center gap-2"
                  style={filter === f.id
                    ? { background: BRAND, color: '#fff' }
                    : { background: '#fff', color: '#475569' }}>
                  {f.label}
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    style={filter === f.id
                      ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                      : { background: '#f1f5f9', color: '#64748b' }}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* search */}
            <div className="relative">
              <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input value={q} onChange={e => setQ(e.target.value)}
                placeholder="Search restaurants…"
                className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:border-orange-300 focus:bg-white transition w-64" />
            </div>
          </div>
        </div>

        {/* ── TABLE ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? <LoadingState /> : filtered.length === 0 ? <EmptyState message="No restaurants found." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Restaurant', 'Cuisine', 'Status', 'Rating', 'Delivery Fee', 'Actions'].map((h, i) => (
                      <th key={h} className={`px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((r) => {
                    const busy = savingId === String(r.id);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors cursor-pointer fade-in"
                        onClick={(e) => { if (e.target?.closest?.('button')) return; openDetail(r.id); }}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {r.image ? (
                              <img src={r.image} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0 border border-slate-100" />
                            ) : (
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: `${BRAND}15` }}>
                                <i className="fas fa-store text-xs" style={{ color: BRAND }} />
                              </div>
                            )}
                            <div>
                              <p className="font-black text-slate-800 text-sm">{r.name}</p>
                              {r.address && <p className="text-xs text-slate-400 mt-0.5">{r.address}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{r.cuisine || '—'}</td>
                        <td className="px-6 py-4"><ApprovalBadge approved={r.isApproved} /></td>
                        <td className="px-6 py-4">
                          {r.rating != null ? (
                            <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-700">
                              <i className="fas fa-star text-[10px] text-amber-400" />{r.rating}
                            </span>
                          ) : <span className="text-slate-400 text-sm">—</span>}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-700">{money(r.deliveryFee || 0)}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            {/* Edit */}
                            <button type="button" onClick={() => openEdit(r.id)} disabled={busy}
                              className="px-3 py-1.5 rounded-lg text-xs font-black border-2 transition-all disabled:opacity-50"
                              style={{ borderColor: '#e2e8f0', color: '#475569', background: '#fff' }}>
                              <i className="fas fa-pen text-[10px] mr-1" />Edit
                            </button>
                            {/* Approve / Unapprove */}
                            {!r.isApproved ? (
                              <button type="button" onClick={() => setApproved(r.id, true)} disabled={busy}
                                className="px-3 py-1.5 rounded-lg text-xs font-black transition-all disabled:opacity-50"
                                style={{ background: '#d1fae5', color: '#065f46' }}>
                                {busy ? '…' : <><i className="fas fa-check text-[10px] mr-1" />Approve</>}
                              </button>
                            ) : (
                              <button type="button" onClick={() => setApproved(r.id, false)} disabled={busy}
                                className="px-3 py-1.5 rounded-lg text-xs font-black transition-all disabled:opacity-50"
                                style={{ background: '#fef3c7', color: '#92400e' }}>
                                {busy ? '…' : <><i className="fas fa-times text-[10px] mr-1" />Unapprove</>}
                              </button>
                            )}
                            {/* Remove */}
                            <button type="button" onClick={() => setPendingRemoveId(r.id)} disabled={busy}
                              className="px-3 py-1.5 rounded-lg text-xs font-black transition-all disabled:opacity-50"
                              style={{ background: '#fee2e2', color: '#991b1b' }}>
                              {busy ? '…' : <><i className="fas fa-trash text-[10px] mr-1" />Remove</>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── DETAIL MODAL ── */}
      <Modal open={detailOpen} title="Restaurant Details" onClose={() => setDetailOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setDetailOpen(false)}
              className="px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition">
              Close
            </button>
            {selected?.id && (
              <button type="button" onClick={() => openEdit(selected.id)}
                className="px-4 py-2 rounded-xl text-sm font-black text-white transition"
                style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}>
                <i className="fas fa-pen text-xs mr-1.5" />Edit
              </button>
            )}
          </div>
        }>
        {detailError && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            <i className="fas fa-exclamation-circle" /> {detailError}
          </div>
        )}
        {detailLoading && <LoadingState />}
        {!detailLoading && selected && (
          <div className="space-y-4 fade-in">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {selected.image ? (
                  <img src={selected.image} alt="" className="w-14 h-14 rounded-2xl object-cover border border-slate-100" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${BRAND}15` }}>
                    <i className="fas fa-store text-xl" style={{ color: BRAND }} />
                  </div>
                )}
                <div>
                  <p className="text-xl font-black text-slate-800">{selected.name}</p>
                  <p className="text-sm text-slate-500">{selected.cuisine || '—'}</p>
                </div>
              </div>
              <ApprovalBadge approved={selected.isApproved} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Address',      icon: 'fa-map-marker-alt', value: selected.address || '—' },
                { label: 'Phone',        icon: 'fa-phone',           value: selected.phone || '—' },
                { label: 'Delivery Fee', icon: 'fa-motorcycle',      value: money(selected.deliveryFee) },
                { label: 'Min. Order',   icon: 'fa-shopping-bag',    value: money(selected.minOrder) },
                { label: 'Delivery Time',icon: 'fa-clock',           value: selected.deliveryTime || '—' },
                { label: 'Status',       icon: 'fa-toggle-on',       value: selected.isOpen ? 'Open' : 'Closed' },
              ].map(({ label, icon, value }) => (
                <div key={label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <i className={`fas ${icon} text-[10px]`} style={{ color: BRAND }} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{value}</p>
                </div>
              ))}
            </div>

            {selected.owner && (
              <div className="p-4 rounded-xl border border-slate-100 bg-white flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${BRAND}15` }}>
                  <i className="fas fa-user text-sm" style={{ color: BRAND }} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner</p>
                  <p className="text-sm font-black text-slate-800">{selected.owner.name}</p>
                  <p className="text-xs text-slate-500">{selected.owner.email}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal open={editOpen} title="Edit Restaurant" onClose={() => setEditOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setEditOpen(false)} disabled={editSaving}
              className="px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={saveEdit} disabled={editSaving}
              className="px-4 py-2 rounded-xl text-sm font-black text-white transition disabled:opacity-50 flex items-center gap-2"
              style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}>
              {editSaving
                ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
                : <><i className="fas fa-check text-xs" />Save changes</>}
            </button>
          </div>
        }>
        {editError && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            <i className="fas fa-exclamation-circle" /> {editError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FieldLabel>Name</FieldLabel>
            <StyledInput value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <FieldLabel>Cuisine</FieldLabel>
            <StyledInput value={form.cuisine} onChange={e => setForm(f => ({ ...f, cuisine: e.target.value }))} />
          </div>
          <div>
            <FieldLabel>Delivery Time</FieldLabel>
            <StyledInput value={form.deliveryTime} onChange={e => setForm(f => ({ ...f, deliveryTime: e.target.value }))} placeholder="e.g. 25–35 min" />
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Address</FieldLabel>
            <StyledInput value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <div>
            <FieldLabel>Phone</FieldLabel>
            <StyledInput value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <FieldLabel>Badge Label</FieldLabel>
            <StyledInput value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="e.g. Top Rated" />
          </div>
          <div>
            <FieldLabel>Delivery Fee (RWF)</FieldLabel>
            <StyledInput value={String(form.deliveryFee)} onChange={e => setForm(f => ({ ...f, deliveryFee: e.target.value }))} />
          </div>
          <div>
            <FieldLabel>Minimum Order (RWF)</FieldLabel>
            <StyledInput value={String(form.minOrder)} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Description</FieldLabel>
            <StyledTextarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-wrap gap-6">
            {[
              { key: 'isOpen', label: 'Open for orders' },
              { key: 'isApproved', label: 'Verified (blue badge)' },
            ].map(({ key, label }) => (
              <label key={key} className="inline-flex items-center gap-2.5 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={!!form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                  <div className="w-10 h-5 rounded-full transition-all"
                    style={{ background: form[key] ? BRAND : '#cbd5e1' }} />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                    style={{ transform: form[key] ? 'translateX(20px)' : 'translateX(0)' }} />
                </div>
                <span className="text-sm font-bold text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      {/* ── CREATE MODAL ── */}
      <Modal open={createOpen} title="Create Restaurant" onClose={() => setCreateOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setCreateOpen(false)} disabled={createSaving}
              className="px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">
              Cancel
            </button>
            <button type="button" disabled={
                createSaving || !createForm.ownerName.trim() ||
                !createForm.ownerEmail.trim() || !createForm.ownerPassword ||
                !createForm.restaurantName.trim()
              }
              onClick={async () => {
                setCreateSaving(true); setCreateError('');
                try {
                  await api.admin.users.create({
                    role: 'restaurant', name: createForm.ownerName, email: createForm.ownerEmail,
                    phone: createForm.ownerPhone || createForm.restaurantPhone,
                    password: createForm.ownerPassword, restaurantName: createForm.restaurantName,
                    restaurantImage: createForm.restaurantImage,
                  });
                  setCreateOpen(false); await load();
                  setToastType('success');
                  setToastMessage('Restaurant created successfully.');
                } catch (e) { setCreateError(e.message || 'Failed to create restaurant'); }
                finally { setCreateSaving(false); }
              }}
              className="px-4 py-2 rounded-xl text-sm font-black text-white transition disabled:opacity-50 flex items-center gap-2"
              style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}>
              {createSaving
                ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating…</>
                : <><i className="fas fa-plus text-xs" />Create</>}
            </button>
          </div>
        }>
        {createError && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            <i className="fas fa-exclamation-circle" /> {createError}
          </div>
        )}
        <div className="space-y-5">
          {/* Owner section */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${BRAND}15` }}>
                <i className="fas fa-user text-xs" style={{ color: BRAND }} />
              </div>
              <p className="text-sm font-black text-slate-700">Owner Account</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Owner Name</FieldLabel>
                <StyledInput value={createForm.ownerName}
                  onChange={e => setCreateForm(f => ({ ...f, ownerName: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>Owner Phone (optional)</FieldLabel>
                <StyledInput value={createForm.ownerPhone}
                  onChange={e => setCreateForm(f => ({ ...f, ownerPhone: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Owner Email</FieldLabel>
                <StyledInput type="email" value={createForm.ownerEmail}
                  onChange={e => setCreateForm(f => ({ ...f, ownerEmail: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Owner Password</FieldLabel>
                <div className="relative">
                  <StyledInput type={showOwnerPassword ? 'text' : 'password'}
                    className="pr-12"
                    value={createForm.ownerPassword}
                    onChange={e => setCreateForm(f => ({ ...f, ownerPassword: e.target.value }))} />
                  <button type="button" onClick={() => setShowOwnerPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center">
                    <i className={`fas ${showOwnerPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`} />
                  </button>
                </div>
              </div>
              <p className="md:col-span-2 text-xs text-slate-400">
                This owner will appear in <span className="font-bold text-slate-600">Admin → Users</span> and will be linked to the restaurant.
              </p>
            </div>
          </div>

          {/* Restaurant section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <FieldLabel>Restaurant Name</FieldLabel>
              <StyledInput value={createForm.restaurantName}
                onChange={e => setCreateForm(f => ({ ...f, restaurantName: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Restaurant Logo / Avatar</FieldLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="file" accept="image/png,image/jpeg,image/webp" disabled={logoUploading}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-600"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    setLogoUploading(true); setCreateError('');
                    try {
                      const data = await api.uploads.restaurantLogo(file);
                      setCreateForm(f => ({ ...f, restaurantImage: data.url || '' }));
                    } catch (err) { setCreateError(err.message || 'Logo upload failed'); }
                    finally { setLogoUploading(false); }
                  }} />
                <StyledInput value={createForm.restaurantImage}
                  onChange={e => setCreateForm(f => ({ ...f, restaurantImage: e.target.value }))}
                  placeholder="Or paste image URL" />
              </div>
              {createForm.restaurantImage ? (
                <div className="mt-3 flex items-center gap-3">
                  <img src={createForm.restaurantImage} alt="" className="h-12 w-12 rounded-xl object-cover border border-slate-100" />
                  <span className="text-xs text-slate-500 font-medium">{logoUploading ? 'Uploading…' : 'Preview'}</span>
                </div>
              ) : (
                <p className="mt-1.5 text-xs text-slate-400">{logoUploading ? 'Uploading…' : 'PNG / JPG / WEBP up to 3 MB.'}</p>
              )}
            </div>
            <div>
              <FieldLabel>Cuisine (optional)</FieldLabel>
              <StyledInput value={createForm.cuisine}
                onChange={e => setCreateForm(f => ({ ...f, cuisine: e.target.value }))} />
            </div>
            <div>
              <FieldLabel>Restaurant Phone (optional)</FieldLabel>
              <StyledInput value={createForm.restaurantPhone}
                onChange={e => setCreateForm(f => ({ ...f, restaurantPhone: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Address (optional)</FieldLabel>
              <StyledInput value={createForm.address}
                onChange={e => setCreateForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <p className="md:col-span-2 text-xs text-slate-400">
              Creating from Admin uses the same flow as Sign Up: owner user + restaurant profile are created and linked.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}