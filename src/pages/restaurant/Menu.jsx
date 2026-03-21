import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';

const CATEGORY_OPTIONS = [
  { id: 'pizza',   label: 'Pizza',   emoji: '🍕' },
  { id: 'burger',  label: 'Burger',  emoji: '🍔' },
  { id: 'sushi',   label: 'Sushi',   emoji: '🍣' },
  { id: 'chinese', label: 'Chinese', emoji: '🥡' },
  { id: 'indian',  label: 'Indian',  emoji: '🍛' },
  { id: 'dessert', label: 'Dessert', emoji: '🍰' },
];

const baseInput = `w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white outline-none transition-all`;

function FocusInput({ className = '', style = {}, ...props }) {
  const [f, setF] = useState(false);
  return (
    <input
      {...props}
      className={`${baseInput} ${className}`}
      style={{ borderColor: f ? BRAND : undefined, boxShadow: f ? `0 0 0 3px ${BRAND}18` : undefined, ...style }}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
    />
  );
}

function FocusTextarea({ ...props }) {
  const [f, setF] = useState(false);
  return (
    <textarea
      {...props}
      className={`${baseInput} min-h-[90px] resize-none`}
      style={{ borderColor: f ? BRAND : undefined, boxShadow: f ? `0 0 0 3px ${BRAND}18` : undefined }}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
    />
  );
}

function FocusSelect({ children, value, onChange, required }) {
  const [f, setF] = useState(false);
  return (
    <div className="relative">
      <select
        value={value} onChange={onChange} required={required}
        className={`${baseInput} appearance-none pr-9 cursor-pointer`}
        style={{ borderColor: f ? BRAND : undefined, boxShadow: f ? `0 0 0 3px ${BRAND}18` : undefined }}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
      >
        {children}
      </select>
      <i className="fas fa-chevron-down text-[10px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <div
          className="w-10 h-6 rounded-full transition-all duration-200"
          style={{ background: checked ? BRAND : '#e2e8f0' }}
        />
        <div
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
          style={{ left: checked ? '22px' : '4px' }}
        />
      </div>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </label>
  );
}

function CategoryBadge({ category }) {
  const cat = CATEGORY_OPTIONS.find(c => c.id === category);
  if (!cat) return <span className="text-slate-400 text-sm">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
      {cat.emoji} {cat.label}
    </span>
  );
}

