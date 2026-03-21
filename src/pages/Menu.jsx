import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';
const CUSTOMER_HERO_BG = 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1600&auto=format&fit=crop&q=80';

const SLUG_TO_ICON = {
  pizza: 'fa-pizza-slice',
  burger: 'fa-hamburger',
  sushi: 'fa-fish',
  chinese: 'fa-bowl-rice',
  indian: 'fa-pepper-hot',
  mexican: 'fa-taco',
  dessert: 'fa-ice-cream',
};

const FALLBACK_FOOD_TYPES = [
  { id: 'pizza', name: 'Pizza', icon: 'fa-pizza-slice' },
  { id: 'burger', name: 'Burgers', icon: 'fa-hamburger' },
  { id: 'sushi', name: 'Sushi', icon: 'fa-fish' },
  { id: 'chinese', name: 'Chinese', icon: 'fa-bowl-rice' },
  { id: 'indian', name: 'Indian', icon: 'fa-pepper-hot' },
  { id: 'mexican', name: 'Mexican', icon: 'fa-taco' },
  { id: 'dessert', name: 'Desserts', icon: 'fa-ice-cream' },
];

/* ── Category pill ── */
function CategoryPill({ cat, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-5 py-2.5 rounded-full border font-bold text-sm transition-all duration-200 whitespace-nowrap"
      style={{
        background:   active ? BRAND : 'white',
        color:        active ? '#fff' : '#475569',
        borderColor:  active ? BRAND : '#e2e8f0',
        boxShadow:    active ? `0 4px 14px ${BRAND}33` : 'none',
      }}
    >
      <i className={`fas ${cat.icon} text-xs`} />
      {cat.name}
    </button>
  );
}

