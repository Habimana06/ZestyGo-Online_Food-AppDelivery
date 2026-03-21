import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api';
import Modal from '../../components/Modal';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';

const ROLE_TABS = [
  { id: 'all',        label: 'All',         icon: 'fa-users' },
  { id: 'admin',      label: 'Admins',      icon: 'fa-shield-halved' },
  { id: 'customer',   label: 'Customers',   icon: 'fa-user' },
  { id: 'restaurant', label: 'Restaurants', icon: 'fa-store' },
  { id: 'delivery',   label: 'Delivery',    icon: 'fa-motorcycle' },
  { id: 'system_assistant', label: 'System Assistants', icon: 'fa-robot' },
];

const ROLE_STYLE = {
  admin:      { bg: '#f3e8ff', color: '#7e22ce', dot: '#a855f7' },
  restaurant: { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  delivery:   { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  customer:   { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
  system_assistant: { bg: '#fdf2f8', color: '#9d174d', dot: '#d946ef' },
};

function RoleBadge({ role }) {
  const s = ROLE_STYLE[role] || ROLE_STYLE.customer;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full capitalize"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {role}
    </span>
  );
}

const baseInput = `w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white outline-none transition-all`;

function FocusInput({ ...props }) {
  const [f, setF] = useState(false);
  return (
    <input {...props} className={baseInput}
      style={{ borderColor: f ? BRAND : undefined, boxShadow: f ? `0 0 0 3px ${BRAND}18` : undefined }}
      onFocus={() => setF(true)} onBlur={() => setF(false)} />
  );
}

function FocusSelect({ children, value, onChange }) {
  const [f, setF] = useState(false);
  return (
    <div className="relative">
      <select value={value} onChange={onChange}
        className={`${baseInput} appearance-none pr-9 cursor-pointer`}
        style={{ borderColor: f ? BRAND : undefined, boxShadow: f ? `0 0 0 3px ${BRAND}18` : undefined }}
        onFocus={() => setF(true)} onBlur={() => setF(false)}>
        {children}
      </select>
      <i className="fas fa-chevron-down text-[10px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  const [f, setF]       = useState(false);
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={onChange}
        placeholder={placeholder || '••••••••'} className={baseInput}
        style={{ paddingRight: '3rem', borderColor: f ? BRAND : undefined, boxShadow: f ? `0 0 0 3px ${BRAND}18` : undefined }}
        onFocus={() => setF(true)} onBlur={() => setF(false)} />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
        <i className={`fas ${show ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div className="relative flex-shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <div className="w-10 h-6 rounded-full transition-all duration-200"
          style={{ background: checked ? BRAND : '#e2e8f0' }} />
        <div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
          style={{ left: checked ? '22px' : '4px' }} />
      </div>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </label>
  );
}

function UserInitials({ name, avatar, size = 10 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const cls = `w-${size} h-${size} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden`;
  return avatar
    ? <div className={cls}><img src={avatar} alt="" className="w-full h-full object-cover" /></div>
    : <div className={cls} style={{ background: `${BRAND}18` }}>
        <span className="text-xs font-black" style={{ color: BRAND }}>{initials}</span>
      </div>;
}

export default function AdminUsers() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [savingId, setSavingId] = useState('');
  const [tab, setTab]           = useState('all');
  const [q, setQ]               = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // create
  const [createOpen, setCreateOpen]     = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError]   = useState('');
  const [createForm, setCreateForm] = useState({ name: '', email: '', phone: '', role: 'customer', password: '', restaurantName: '' });

  // detail
  const [detailOpen, setDetailOpen]       = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError]     = useState('');
  const [selectedId, setSelectedId]       = useState(null);
  const [selected, setSelected]           = useState(null);

  // edit
  const [editOpen, setEditOpen]     = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError]   = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'customer', isBlocked: false, isApproved: true, password: '' });

  const load = async () => {
    setLoading(true); setError('');
    try {
      const data = await api.admin.users.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load users');
      setUsers([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c = { all: users.length, admin: 0, customer: 0, restaurant: 0, delivery: 0, system_assistant: 0 };
    for (const u of users) { const r = String(u.role || '').toLowerCase(); if (c[r] != null) c[r]++; }
    return c;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = q.trim().toLowerCase();
    return users.filter(u => {
      if (tab !== 'all' && String(u.role || '').toLowerCase() !== tab) return false;
      if (!query) return true;
      return `${u.name||''} ${u.email||''} ${u.phone||''} ${u.restaurantName||''}`.toLowerCase().includes(query);
    });
  }, [users, tab, q]);

  const openDetail = async (id) => {
    setSelectedId(id); setSelected(null); setDetailError('');
    setDetailLoading(true); setDetailOpen(true);
    try { setSelected(await api.admin.users.getById(id)); }
    catch (e) { setDetailError(e.message || 'Failed to load user'); }
    finally { setDetailLoading(false); }
  };

  const openEdit = async (id) => {
    setEditError(''); setEditSaving(false); setEditOpen(true);
    const src = selected?.id === id ? selected : await api.admin.users.getById(id).catch(() => null);
    if (src) {
      setSelectedId(id); setSelected(src);
      setForm({ name: src.name||'', email: src.email||'', phone: src.phone||'', role: src.role||'customer', isBlocked: !!src.isBlocked, isApproved: src.isApproved == null ? true : !!src.isApproved, password: '' });
    } else { setEditError('Failed to load user'); }
  };

  const saveEdit = async () => {
    if (!selectedId) return;
    setEditSaving(true); setEditError('');
    try {
      await api.admin.users.update(selectedId, { name: form.name, email: form.email, phone: form.phone, role: form.role, isBlocked: !!form.isBlocked, isApproved: !!form.isApproved, ...(form.password ? { password: form.password } : {}) });
      setEditOpen(false); await load();
      if (detailOpen) setSelected(await api.admin.users.getById(selectedId));
    } catch (e) { setEditError(e.message || 'Failed to update user'); }
    finally { setEditSaving(false); }
  };

  const setBlocked  = async (id, v) => { setSavingId(String(id)); try { await api.admin.users.setBlocked(id, v); await load(); } catch (e) { setError(e.message); } finally { setSavingId(''); } };
  const setApproved = async (id, v) => { setSavingId(String(id)); try { await api.admin.users.approve(id, v);    await load(); } catch (e) { setError(e.message); } finally { setSavingId(''); } };

  const remove = async (id) => {
    setSavingId(String(id)); setError('');
    try { await api.admin.users.remove(id); await load(); }
    catch (e) { setError(e.message || 'Failed to delete user'); }
    finally { setSavingId(''); setDeleteTarget(null); }
  };

  const handleCreate = async () => {
    setCreateSaving(true); setCreateError('');
    try { await api.admin.users.create(createForm); setCreateOpen(false); await load(); }
    catch (e) { setCreateError(e.message || 'Failed to create user'); }
    finally { setCreateSaving(false); }
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
      <header className="bg-white border-b border-slate-100 px-8 py-5 flex flex-wrap gap-4 items-center justify-between sticky top-0 z-10"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Users</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Manage accounts by role · click any row to view details</p>
        </div>
        <button
          onClick={() => { setCreateError(''); setCreateForm({ name: '', email: '', phone: '', role: 'customer', password: '', restaurantName: '' }); setCreateOpen(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-black rounded-2xl transition-all"
          style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 4px 14px ${BRAND}40` }}
        >
          <i className="fas fa-user-plus text-xs" /> Create user
        </button>
      </header>

      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen space-y-5">

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium fade-in">
            <i className="fas fa-exclamation-circle flex-shrink-0" /> {error}
          </div>
        )}

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {ROLE_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="rounded-2xl border px-4 py-3 text-left transition-all"
              style={tab === t.id
                ? { background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, borderColor: BRAND, boxShadow: `0 4px 14px ${BRAND}30` }
                : { background: '#fff', borderColor: '#e2e8f0' }
              }>
              <p className="text-xs font-bold mb-1" style={{ color: tab === t.id ? 'rgba(255,255,255,0.75)' : '#94a3b8' }}>
                <i className={`fas ${t.icon} mr-1`} />{t.label}
              </p>
              <p className="text-2xl font-black" style={{ color: tab === t.id ? '#fff' : '#1e293b' }}>{counts[t.id] ?? 0}</p>
            </button>
          ))}
        </div>

        {/* ── TABLE CARD ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* toolbar */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1 max-w-sm">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input value={q} onChange={e => setQ(e.target.value)}
                  placeholder="Search name, email, phone…"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none transition-all focus:border-orange-300 focus:bg-white" />
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-500">{filteredUsers.length} users</span>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center gap-3 text-slate-400">
              <span className="w-8 h-8 border-2 border-slate-200 border-t-orange-400 rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading users…</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 flex flex-col items-center gap-3 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">👤</div>
              <p className="font-bold text-slate-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['User', 'Email', 'Role', 'Status', 'Actions'].map((h, i) => (
                      <th key={h} className={`px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map(u => {
                    const busy = savingId === String(u.id);
                    const needsApproval = (u.role === 'delivery' || u.role === 'restaurant') && !u.isApproved;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 cursor-pointer transition-colors fade-in"
                        onClick={e => { if (e.target?.closest?.('button')) return; openDetail(u.id); }}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <UserInitials name={u.name} avatar={u.avatar} />
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{u.name}</p>
                              <p className="text-xs text-slate-400">
                                {u.role === 'restaurant' && u.restaurantName
                                  ? <>🏪 {u.restaurantName}</>
                                  : u.phone || '—'
                                }
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                        <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                              style={u.isBlocked
                                ? { background: '#fee2e2', color: '#991b1b' }
                                : { background: '#dcfce7', color: '#166534' }
                              }>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: u.isBlocked ? '#ef4444' : '#22c55e' }} />
                              {u.isBlocked ? 'Blocked' : 'Active'}
                            </span>
                            {needsApproval && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                                style={{ background: '#fef9c3', color: '#a16207' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                Pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openEdit(u.id)} disabled={busy}
                              className="w-8 h-8 rounded-xl border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-300 hover:text-slate-600 transition disabled:opacity-40" title="Edit">
                              <i className="fas fa-pen text-xs" />
                            </button>
                            {(u.role === 'delivery' || u.role === 'restaurant') && !u.isApproved && (
                              <button onClick={() => setApproved(u.id, true)} disabled={busy}
                                className="w-8 h-8 rounded-xl border-2 flex items-center justify-center transition disabled:opacity-40"
                                style={{ borderColor: '#3b82f6', color: '#3b82f6' }} title="Approve">
                                {busy ? <span className="w-3 h-3 border-2 border-blue-300 border-t-blue-500 rounded-full animate-spin" />
                                       : <i className="fas fa-check text-xs" />}
                              </button>
                            )}
                            <button onClick={() => setBlocked(u.id, !u.isBlocked)} disabled={busy}
                              className="w-8 h-8 rounded-xl border-2 flex items-center justify-center transition disabled:opacity-40"
                              style={u.isBlocked
                                ? { borderColor: '#10b981', color: '#10b981' }
                                : { borderColor: '#f59e0b', color: '#f59e0b' }}
                              title={u.isBlocked ? 'Unblock' : 'Block'}>
                              {busy ? <span className="w-3 h-3 border-2 border-current rounded-full animate-spin border-t-transparent" />
                                     : <i className={`fas ${u.isBlocked ? 'fa-lock-open' : 'fa-lock'} text-xs`} />}
                            </button>
                            <button onClick={() => setDeleteTarget(u)} disabled={busy}
                              className="w-8 h-8 rounded-xl border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40" title="Delete">
                              <i className="fas fa-trash text-xs" />
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

      {/* ── DELETE CONFIRM ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 fade-in">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-trash text-red-500 text-lg" />
            </div>
            <h3 className="text-lg font-black text-slate-800 text-center mb-1">Delete user?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              <span className="font-bold text-slate-700">{deleteTarget.name}</span> will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 text-sm font-bold rounded-2xl border-2 border-slate-200 text-slate-600 hover:border-slate-300 transition">
                Cancel
              </button>
              <button onClick={() => remove(deleteTarget.id)} disabled={!!savingId}
                className="flex-1 py-3 text-sm font-bold rounded-2xl text-white flex items-center justify-center gap-2 transition"
                style={{ background: '#ef4444', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}>
                {savingId ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <i className="fas fa-trash text-xs" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      <Modal open={detailOpen} title="User details"
        onClose={() => { setDetailOpen(false); setDetailError(''); }}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setDetailOpen(false)}
              className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300 transition">
              Close
            </button>
            {selected?.id && (
              <button onClick={() => openEdit(selected.id)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-black transition"
                style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 4px 14px ${BRAND}40` }}>
                <i className="fas fa-pen text-xs" /> Edit
              </button>
            )}
          </div>
        }>
        {detailError && <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium"><i className="fas fa-exclamation-circle" /> {detailError}</div>}
        {detailLoading && (
          <div className="py-8 flex flex-col items-center gap-3 text-slate-400">
            <span className="w-7 h-7 border-2 border-slate-200 border-t-orange-400 rounded-full animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        )}
        {!detailLoading && selected && (
          <div className="space-y-4">
            {/* avatar + name hero */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <UserInitials name={selected.name} avatar={selected.avatar} size={14} />
              <div>
                <p className="font-black text-slate-800">{selected.name}</p>
                <p className="text-sm text-slate-500">{selected.email}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <RoleBadge role={selected.role} />
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                    style={selected.isBlocked ? { background: '#fee2e2', color: '#991b1b' } : { background: '#dcfce7', color: '#166534' }}>
                    {selected.isBlocked ? '🔒 Blocked' : '✓ Active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Phone',   value: selected.phone || '—' },
                { label: 'Created', value: selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-sm font-bold text-slate-700">{value}</p>
                </div>
              ))}
            </div>

            {selected.restaurant && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Linked Restaurant</p>
                  <p className="font-black text-slate-800">{selected.restaurant.name}</p>
                  <p className="text-xs text-slate-500">{selected.restaurant.cuisine || '—'}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={selected.restaurant.isApproved
                    ? { background: '#dbeafe', color: '#1d4ed8' }
                    : { background: '#fef9c3', color: '#a16207' }
                  }>
                  {selected.restaurant.isApproved ? '✓ Verified' : '⏳ Pending'}
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal open={editOpen} title="Edit user"
        onClose={() => { setEditOpen(false); setEditError(''); setForm(f => ({ ...f, password: '' })); }}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setEditOpen(false)} disabled={editSaving}
              className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300 transition">
              Cancel
            </button>
            <button onClick={saveEdit} disabled={editSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-black transition disabled:opacity-50"
              style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 4px 14px ${BRAND}40` }}>
              {editSaving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</> : <><i className="fas fa-floppy-disk text-xs" /> Save changes</>}
            </button>
          </div>
        }>
        {editError && <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium"><i className="fas fa-exclamation-circle" /> {editError}</div>}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name"><FocusInput value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" /></Field>
            <Field label="Role">
              <FocusSelect value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {['admin','customer','restaurant','delivery','system_assistant'].map(r => <option key={r} value={r}>{r}</option>)}
              </FocusSelect>
            </Field>
            <div className="col-span-2"><Field label="Email"><FocusInput type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field></div>
            <div className="col-span-2"><Field label="Phone"><FocusInput type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Field></div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <Toggle checked={!!form.isBlocked} onChange={e => setForm(f => ({ ...f, isBlocked: e.target.checked }))} label="🔒 Account blocked" />
            <Toggle checked={!!form.isApproved} onChange={e => setForm(f => ({ ...f, isApproved: e.target.checked }))} label="✓ Approved (delivery / restaurant access)" />
          </div>

          <Field label="New password (optional)">
            <PasswordInput value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Leave empty to keep current" />
            <p className="text-[11px] text-slate-400 mt-1.5">Password is stored as a secure bcrypt hash.</p>
          </Field>
        </div>
      </Modal>

      {/* ── CREATE MODAL ── */}
      <Modal open={createOpen} title="Create user"
        onClose={() => setCreateOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setCreateOpen(false)} disabled={createSaving}
              className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300 transition">
              Cancel
            </button>
            <button onClick={handleCreate}
              disabled={createSaving || !createForm.name.trim() || !createForm.email.trim() || !createForm.password || (createForm.role === 'restaurant' && !createForm.restaurantName.trim())}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-black transition disabled:opacity-50"
              style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 4px 14px ${BRAND}40` }}>
              {createSaving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating…</> : <><i className="fas fa-user-plus text-xs" /> Create</>}
            </button>
          </div>
        }>
        {createError && <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium"><i className="fas fa-exclamation-circle" /> {createError}</div>}
        <div className="space-y-4">
          <Field label="Role">
            <FocusSelect value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}>
              {['customer','delivery','restaurant','admin','system_assistant'].map(r => <option key={r} value={r}>{r}</option>)}
            </FocusSelect>
            {(createForm.role === 'delivery' || createForm.role === 'restaurant') && (
              <div className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                <i className="fas fa-clock mt-0.5 flex-shrink-0" />
                This account will be created as <strong className="ml-1">Pending</strong> until you verify it.
              </div>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Field label="Full Name"><FocusInput value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Jean Pierre" /></Field></div>
            <div className="col-span-2"><Field label="Email"><FocusInput type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com" /></Field></div>
            <Field label="Phone (optional)"><FocusInput type="tel" value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} placeholder="+250 7XX XXX XXX" /></Field>
            <Field label="Password"><PasswordInput value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} /></Field>
          </div>
          {createForm.role === 'restaurant' && (
            <Field label="Restaurant Name"><FocusInput value={createForm.restaurantName} onChange={e => setCreateForm(f => ({ ...f, restaurantName: e.target.value }))} placeholder="Business name" /></Field>
          )}
          <p className="text-[11px] text-slate-400">Password is stored as a secure bcrypt hash.</p>
        </div>
      </Modal>
    </>
  );
}