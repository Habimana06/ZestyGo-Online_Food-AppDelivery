import { useEffect, useState } from 'react';
import { api } from '../../api';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';

const BRAND = '#F56230';
const BRAND_D = '#d94e22';

const baseInput = `w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white outline-none transition-all`;

export default function Announcements() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [coupons, setCoupons] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [headline, setHeadline] = useState('');
  const [message, setMessage] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [ctaText, setCtaText] = useState('Order now ->');
  const [ctaPath, setCtaPath] = useState('/menu');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [busy, setBusy] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const resetForm = () => {
    setEditingId(null);
    setHeadline('');
    setMessage('');
    setCouponCode('');
    setCtaText('Order now ->');
    setCtaPath('/menu');
    setIsActive(true);
    setSortOrder(0);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [ann, cps] = await Promise.all([
        api.systemAssistant.announcements.list(),
        api.systemAssistant.coupons.list(),
      ]);
      setItems(Array.isArray(ann) ? ann : []);
      setCoupons(Array.isArray(cps) ? cps : []);
    } catch (e) {
      setError(e.message || 'Failed to load announcements');
      setItems([]);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!error) return;
    setToastType('error');
    setToastMessage(error);
  }, [error]);

  const onEdit = (it) => {
    setEditingId(Number(it.id));
    setHeadline(it.headline || '');
    setMessage(it.message || '');
    setCouponCode(it.coupon_code || '');
    setCtaText(it.cta_text || '');
    setCtaPath(it.cta_path || '/menu');
    setIsActive(Number(it.is_active) === 1);
    setSortOrder(Number(it.sort_order || 0));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!headline.trim()) return;

    setBusy(true);
    setError('');
    try {
      const payload = {
        headline: headline.trim(),
        message: message ? message.trim() : null,
        couponCode: couponCode ? couponCode.trim() : null,
        ctaText: ctaText ? ctaText.trim() : null,
        ctaPath: ctaPath ? ctaPath.trim() : '/menu',
        isActive,
        sortOrder,
      };

      if (editingId) {
        await api.systemAssistant.announcements.update(editingId, payload);
        setToastType('success');
        setToastMessage('Announcement updated.');
      } else {
        await api.systemAssistant.announcements.create(payload);
        setToastType('success');
        setToastMessage('Announcement created.');
      }

      await load();
      resetForm();
    } catch (e2) {
      setError(e2.message || 'Failed to save announcement');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (it) => {
    setBusy(true);
    setError('');
    try {
      await api.systemAssistant.announcements.update(it.id, {
        headline: it.headline,
        message: it.message,
        couponCode: it.coupon_code,
        ctaText: it.cta_text,
        ctaPath: it.cta_path,
        isActive: Number(it.is_active) !== 1,
        sortOrder: it.sort_order,
      });
      await load();
      setToastType('success');
      setToastMessage(Number(it.is_active) === 1 ? 'Announcement deactivated.' : 'Announcement activated.');
    } catch (e) {
      setError(e.message || 'Failed to update');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setPendingDeleteId(null);
    setBusy(true);
    setError('');
    try {
      await api.systemAssistant.announcements.remove(id);
      await load();
      if (editingId && String(editingId) === String(id)) resetForm();
      setToastType('success');
      setToastMessage('Announcement deleted.');
    } catch (e) {
      setError(e.message || 'Failed to delete');
      setToastType('error');
      setToastMessage(e.message || 'Failed to delete');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete announcement?"
        message="This announcement will be removed from the slider."
        confirmText="Delete"
        cancelText="Cancel"
        confirmType="danger"
        loading={busy}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => remove(pendingDeleteId)}
      />
      <Toast
        message={toastMessage}
        type={toastType}
        duration={2400}
        position="top-right"
        onClose={() => { setToastMessage(''); setError(''); }}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Home News</h1>
            <p className="text-sm text-slate-500 mt-1">
              Add slider messages for the top banner on Home.
            </p>
          </div>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border"
            style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#334155' }}
          >
            <i className="fas fa-bullhorn" style={{ color: BRAND }} />
            {loading ? 'Loading…' : `${items.length} item(s)`}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <form onSubmit={onSubmit} className="space-y-4 rounded-[22px] border border-slate-100 p-5 bg-slate-50">
            <h2 className="font-black text-slate-800 mb-2">Create / Edit</h2>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Headline</label>
              <input
                className={baseInput}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. New users get 50% OFF first order"
                disabled={busy}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Message (optional)</label>
              <textarea
                className={baseInput}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Short extra text shown in the banner (optional)"
                disabled={busy}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Coupon Code</label>
                <select
                  className={baseInput}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={busy}
                >
                  <option value="">No coupon</option>
                  {coupons.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Sort Order</label>
                <input
                  className={baseInput}
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  disabled={busy}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">CTA Text</label>
                <input
                  className={baseInput}
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Order now ->"
                  disabled={busy}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">CTA Path</label>
                <input
                  className={baseInput}
                  value={ctaPath}
                  onChange={(e) => setCtaPath(e.target.value)}
                  placeholder="/menu"
                  disabled={busy}
                />
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={busy}
              />
              Active (will show on Home)
            </label>

            <div className="flex gap-3 flex-wrap">
              <button
                type="submit"
                disabled={busy || !headline.trim()}
                className="flex-1 py-3.5 text-white font-black text-sm rounded-2xl transition-all disabled:opacity-60"
                style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 6px 20px ${BRAND}40` }}
              >
                {editingId ? 'Save Changes' : 'Add News'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={busy}
                  className="px-5 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <div className="rounded-[22px] border border-slate-100 p-5 bg-slate-50">
            <h2 className="font-black text-slate-800 mb-3">Existing News</h2>
            {loading ? (
              <div className="text-slate-500 text-sm">Loading…</div>
            ) : items.length === 0 ? (
              <div className="text-slate-500 text-sm">No announcements yet.</div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                {items.map((it) => (
                  <div key={it.id} className="p-4 rounded-2xl border border-slate-100 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black text-slate-800">{it.headline}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {it.coupon_code ? `Coupon: ${it.coupon_code}` : 'No coupon'}
                          {it.cta_text ? ` • CTA: ${it.cta_text}` : ''}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-2">Sort: {it.sort_order} • ID: {it.id}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-xs text-slate-700 font-bold">
                          <input
                            type="checkbox"
                            checked={Number(it.is_active) === 1}
                            onChange={() => toggleActive(it)}
                            disabled={busy}
                          />
                          Active
                        </label>
                        <button
                          type="button"
                          onClick={() => onEdit(it)}
                          disabled={busy}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(it.id)}
                          disabled={busy}
                          className="px-3 py-2 rounded-xl border border-red-200 text-xs font-bold text-red-500 hover:bg-red-50 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        Tip: Use System Assistant {'>'} Coupons to create new coupon codes used in the news banner.
        (Default coupons are already available: <code className="font-mono">FIRST50</code>, <code className="font-mono">FREEDEL</code>.)
      </div>
    </div>
  );
}

