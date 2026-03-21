import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import Toast from '../components/Toast';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';

const PAYMENT_METHODS = [
  { id: 'card',   label: 'Credit / Debit Card', icon: 'fa-credit-card',    sub: 'Visa, Mastercard, etc.'       },
  { id: 'mobile', label: 'Mobile Money',         icon: 'fa-mobile-alt',     sub: 'PayPack (MTN · Airtel)'      },
  { id: 'bank',   label: 'Bank Transfer',       icon: 'fa-university',     sub: 'Confirm with your bank reference' },
  { id: 'cash',   label: 'Cash on Delivery',     icon: 'fa-money-bill-wave', sub: 'Pay when your order arrives' },
];

/* ── Focus-ring input ── */
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{label}</label>
      {children}
    </div>
  );
}

const baseInput = `w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-slate-50 outline-none transition-all`;

function Input({ ...props }) {
  const [f, setF] = useState(false);
  return (
    <input {...props} className={baseInput}
      style={{ borderColor: f ? BRAND : undefined, boxShadow: f ? `0 0 0 3px ${BRAND}18` : undefined }}
      onFocus={() => setF(true)} onBlur={() => setF(false)} />
  );
}

function Textarea({ ...props }) {
  const [f, setF] = useState(false);
  return (
    <textarea {...props} className={`${baseInput} resize-none`}
      style={{ borderColor: f ? BRAND : undefined, boxShadow: f ? `0 0 0 3px ${BRAND}18` : undefined }}
      onFocus={() => setF(true)} onBlur={() => setF(false)} />
  );
}

