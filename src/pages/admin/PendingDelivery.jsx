import { useEffect, useState } from 'react';
import { api } from '../../api';
import Modal from '../../components/Modal';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';

function EmptyState() {
  return (
    <div className="p-10 flex flex-col items-center gap-2 text-slate-400">
      <div className="text-2xl">🛵</div>
      <p className="text-sm font-medium">No pending delivery accounts — all caught up!</p>
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

function Avatar({ name }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black text-white"
      style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}>
      {initials}
    </div>
  );
}

export default function AdminPendingDelivery() {
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [savingId, setSavingId]         = useState('');

  const [detailOpen, setDetailOpen]       = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError]     = useState('');
  const [selected, setSelected]           = useState(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const data = await api.admin.pending.delivery();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load pending delivery users');
      setUsers([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const verify = async (id) => {
    setSavingId(String(id)); setError('');
    try { await api.admin.users.approve(id, true); await load(); }
    catch (e) { setError(e.message || 'Failed to verify'); }
    finally { setSavingId(''); }
  };

  const openDetail = async (id) => {
    setSelected(null); setDetailOpen(true); setDetailLoading(true); setDetailError('');
    try { setSelected(await api.admin.users.getById(id)); }
    catch (e) { setDetailError(e.message || 'Failed to load user'); }
    finally { setDetailLoading(false); }
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
          <h1 className="text-2xl font-black text-slate-800">Pending Delivery Accounts</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Verify delivery users so they can log in and accept orders</p>
        </div>
        {!loading && users.length > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black"
            style={{ background: '#dbeafe', color: '#1d4ed8' }}>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            {users.length} awaiting review
          </div>
        )}
      </header>

      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen space-y-5">

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium fade-in">
            <i className="fas fa-exclamation-circle flex-shrink-0" /> {error}
          </div>
        )}

        {/* ── TABLE CARD ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* card header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${BRAND}15` }}>
              <i className="fas fa-motorcycle text-sm" style={{ color: BRAND }} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800">Awaiting Verification</h2>
              <p className="text-xs text-slate-400">Click any row to view full details</p>
            </div>
          </div>

          {loading ? <LoadingState /> : users.length === 0 ? <EmptyState /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Delivery User', 'Email', 'Phone', 'Registered', 'Action'].map((h, i) => (
                      <th key={h}
                        className={`px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest ${i === 4 ? 'text-right' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => {
                    const busy = savingId === String(u.id);
                    return (
                      <tr key={u.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer fade-in"
                        onClick={(e) => { if (e.target?.closest?.('button')) return; openDetail(u.id); }}>

                        {/* Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} />
                            <p className="font-black text-slate-800 text-sm">{u.name}</p>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 text-sm text-slate-600 break-all">{u.email}</td>

                        {/* Phone */}
                        <td className="px-6 py-4 text-sm text-slate-600">{u.phone || '—'}</td>

                        {/* Created */}
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4">
                          <div className="flex justify-end">
                            <button type="button" onClick={() => verify(u.id)} disabled={busy}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-white transition-all disabled:opacity-50"
                              style={{
                                background: busy ? '#3b82f6' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                                boxShadow: busy ? 'none' : '0 4px 10px rgba(59,130,246,0.35)',
                              }}>
                              {busy
                                ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying…</>
                                : <><i className="fas fa-check text-[10px]" />Verify</>}
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
      <Modal open={detailOpen} title="Delivery User Details" onClose={() => setDetailOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setDetailOpen(false)}
              className="px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition">
              Close
            </button>
            {selected?.id && (
              <button type="button"
                onClick={() => { verify(selected.id); setDetailOpen(false); }}
                disabled={savingId === String(selected.id)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black text-white transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 4px 10px rgba(59,130,246,0.35)' }}>
                {savingId === String(selected.id)
                  ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying…</>
                  : <><i className="fas fa-check text-xs" />Verify Account</>}
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
            {/* identity row */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}>
                {(selected.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xl font-black text-slate-800">{selected.name}</p>
                <p className="text-sm text-slate-500 break-all">{selected.email}</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Pending
              </span>
            </div>

            {/* detail grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Phone',      icon: 'fa-phone',    value: selected.phone || '—' },
                { label: 'Registered', icon: 'fa-calendar', value: selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : '—' },
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

            {/* info note */}
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium">
              <i className="fas fa-info-circle mt-0.5 flex-shrink-0" />
              Verifying this account allows the delivery user to log in and start accepting orders.
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}