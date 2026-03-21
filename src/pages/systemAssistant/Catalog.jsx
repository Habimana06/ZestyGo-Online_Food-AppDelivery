import { useEffect, useState } from 'react';
import { api } from '../../api';

const BRAND = '#F56230';
const BRAND_D = '#d94e22';

const baseInput = `w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white outline-none transition-all`;

function Chip({ children }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
      style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#334155' }}
    >
      {children}
    </span>
  );
}

export default function SystemAssistantCatalog() {
  const [cuisines, setCuisines] = useState([]);
  const [foodTypes, setFoodTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newCuisine, setNewCuisine] = useState('');
  const [newFoodTypeLabel, setNewFoodTypeLabel] = useState('');
  const [newFoodTypeSlug, setNewFoodTypeSlug] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [c, f] = await Promise.all([api.catalog.getCuisines(), api.catalog.getFoodTypes()]);
      setCuisines(Array.isArray(c) ? c : []);
      setFoodTypes(Array.isArray(f) ? f : []);
    } catch (e) {
      setError(e.message || 'Failed to load catalog');
      setCuisines([]);
      setFoodTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addCuisine = async (e) => {
    e.preventDefault();
    if (!newCuisine.trim()) return;
    setBusy(true);
    try {
      await api.systemAssistant.catalog.addCuisine(newCuisine.trim());
      setNewCuisine('');
      await load();
    } catch (err) {
      setError(err.message || 'Failed to add cuisine');
    } finally {
      setBusy(false);
    }
  };

  const addFoodType = async (e) => {
    e.preventDefault();
    if (!newFoodTypeLabel.trim()) return;
    setBusy(true);
    try {
      await api.systemAssistant.catalog.addFoodType({
        label: newFoodTypeLabel.trim(),
        slug: newFoodTypeSlug.trim() || undefined,
      });
      setNewFoodTypeLabel('');
      setNewFoodTypeSlug('');
      await load();
    } catch (err) {
      setError(err.message || 'Failed to add food type');
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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Catalog</h1>
            <p className="text-sm text-slate-500 mt-1">Add new food types and cuisines for customer filters.</p>
          </div>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border"
            style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#334155' }}
          >
            <i className="fas fa-utensils" style={{ color: BRAND }} />
            {loading ? 'Loading…' : `${cuisines.length} cuisines • ${foodTypes.length} types`}
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <div className="rounded-[22px] border border-slate-100 p-5 bg-slate-50">
            <h2 className="font-black text-slate-800 mb-2">Add Cuisine</h2>
            <form onSubmit={addCuisine} className="space-y-4">
              <input
                className={baseInput}
                value={newCuisine}
                onChange={(e) => setNewCuisine(e.target.value)}
                placeholder="e.g. Thai"
                disabled={busy}
              />
              <button
                type="submit"
                disabled={busy || !newCuisine.trim()}
                className="w-full py-3.5 text-white font-black text-sm rounded-2xl transition-all disabled:opacity-60"
                style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 6px 20px ${BRAND}40` }}
              >
                {busy ? 'Adding…' : 'Add Cuisine'}
              </button>
            </form>
          </div>

          <div className="rounded-[22px] border border-slate-100 p-5 bg-slate-50">
            <h2 className="font-black text-slate-800 mb-2">Add Food Type</h2>
            <form onSubmit={addFoodType} className="space-y-4">
              <input
                className={baseInput}
                value={newFoodTypeLabel}
                onChange={(e) => setNewFoodTypeLabel(e.target.value)}
                placeholder="e.g. Mexican"
                disabled={busy}
              />
              <input
                className={baseInput}
                value={newFoodTypeSlug}
                onChange={(e) => setNewFoodTypeSlug(e.target.value)}
                placeholder="Slug (optional) e.g. mexican"
                disabled={busy}
              />
              <button
                type="submit"
                disabled={busy || !newFoodTypeLabel.trim()}
                className="w-full py-3.5 text-white font-black text-sm rounded-2xl transition-all disabled:opacity-60"
                style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 6px 20px ${BRAND}40` }}
              >
                {busy ? 'Adding…' : 'Add Food Type'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          <div>
            <h2 className="font-black text-slate-800 mb-3">Cuisines</h2>
            <div className="flex flex-wrap gap-2">
              {loading ? (
                <span className="text-slate-500 text-sm">Loading…</span>
              ) : cuisines.length ? (
                cuisines.map((c) => <Chip key={c}>{c}</Chip>)
              ) : (
                <span className="text-slate-500 text-sm">No cuisines yet.</span>
              )}
            </div>
          </div>
          <div>
            <h2 className="font-black text-slate-800 mb-3">Food Types</h2>
            <div className="flex flex-wrap gap-2">
              {loading ? (
                <span className="text-slate-500 text-sm">Loading…</span>
              ) : foodTypes.length ? (
                foodTypes.map((t) => <Chip key={t.slug}>{t.label}</Chip>)
              ) : (
                <span className="text-slate-500 text-sm">No food types yet.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