/* ── Menu item card ── */
function MenuCard({ item, restaurant, onAdd, added }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      className="bg-white rounded-[20px] overflow-hidden border border-slate-100 flex transition-all duration-300"
      style={{
        transform:  hov ? 'translateY(-4px)' : 'none',
        boxShadow:  hov ? '0 20px 50px rgba(0,0,0,.1)' : '0 2px 12px rgba(0,0,0,.05)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* image */}
      <div className="w-36 flex-shrink-0 relative overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
          style={{ transition: 'transform .5s', transform: hov ? 'scale(1.08)' : 'scale(1)' }}
        />
        {item.isVegetarian && (
          <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center"
            title="Vegetarian">
            <i className="fas fa-leaf text-white" style={{ fontSize: 8 }} />
          </span>
        )}
      </div>

      {/* content */}
      <div className="p-4 flex-1 flex flex-col min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-slate-800 text-sm leading-snug" style={{ fontFamily: 'Sora,sans-serif' }}>
            {item.name}
          </h3>
        </div>

        <p className="text-xs text-slate-400 mb-2 line-clamp-2 leading-relaxed">{item.description}</p>

        {/* restaurant tag */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
            <i className="fas fa-store" style={{ color: BRAND }} />
            {item.restaurantName || restaurant?.name || 'Unknown'}
          </span>
          {(item.restaurantIsApproved ?? restaurant?.isApproved) && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-bold">
              <i className="fas fa-check-circle" style={{ fontSize: 7 }} /> Verified
            </span>
          )}
        </div>

        {/* price + actions */}
        <div className="mt-auto flex items-center justify-between gap-2">
          <div>
            <span className="text-base font-black" style={{ color: BRAND, fontFamily: 'Sora,sans-serif' }}>
              {Number(item.price).toLocaleString()} RWF
            </span>
            {Number(item.prepTimeMinutes || 0) > 0 && (
              <span className="block text-[10px] text-slate-400 mt-0.5">
                <i className="fas fa-clock mr-0.5" />{item.prepTimeMinutes} min prep
              </span>
            )}
          </div>
          <button
            onClick={onAdd}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all duration-200"
            style={{
              background: added ? '#22c55e' : `linear-gradient(135deg,${BRAND},${BRAND_D})`,
              boxShadow:  added ? '0 4px 12px rgba(34,197,94,.35)' : `0 4px 12px ${BRAND}33`,
              transform:  hov ? 'scale(1.1)' : 'scale(1)',
            }}
            title="Add to cart"
          >
            <i className={`fas ${added ? 'fa-check' : 'fa-plus'} text-xs`} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({ onReset }) {
  return (
    <div className="text-center py-24">
      <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
        style={{ background: `${BRAND}10` }}>
        <i className="fas fa-search text-4xl" style={{ color: BRAND }} />
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-2" style={{ fontFamily: 'Sora,sans-serif' }}>
        No items found
      </h2>
      <p className="text-slate-500 mb-8 max-w-xs mx-auto">
        Try adjusting your search or filters to discover more dishes.
      </p>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 px-7 py-3 text-white font-bold text-sm rounded-xl"
        style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 6px 20px ${BRAND}33` }}
      >
        <i className="fas fa-rotate-left text-xs" /> Reset filters
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════════════ */
export default function Menu() {
  const navigate = useNavigate();
  const [searchParams]  = useSearchParams();
  const categoryParam   = searchParams.get('category') || 'all';
  const restaurantParam = searchParams.get('restaurantId') || '';

  const [items, setItems]           = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [category, setCategory]     = useState(categoryParam);
  const [search, setSearch]         = useState('');
  const [vegetarian, setVegetarian] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [addedIds, setAddedIds]     = useState({});
  const [foodTypes, setFoodTypes] = useState([]);
  const [loginRequiredOpen, setLoginRequiredOpen] = useState(false);

  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      api.menu.getAll().catch(() => []),
      api.restaurants.getAll().catch(() => []),
      api.catalog.getFoodTypes().catch(() => []),
    ]).then(([menuData, restData, foodTypesData]) => {
      setItems(menuData);
      setRestaurants(restData);
      setFoodTypes(Array.isArray(foodTypesData) ? foodTypesData : []);
      setLoading(false);
    });
  }, []);

  useEffect(() => { setCategory(categoryParam); }, [categoryParam]);

  const handleAdd = (item) => {
    if (!user || user.role !== 'customer') {
      setLoginRequiredOpen(true);
      return;
    }
    addToCart({ id: item.id, name: item.name, price: item.price, image: item.image, restaurantId: item.restaurantId });
    setAddedIds(p => ({ ...p, [item.id]: true }));
    setTimeout(() => setAddedIds(p => ({ ...p, [item.id]: false })), 1200);
  };

  const reset = () => { setSearch(''); setCategory('all'); setVegetarian(false); };

  const filtered = items.filter(item => {
    const matchCat      = category === 'all' || item.category === category;
    const matchRest     = !restaurantParam || String(item.restaurantId) === String(restaurantParam);
    const matchSearch   = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.description?.toLowerCase().includes(search.toLowerCase());
    const matchVeg      = !vegetarian || item.isVegetarian;
    return matchCat && matchRest && matchSearch && matchVeg;
  });

  const getRestaurant = (id) => restaurants.find(r => r.id === id);
  const hasFilters = search || category !== 'all' || vegetarian;

  return (
    <>
      <Modal
        open={loginRequiredOpen}
        title="Login First to Order"
        onClose={() => setLoginRequiredOpen(false)}
        footer={(
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setLoginRequiredOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold text-sm"
            >
              Later
            </button>
            <button
              type="button"
              onClick={() => navigate('/login?redirect=/menu')}
              className="px-4 py-2 rounded-xl text-white font-bold text-sm"
              style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}
            >
              Login
            </button>
          </div>
        )}
      >
        <p className="text-slate-600 text-sm leading-relaxed">
          Please login as a customer first to make an order.
        </p>
      </Modal>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        @keyframes cardIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .skeleton {
          background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
          background-size: 800px 100%;
          animation: shimmer 1.4s infinite;
        }
        .menu-card { animation: cardIn .4s ease both; }
      `}</style>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden py-20"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(30,41,59,.95) 0%, rgba(51,65,85,.92) 60%, rgba(30,41,59,.95) 100%), url(${CUSTOMER_HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: BRAND }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-5 blur-3xl pointer-events-none" style={{ background: BRAND }} />

        <div className="max-w-[1200px] mx-auto px-5 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-5 border"
                style={{ color: BRAND, background: `${BRAND}15`, borderColor: `${BRAND}30` }}>
                <span className="w-2 h-2 rounded-full" style={{ background: BRAND, animation: 'pulse 2s infinite' }} />
                🍽️ Fresh dishes across Kigali
              </span>
              <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight" style={{ fontFamily: 'Sora,sans-serif' }}>
                Explore Our<br />
                <span style={{ color: BRAND }}>Full Menu</span>
              </h1>
              <p className="text-white/60 text-lg leading-relaxed max-w-md">
                Browse hundreds of dishes from your favourite restaurants — filtered just the way you like it.
              </p>
            </div>

            {/* stat cards */}
            <div className="hidden lg:grid grid-cols-3 gap-4">
              {[
                { icon: 'fa-utensils',   val: `${items.length || '200'}+`, label: 'Dishes'       },
                { icon: 'fa-store',      val: `${restaurants.length || '50'}+`, label: 'Restaurants' },
                { icon: 'fa-leaf',       val: '40+',  label: 'Veg Options'  },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-5 text-center border border-white/10"
                  style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${BRAND}20` }}>
                    <i className={`fas ${s.icon} text-sm`} style={{ color: BRAND }} />
                  </div>
                  <div className="text-2xl font-black text-white mb-0.5" style={{ fontFamily: 'Sora,sans-serif' }}>{s.val}</div>
                  <div className="text-white/40 text-xs">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STICKY FILTERS ── */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
        <div className="max-w-[1200px] mx-auto px-5 py-4">
          <div className="flex flex-wrap gap-3 items-center">

            {/* search */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200 flex-1 min-w-[200px]"
              style={{ maxWidth: 340 }}>
              <i className="fas fa-search text-sm flex-shrink-0" style={{ color: BRAND }} />
              <input
                type="text"
                placeholder="Search dishes or descriptions…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 border-none outline-none text-sm text-slate-700 bg-transparent"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 transition">
                  <i className="fas fa-times text-xs" />
                </button>
              )}
            </div>

            {/* vegetarian toggle */}
            <button
              onClick={() => setVegetarian(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all duration-200"
              style={{
                background:  vegetarian ? '#22c55e' : 'white',
                color:       vegetarian ? '#fff' : '#475569',
                borderColor: vegetarian ? '#22c55e' : '#e2e8f0',
                boxShadow:   vegetarian ? '0 4px 12px rgba(34,197,94,.3)' : 'none',
              }}
            >
              <i className="fas fa-leaf text-xs" />
              Vegetarian
            </button>

            {/* clear */}
            {hasFilters && (
              <button onClick={reset} className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition ml-auto">
                <i className="fas fa-rotate-left text-[10px]" /> Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CATEGORIES SCROLL ── */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-[1200px] mx-auto px-5 py-4">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'all', name: 'All', icon: 'fa-th-large' },
              ...(foodTypes.length
                ? foodTypes.map((t) => ({
                  id: t.slug,
                  name: t.label,
                  icon: SLUG_TO_ICON[t.slug] || 'fa-utensils',
                }))
                : FALLBACK_FOOD_TYPES),
            ].map(c => (
              <CategoryPill
                key={c.id}
                cat={c}
                active={category === c.id}
                onClick={() => setCategory(c.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── RESULTS ── */}
      <section className="max-w-[1200px] mx-auto px-5 pb-24 pt-10">

        {/* results header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center" style={{ fontFamily: 'Sora,sans-serif' }}>
              {category === 'all'
                ? 'All Dishes'
                : (foodTypes.find((t) => t.slug === category)?.label || FALLBACK_FOOD_TYPES.find((f) => f.id === category)?.name || category)}
              <span className="inline-flex items-center justify-center font-black text-xs text-white rounded-full px-2.5 py-0.5 ml-2"
                style={{ background: BRAND, minWidth: 28 }}>
                {filtered.length}
              </span>
            </h2>
            {hasFilters && (
              <p className="text-sm text-slate-400 mt-1">
                Showing {filtered.length} of {items.length} dishes
              </p>
            )}
          </div>

          {/* active filter tags */}
          <div className="flex flex-wrap gap-2">
            {vegetarian && (
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border"
                style={{ color: '#22c55e', borderColor: '#22c55e40', background: '#22c55e08' }}>
                <i className="fas fa-leaf text-[9px]" /> Vegetarian
                <button onClick={() => setVegetarian(false)}><i className="fas fa-times text-[9px]" /></button>
              </span>
            )}
            {search && (
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border"
                style={{ color: BRAND, borderColor: `${BRAND}30`, background: `${BRAND}08` }}>
                "{search}"
                <button onClick={() => setSearch('')}><i className="fas fa-times text-[9px]" /></button>
              </span>
            )}
          </div>
        </div>

        {/* skeleton loader */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-[20px] overflow-hidden border border-slate-100 flex h-36">
                <div className="skeleton w-36 flex-shrink-0" />
                <div className="p-4 flex-1 space-y-3">
                  <div className="skeleton h-4 w-3/4 rounded-full" />
                  <div className="skeleton h-3 w-full rounded-full" />
                  <div className="skeleton h-3 w-2/3 rounded-full" />
                  <div className="skeleton h-4 w-1/3 rounded-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onReset={reset} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item, i) => (
              <div key={item.id} className="menu-card" style={{ animationDelay: `${i * 50}ms` }}>
                <MenuCard
                  item={item}
                  restaurant={getRestaurant(item.restaurantId)}
                  onAdd={() => handleAdd(item)}
                  added={!!addedIds[item.id]}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}