export default function RestaurantMenu() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', price: 0, image: '',
    category: '', prepTimeMinutes: 0, isPopular: false, isVegetarian: false,
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: '', description: '', price: 0, image: '', category: '', prepTimeMinutes: 0, isPopular: false, isVegetarian: false });
  };

  const load = async () => {
    setLoading(true); setError('');
    try {
      const data = await api.restaurant.menu.getAll();
      setItems(data);
    } catch (e) {
      setError(e.message || 'Failed to load menu');
      setItems([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const canSubmit = useMemo(() =>
    form.name.trim() && Number(form.price) >= 0 && String(form.category || '').trim(),
    [form.name, form.price, form.category]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true); setError('');
    try {
      if (editingId) await api.restaurant.menu.update(editingId, form);
      else           await api.restaurant.menu.add(form);
      await load(); resetForm();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const onPickImage = async (file) => {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const data = await api.restaurant.menu.uploadImage(file);
      setForm(f => ({ ...f, image: data?.url || '' }));
    } catch (e) {
      setError(e.message || 'Image upload failed');
    } finally { setUploading(false); }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || '', description: item.description || '',
      price: item.price ?? 0, image: item.image || '',
      category: item.category || '', prepTimeMinutes: item.prepTimeMinutes ?? 0,
      isPopular: !!item.isPopular, isVegetarian: !!item.isVegetarian,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    setSaving(true); setError('');
    try {
      await api.restaurant.menu.remove(id);
      setItems(prev => prev.filter(x => x.id !== id));
      if (editingId === id) resetForm();
    } catch (e) {
      setError(e.message || 'Delete failed');
    } finally { setSaving(false); setDeleteId(null); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        * { font-family: 'Sora', sans-serif; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn .25s ease both; }
      `}</style>

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between sticky top-0 z-10" style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Manage Menu</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">{items.length} item{items.length !== 1 ? 's' : ''} on your menu</p>
        </div>
        {editingId && (
          <button
            onClick={resetForm}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border-2 transition-all"
            style={{ borderColor: BRAND, color: BRAND }}
          >
            <i className="fas fa-xmark text-xs" /> Cancel editing
          </button>
        )}
      </header>

      <div className="p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">

        {/* ── FORM ── */}
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* form header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${BRAND}15` }}>
              <i className="fas fa-utensils text-sm" style={{ color: BRAND }} />
            </div>
            <h2 className="text-base font-black text-slate-800">
              {editingId ? 'Update food item' : 'Add new food item'}
            </h2>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                <i className="fas fa-exclamation-circle flex-shrink-0" /> {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Item Name">
                <FocusInput type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Margherita Pizza" />
              </Field>

              <Field label="Price (RWF)">
                <FocusInput type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} min={0} required placeholder="0" />
              </Field>

              <Field label="Category">
                <FocusSelect value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                  <option value="">Select a category</option>
                  {CATEGORY_OPTIONS.map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                  ))}
                </FocusSelect>
              </Field>

              <Field label="Prep Time (minutes)">
                <FocusInput type="number" min={0} value={Number(form.prepTimeMinutes || 0)} onChange={e => setForm({ ...form, prepTimeMinutes: Number(e.target.value) })} placeholder="0" />
              </Field>

              <Field label="Image URL">
                <FocusInput type="text" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
              </Field>

              <Field label="Upload Image">
                <label
                  className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-orange-300 transition-colors bg-white"
                  style={{ borderColor: uploading ? BRAND : undefined }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${BRAND}12` }}>
                    <i className="fas fa-upload text-xs" style={{ color: BRAND }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700">{uploading ? 'Uploading…' : 'Choose file'}</p>
                    <p className="text-xs text-slate-400">PNG, JPG, WEBP · max 3 MB</p>
                  </div>
                  {uploading && <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin flex-shrink-0" style={{ borderColor: BRAND }} />}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                    onChange={e => onPickImage(e.target.files?.[0] || null)} disabled={uploading} />
                </label>
              </Field>

              <div className="md:col-span-2">
                <Field label="Description">
                  <FocusTextarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe this item…" />
                </Field>
              </div>

              {/* image preview */}
              {form.image && (
                <div className="md:col-span-2">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <img src={form.image} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">Image Preview</p>
                      <p className="text-[10px] text-slate-400">This will appear on customer pages</p>
                    </div>
                    <button type="button" onClick={() => setForm(f => ({ ...f, image: '' }))}
                      className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
                      <i className="fas fa-xmark text-xs" />
                    </button>
                  </div>
                </div>
              )}

              {/* toggles */}
              <div className="md:col-span-2 flex flex-wrap gap-6 pt-1">
                <Toggle checked={form.isPopular} onChange={e => setForm({ ...form, isPopular: e.target.checked })} label="🔥 Popular item" />
                <Toggle checked={form.isVegetarian} onChange={e => setForm({ ...form, isVegetarian: e.target.checked })} label="🥗 Vegetarian" />
              </div>
            </div>

            <div className="pt-1 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving || uploading || !canSubmit}
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-black text-sm rounded-2xl transition-all disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg,${BRAND},${BRAND_D})`,
                  boxShadow: `0 4px 14px ${BRAND}40`,
                }}
              >
                {uploading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Uploading…</>
                : saving    ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
                : editingId ? <><i className="fas fa-pen text-xs" /> Update Item</>
                :             <><i className="fas fa-plus text-xs" /> Add Item</>}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm}
                  className="px-5 py-3 text-sm font-bold rounded-2xl border-2 border-slate-200 text-slate-500 hover:border-slate-300 transition-all">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>

        {/* ── MENU LIST ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${BRAND}15` }}>
                <i className="fas fa-list text-sm" style={{ color: BRAND }} />
              </div>
              <h2 className="text-base font-black text-slate-800">Your menu items</h2>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-500">{items.length} total</span>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center gap-3 text-slate-400">
              <span className="w-8 h-8 border-2 border-slate-200 border-t-orange-400 rounded-full animate-spin" />
              <span className="text-sm font-medium">Loading menu…</span>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 flex flex-col items-center gap-3 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">🍽️</div>
              <p className="font-bold text-slate-500">No menu items yet</p>
              <p className="text-sm text-slate-400">Add your first item using the form above.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {items.map(item => (
                <div key={item.id} className="fade-in flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
                  {/* image */}
                  <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                    {item.image
                      ? <img src={item.image} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                    }
                  </div>

                  {/* info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                      {item.isPopular    && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-100">🔥 Popular</span>}
                      {item.isVegetarian && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">🥗 Veg</span>}
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{item.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <CategoryBadge category={item.category} />
                      {item.prepTimeMinutes > 0 && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <i className="fas fa-clock" /> {item.prepTimeMinutes} min
                        </span>
                      )}
                    </div>
                  </div>

                  {/* price */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <span className="text-base font-black text-slate-800">
                      {Number(item.price || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">RWF</span>
                  </div>

                  {/* actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(item)}
                      className="w-9 h-9 rounded-xl border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:border-orange-300 hover:text-orange-500 transition-all"
                      title="Edit"
                    >
                      <i className="fas fa-pen text-xs" />
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="w-9 h-9 rounded-xl border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Delete"
                    >
                      <i className="fas fa-trash text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 fade-in">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-trash text-red-500 text-lg" />
            </div>
            <h3 className="text-lg font-black text-slate-800 text-center mb-2">Delete item?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">This action cannot be undone. The item will be permanently removed from your menu.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 text-sm font-bold rounded-2xl border-2 border-slate-200 text-slate-600 hover:border-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => remove(deleteId)}
                disabled={saving}
                className="flex-1 py-3 text-sm font-bold rounded-2xl text-white transition flex items-center justify-center gap-2"
                style={{ background: '#ef4444', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}
              >
                {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <i className="fas fa-trash text-xs" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}