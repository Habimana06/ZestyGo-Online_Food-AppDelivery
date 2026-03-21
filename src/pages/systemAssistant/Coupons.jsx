import { useEffect, useState } from 'react';
import { api } from '../../api';

const BRAND = '#F56230';
const BRAND_D = '#d94e22';

const baseInput = `w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white outline-none transition-all`;

export default function SystemAssistantCoupons() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [coupons, setCoupons] = useState([]);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('0');
  const [appliesTo, setAppliesTo] = useState('subtotal');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [minSubtotal, setMinSubtotal] = useState('');
  const [expiresAt, setExpiresAt] = useState(''); // datetime-local string
  const [isActive, setIsActive] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.systemAssistant.coupons.list();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load coupons');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upsert = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setBusy(true);
    setError('');
    try {
      await api.systemAssistant.coupons.upsert({
        code,
        discountType,
        discountValue,
        appliesTo,
        maxDiscount: maxDiscount.trim() ? maxDiscount : null,
        minSubtotal: minSubtotal.trim() ? minSubtotal : null,
        expiresAt: expiresAt ? expiresAt : null,
        isActive,
      });

      setCode('');
      setDiscountValue('0');
      setDiscountType('percent');
      setAppliesTo('subtotal');
      setMaxDiscount('');
      setMinSubtotal('');
      setExpiresAt('');
      setIsActive(true);

      await load();
    } catch (e2) {
      setError(e2.message || 'Failed to save coupon');
    } finally {
      setBusy(false);
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Coupons</h1>
            <p className="text-sm text-slate-500 mt-1">Create discount codes used in Cart promo field.</p>
          </div>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border"
            style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#334155' }}
          >
            <i className="fas fa-tag" style={{ color: BRAND }} />
            {loading ? 'Loading…' : `${coupons.length} coupons`}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div className="rounded-[22px] border border-slate-100 p-5 bg-slate-50">
            <h2 className="font-black text-slate-800 mb-3">Create / Update</h2>
            <form onSubmit={upsert} className="space-y-4">
              <input
                className={baseInput}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. FIRST50"
                disabled={busy}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Type</label>
                  <select
                    className={baseInput}
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    disabled={busy}
                  >
                    <option value="percent">Percent</option>
                    <option value="fixed">Fixed (RWF)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Applies To</label>
                  <select
                    className={baseInput}
                    value={appliesTo}
                    onChange={(e) => setAppliesTo(e.target.value)}
                    disabled={busy}
                  >
                    <option value="subtotal">Subtotal</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
                  {discountType === 'percent' ? 'Percent value (0-100)' : 'Fixed amount (RWF)'}
                </label>
                <input
                  className={baseInput}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={busy}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Max discount (optional)</label>
                  <input
                    className={baseInput}
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    placeholder="e.g. 25000"
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={busy}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Min subtotal (optional)</label>
                  <input
                    className={baseInput}
                    value={minSubtotal}
                    onChange={(e) => setMinSubtotal(e.target.value)}
                    placeholder="e.g. 20000"
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={busy}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Expires at (optional)</label>
                <input
                  className={baseInput}
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  type="datetime-local"
                  disabled={busy}
                />
              </div>

              <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={busy} />
                Active
              </label>

              <button
                type="submit"
                disabled={busy || !code.trim()}
                className="w-full py-3.5 text-white font-black text-sm rounded-2xl transition-all disabled:opacity-60"
                style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 6px 20px ${BRAND}40` }}
              >
                {busy ? 'Saving…' : 'Save Coupon'}
              </button>
            </form>
          </div>

          <div className="rounded-[22px] border border-slate-100 p-5 bg-slate-50">
            <h2 className="font-black text-slate-800 mb-3">Existing Coupons</h2>

            {loading ? (
              <div className="text-slate-500 text-sm">Loading…</div>
            ) : coupons.length === 0 ? (
              <div className="text-slate-500 text-sm">No coupons yet.</div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                {coupons.map((c) => (
                  <div key={c.code} className="p-4 rounded-2xl border border-slate-100 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black text-slate-800">{c.code}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {String(c.discount_type || '').toUpperCase()} {c.discount_value}
                          {c.applies_to ? ` • ${c.applies_to}` : ''}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-[11px] font-bold ${
                          Number(c.is_active) === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {Number(c.is_active) === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      {c.max_discount != null ? `Max: ${Number(c.max_discount).toLocaleString()} RWF • ` : ''}
                      {c.min_subtotal != null && Number(c.min_subtotal) > 0 ? `Min: ${Number(c.min_subtotal).toLocaleString()} RWF • ` : ''}
                      {c.expires_at ? `Expires: ${new Date(c.expires_at).toLocaleString()}` : 'No expiry'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

