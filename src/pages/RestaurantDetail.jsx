import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';

/* ── Menu item row ── */
function MenuItem({ item, onAdd, added }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      className="flex gap-5 p-4 rounded-2xl transition-all duration-200"
      style={{ background: hov ? `${BRAND}04` : 'transparent', border: hov ? `1px solid ${BRAND}15` : '1px solid transparent' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* image */}
      <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500"
          style={{ transform: hov ? 'scale(1.08)' : 'scale(1)' }}
        />
      </div>

      {/* info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <h3 className="font-bold text-slate-800 text-sm leading-snug" style={{ fontFamily: 'Sora,sans-serif' }}>
            {item.name}
          </h3>
          {item.isVegetarian && (
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center mt-0.5" title="Vegetarian">
              <i className="fas fa-leaf text-white" style={{ fontSize: 7 }} />
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">{item.description}</p>
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="font-black text-base" style={{ color: BRAND, fontFamily: 'Sora,sans-serif' }}>
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
              boxShadow: added ? '0 4px 12px rgba(34,197,94,.35)' : `0 4px 12px ${BRAND}33`,
              transform: hov ? 'scale(1.12)' : 'scale(1)',
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

/* ── Info row for sidebar ── */
function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: `${BRAND}12` }}>
        <i className={`fas ${icon} text-xs`} style={{ color: BRAND }} />
      </div>
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">{label}</div>
        <div className="text-sm font-medium text-slate-700">{value}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════════════ */
export default function RestaurantDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems]           = useState([]);
  const [category, setCategory]     = useState('all');
  const [addedIds, setAddedIds]     = useState({});
  const [loginRequiredOpen, setLoginRequiredOpen] = useState(false);
  const { cart, addToCart }         = useCart();
  const { user } = useAuth();

  useEffect(() => {
    api.restaurants.getById(id).then(setRestaurant).catch(() => setRestaurant(null));
    api.menu.getByRestaurant(id).then(setItems).catch(() => setItems([]));
  }, [id]);

  const handleAdd = (item) => {
    if (!user || user.role !== 'customer') {
      setLoginRequiredOpen(true);
      return;
    }
    addToCart({ id: item.id, name: item.name, price: item.price, image: item.image, restaurantId: item.restaurantId });
    setAddedIds(p => ({ ...p, [item.id]: true }));
    setTimeout(() => setAddedIds(p => ({ ...p, [item.id]: false })), 1200);
  };

  const categories = ['all', ...new Set(items.map(i => i.category).filter(Boolean))];
  const filtered   = category === 'all' ? items : items.filter(i => i.category === category);
  const cartItems  = cart.filter(c => items.some(i => i.id === c.id));
  const subtotal   = cartItems.reduce((s, c) => s + c.price * c.quantity, 0);
  const totalQty   = cartItems.reduce((s, c) => s + c.quantity, 0);

  /* loading spinner */
  if (!restaurant) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: `${BRAND} transparent transparent transparent` }} />
      <p className="text-slate-400 text-sm font-medium">Loading restaurant…</p>
    </div>
  );

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
              onClick={() => navigate(`/login?redirect=/restaurant/${encodeURIComponent(String(id || ''))}`)}
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
        @keyframes cardIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── HERO BANNER ── */}
      <div
        className="relative bg-cover bg-center"
        style={{ backgroundImage: `url(${restaurant.image})`, marginTop: '-72px', paddingTop: '72px', height: 340 }}
      >
        {/* gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        {/* content */}
        <div className="absolute bottom-0 left-0 right-0 max-w-[1200px] mx-auto px-5 pb-8">
          <div className="flex items-end gap-5 flex-wrap">
            {/* logo */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white/20 flex-shrink-0 shadow-2xl">
              <img src={restaurant.image} alt="" className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 min-w-0">
              {/* name + badge */}
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-3xl font-black text-white leading-tight" style={{ fontFamily: 'Sora,sans-serif' }}>
                  {restaurant.name}
                </h1>
                {restaurant.isApproved && (
                  <span className="bg-blue-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <i className="fas fa-check-circle text-[10px]" /> Verified
                  </span>
                )}
                {restaurant.isOpen !== false
                  ? <span className="bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">Open Now</span>
                  : <span className="bg-red-500/80 text-white text-xs font-bold px-3 py-1 rounded-full">Closed</span>
                }
              </div>

              <p className="text-white/70 text-sm mb-3">{restaurant.cuisine}</p>

              {/* stats row */}
              <div className="flex gap-4 flex-wrap">
                {[
                  { icon: 'fa-star text-yellow-400', val: restaurant.rating                                      },
                  { icon: 'fa-clock',                val: restaurant.deliveryTime                                },
                  { icon: 'fa-coins',                val: `Min ${Number(restaurant.minOrder || 0).toLocaleString()} RWF` },
                  { icon: 'fa-truck',                val: `Delivery: ${Number(restaurant.deliveryFee || 0).toLocaleString()} RWF` },
                ].map((s, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-white/80 text-sm font-medium backdrop-blur-sm bg-white/10 px-3 py-1.5 rounded-full">
                    <i className={`fas ${s.icon} text-xs`} /> {s.val}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <section className="py-10 pb-24">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid lg:grid-cols-3 gap-8 items-start">

            {/* ── LEFT — MENU ── */}
            <div className="lg:col-span-2">

              {/* category filter pills */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className="px-4 py-2 rounded-full border text-xs font-bold transition-all duration-200"
                    style={{
                      background:  category === c ? BRAND : 'white',
                      color:       category === c ? '#fff' : '#475569',
                      borderColor: category === c ? BRAND : '#e2e8f0',
                      boxShadow:   category === c ? `0 4px 12px ${BRAND}33` : 'none',
                    }}
                  >
                    {c === 'all' ? 'All Items' : c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>

              {/* menu card */}
              <div className="bg-white rounded-[24px] border border-slate-100 p-6"
                style={{ boxShadow: '0 2px 16px rgba(0,0,0,.06)' }}>
                <h2 className="font-black text-slate-800 mb-6 flex items-center gap-2"
                  style={{ fontFamily: 'Sora,sans-serif' }}>
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${BRAND}12` }}>
                    <i className="fas fa-utensils text-xs" style={{ color: BRAND }} />
                  </span>
                  Menu
                  <span className="text-xs font-bold text-slate-400 ml-1">({filtered.length} items)</span>
                </h2>

                {filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `${BRAND}10` }}>
                      <i className="fas fa-utensils text-2xl" style={{ color: BRAND }} />
                    </div>
                    <p className="text-slate-500 font-medium">No items in this category</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {filtered.map((item, i) => (
                      <div key={item.id} style={{ animationDelay: `${i * 50}ms`, animation: 'cardIn .4s ease both' }}>
                        <MenuItem
                          item={item}
                          onAdd={() => handleAdd(item)}
                          added={!!addedIds[item.id]}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
                  <Link
                    to={`/menu?restaurantId=${encodeURIComponent(String(restaurant.id))}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl border-2 transition-all"
                    style={{ borderColor: BRAND, color: BRAND }}
                    onMouseEnter={e => { e.currentTarget.style.background = BRAND; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = BRAND; }}
                  >
                    <i className="fas fa-th-large text-xs" /> View all items
                  </Link>
                </div>
              </div>
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-5">

                {/* restaurant info card */}
                <div className="bg-white rounded-[24px] border border-slate-100 p-6"
                  style={{ boxShadow: '0 2px 16px rgba(0,0,0,.06)' }}>
                  <h3 className="font-black text-slate-800 mb-5 flex items-center gap-2" style={{ fontFamily: 'Sora,sans-serif' }}>
                    <i className="fas fa-store text-sm" style={{ color: BRAND }} />
                    Restaurant Info
                  </h3>
                  <div className="space-y-4">
                    <InfoRow icon="fa-map-marker-alt" label="Address" value={restaurant.address || 'Kigali, Rwanda'} />
                    <InfoRow icon="fa-phone"          label="Phone"   value={restaurant.phone   || 'N/A'} />
                    <InfoRow icon="fa-clock"          label="Hours"   value="Mon–Sun: 10:00 AM – 10:00 PM" />
                  </div>
                </div>

                {/* order summary card */}
                <div className="bg-white rounded-[24px] border border-slate-100 p-6"
                  style={{ boxShadow: '0 2px 16px rgba(0,0,0,.06)' }}>
                  <h3 className="font-black text-slate-800 mb-5 flex items-center gap-2" style={{ fontFamily: 'Sora,sans-serif' }}>
                    <i className="fas fa-receipt text-sm" style={{ color: BRAND }} />
                    Your Order
                    {totalQty > 0 && (
                      <span className="ml-auto text-xs font-bold text-white px-2 py-0.5 rounded-full"
                        style={{ background: BRAND }}>{totalQty}</span>
                    )}
                  </h3>

                  {cartItems.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: `${BRAND}08` }}>
                        <i className="fas fa-shopping-cart text-xl" style={{ color: `${BRAND}60` }} />
                      </div>
                      <p className="text-slate-400 text-sm">Add items to get started</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 mb-4 max-h-[220px] overflow-y-auto pr-1"
                        style={{ scrollbarWidth: 'thin' }}>
                        {cartItems.map(c => (
                          <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50">
                            <img src={c.image} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs text-slate-800 truncate">{c.name}</p>
                              <p className="text-[10px] text-slate-400">× {c.quantity}</p>
                            </div>
                            <span className="font-black text-xs flex-shrink-0" style={{ color: BRAND }}>
                              {(c.price * c.quantity).toLocaleString()} RWF
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-slate-100 mb-5">
                        <span className="font-black text-slate-800 text-sm" style={{ fontFamily: 'Sora,sans-serif' }}>Subtotal</span>
                        <span className="font-black text-base" style={{ color: BRAND, fontFamily: 'Sora,sans-serif' }}>
                          {subtotal.toLocaleString()} RWF
                        </span>
                      </div>

                      <Link
                        to="/cart"
                        className="flex items-center justify-center gap-2 w-full py-3.5 text-white font-black text-sm rounded-2xl transition-all"
                        style={{
                          background: `linear-gradient(135deg,${BRAND},${BRAND_D})`,
                          boxShadow: `0 6px 20px ${BRAND}40`,
                          fontFamily: 'Sora,sans-serif',
                        }}
                      >
                        <i className="fas fa-shopping-cart text-xs" />
                        View Cart · {totalQty} {totalQty === 1 ? 'item' : 'items'}
                      </Link>
                    </>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}