import { useEffect, useState } from 'react';
import { api } from '../../api';

const BRAND = '#F56230';
const BRAND_D = '#d94e22';

export default function SystemAssistantReviews() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState([]);
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.systemAssistant.reviews.getPending();
      setPending(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load pending reviews');
      setPending([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id) => {
    setBusyId(String(id));
    try {
      await api.systemAssistant.reviews.approve(id);
      await load();
    } catch (e) {
      setError(e.message || 'Failed to approve');
    } finally {
      setBusyId('');
    }
  };

  const reject = async (id) => {
    const reason = window.prompt('Rejection reason (optional):') || '';
    setBusyId(String(id));
    try {
      await api.systemAssistant.reviews.reject(id, reason);
      await load();
    } catch (e) {
      setError(e.message || 'Failed to reject');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {error ? (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-medium">
          <i className="fas fa-exclamation-circle mr-2" />
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Pending Reviews</h1>
          <p className="text-sm text-slate-500 mt-1">Approve to show on Home. Reject to hide.</p>
        </div>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border"
          style={{ background: '#fdf2f8', borderColor: '#fbcfe8', color: '#9d174d' }}
        >
          <i className="fas fa-star" style={{ color: BRAND }} />
          {loading ? '…' : pending.length} pending
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-slate-500 text-sm">Loading…</div>
      ) : pending.length === 0 ? (
        <div className="p-10 bg-white border border-slate-100 rounded-2xl text-center text-slate-500">
          No pending reviews.
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {pending.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-slate-100 rounded-[24px] overflow-hidden"
              style={{ boxShadow: '0 2px 16px rgba(0,0,0,.04)' }}
            >
              <div className="p-7">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.stars)].map((_, j) => (
                    <i key={j} className="fas fa-star text-yellow-400 text-sm" />
                  ))}
                </div>
                <p className="text-slate-600 italic mb-6 leading-relaxed text-sm">"{t.text}"</p>

                <div className="flex items-center gap-3">
                  <img
                    src={
                      t.customerAvatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(t.customerName)}&background=F56230&color=fff&bold=true`
                    }
                    alt=""
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow"
                  />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm" style={{ fontFamily: 'Sora,sans-serif' }}>
                      {t.customerName}
                    </h4>
                    <span className="text-xs text-slate-400">{t.customerRole}</span>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {t.createdAt ? new Date(t.createdAt).toLocaleString() : ''}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-7 pb-7 pt-0 flex gap-3 justify-end flex-wrap">
                <button
                  type="button"
                  onClick={() => reject(t.id)}
                  disabled={busyId === String(t.id)}
                  className="px-4 py-2 rounded-xl border border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 transition disabled:opacity-60"
                >
                  {busyId === String(t.id) ? '…' : 'Reject'}
                </button>
                <button
                  type="button"
                  onClick={() => approve(t.id)}
                  disabled={busyId === String(t.id)}
                  className="px-4 py-2 rounded-xl text-white font-bold text-sm hover:opacity-95 transition disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 4px 14px ${BRAND}40` }}
                >
                  {busyId === String(t.id) ? '…' : 'Approve'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

