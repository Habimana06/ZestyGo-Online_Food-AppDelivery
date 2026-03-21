import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '../api';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';

/* ── Empty state ── */
function EmptyCart() {
  return (
    <section className="max-w-[1200px] mx-auto px-5 py-24">
      <div className="text-center">
        <div className="w-32 h-32 rounded-[32px] flex items-center justify-center mx-auto mb-8"
          style={{ background: `${BRAND}10` }}>
          <i className="fas fa-shopping-cart text-5xl" style={{ color: BRAND }} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-3" style={{ fontFamily: 'Sora,sans-serif' }}>
          Your cart is empty
        </h2>
        <p className="text-slate-500 mb-10 max-w-xs mx-auto">
          Looks like you haven't added anything yet. Browse our menu and find something delicious!
        </p>
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 px-9 py-4 text-white font-bold text-sm rounded-2xl"
          style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 8px 28px ${BRAND}40` }}
        >
          <i className="fas fa-utensils text-xs" /> Browse Menu
        </Link>
      </div>
    </section>
  );
}

/* ── Cart item row ── */
function CartItem({ item, onRemove, onQty }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      className="flex gap-5 py-5 border-b border-slate-50 last:border-0 transition-all duration-200"
      style={{ background: hov ? `${BRAND}03` : 'transparent' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* image */}
      <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500"
          style={{ transform: hov ? 'scale(1.07)' : 'scale(1)' }}
        />
      </div>

      {/* details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-800 text-sm mb-1 truncate" style={{ fontFamily: 'Sora,sans-serif' }}>
          {item.name}
        </h3>
        <p className="text-xs text-slate-400 mb-3">{Number(item.price).toLocaleString()} RWF each</p>

        {/* qty controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => onQty(item.id, -1)}
              className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-white transition-all font-bold text-lg"
              style={{ ':hover': { background: BRAND } }}
              onMouseEnter={e => { e.currentTarget.style.background = BRAND; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; }}
            >−</button>
            <span className="w-9 text-center font-black text-sm text-slate-800">{item.quantity}</span>
            <button
              onClick={() => onQty(item.id, 1)}
              className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-white transition-all font-bold text-lg"
              onMouseEnter={e => { e.currentTarget.style.background = BRAND; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; }}
            >+</button>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
          >
            <i className="fas fa-trash-alt text-[10px]" /> Remove
          </button>
        </div>
      </div>

      {/* line total */}
      <div className="text-right flex-shrink-0">
        <span className="font-black text-base" style={{ color: BRAND, fontFamily: 'Sora,sans-serif' }}>
          {(item.price * item.quantity).toLocaleString()} RWF
        </span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════════════ */
export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [promo, setPromo]       = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState('');
  const [promoOk, setPromoOk]   = useState(false);
  const [promoApplied, setPromoApplied] = useState('');

  const deliveryFee = cart.length ? 2990 : 0;
  const tax         = cartTotal * 0.1;
  const effectiveDel = discount === deliveryFee ? 0 : deliveryFee;
  const total        = cartTotal + effectiveDel + tax - (discount === deliveryFee ? 0 : discount);

  const applyPromoCode = async (codeToApply) => {
    const code = String(codeToApply || '').toUpperCase().trim();
    if (!code) return;

    try {
      const result = await api.coupons.validate({ code, cartTotal, deliveryFee });
      // Frontend UI treats discount === deliveryFee as free delivery.
      setDiscount(Number(result.discountForUI ?? result.discountAmount ?? 0));
      setPromoMsg(result.msg || 'Promo applied!');
      setPromoOk(true);
      setPromoApplied(code);
    } catch (e) {
      setDiscount(0);
      setPromoMsg(e.message || '❌ Invalid or expired promo code.');
      setPromoOk(false);
      setPromoApplied('');
    }
  };

  const applyPromo = () => applyPromoCode(promo);

  const removePromo = () => {
    setDiscount(0); setPromoMsg(''); setPromoOk(false); setPromo(''); setPromoApplied('');
  };

  // If cart totals change and a promo is applied, keep the discount in sync.
  useEffect(() => {
    if (!promoApplied) return;
    applyPromoCode(promoApplied);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartTotal, deliveryFee, promoApplied]);

  const proceedToCheckout = () => {
    if (!cart.length) return;
    if (!isLoggedIn) { navigate('/login?redirect=/checkout'); return; }
    localStorage.setItem('orderSummary', JSON.stringify({
      subtotal: cartTotal, deliveryFee: effectiveDel, tax, discount, total,
    }));
    navigate('/checkout');
  };

  if (cart.length === 0) return <EmptyCart />;

  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
      `}</style>

      {/* ── PAGE HEADER ── */}
      <div className="bg-white border-b border-slate-100" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
        <div className="max-w-[1200px] mx-auto px-5 py-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3" style={{ fontFamily: 'Sora,sans-serif' }}>
              <span className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}>
                <i className="fas fa-shopping-cart text-white text-sm" />
              </span>
              Your Cart
              <span className="text-sm font-bold text-white px-3 py-1 rounded-full"
                style={{ background: BRAND }}>
                {totalQty} {totalQty === 1 ? 'item' : 'items'}
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Review your items before checking out</p>
          </div>
          <Link to="/menu"
            className="flex items-center gap-2 text-sm font-bold transition"
            style={{ color: BRAND }}>
            <i className="fas fa-plus-circle text-xs" /> Add more items
          </Link>
        </div>
      </div>

      <section className="max-w-[1200px] mx-auto px-5 py-10 pb-24">
        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* ── CART ITEMS ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[24px] border border-slate-100 p-8 mb-6"
              style={{ boxShadow: '0 2px 16px rgba(0,0,0,.06)' }}>
              <h2 className="font-black text-slate-800 mb-6 flex items-center gap-2"
                style={{ fontFamily: 'Sora,sans-serif' }}>
                <i className="fas fa-list text-sm" style={{ color: BRAND }} />
                Cart Items
                <span className="text-xs font-bold text-slate-400 ml-1">({totalQty})</span>
              </h2>
              <div>
                {cart.map(item => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onRemove={removeFromCart}
                    onQty={updateQuantity}
                  />
                ))}
              </div>
            </div>

            {/* suggested promo */}
            <div className="rounded-2xl border border-dashed border-slate-200 p-5 flex flex-wrap items-center gap-4 bg-white"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${BRAND}12` }}>
                <i className="fas fa-tag text-sm" style={{ color: BRAND }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700">Have a promo code?</p>
                <p className="text-xs text-slate-400">Try <code className="font-mono bg-slate-100 px-1 rounded">FIRST50</code> for 50% off or <code className="font-mono bg-slate-100 px-1 rounded">FREEDEL</code> for free delivery</p>
              </div>
            </div>
          </div>

          {/* ── ORDER SUMMARY ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[24px] border border-slate-100 p-7 sticky top-24"
              style={{ boxShadow: '0 2px 16px rgba(0,0,0,.06)' }}>

              <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2"
                style={{ fontFamily: 'Sora,sans-serif' }}>
                <i className="fas fa-receipt text-sm" style={{ color: BRAND }} />
                Order Summary
              </h3>

              {/* line items */}
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal ({totalQty} items)</span>
                  <span className="font-medium text-slate-700">{cartTotal.toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery fee</span>
                  <span className={`font-medium ${discount === deliveryFee ? 'line-through text-slate-300' : 'text-slate-700'}`}>
                    {deliveryFee.toLocaleString()} RWF
                  </span>
                </div>
                {discount === deliveryFee && (
                  <div className="flex justify-between text-green-600 text-xs font-bold">
                    <span>Free delivery applied</span>
                    <span>−{deliveryFee.toLocaleString()} RWF</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Tax (10%)</span>
                  <span className="font-medium text-slate-700">{Math.round(tax).toLocaleString()} RWF</span>
                </div>
                {discount > 0 && discount !== deliveryFee && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span className="flex items-center gap-1">
                      <i className="fas fa-tag text-[10px]" /> Discount
                    </span>
                    <span>−{Math.round(discount).toLocaleString()} RWF</span>
                  </div>
                )}
              </div>

              {/* total */}
              <div className="flex justify-between items-center border-t-2 border-slate-100 pt-4 mb-6">
                <span className="font-black text-slate-800" style={{ fontFamily: 'Sora,sans-serif' }}>Total</span>
                <span className="text-2xl font-black" style={{ color: BRAND, fontFamily: 'Sora,sans-serif' }}>
                  {Math.round(total).toLocaleString()} RWF
                </span>
              </div>

              {/* promo code */}
              {promoApplied ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5">
                  <div className="flex items-center gap-2 text-green-700 text-sm font-bold">
                    <i className="fas fa-check-circle" />
                    <code className="font-mono">{promoApplied}</code> applied
                  </div>
                  <button onClick={removePromo} className="text-green-500 hover:text-green-700 transition">
                    <i className="fas fa-times text-xs" />
                  </button>
                </div>
              ) : (
                <div className="mb-5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo code"
                      value={promo}
                      onChange={e => setPromo(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && applyPromo()}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none bg-slate-50 text-slate-700 transition-all"
                      onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = `0 0 0 3px ${BRAND}18`; }}
                      onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                    />
                    <button
                      onClick={applyPromo}
                      className="px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all"
                      style={{ borderColor: BRAND, color: BRAND }}
                      onMouseEnter={e => { e.currentTarget.style.background = BRAND; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = BRAND; }}
                    >
                      Apply
                    </button>
                  </div>
                  {promoMsg && (
                    <p className={`text-xs mt-2 font-medium ${promoOk ? 'text-green-600' : 'text-red-500'}`}>
                      {promoMsg}
                    </p>
                  )}
                </div>
              )}

              {/* checkout button */}
              <button
                onClick={proceedToCheckout}
                className="w-full py-4 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition-all"
                style={{
                  background: `linear-gradient(135deg,${BRAND},${BRAND_D})`,
                  boxShadow: `0 8px 28px ${BRAND}40`,
                  fontFamily: 'Sora,sans-serif',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 12px 36px ${BRAND}55`}
                onMouseLeave={e => e.currentTarget.style.boxShadow = `0 8px 28px ${BRAND}40`}
              >
                <i className="fas fa-lock text-xs" />
                Proceed to Checkout
              </button>

              {!isLoggedIn && (
                <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1">
                  <i className="fas fa-info-circle" style={{ color: BRAND }} />
                  You'll be asked to log in before checkout
                </p>
              )}

              {/* trust badges */}
              <div className="mt-5 flex justify-around text-center">
                {[
                  { icon: 'fa-lock',      label: 'Secure'      },
                  { icon: 'fa-undo',      label: 'Easy Refund' },
                  { icon: 'fa-headset',   label: '24/7 Support' },
                ].map(b => (
                  <div key={b.label} className="flex flex-col items-center gap-1">
                    <i className={`fas ${b.icon} text-xs`} style={{ color: BRAND }} />
                    <span className="text-[10px] text-slate-400 font-medium">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}