/* ── Section card wrapper ── */
function Card({ icon, title, children }) {
  return (
    <div className="bg-white rounded-[24px] border border-slate-100 p-8"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,.06)' }}>
      <h3 className="text-base font-black text-slate-800 mb-7 flex items-center gap-3"
        style={{ fontFamily: 'Sora,sans-serif' }}>
        <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${BRAND}12` }}>
          <i className={`fas ${icon} text-sm`} style={{ color: BRAND }} />
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════════════ */
export default function Checkout() {
  const { cart, clearCart }   = useCart();
  const { user, isLoggedIn }  = useAuth();
  const navigate              = useNavigate();
  const [payment, setPayment] = useState('card');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({
    firstName: '', lastName: '', address: '',
    city: '', zipCode: '', phone: '', instructions: '',
  });

  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    bankName: '',
    bankAccount: '',
  });

  const [modalStep, setModalStep] = useState('none'); // none | confirm | processing | success
  const [modalError, setModalError] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [savePaymentMethod, setSavePaymentMethod] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');

  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [savedPaymentMethodsLoading, setSavedPaymentMethodsLoading] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login?redirect=/checkout'); return; }
    if (cart.length === 0) {
      const saved = JSON.parse(localStorage.getItem('orderSummary') || '{}');
      if (saved.subtotal) setSummary(saved);
      else navigate('/menu');
      return;
    }
    setSummary(JSON.parse(localStorage.getItem('orderSummary') || '{}'));
    if (user) {
      const parts = (user.name || '').split(' ');
      setForm(f => ({ ...f, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '', phone: user.phone || '' }));
    }
  }, [cart, isLoggedIn, user, navigate]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!isLoggedIn) return;
      setSavedPaymentMethodsLoading(true);
      try {
        const list = await api.paymentMethods.list();
        if (!cancelled) setSavedPaymentMethods(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setSavedPaymentMethods([]);
      } finally {
        if (!cancelled) setSavedPaymentMethodsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!summary) return;
    setModalError('');

    // Validate required payment details depending on payment method.
    const paymentValid = () => {
      if (payment === 'card') {
        const num = String(paymentDetails.cardNumber || '').replace(/\s+/g, '');
        const exp = String(paymentDetails.expiry || '').trim();
        const cvv = String(paymentDetails.cvv || '').trim();
        const digits = num.replace(/\D/g, '');
        if (!(digits.length === 4 || digits.length >= 12)) return 'Enter a valid card number (or last 4 digits).';
        if (!/^\d{2}\/\d{2}$/.test(exp)) return 'Expiry must be in MM/YY format.';
        if (cvv.length < 3 || cvv.length > 4) return 'CVV must be 3 to 4 digits.';
        return '';
      }
      if (payment === 'bank') {
        if (!paymentDetails.bankName.trim()) return 'Enter bank name.';
        if (!paymentDetails.bankAccount.trim()) return 'Enter bank account/reference.';
        return '';
      }
      if (payment === 'mobile') {
        if (!form.phone.trim()) return 'Enter your mobile money phone number.';
        return '';
      }
      // cash has no extra requirements
      return '';
    };

    const msg = paymentValid();
    if (msg) {
      setToastType('error');
      setToastMessage(msg);
      return;
    }

    setModalStep('confirm');
  };

  const createOrder = async () => {
    const restaurantId = cart[0]?.restaurantId ?? 1;
    const restaurant = await api.restaurants.getById(restaurantId).catch(() => ({ name: 'Restaurant' }));
    const order = await api.orders.create({
      restaurantId: Number(restaurantId),
      restaurantName: restaurant.name,
      items: cart.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
      subtotal: summary.subtotal,
      deliveryFee: summary.deliveryFee || 0,
      tax: summary.tax || 0,
      discount: summary.discount || 0,
      total: summary.total,
      paymentMethod: payment,
      deliveryAddress: `${form.address}, ${form.city}, ${form.zipCode}`,
      notes: form.instructions,
      customerName: `${form.firstName} ${form.lastName}`,
      customerPhone: form.phone,
    });

    return order;
  };

  const savePaymentMethodFromCheckout = async () => {
    if (!savePaymentMethod) return;
    if (payment === 'cash') return;

    if (payment === 'mobile') {
      await api.paymentMethods.add({
        type: 'mobile',
        displayName: null,
        account: String(form.phone || '').trim(),
        extra: null,
        isDefault: true,
      });
      return;
    }

    if (payment === 'card') {
      const cleaned = String(paymentDetails.cardNumber || '').replace(/\D/g, '');
      const last4 = cleaned.slice(-4);
      await api.paymentMethods.add({
        type: 'card',
        displayName: null,
        account: last4,
        extra: { expiry: String(paymentDetails.expiry || '').trim() },
        isDefault: true,
      });
      return;
    }

    if (payment === 'bank') {
      await api.paymentMethods.add({
        type: 'bank',
        displayName: null,
        account: String(paymentDetails.bankAccount || '').trim(),
        extra: { bankName: String(paymentDetails.bankName || '').trim() },
        isDefault: true,
      });
    }
  };

  const confirmPayment = async () => {
    setModalError('');
    setModalStep('processing');
    setLoading(true);
    setCreatedOrderId(null);

    try {
      await savePaymentMethodFromCheckout();
      const order = await createOrder();
      setCreatedOrderId(order.id);

      // If MoMo, wait until backend sync updates order payment_status.
      if (payment === 'mobile') {
        const orderId = order.id;
        const maxAttempts = 18; // ~90s (18 * 5s)
        const waitMs = 5000;

        // Keep modal open while we confirm the payment.
        let finalOrder = null;
        // eslint-disable-next-line no-plusplus
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          // eslint-disable-next-line no-await-in-loop
          finalOrder = await api.orders.getById(orderId).catch(() => null);
          const st = String(finalOrder?.paymentStatus || '').toLowerCase();

          if (st && st !== 'pending') break;

          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, waitMs));
        }

        const st = String(finalOrder?.paymentStatus || '').toLowerCase();
        if (st === 'paid') {
          clearCart();
          localStorage.removeItem('orderSummary');
          setModalStep('success');
        } else {
          const failMsg = finalOrder?.paymentStatus
            ? `Payment failed (${finalOrder.paymentStatus}).`
            : 'Payment not confirmed yet. Please try again later.';
          setModalError(failMsg);
          setToastType('error');
          setToastMessage(failMsg);
          setModalStep('none');
        }
      } else {
        // Non-MoMo flows keep the current immediate confirmation UX.
        clearCart();
        localStorage.removeItem('orderSummary');
        setModalStep('success');
      }
    } catch (err) {
      const failMsg = err.message || 'Payment failed. Please try again.';
      setModalError(failMsg);
      setToastType('error');
      setToastMessage(failMsg);
      setModalStep('none');
    } finally {
      setLoading(false);
    }
  };

  if (!summary && !cart.length) return null;

  const items        = cart.length ? cart : [];
  const orderSummary = summary || { subtotal: 0, deliveryFee: 0, tax: 0, discount: 0, total: 0 };

  const savedCards = savedPaymentMethods.filter((m) => m.type === 'card');
  const savedBanks = savedPaymentMethods.filter((m) => m.type === 'bank');
  const savedMobiles = savedPaymentMethods.filter((m) => m.type === 'mobile');

  const savedCardDefault =
    savedCards.find((m) => m.isDefault) || savedCards[0] || null;
  const savedBankDefault =
    savedBanks.find((m) => m.isDefault) || savedBanks[0] || null;
  const savedMobileDefault =
    savedMobiles.find((m) => m.isDefault) || savedMobiles[0] || null;

  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        duration={2800}
        position="top-right"
        onClose={() => setToastMessage('')}
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
      `}</style>

      {/* ── PAGE HEADER ── */}
      <div className="bg-white border-b border-slate-100" style={{ boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
        <div className="max-w-[1200px] mx-auto px-5 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3" style={{ fontFamily: 'Sora,sans-serif' }}>
              <span className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}>
                <i className="fas fa-lock text-white text-sm" />
              </span>
              Secure Checkout
            </h1>
            <p className="text-slate-400 text-sm mt-1">Complete your order in just a few steps</p>
          </div>
          {/* step indicators */}
          <div className="hidden md:flex items-center gap-2 text-xs font-bold">
            {['Cart', 'Checkout', 'Tracking'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                {i > 0 && <i className="fas fa-chevron-right text-slate-300 text-[10px]" />}
                <span className={`px-3 py-1.5 rounded-full ${i === 1
                  ? 'text-white'
                  : 'text-slate-400 bg-slate-100'}`}
                  style={i === 1 ? { background: `linear-gradient(135deg,${BRAND},${BRAND_D})` } : {}}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="max-w-[1200px] mx-auto px-5 py-10 pb-20">
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Delivery address */}
            <Card icon="fa-map-marker-alt" title="Delivery Address">
              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="First Name"><Input type="text" value={form.firstName} onChange={set('firstName')} required placeholder="John" /></Field>
                <Field label="Last Name"><Input type="text" value={form.lastName} onChange={set('lastName')} required placeholder="Doe" /></Field>
              </div>
              <div className="mt-5">
                <Field label="Street Address">
                  <Input type="text" value={form.address} onChange={set('address')} required placeholder="123 KN 5 Rd, Kiyovu" />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-5 mt-5">
                <Field label="City"><Input type="text" value={form.city} onChange={set('city')} required placeholder="Kigali" /></Field>
                <Field label="District / ZIP"><Input type="text" value={form.zipCode} onChange={set('zipCode')} required placeholder="Gasabo" /></Field>
              </div>
              <div className="mt-5">
                <Field label="Phone Number">
                  <Input type="tel" value={form.phone} onChange={set('phone')} required placeholder="+250 7XX XXX XXX" />
                </Field>
              </div>
            </Card>

            {/* Delivery instructions */}
            <Card icon="fa-sticky-note" title="Delivery Instructions">
              <Field label="Special instructions (optional)">
                <Textarea
                  value={form.instructions}
                  onChange={set('instructions')}
                  placeholder="e.g. Leave at the gate, call on arrival, no onions…"
                  rows={4}
                />
              </Field>
            </Card>

            {/* Payment method */}
            <Card icon="fa-wallet" title="Payment Method">
              <div className="space-y-3">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPayment(m.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200"
                    style={{
                      borderColor: payment === m.id ? BRAND : '#e2e8f0',
                      background:  payment === m.id ? `${BRAND}07` : 'white',
                      boxShadow:   payment === m.id ? `0 4px 14px ${BRAND}20` : 'none',
                    }}
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ background: payment === m.id ? `linear-gradient(135deg,${BRAND},${BRAND_D})` : '#f1f5f9' }}>
                      <i className={`fas ${m.icon} text-base`}
                        style={{ color: payment === m.id ? '#fff' : '#94a3b8' }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-slate-800">{m.label}</div>
                      <div className="text-xs text-slate-400">{m.sub}</div>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ borderColor: payment === m.id ? BRAND : '#e2e8f0', background: payment === m.id ? BRAND : 'white' }}>
                      {payment === m.id && <i className="fas fa-check text-white" style={{ fontSize: 9 }} />}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {modalError && modalStep === 'none' && (
              <div className="mt-5 mb-2 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-medium">
                <i className="fas fa-exclamation-circle mr-2" />
                {modalError}
              </div>
            )}

            {/* Payment details required for confirmation */}
            {payment === 'card' && (
              <Card icon="fa-credit-card" title="Card Details">
                <div className="space-y-4">
                  {savedCardDefault ? (
                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
                      <div className="text-xs font-bold text-slate-700 mb-2">
                        Saved card(s)
                      </div>
                      <div className="space-y-2">
                        {savedCards.map((m) => (
                          <div key={m.id} className="flex items-center justify-between gap-3">
                            <div className="min-w-0 text-xs text-slate-700 font-bold">
                              {m.displayName || 'Card'} •••• {m.account}
                              {m.isDefault ? (
                                <span className="ml-2 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  Default
                                </span>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentDetails((p) => ({
                                  ...p,
                                  cardNumber: m.account,
                                  expiry: m.extra?.expiry || '',
                                  cvv: '',
                                }));
                              }}
                              className="px-3 py-2 rounded-xl bg-white border border-blue-100 text-xs font-black text-blue-700 hover:bg-blue-50 transition flex-shrink-0"
                            >
                              Use
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <Field label="Card Number">
                    <Input
                      type="text"
                      value={paymentDetails.cardNumber}
                      onChange={(e) => setPaymentDetails((p) => ({ ...p, cardNumber: e.target.value }))}
                      placeholder={savedCardDefault ? 'Last4 or full card number' : '1234 5678 9012 3456'}
                      required
                      inputMode="numeric"
                    />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Expiry (MM/YY)">
                      <Input
                        type="text"
                        value={paymentDetails.expiry}
                        onChange={(e) => setPaymentDetails((p) => ({ ...p, expiry: e.target.value }))}
                        placeholder="12/28"
                        required
                      />
                    </Field>
                    <Field label="CVV">
                      <Input
                        type="password"
                        value={paymentDetails.cvv}
                        onChange={(e) => setPaymentDetails((p) => ({ ...p, cvv: e.target.value }))}
                        placeholder="123"
                        required
                        inputMode="numeric"
                      />
                    </Field>
                  </div>
                </div>
              </Card>
            )}

            {payment === 'mobile' && (
              <Card icon="fa-mobile-alt" title="Mobile Money Details">
                <div className="space-y-4">
                  {savedMobileDefault ? (
                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
                      <div className="text-xs font-bold text-slate-700 mb-2">
                        Saved mobile(s)
                      </div>
                      <div className="space-y-2">
                        {savedMobiles.map((m) => (
                          <div key={m.id} className="flex items-center justify-between gap-3">
                            <div className="min-w-0 text-xs text-slate-700 font-bold">
                              {m.account}
                              {m.isDefault ? (
                                <span className="ml-2 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  Default
                                </span>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => setForm((p) => ({ ...p, phone: m.account }))}
                              className="px-3 py-2 rounded-xl bg-white border border-blue-100 text-xs font-black text-blue-700 hover:bg-blue-50 transition flex-shrink-0"
                            >
                              Use
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <p className="text-sm text-slate-500">
                    We'll use your mobile number from the address form: <span className="font-bold">{form.phone || '—'}</span>
                  </p>
                </div>
              </Card>
            )}

            {payment === 'bank' && (
              <Card icon="fa-university" title="Bank Transfer Details">
                <div className="space-y-4">
                  {savedBankDefault ? (
                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
                      <div className="text-xs font-bold text-slate-700 mb-2">
                        Saved bank(s)
                      </div>
                      <div className="space-y-2">
                        {savedBanks.map((m) => (
                          <div key={m.id} className="flex items-center justify-between gap-3">
                            <div className="min-w-0 text-xs text-slate-700 font-bold">
                              {m.extra?.bankName || m.displayName || 'Bank'} ••• {m.account}
                              {m.isDefault ? (
                                <span className="ml-2 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  Default
                                </span>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentDetails((p) => ({
                                  ...p,
                                  bankName: m.extra?.bankName || p.bankName,
                                  bankAccount: m.account,
                                }));
                              }}
                              className="px-3 py-2 rounded-xl bg-white border border-blue-100 text-xs font-black text-blue-700 hover:bg-blue-50 transition flex-shrink-0"
                            >
                              Use
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <Field label="Bank Name">
                    <Input
                      type="text"
                      value={paymentDetails.bankName}
                      onChange={(e) => setPaymentDetails((p) => ({ ...p, bankName: e.target.value }))}
                      placeholder={savedBankDefault ? (savedBankDefault.extra?.bankName || 'Bank') : 'e.g. Access Bank'}
                      required
                    />
                  </Field>
                  <Field label="Account / Reference">
                    <Input
                      type="text"
                      value={paymentDetails.bankAccount}
                      onChange={(e) => setPaymentDetails((p) => ({ ...p, bankAccount: e.target.value }))}
                      placeholder={savedBankDefault ? 'Saved reference/account' : 'Enter your bank reference/account'}
                      required
                    />
                  </Field>
                </div>
                <label className="flex items-center gap-3 text-xs font-bold text-slate-700 mt-4">
                  <input type="checkbox" checked={savePaymentMethod} onChange={(e) => setSavePaymentMethod(e.target.checked)} />
                  Save this bank reference to profile
                </label>
              </Card>
            )}

            {payment === 'cash' && (
              <Card icon="fa-money-bill-wave" title="Cash on Delivery">
                <p className="text-sm text-slate-500">Pay when your order arrives.</p>
              </Card>
            )}

            {/* Place order button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-white font-black text-base rounded-2xl flex items-center justify-center gap-3 transition-all"
              style={{
                background: loading ? '#e2e8f0' : `linear-gradient(135deg,${BRAND},${BRAND_D})`,
                color: loading ? '#94a3b8' : '#fff',
                boxShadow: loading ? 'none' : `0 8px 28px ${BRAND}40`,
                fontFamily: 'Sora,sans-serif',
              }}
            >
              {loading
                ? <><span className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" /> Processing…</>
                : <><i className="fas fa-lock text-sm" /> Place Order · {Number(orderSummary.total || 0).toLocaleString()} RWF</>
              }
            </button>

            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <i className="fas fa-shield-alt" style={{ color: BRAND }} />
              Your payment info is encrypted and secure
            </p>
          </div>

          {/* ── RIGHT COLUMN — ORDER SUMMARY ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[24px] border border-slate-100 p-7 sticky top-24"
              style={{ boxShadow: '0 2px 16px rgba(0,0,0,.06)' }}>

              <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2"
                style={{ fontFamily: 'Sora,sans-serif' }}>
                <i className="fas fa-receipt text-sm" style={{ color: BRAND }} />
                Order Summary
              </h3>

              {/* items list */}
              <div className="max-h-[220px] overflow-y-auto space-y-3 mb-6 pr-1"
                style={{ scrollbarWidth: 'thin' }}>
                {items.map(i => (
                  <div key={i.id} className="flex gap-3 items-center py-2.5 border-b border-slate-50">
                    <div className="relative flex-shrink-0">
                      <img src={i.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[9px] font-black flex items-center justify-center"
                        style={{ background: BRAND }}>
                        {i.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 truncate">{i.name}</p>
                      <p className="text-xs text-slate-400">{Number(i.price).toLocaleString()} RWF each</p>
                    </div>
                    <span className="font-black text-sm flex-shrink-0" style={{ color: BRAND }}>
                      {(i.price * i.quantity).toLocaleString()} RWF
                    </span>
                  </div>
                ))}
              </div>

              {/* totals */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-700">{Number(orderSummary.subtotal || 0).toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery fee</span>
                  <span className="font-medium text-slate-700">{Number(orderSummary.deliveryFee || 0).toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax</span>
                  <span className="font-medium text-slate-700">{Number(orderSummary.tax || 0).toLocaleString()} RWF</span>
                </div>
                {orderSummary.discount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span className="flex items-center gap-1.5">
                      <i className="fas fa-tag text-xs" /> Discount
                    </span>
                    <span>−{Number(orderSummary.discount).toLocaleString()} RWF</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center border-t-2 border-slate-100 pt-4 mt-4">
                <span className="font-black text-slate-800" style={{ fontFamily: 'Sora,sans-serif' }}>Total</span>
                <span className="text-xl font-black" style={{ color: BRAND, fontFamily: 'Sora,sans-serif' }}>
                  {Number(orderSummary.total || 0).toLocaleString()} RWF
                </span>
              </div>

              {/* promo code hint */}
              <div className="mt-5 p-3 rounded-xl border border-dashed border-slate-200 flex items-center gap-2 text-xs text-slate-400">
                <i className="fas fa-ticket-alt" style={{ color: BRAND }} />
                <span>Have a promo code? Apply it in your cart before checkout.</span>
              </div>

              {/* trust badges */}
              <div className="mt-5 flex justify-around text-center">
                {[
                  { icon: 'fa-lock',         label: 'Secure' },
                  { icon: 'fa-undo',         label: 'Easy Refund' },
                  { icon: 'fa-headset',      label: '24/7 Support' },
                ].map(b => (
                  <div key={b.label} className="flex flex-col items-center gap-1">
                    <i className={`fas ${b.icon} text-xs`} style={{ color: BRAND }} />
                    <span className="text-[10px] text-slate-400 font-medium">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </form>
      </section>

      {/* Payment confirmation modals */}
      {modalStep !== 'none' && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-sm">
          <div className="w-[420px] max-w-full bg-white rounded-[26px] border border-slate-100 shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}
              >
                <i
                  className={`fas ${
                    payment === 'mobile'
                      ? 'fa-mobile-alt'
                      : payment === 'bank'
                        ? 'fa-university'
                        : payment === 'cash'
                          ? 'fa-money-bill-wave'
                          : 'fa-credit-card'
                  } text-white`}
                />
              </div>
              <div>
                <div className="text-lg font-black text-slate-800">
                  {modalStep === 'confirm'
                    ? 'Confirm Payment'
                    : modalStep === 'processing'
                      ? 'Processing Payment…'
                      : 'Payment Done'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {payment === 'mobile'
                    ? 'Confirm using your phone (PayPack).'
                    : payment === 'bank'
                      ? 'Confirm using your bank transfer reference.'
                      : payment === 'cash'
                        ? 'Cash on delivery confirmation.'
                        : 'Confirm using your card provider / bank app.'}
                </div>
              </div>
            </div>

            {modalError && (
              <div className="mb-4 bg-red-50 border border-red-100 text-red-600 p-3 rounded-2xl text-sm font-medium">
                <i className="fas fa-exclamation-circle mr-2" />
                {modalError}
              </div>
            )}

            {modalStep === 'confirm' ? (
              <div className="space-y-4">
                <div className="text-sm text-slate-600 leading-relaxed">
                  You are about to place an order for{' '}
                  <span className="font-black" style={{ color: BRAND }}>
                    {Number(orderSummary.total || 0).toLocaleString()} RWF
                  </span>
                  .
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModalStep('none');
                      setModalError('');
                    }}
                    className="flex-1 py-3 rounded-2xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmPayment()}
                    disabled={loading}
                    className="flex-1 py-3 rounded-2xl font-black text-white transition"
                    style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}
                  >
                    {loading ? 'Working…' : 'Confirm'}
                  </button>
                </div>
              </div>
            ) : null}

            {modalStep === 'processing' ? (
              <div className="flex flex-col items-center justify-center gap-4 py-6">
                <span className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
                <div className="text-sm text-slate-600 font-medium">Please wait while we confirm your payment…</div>
              </div>
            ) : null}

            {modalStep === 'success' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <i className="fas fa-check-circle text-emerald-600" />
                  <div>
                    <div className="font-black text-emerald-700">Payment done successfully.</div>
                    <div className="text-xs text-slate-500 mt-1">Your order has been placed.</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalStep('none');
                    setModalError('');
                    navigate('/orders');
                  }}
                  className="w-full py-3 rounded-2xl font-black text-white transition"
                  style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}
                >
                  Go to Orders
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}