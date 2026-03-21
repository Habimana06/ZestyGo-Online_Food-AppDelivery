import { useEffect, useState } from 'react';
import { api } from '../../api';

const BRAND = '#F56230';

function DetailsCell({ details }) {
  if (!details) return <span className="text-slate-400">—</span>;
  try {
    const s = typeof details === 'string' ? details : JSON.stringify(details);
    return <span className="text-xs text-slate-600 break-all">{s.length > 500 ? s.slice(0, 500) + '…' : s}</span>;
  } catch {
    return <span className="text-xs text-slate-600 break-all">{String(details).slice(0, 500)}</span>;
  }
}

export default function AdminLogs() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.admin.logs.getAll(`?limit=50&offset=0`);
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Admin Audit Log</h1>
          <p className="text-sm text-slate-500 mt-1">Shows key actions with timestamps.</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
          style={{ background: `linear-gradient(135deg,${BRAND},#d94e22)` }}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-medium">
          <i className="fas fa-exclamation-circle mr-2" />
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-slate-500 text-sm">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-slate-500 text-sm">No audit logs yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Time', 'Actor', 'Action', 'Target', 'Details'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {l.createdAt ? new Date(l.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-800">
                      <div className="font-bold">{l.actorName || 'Unknown'}</div>
                      <div className="text-xs text-slate-400">{l.actorRole}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-bold">{l.action}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {l.targetUserId ? `User #${l.targetUserId}` : l.targetRestaurantId ? `Restaurant #${l.targetRestaurantId}` : '—'}
                      {l.targetName ? <span className="text-xs text-slate-400"> ({l.targetName})</span> : null}
                    </td>
                    <td className="px-6 py-4">
                      <DetailsCell details={l.details} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

