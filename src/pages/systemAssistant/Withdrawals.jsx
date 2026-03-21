import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api';
import Toast from '../../components/Toast';

const BRAND = '#F56230';
const money = (n) => `RWF ${Number(n || 0).toLocaleString()}`;

export default function SystemAssistantWithdrawals() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [tab, setTab] = useState('restaurant');
  const [data, setData] = useState({ delivery: [], restaurant: [] });
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await api.systemAssistant.withdrawals.pending();
      setData({
        delivery: Array.isArray(d?.delivery) ? d.delivery : [],
        restaurant: Array.isArray(d?.restaurant) ? d.restaurant : [],
      });
    } catch (e) {
      setError(e.message || 'Failed to load pending withdrawals');
      setData({ delivery: [], restaurant: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!error) return;
    setToastType('error');
    setToastMessage(error);
  }, [error]);

  const rows = useMemo(() => data[tab] || [], [data, tab]);

  const updateRequest = async (type, id, action) => {
    const key = `${type}:${id}:${action}`;
    setBusyKey(key);
    setError('');
    try {
      await api.systemAssistant.withdrawals.update(type, id, action);
      setToastType('success');
      setToastMessage(`Withdrawal ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
      await load();
    } catch (e) {
      setToastType('error');
      setToastMessage(e.message || 'Failed to update withdrawal');
      setError(e.message || 'Failed to update withdrawal');
    } finally {
      setBusyKey('');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <Toast
        message={toastMessage}
        type={toastType}
        duration={2600}
        position="top-right"
        onClose={() => { setToastMessage(''); setError(''); }}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Pending Withdrawals</h1>
            <p className="text-sm text-slate-500 mt-1">Approve or reject restaurant and delivery withdrawal requests.</p>
          </div>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            <i className="fas fa-sync-alt mr-2" />
            Refresh
          </button>
        </div>

        <div className="flex rounded-xl border border-slate-200 overflow-hidden w-fit mb-5">
          {[
            { id: 'restaurant', label: `Restaurant (${data.restaurant.length})` },
            { id: 'delivery', label: `Delivery (${data.delivery.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="px-4 py-2 text-sm font-black"
              style={tab === t.id ? { background: BRAND, color: '#fff' } : { background: '#fff', color: '#475569' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 p-10 text-center text-slate-400">
            <i className="fas fa-inbox text-2xl mb-2 block" />
            No pending {tab} withdrawals.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((w) => (
              <div key={`${tab}:${w.id}`} className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-black text-slate-800">
                      {tab === 'restaurant' ? 'Restaurant' : 'Delivery'}: {w.ownerName}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      {money(w.amount)} · {String(w.method || '').toUpperCase()} · {w.account}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Requested: {w.createdAt ? new Date(w.createdAt).toLocaleString() : '—'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateRequest(tab, w.id, 'reject')}
                      disabled={Boolean(busyKey)}
                      className="px-3 py-2 rounded-xl border border-red-200 text-xs font-black text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      {busyKey === `${tab}:${w.id}:reject` ? 'Working…' : 'Reject'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateRequest(tab, w.id, 'approve')}
                      disabled={Boolean(busyKey)}
                      className="px-3 py-2 rounded-xl text-xs font-black text-white disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}
                    >
                      {busyKey === `${tab}:${w.id}:approve` ? 'Working…' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
