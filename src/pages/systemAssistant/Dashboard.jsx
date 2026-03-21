import { useEffect, useState } from 'react';
import { api } from '../../api';

const BRAND = '#F56230';
const BRAND_D = '#d94e22';

export default function SystemAssistantDashboard() {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const pending = await api.systemAssistant.reviews.getPending();
        setPendingCount(Array.isArray(pending) ? pending.length : 0);
      } catch (e) {
        setError(e.message || 'Failed to load pending reviews');
        setPendingCount(0);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div className="p-6 lg:p-8">
      {error ? (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-medium">
          <i className="fas fa-exclamation-circle mr-2" />
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-slate-800">System Assistant</h1>
            <p className="text-sm text-slate-500 mt-1">Review approvals and catalog updates.</p>
          </div>

          <div
            className="inline-flex items-center gap-3 px-4 py-2 rounded-xl border font-bold"
            style={{
              background: loading ? '#f1f5f9' : '#fdf2f8',
              borderColor: loading ? '#e2e8f0' : '#fbcfe8',
              color: loading ? '#64748b' : '#9d174d',
            }}
          >
            <i className="fas fa-star" style={{ color: BRAND }} />
            Pending reviews: {loading ? '…' : pendingCount}
          </div>
        </div>

        <div className="mt-7 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-100 p-5 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${BRAND}15` }}>
                <i className="fas fa-star text-sm" style={{ color: BRAND }} />
              </div>
              <div>
                <div className="text-sm font-black text-slate-800">Approve customer reviews</div>
                <div className="text-xs text-slate-500 mt-1">Only approved reviews appear on Home.</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 p-5 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${BRAND}15` }}>
                <i className="fas fa-utensils text-sm" style={{ color: BRAND }} />
              </div>
              <div>
                <div className="text-sm font-black text-slate-800">Maintain cuisines & food types</div>
                <div className="text-xs text-slate-500 mt-1">Updates are used by customer filters.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 rounded-[22px] p-5 border border-slate-100" style={{ background: `linear-gradient(135deg,${BRAND}10,#ffffff)` }}>
          <div className="text-sm font-bold text-slate-800">
            <i className="fas fa-lightbulb mr-2" style={{ color: BRAND }} /> Tip
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Use <strong>Pending Reviews</strong> to approve/reject, and <strong>Catalog</strong> to add new cuisines/types.
          </div>
        </div>
      </div>
    </div>
  );
}

