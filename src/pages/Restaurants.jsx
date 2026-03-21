import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';
const CUSTOMER_HERO_BG = 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1600&auto=format&fit=crop&q=80';

const SORT_OPTIONS = [
  { value: 'rating',   label: 'Top Rated',      icon: 'fa-star'          },
  { value: 'delivery', label: 'Fastest',         icon: 'fa-bolt'          },
  { value: 'minOrder', label: 'Lowest Min Order', icon: 'fa-coins'        },
];

/* ── Animated count badge ── */
function CountBadge({ count }) {
  return (
    <span
      className="inline-flex items-center justify-center font-black text-xs text-white rounded-full px-2.5 py-0.5 ml-2"
      style={{ background: BRAND, fontFamily: 'Sora,sans-serif', minWidth: 28 }}
    >
      {count}
    </span>
  );
}

/* ── Filter pill button ── */
function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 whitespace-nowrap"
      style={{
        background: active ? BRAND : 'white',
        color: active ? '#fff' : '#475569',
        borderColor: active ? BRAND : '#e2e8f0',
        boxShadow: active ? `0 4px 12px ${BRAND}33` : 'none',
      }}
    >
      {children}
    </button>
  );
}

/* ── Restaurant card (matches Home style) ── */
function RestaurantCard({ r, index }) {
  const [hov, setHov] = useState(false);

  return (
    <Link
      to={`/restaurant/${r.id}`}
      className="bg-white rounded-[20px] overflow-hidden border border-slate-100 block"
      style={{
        transition: 'transform .3s, box-shadow .3s',
        transform: hov ? 'translateY(-6px)' : 'none',
        boxShadow: hov ? '0 20px 50px rgba(0,0,0,.1)' : '0 2px 12px rgba(0,0,0,.05)',
        animationDelay: `${index * 60}ms`,
        animation: 'cardIn .4s ease both',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={r.image}
          alt={r.name}
          className="w-full h-full object-cover"
          style={{ transition: 'transform .5s', transform: hov ? 'scale(1.08)' : 'scale(1)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />

        {/* badges row */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="text-white text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: BRAND }}>
            {r.badge || 'Popular'}
          </span>
          {r.isApproved && (
            <span className="text-white text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-600 flex items-center gap-1">
              <i className="fas fa-check-circle text-[8px]" /> Verified
            </span>
          )}
        </div>

        {r.rating >= 4.5 && (
          <span className="absolute top-3 right-3 bg-yellow-400 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            ⭐ Top
          </span>
        )}

        {/* open/closed overlay bottom */}
        {r.isOpen === false && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white/90 text-slate-700 font-bold text-xs px-4 py-2 rounded-full">
              Currently Closed
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Sora,sans-serif' }}>{r.name}</h3>
          {r.isOpen !== false
            ? <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0">Open</span>
            : <span className="text-[10px] font-bold text-red-400 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full flex-shrink-0">Closed</span>}
        </div>
        <p className="text-slate-400 text-xs mb-4">{r.cuisine}</p>
        <div className="flex gap-3 text-xs text-slate-500 flex-wrap">
          <span><i className="fas fa-star text-yellow-400 mr-1" /><strong className="text-slate-700">{r.rating}</strong></span>
          <span><i className="fas fa-clock mr-1 text-slate-300" />{r.deliveryTime}</span>
          <span><i className="fas fa-coins mr-1 text-slate-300" />Min {Number(r.minOrder || 0).toLocaleString()} RWF</span>
        </div>
        {r.deliveryFee != null && (
          <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <i className="fas fa-truck" />
            Delivery: {Number(r.deliveryFee).toLocaleString()} RWF
          </p>
        )}
      </div>
    </Link>
  );
}

/* ── Empty state ── */
function EmptyState({ onReset }) {
  return (
    <div className="text-center py-24 px-4">
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
        style={{ background: `${BRAND}10` }}
      >
        <i className="fas fa-search text-4xl" style={{ color: BRAND }} />
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-2" style={{ fontFamily: 'Sora,sans-serif' }}>
        No restaurants found
      </h2>
      <p className="text-slate-500 mb-8 max-w-xs mx-auto">
        Try adjusting your search or filters to discover more restaurants.
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
export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch]           = useState('');
  const [cuisine, setCuisine]         = useState('');
  const [sort, setSort]               = useState('rating');
  const [openOnly, setOpenOnly]       = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [cuisines, setCuisines] = useState([]);
  const [loading, setLoading]         = useState(true);
  const inputRef                      = useRef(null);

  useEffect(() => {
    api.restaurants.getAll()
      .then(setRestaurants)
      .catch(() => setRestaurants([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.catalog.getCuisines()
      .then((list) => setCuisines(Array.isArray(list) ? list : []))
      .catch(() => setCuisines([]));
  }, []);

  const filtered = restaurants
    .filter(r => {
      const q = search.toLowerCase();
      const matchSearch  = !search   || r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q);
      const matchCuisine = !cuisine  || r.cuisine.includes(cuisine);
      const matchOpen    = !openOnly || r.isOpen !== false;
      const matchVerif   = !verifiedOnly || r.isApproved;
      return matchSearch && matchCuisine && matchOpen && matchVerif;
    })
    .sort((a, b) => {
      if (sort === 'rating')   return b.rating - a.rating;
      if (sort === 'delivery') return parseInt(a.deliveryTime) - parseInt(b.deliveryTime);
      if (sort === 'minOrder') return (a.minOrder || 0) - (b.minOrder || 0);
      return 0;
    });

  const reset = () => { setSearch(''); setCuisine(''); setOpenOnly(false); setVerifiedOnly(false); setSort('rating'); };
  const hasFilters = search || cuisine || openOnly || verifiedOnly;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        @keyframes cardIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .skeleton {
          background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
          background-size: 800px 100%;
          animation: shimmer 1.4s infinite;
        }
      `}</style>

      {/* ── HERO BANNER ── */}
      <section
        className="relative overflow-hidden py-20"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(30,41,59,.95) 0%, rgba(51,65,85,.92) 60%, rgba(30,41,59,.95) 100%), url(${CUSTOMER_HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* decorative blobs */}
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: BRAND }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-5 blur-3xl pointer-events-none" style={{ background: BRAND }} />

        <div className="max-w-[1200px] mx-auto px-5 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-5 border"
                style={{ color: BRAND, background: `${BRAND}15`, borderColor: `${BRAND}30` }}>
                <span className="w-2 h-2 rounded-full" style={{ background: BRAND, animation: 'pulse 2s infinite' }} />
                🍴 {restaurants.length}+ restaurants in Kigali
              </span>
              <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight" style={{ fontFamily: 'Sora,sans-serif' }}>
                Discover the Best<br />
                <span style={{ color: BRAND }}>Restaurants</span>
              </h1>
              <p className="text-white/60 text-lg leading-relaxed max-w-md">
                Browse top-rated restaurants, filter by cuisine, and order your favourite meals in minutes.
              </p>
            </div>

            {/* hero stat cards */}
            <div className="hidden lg:grid grid-cols-3 gap-4">
              {[
                { icon: 'fa-store',     val: `${restaurants.length || '50'}+`, label: 'Restaurants' },
                { icon: 'fa-utensils', val: '12+',  label: 'Cuisines'    },
                { icon: 'fa-bolt',     val: '30min', label: 'Avg Delivery' },
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
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100" style={{ boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
        <div className="max-w-[1200px] mx-auto px-5 py-4">
          <div className="flex flex-wrap gap-3 items-center">

            {/* search */}
            <div
              className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 flex-1 min-w-[200px] border border-slate-200 transition-all"
              style={{ maxWidth: 340 }}
            >
              <i className="fas fa-search text-sm flex-shrink-0" style={{ color: BRAND }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search restaurants or cuisine…"
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

            {/* cuisine select */}
            <div className="relative">
              <select
                value={cuisine}
                onChange={e => setCuisine(e.target.value)}
                className="appearance-none pl-4 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-slate-50 outline-none cursor-pointer"
                style={{ minWidth: 150 }}
              >
                <option value="">All Cuisines</option>
                {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <i className="fas fa-chevron-down text-[10px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* sort pills */}
            <div className="flex gap-2 flex-wrap">
              {SORT_OPTIONS.map(o => (
                <Pill key={o.value} active={sort === o.value} onClick={() => setSort(o.value)}>
                  <i className={`fas ${o.icon} text-[10px]`} />
                  {o.label}
                </Pill>
              ))}
            </div>

            {/* toggle pills */}
            <Pill active={openOnly} onClick={() => setOpenOnly(v => !v)}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              Open Now
            </Pill>
            <Pill active={verifiedOnly} onClick={() => setVerifiedOnly(v => !v)}>
              <i className="fas fa-check-circle text-[10px]" />
              Verified
            </Pill>

            {/* clear */}
            {hasFilters && (
              <button
                onClick={reset}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition ml-auto"
              >
                <i className="fas fa-rotate-left text-[10px]" /> Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── RESULTS ── */}
      <section className="max-w-[1200px] mx-auto px-5 pb-24 pt-10">

        {/* results header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-800" style={{ fontFamily: 'Sora,sans-serif' }}>
              {hasFilters ? 'Search Results' : 'All Restaurants'}
              <CountBadge count={filtered.length} />
            </h2>
            {hasFilters && (
              <p className="text-sm text-slate-400 mt-1">
                Showing {filtered.length} of {restaurants.length} restaurants
              </p>
            )}
          </div>

          {/* view active filters summary */}
          {(cuisine || openOnly || verifiedOnly) && (
            <div className="flex flex-wrap gap-2">
              {cuisine && (
                <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border"
                  style={{ color: BRAND, borderColor: `${BRAND}30`, background: `${BRAND}08` }}>
                  {cuisine}
                  <button onClick={() => setCuisine('')}><i className="fas fa-times text-[9px]" /></button>
                </span>
              )}
              {openOnly && (
                <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border"
                  style={{ color: BRAND, borderColor: `${BRAND}30`, background: `${BRAND}08` }}>
                  Open Now
                  <button onClick={() => setOpenOnly(false)}><i className="fas fa-times text-[9px]" /></button>
                </span>
              )}
              {verifiedOnly && (
                <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border"
                  style={{ color: BRAND, borderColor: `${BRAND}30`, background: `${BRAND}08` }}>
                  Verified Only
                  <button onClick={() => setVerifiedOnly(false)}><i className="fas fa-times text-[9px]" /></button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* skeleton loader */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-[20px] overflow-hidden border border-slate-100">
                <div className="skeleton h-44 w-full" />
                <div className="p-5 space-y-3">
                  <div className="skeleton h-4 w-3/4 rounded-full" />
                  <div className="skeleton h-3 w-1/2 rounded-full" />
                  <div className="flex gap-3">
                    <div className="skeleton h-3 w-12 rounded-full" />
                    <div className="skeleton h-3 w-12 rounded-full" />
                    <div className="skeleton h-3 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onReset={reset} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((r, i) => <RestaurantCard key={r.id} r={r} index={i} />)}
          </div>
        )}
      </section>

      {/* ── CTA BANNER ── */}
      {!loading && filtered.length > 0 && (
        <section className="pb-20">
          <div className="max-w-[1200px] mx-auto px-5">
            <div
              className="rounded-[28px] p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
              style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}
            >
              <div className="absolute w-64 h-64 rounded-full bg-white/5 -top-16 -right-16 pointer-events-none" />
              <div className="absolute w-40 h-40 rounded-full bg-white/5 -bottom-10 right-40 pointer-events-none" />
              <div className="relative z-10 text-center md:text-left">
                <h3 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Sora,sans-serif' }}>
                  Can't find what you're looking for?
                </h3>
                <p className="text-white/70">Browse our full menu with all dishes and categories.</p>
              </div>
              <Link
                to="/menu"
                className="relative z-10 flex items-center gap-2 bg-white px-7 py-3.5 rounded-xl font-bold text-sm flex-shrink-0 hover:bg-slate-50 transition"
                style={{ color: BRAND }}
              >
                <i className="fas fa-utensils text-xs" /> Explore Menu
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}