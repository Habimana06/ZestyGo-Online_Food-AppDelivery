import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import burgerImg from '../../image/burger-classic-cheese-rezept-removebg-preview.png';
import steakImg from '../../image/medium-rare-steak-removebg-preview.png';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';

const categories = [
  { id: 'pizza',   name: 'Pizza',    img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
  { id: 'burger',  name: 'Burgers',  img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
  { id: 'sushi',   name: 'Sushi',    img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400' },
  { id: 'chinese', name: 'Chinese',  img: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400' },
  { id: 'indian',  name: 'Indian',   img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400' },
  { id: 'dessert', name: 'Desserts', img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400' },
];

const HERO_SLIDES = [
  { title: 'Delicious Food', accent: 'Delivered Fast',    sub: 'Order from your favourite restaurants and get fresh, hot meals at your door in minutes.', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900', useImg: true  },
  { title: 'Crave the Classic', accent: 'Burger Stack',   sub: 'Juicy patties, melted cheese and a stack of flavour — ready for pickup or delivery.',        img: burgerImg, useImg: false },
  { title: 'Premium Cuts',   accent: 'Grilled to Order', sub: 'Restaurant-quality steaks and grills delivered straight from the kitchen to your table.',      img: steakImg,  useImg: false },
];

const TESTIMONIALS = [
  { text: 'Amazing service! The food arrived hot and fresh. Will definitely order again!', name: 'Sarah Johnson', role: 'Regular Customer', img: 'https://randomuser.me/api/portraits/women/1.jpg', stars: 5 },
  { text: 'Best food delivery app! Great variety of restaurants and super fast delivery.',  name: 'Michael Chen',  role: 'Food Enthusiast', img: 'https://randomuser.me/api/portraits/men/2.jpg',   stars: 5 },
  { text: 'Love the easy ordering process and the real-time tracking feature!',             name: 'Emily Davis',   role: 'Verified Buyer',  img: 'https://randomuser.me/api/portraits/women/3.jpg', stars: 5 },
];

/* ── Count-up with IntersectionObserver ── */
function useCountUp(target, dur = 1200) {
  const [v, setV]   = useState(0);
  const started     = useRef(false);
  const elRef       = useRef(null);
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let cur = 0;
        const step = target / (dur / 16);
        const t = setInterval(() => {
          cur += step;
          if (cur >= target) { setV(target); clearInterval(t); }
          else setV(Math.floor(cur));
        }, 16);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, dur]);
  return [v, elRef];
}

function StatNum({ num, suffix, label }) {
  const [v, ref] = useCountUp(num);
  return (
    <div ref={ref} className="text-center">
      <span className="block text-3xl lg:text-4xl font-black" style={{ fontFamily: 'Sora,sans-serif', color: BRAND }}>
        {v.toLocaleString()}{suffix}
      </span>
      <span className="text-gray-500 text-sm font-medium">{label}</span>
    </div>
  );
}

function FloatingBadge({ icon, title, sub, style }) {
  return (
    <div className="absolute bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 z-10" style={{ ...style, animation: 'bounceSlow 3s ease-in-out infinite' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${BRAND}18` }}>
        <i className={`fas ${icon} text-base`} style={{ color: BRAND }} />
      </div>
      <div>
        <div className="text-xs font-black text-slate-800" style={{ fontFamily: 'Sora,sans-serif' }}>{title}</div>
        <div className="text-[10px] text-slate-400 font-medium">{sub}</div>
      </div>
    </div>
  );
}

function RestaurantCard({ r }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={`/restaurant/${r.id}`}
      className="bg-white rounded-[20px] overflow-hidden border border-slate-100 block"
      style={{ transition: 'transform .3s, box-shadow .3s', transform: hov ? 'translateY(-6px)' : 'none', boxShadow: hov ? '0 20px 50px rgba(0,0,0,.1)' : '0 2px 12px rgba(0,0,0,.05)' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      <div className="relative h-44 overflow-hidden">
        <img src={r.image} alt={r.name} className="w-full h-full object-cover" style={{ transition: 'transform .5s', transform: hov ? 'scale(1.08)' : 'scale(1)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <span className="absolute top-3 left-3 text-white text-xs font-bold px-3 py-1 rounded-full" style={{ background: BRAND }}>{r.badge || 'Popular'}</span>
        {r.rating >= 4.5 && <span className="absolute top-3 right-3 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-full">⭐ Top</span>}
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: 'Sora,sans-serif' }}>{r.name}</h3>
          {r.isOpen !== false
            ? <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Open</span>
            : <span className="text-[10px] font-bold text-red-400 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">Closed</span>}
        </div>
        <p className="text-slate-400 text-xs mb-4">{r.cuisine}</p>
        <div className="flex gap-3 text-xs text-slate-500 flex-wrap">
          <span><i className="fas fa-star text-yellow-400 mr-1" /><strong className="text-slate-700">{r.rating}</strong></span>
          <span><i className="fas fa-clock mr-1 text-slate-300" />{r.deliveryTime}</span>
          <span><i className="fas fa-coins mr-1 text-slate-300" />Min {Number(r.minOrder || 0).toLocaleString()} RWF</span>
        </div>
      </div>
    </Link>
  );
}

function PromoBanner() {
  const [copied, setCopied] = useState(null);
  const copy = (code) => {
    navigator.clipboard.writeText(code).then(() => { setCopied(code); setTimeout(() => setCopied(null), 2000); });
  };
  const promos = [
    { bg: `linear-gradient(135deg,${BRAND},${BRAND_D})`, tag: 'New Users',       title: '50% OFF',       sub: 'your first order',           code: 'FIRST50', icon: 'fa-gift'  },
    { bg: 'linear-gradient(135deg,#1e293b,#334155)',      tag: 'Weekend Special', title: 'Free Delivery', sub: 'on orders above RWF 30,000', code: 'FREEDEL', icon: 'fa-truck' },
  ];
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {promos.map(p => (
        <div key={p.code} className="rounded-[24px] p-8 text-white relative overflow-hidden" style={{ background: p.bg }}>
          <div className="absolute w-48 h-48 rounded-full bg-white/5 -top-12 -right-12 pointer-events-none" />
          <div className="absolute w-28 h-28 rounded-full bg-white/5 -bottom-8 -left-6 pointer-events-none" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-white/20 border border-white/30 px-3 py-1 rounded-full text-xs font-bold mb-4">
              <i className={`fas ${p.icon} text-[10px]`} />{p.tag}
            </span>
            <h3 className="text-4xl font-black mb-1 leading-tight" style={{ fontFamily: 'Sora,sans-serif' }}>{p.title}</h3>
            <p className="text-white/80 mb-1">{p.sub}</p>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <code className="bg-white/20 border border-white/30 rounded-xl px-4 py-2 text-sm font-mono font-bold tracking-widest">{p.code}</code>
              <button onClick={() => copy(p.code)}
                className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition"
                style={{ color: BRAND }}>
                <i className={`fas ${copied === p.code ? 'fa-check text-green-500' : 'fa-copy'}`} />
                {copied === p.code ? 'Copied!' : 'Copy code'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════
   LOGIN PROMPT CARD
════════════════════════════════════════ */
function LoginPromptCard() {
  return (
    <div className="mx-1 my-2 rounded-2xl overflow-hidden shadow-md border border-orange-100"
      style={{ background: 'linear-gradient(135deg,#fff7ed,#fff)' }}>
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg,${BRAND},${BRAND_D},#ffb347)` }} />
      <div className="p-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 mx-auto"
          style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}>
          <i className="fas fa-lock text-white text-sm" />
        </div>
        <p className="text-center text-slate-800 font-bold text-sm mb-1" style={{ fontFamily: 'Sora,sans-serif' }}>
          Sign in Required
        </p>
        <p className="text-center text-slate-500 text-xs leading-relaxed mb-3">
          Please sign in as a customer to connect with our live support team.
        </p>
        <Link
          to="/login"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90"
          style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 4px 12px ${BRAND}40` }}
        >
          <i className="fas fa-sign-in-alt text-[11px]" />
          Sign In to Continue
        </Link>
      </div>
    </div>
  );
}

/* ── AI Chat widget ── */
function AIChat({ open, onClose }) {
  const [input, setInput]       = useState('');
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! I'm the ZestyGo AI assistant. Ask me anything about restaurants, delivery, or how to order." },
  ]);
  const [showLoginCard, setShowLoginCard] = useState(false);
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);
  const { user }                = useAuth();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading, showLoginCard]);

  const SUGGESTIONS = ['How do I place an order?', 'What are the delivery fees?', 'Popular restaurants?', 'What payment methods?'];

  const cannedAnswer = (q) => {
    const t = String(q || '').toLowerCase();
    if (!t.trim()) return null;
    if (t.includes('track') || t.includes('where is my order') || t.includes('order status'))
      return "You can track your order from the 'Orders' page. Open an order to see its latest status and updates.";
    if (t.includes('delivery fee') || t.includes('fee') || t.includes('shipping'))
      return 'Delivery fee is set by the restaurant during order acceptance and is included in your checkout total.';
    if (t.includes('refund') || t.includes('cancel'))
      return 'For cancellations/refunds, share your Order ID and a short explanation so our System Assistant can help.';
    if (t.includes('payment') || t.includes('mpesa') || t.includes('mobile money') || t.includes('cash'))
      return 'We support card, mobile money, and cash on delivery. The payment method is selected during checkout.';
    if (t.includes('popular') || t.includes('restaurants') || t.includes('where can i order') || t.includes('top restaurants'))
      return "Check the 'Restaurants' page to see our top picks, then open a restaurant to view its menu.";
    return null;
  };

  const escalateToSystemAssistant = async (question) => {
    const conv = await api.messages.conversations();
    const sa = Array.isArray(conv) ? conv.find((u) => u.role === 'system_assistant') : null;
    if (!sa?.id) throw new Error('No System Assistant available');
    await api.messages.send({
      toUserId: Number(sa.id),
      body: `[Human Assistant request]\nCustomer: ${user?.name || user?.email || user?.id}\nQuestion: ${question}`,
    });
  };

  const send = useCallback(async (text) => {
    const q = String(text || '').trim();
    if (!q || loading) return;
    setMessages((p) => [...p, { from: 'user', text: q }]);
    setInput('');
    setLoading(true);
    setShowLoginCard(false);
    try {
      const ans = cannedAnswer(q);
      if (ans) { setMessages((p) => [...p, { from: 'bot', text: ans }]); return; }
      setMessages((p) => [...p, { from: 'bot', text: "I'm not fully sure. Connecting you to a System Assistant…" }]);
      if (!user || user.role !== 'customer') { setShowLoginCard(true); return; }
      await escalateToSystemAssistant(q);
      setMessages((p) => [
        ...p,
        { from: 'bot', text: 'Done. The System Assistant will reply in your Messages inbox soon.' },
        { from: 'bot', text: 'Tip: if you have an Order ID, include it for faster help.' },
      ]);
    } catch {
      setMessages((p) => [...p, { from: 'bot', text: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [loading, user]);

  if (!open) return null;
  return (
    <div className="w-80 flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100" style={{ height: 430 }}>
      <div className="px-4 py-3 flex items-center justify-between text-white flex-shrink-0" style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <i className="fas fa-robot text-xs" />
          </div>
          <div>
            <div className="text-xs font-bold" style={{ fontFamily: 'Sora,sans-serif' }}>ZestyGo AI</div>
            <div className="text-[10px] text-white/70 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />Online · Auto answers + Escalation</div>
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition">
          <i className="fas fa-times text-xs" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50 text-sm">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.from === 'bot' && (
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: BRAND }}>
                <i className="fas fa-robot text-white" style={{ fontSize: 9 }} />
              </div>
            )}
            <div className={`max-w-[78%] px-3 py-2 rounded-2xl leading-relaxed text-sm ${m.from === 'user' ? 'text-white rounded-br-sm' : 'bg-white text-slate-700 rounded-bl-sm shadow-sm border border-slate-100'}`}
              style={m.from === 'user' ? { background: BRAND } : {}}>
              {m.text}
            </div>
          </div>
        ))}
        {showLoginCard && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: BRAND }}>
              <i className="fas fa-robot text-white" style={{ fontSize: 9 }} />
            </div>
            <div className="flex-1 max-w-[85%]"><LoginPromptCard /></div>
          </div>
        )}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: BRAND }}>
              <i className="fas fa-robot text-white" style={{ fontSize: 9 }} />
            </div>
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" style={{ animation: `bounce .8s ${i*150}ms infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {messages.length <= 1 && (
        <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5 bg-white border-t border-slate-100 flex-shrink-0">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)}
              className="text-[11px] px-2.5 py-1 rounded-full border font-medium transition"
              style={{ borderColor: BRAND, color: BRAND }}
              onMouseEnter={e => { e.currentTarget.style.background = BRAND; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = BRAND; }}
            >{s}</button>
          ))}
        </div>
      )}
      <form className="flex items-center gap-2 px-3 py-2 border-t border-slate-100 bg-white flex-shrink-0"
        onSubmit={e => { e.preventDefault(); send(input); }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask me anything…" disabled={loading}
          className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-full outline-none"
          onFocus={e => e.target.style.borderColor = BRAND} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
        <button type="submit" disabled={!input.trim() || loading}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all"
          style={{ background: !input.trim() || loading ? '#e2e8f0' : BRAND }}>
          <i className="fas fa-paper-plane text-[11px]" />
        </button>
      </form>
    </div>
  );
}

/* ════════════════════════════════════════
   RETRO DINER COUPON MODAL  (#7)
   — self-contained fixed overlay, no Modal wrapper
   — blurred blue-white backdrop, dark floating card
════════════════════════════════════════ */
function RetroCouponModal({ open, onClose, announcement, onClaim }) {
  const [countdown, setCountdown] = useState(12);
  const [copied, setCopied]       = useState(false);
  const [unlocked, setUnlocked]   = useState(false);

  useEffect(() => {
    if (!open) return;
    setCountdown(12);
    setCopied(false);
    setUnlocked(false);
  }, [open]);

  useEffect(() => {
    if (!open || unlocked) return;
    if (countdown <= 0) { setUnlocked(true); return; }
    const id = setInterval(() => setCountdown(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [open, countdown, unlocked]);

  const code     = announcement?.coupon_code || 'FIRST50';
  const headline = announcement?.headline    || 'NEW USERS GET 50% OFF FIRST ORDER';
  const message  = announcement?.message     || 'Limited seats — act fast before it expires.';

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!open) return null;

  const R    = 20;
  const circ = 2 * Math.PI * R;
  const offset = circ - circ * ((12 - countdown) / 12);

  return (
    <div className="rcm-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rcm-card">

        {/* hatch texture overlay */}
        <div className="rcm-hatch" />

        {/* corner bracket accents */}
        <div className="rcm-corner rcm-tl" /><div className="rcm-corner rcm-tr" />
        <div className="rcm-corner rcm-bl" /><div className="rcm-corner rcm-br" />

        {/* ── TOP: stars + eyebrow + headline ── */}
        <div className="rcm-top">
          <div className="rcm-stars">★ &nbsp; ★ &nbsp; ★</div>
          <div className="rcm-eyebrow">LIVE DEAL · LIMITED TIME</div>
          <h2 className="rcm-headline">{headline}</h2>
          <p className="rcm-sub">{message}</p>
        </div>

        {/* ── DIVIDER ── */}
        <div className="rcm-divider-row">
          <div className="rcm-notch-l" />
          <div className="rcm-dashes" />
          <div className="rcm-notch-r" />
        </div>

        {/* ── CODE ROW ── */}
        <div className="rcm-code-row">
          <div className="rcm-code-left">
            <i className="fas fa-ticket-alt rcm-ticket-icon" />
            <span className="rcm-code-text">{code}</span>
          </div>
          <button className={`rcm-copy-btn${copied ? ' rcm-copied' : ''}`} onClick={handleCopy}>
            <i className={`fas ${copied ? 'fa-check' : 'fa-clone'}`} />
            &nbsp;{copied ? 'COPIED!' : 'COPY'}
          </button>
        </div>

        {/* ── CTA ── */}
        <div className="rcm-footer">
          <p className="rcm-hint">
            {unlocked ? 'YOUR DEAL IS READY — CLAIM IT NOW' : `UNLOCKS IN ${countdown} SECOND${countdown !== 1 ? 'S' : ''}`}
          </p>
          <button
            className={`rcm-cta${unlocked ? ' rcm-cta-on' : ' rcm-cta-off'}`}
            disabled={!unlocked}
            onClick={() => { onClaim(); onClose(); }}
          >
            {unlocked ? (
              '▶ CLAIM MY DEAL'
            ) : (
              <span className="rcm-cta-inner">
                <svg width="38" height="38" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r={R} fill="none" stroke="rgba(245,98,48,.22)" strokeWidth="2.5"/>
                  <circle cx="22" cy="22" r={R} fill="none" stroke="#F56230" strokeWidth="2.5"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round" transform="rotate(-90 22 22)"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}/>
                  <text x="22" y="27" textAnchor="middle" fill="#F56230" fontSize="12" fontWeight="800"
                    fontFamily="'Courier New',monospace">{countdown}</text>
                </svg>
                PLEASE WAIT…
              </span>
            )}
          </button>
          <button className="rcm-dismiss" onClick={onClose}>maybe later</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   RETRO DINER NEWS TICKER  (#7)
════════════════════════════════════════ */
function RetroNewsTicker({ announcements }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animKey, setAnimKey]         = useState(0);

  useEffect(() => { setActiveIndex(0); setAnimKey(n => n + 1); }, [announcements]);

  if (!announcements.length) return null;

  const onAnimEnd = () => {
    if (announcements.length <= 1) return;
    setActiveIndex(i => (i + 1) % announcements.length);
    setAnimKey(n => n + 1);
  };

  const item = announcements[activeIndex];

  return (
    <div className="retro-ticker-rail">
      {/* left tag */}
      <div className="retro-ticker-tag">
        <span className="retro-ticker-live" />
        LIVE
      </div>

      {/* border accents */}
      <div className="retro-ticker-border-t" />
      <div className="retro-ticker-border-b" />

      {/* scrolling text */}
      <div className="retro-ticker-scroll-wrap">
        {announcements.length > 1 ? (
          <div
            key={animKey}
            className="retro-ticker-track"
            onAnimationEnd={onAnimEnd}
          >
            <span className="retro-ticker-item">
              ★&nbsp;&nbsp;{item?.headline}
              {item?.coupon_code && (
                <>&nbsp;—&nbsp;USE CODE&nbsp;<code className="retro-ticker-code">{item.coupon_code}</code></>
              )}
              {item?.cta_text && (
                <>&nbsp;·&nbsp;
                  <Link to={item.cta_path || '/menu'} className="retro-ticker-link">
                    {item.cta_text}&nbsp;→
                  </Link>
                </>
              )}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;
              {item?.headline}
              {item?.coupon_code && (
                <>&nbsp;—&nbsp;USE CODE&nbsp;<code className="retro-ticker-code">{item.coupon_code}</code></>
              )}
            </span>
          </div>
        ) : (
          <div className="retro-ticker-static">
            <span className="retro-ticker-item">
              ★&nbsp;&nbsp;{item?.headline}
              {item?.coupon_code && (
                <>&nbsp;—&nbsp;USE CODE&nbsp;<code className="retro-ticker-code">{item.coupon_code}</code></>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const { user } = useAuth();
  const [restaurants, setRestaurants]       = useState([]);
  const [heroIndex, setHeroIndex]           = useState(0);
  const [chatOpen, setChatOpen]             = useState(false);
  const [address, setAddress]               = useState('');
  const [showAll, setShowAll]               = useState(false);
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [foodTypes, setFoodTypes]           = useState([]);
  const [announcements, setAnnouncements]   = useState([]);
  const [couponOpen, setCouponOpen]         = useState(false);
  const [popupAnnouncement, setPopupAnnouncement] = useState(null);
  const [burstOn, setBurstOn]               = useState(false);
  const [burstDurationMs, setBurstDurationMs] = useState(6500);

  useEffect(() => { api.restaurants.getAll().then(setRestaurants).catch(() => setRestaurants([])); }, []);
  useEffect(() => { api.reviews.getApproved().then(setApprovedReviews).catch(() => setApprovedReviews([])); }, []);
  useEffect(() => {
    api.catalog.getFoodTypes().then(list => setFoodTypes(Array.isArray(list) ? list : [])).catch(() => setFoodTypes([]));
  }, []);
  useEffect(() => {
    api.announcements.getActive()
      .then(list => setAnnouncements(Array.isArray(list) ? list : []))
      .catch(() => setAnnouncements([]));
  }, []);

  /* welcome popup */
  useEffect(() => {
    if (!user || user.role !== 'customer') return;
    const pending = localStorage.getItem('customer_welcome_popup_pending') === '1';
    if (!pending) return;
    const waitMs = 5000 + Math.floor(Math.random() * 5001);
    const id = window.setTimeout(() => {
      const picked = announcements.find(a => a?.coupon_code) || announcements[0] || null;
      setPopupAnnouncement(picked);
      setCouponOpen(true);
      localStorage.removeItem('customer_welcome_popup_pending');
    }, waitMs);
    return () => clearTimeout(id);
  }, [user, announcements]);

  const handleClaim = () => {
    const duration = 10000 + Math.floor(Math.random() * 5001);
    setBurstDurationMs(duration);
    setBurstOn(true);
    window.setTimeout(() => setBurstOn(false), duration);
  };

  useEffect(() => {
    const id = setInterval(() => setHeroIndex(i => (i + 1) % HERO_SLIDES.length), 8000);
    return () => clearInterval(id);
  }, []);

  const featured = restaurants.slice(0, showAll ? 8 : 4);
  const slide    = HERO_SLIDES[heroIndex];

  const testimonialsToShow = approvedReviews.length
    ? approvedReviews.map(t => ({ text: t.text, name: t.customerName, role: t.customerRole, img: t.customerAvatar, stars: t.stars }))
    : TESTIMONIALS;

  const categoriesToShow = foodTypes.length
    ? foodTypes.map(t => ({ id: t.slug, name: t.label, img: categories.find(c => c.id === t.slug)?.img || categories[0]?.img }))
    : categories;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=Courier+Prime:wght@400;700&display=swap');

        /* ─── SHARED ─── */
        @keyframes bounceSlow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeSlide  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .hero-content { animation: fadeSlide .5s ease both; }

        /* ══════════════════════════════════
           RETRO DINER NEWS TICKER
        ══════════════════════════════════ */
        .retro-ticker-rail {
          position: relative;
          display: flex;
          align-items: stretch;
          background: #0d0500;
          overflow: hidden;
          height: 42px;
        }
        .retro-ticker-border-t {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: repeating-linear-gradient(90deg,#F56230 0,#F56230 6px,transparent 6px,transparent 12px);
          opacity: .5;
        }
        .retro-ticker-border-b {
          position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
          background: repeating-linear-gradient(90deg,#F56230 0,#F56230 6px,transparent 6px,transparent 12px);
          opacity: .5;
        }
        .retro-ticker-tag {
          display: flex; align-items: center; gap: 7px;
          background: #F56230; color: #0d0500;
          font-family: 'Courier Prime', 'Courier New', monospace;
          font-size: 11px; font-weight: 700; letter-spacing: .12em;
          padding: 0 18px; flex-shrink: 0; z-index: 2;
          border-right: 2px solid rgba(245,98,48,.4);
        }
        .retro-ticker-live {
          width: 7px; height: 7px; border-radius: 50%; background: #0d0500;
          animation: retroBlink 1.2s ease-in-out infinite;
        }
        @keyframes retroBlink { 0%,100%{opacity:1} 50%{opacity:.2} }
        .retro-ticker-scroll-wrap { overflow: hidden; flex: 1; display: flex; align-items: center; position: relative; }
        .retro-ticker-track {
          display: inline-flex; white-space: nowrap;
          animation: retroCrawl 24s linear both;
        }
        @keyframes retroCrawl { from{transform:translateX(100%)} to{transform:translateX(-100%)} }
        .retro-ticker-static { display: flex; align-items: center; padding-left: 20px; }
        .retro-ticker-item {
          font-family: 'Courier Prime', 'Courier New', monospace;
          font-size: 12px; color: rgba(245,185,130,.75); letter-spacing: .04em;
        }
        .retro-ticker-code {
          font-family: 'Courier Prime', 'Courier New', monospace;
          font-size: 12px; font-weight: 700; color: #F56230;
          background: rgba(245,98,48,.14); border: 1px solid rgba(245,98,48,.3);
          padding: 1px 6px; border-radius: 3px; margin: 0 2px;
        }
        .retro-ticker-link {
          color: #F56230; font-weight: 700; text-decoration: underline;
          text-underline-offset: 2px;
        }

        /* ══════════════════════════════════
           RETRO DINER COUPON — fixed overlay
           no white card · blurred blue-white backdrop
        ══════════════════════════════════ */

        /* ── backdrop: very subtle dark overlay, page shows through clearly ── */
        .rcm-backdrop {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          background: rgba(10, 6, 2, 0.72);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          padding: 20px;
        }

        /* ── card: wide, flat, landscape-ish like screenshot ── */
        .rcm-card {
          position: relative;
          width: 100%;
          max-width: 580px;
          background: #0f0700;
          border: 2px solid #F56230;
          border-radius: 12px;
          overflow: hidden;
          padding: 26px 32px 20px;
          animation: rcmPop .4s cubic-bezier(.34,1.56,.64,1) both;
          box-shadow:
            0 0 0 1px rgba(245,98,48,.12),
            0 24px 60px rgba(0,0,0,.7),
            0 0 40px rgba(245,98,48,.06);
        }
        @keyframes rcmPop {
          from { transform: scale(.88) translateY(14px); opacity: 0; }
          to   { transform: scale(1)   translateY(0);    opacity: 1; }
        }

        /* hatched texture — matches screenshot diagonal lines */
        .rcm-hatch {
          position: absolute; inset: 0; pointer-events: none; opacity: .07;
          background-image: repeating-linear-gradient(
            45deg, #F56230 0, #F56230 1px, transparent 0, transparent 50%
          );
          background-size: 12px 12px;
        }

        /* corner brackets */
        .rcm-corner {
          position: absolute; width: 14px; height: 14px;
          border-color: #F56230; border-style: solid;
        }
        .rcm-tl { top: 9px;  left: 9px;  border-width: 2px 0 0 2px; }
        .rcm-tr { top: 9px;  right: 9px; border-width: 2px 2px 0 0; }
        .rcm-bl { bottom: 9px; left: 9px;  border-width: 0 0 2px 2px; }
        .rcm-br { bottom: 9px; right: 9px; border-width: 0 2px 2px 0; }

        /* top section */
        .rcm-top { position: relative; z-index: 2; text-align: center; margin-bottom: 14px; }
        .rcm-stars {
          font-size: 12px; color: #F56230; letter-spacing: 6px; margin-bottom: 5px;
          animation: rcmStarPulse 2s ease-in-out infinite;
        }
        @keyframes rcmStarPulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        .rcm-eyebrow {
          font-family: 'Courier Prime','Courier New',monospace;
          font-size: 9px; font-weight: 700; letter-spacing: .22em;
          color: rgba(245,98,48,.5); margin-bottom: 8px; text-transform: uppercase;
        }
        .rcm-headline {
          font-family: 'Courier Prime','Courier New',monospace;
          font-size: clamp(14px, 2.8vw, 20px); font-weight: 700;
          color: #fff; line-height: 1.2;
          text-transform: uppercase; letter-spacing: .03em; margin-bottom: 5px;
        }
        .rcm-sub {
          font-family: 'Courier Prime','Courier New',monospace;
          font-size: 10.5px; color: rgba(255,255,255,.32); line-height: 1.5;
        }

        /* dashed ticket divider — notches cut into the card edge */
        .rcm-divider-row {
          position: relative; z-index: 2;
          display: flex; align-items: center;
          margin: 0 -32px 14px;
        }
        .rcm-notch-l, .rcm-notch-r {
          width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
          /* same dark as page backdrop so it looks cut out */
          background: rgba(10,6,2,.85);
          border: 2px solid #F56230;
        }
        .rcm-dashes {
          flex: 1; height: 1.5px;
          background: repeating-linear-gradient(
            90deg, rgba(245,98,48,.55) 0, rgba(245,98,48,.55) 5px,
            transparent 5px, transparent 11px
          );
        }

        /* code row */
        .rcm-code-row {
          position: relative; z-index: 2;
          display: flex; align-items: center; justify-content: space-between;
          border: 2px solid #F56230; border-radius: 5px;
          background: #180b00; padding: 11px 14px; margin-bottom: 14px;
          animation: rcmCodePulse 2.6s ease-in-out infinite;
        }
        @keyframes rcmCodePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(245,98,48,.15); }
          55%     { box-shadow: 0 0 0 5px rgba(245,98,48,0); }
        }
        .rcm-code-left { display: flex; align-items: center; gap: 10px; }
        .rcm-ticket-icon { color: #F56230; font-size: 16px; }
        .rcm-code-text {
          font-family: 'Courier Prime','Courier New',monospace;
          font-size: 22px; font-weight: 700; color: #F56230;
          letter-spacing: .14em; text-shadow: 0 0 10px rgba(245,98,48,.28);
        }
        .rcm-copy-btn {
          display: flex; align-items: center; gap: 5px;
          background: #F56230; color: #0d0500; border: none;
          font-family: 'Courier Prime','Courier New',monospace;
          font-size: 11px; font-weight: 700; letter-spacing: .1em;
          padding: 8px 16px; border-radius: 4px; cursor: pointer;
          transition: background .18s, transform .12s; text-transform: uppercase;
        }
        .rcm-copy-btn:hover { background: #d94e22; transform: scale(1.04); }
        .rcm-copied { background: #16a34a !important; }

        /* footer */
        .rcm-footer { position: relative; z-index: 2; }
        .rcm-hint {
          font-family: 'Courier Prime','Courier New',monospace;
          text-align: center; font-size: 9px; letter-spacing: .16em;
          color: rgba(245,98,48,.42); margin-bottom: 10px; text-transform: uppercase;
        }
        .rcm-cta {
          width: 100%; border: none; border-radius: 5px;
          font-family: 'Courier Prime','Courier New',monospace;
          font-size: 15px; font-weight: 700; letter-spacing: .1em;
          padding: 14px; cursor: pointer; transition: all .2s;
          text-transform: uppercase;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .rcm-cta-on {
          background: #F56230; color: #0d0500;
          box-shadow: 0 0 0 2px #F56230, 0 0 20px rgba(245,98,48,.38);
        }
        .rcm-cta-on:hover { background: #d94e22; transform: translateY(-1px); }
        .rcm-cta-off {
          background: rgba(245,98,48,.07);
          color: rgba(245,98,48,.38);
          border: 1px solid rgba(245,98,48,.18);
          cursor: default;
        }
        .rcm-cta-inner { display: flex; align-items: center; gap: 10px; }
        .rcm-dismiss {
          display: block; margin: 12px auto 0; background: none; border: none;
          font-family: 'Courier Prime','Courier New',monospace;
          font-size: 10px; color: rgba(245,98,48,.28); cursor: pointer;
          letter-spacing: .1em; transition: color .15s;
        }
        .rcm-dismiss:hover { color: rgba(245,98,48,.6); }

        /* ── BURST ANIMATION ── */
        @keyframes burstFallA {
          0%   { transform: translateY(-10vh) rotate(0deg) scale(1);    opacity:1; }
          80%  { opacity:.8; }
          100% { transform: translateY(110vh) rotate(480deg) scale(.5); opacity:0; }
        }
        @keyframes burstFallB {
          0%   { transform: translateY(-10vh) rotate(0deg) scale(1);    opacity:1; }
          70%  { opacity:.9; }
          100% { transform: translateY(108vh) rotate(-360deg) scale(.6); opacity:0; }
        }
        .burst-wrap { pointer-events:none; position:fixed; inset:0; z-index:1100; overflow:hidden; }
        .burst-piece { position:absolute; animation-timing-function:cubic-bezier(.25,.46,.45,.94); animation-iteration-count:1; animation-fill-mode:forwards; }
        .burst-piece.type-rect  { border-radius:2px; }
        .burst-piece.type-round { border-radius:50%; }
        .burst-piece.type-star  { clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%); }
      `}</style>

      {/* ════ RETRO DINER COUPON MODAL ════ */}
      <RetroCouponModal
        open={couponOpen}
        onClose={() => setCouponOpen(false)}
        announcement={popupAnnouncement}
        onClaim={handleClaim}
      />

      {/* ════ BURST ════ */}
      {burstOn && (
        <div className="burst-wrap">
          {Array.from({ length: 110 }).map((_, i) => {
            const palette = ['#F56230','#ffb347','#ffd700','#ff6b35','#fff7ed','#e11d48','#fb923c','#fbbf24'];
            const color   = palette[i % palette.length];
            const types   = ['type-rect','type-round','type-star'];
            const type    = types[i % types.length];
            const size    = type === 'type-star' ? 12 + (i % 5)*2 : type === 'type-round' ? 7 + (i%4)*3 : 8 + (i%6)*2;
            return (
              <span key={i} className={`burst-piece ${type}`} style={{
                left: `${(i*11+(i%7)*3)%100}%`, top: `-${(i%18)*20+10}px`,
                width: size, height: type === 'type-rect' ? size*.45 : size,
                background: color,
                animationName: i%2===0 ? 'burstFallA' : 'burstFallB',
                animationDelay: `${(i%28)*.08}s`,
                animationDuration: `${1.4+(i%9)*.28}s`,
                opacity: 0,
              }} />
            );
          })}
        </div>
      )}

      {/* ════ RETRO DINER NEWS TICKER ════ */}
      <RetroNewsTicker announcements={announcements} />

      {/* ════ HERO ════ */}
      <section className="max-w-[1200px] mx-auto px-5 py-14 grid lg:grid-cols-2 gap-14 items-center" style={{ minHeight: 'calc(100vh - 72px - 42px)' }}>
        <div key={heroIndex} className="hero-content">
          <span className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-5 border" style={{ color: BRAND, background: `${BRAND}10`, borderColor: `${BRAND}30` }}>
            <span className="w-2 h-2 rounded-full" style={{ background: BRAND, animation: 'pulse 2s infinite' }} />
            🍴 Fast delivery across Kigali
          </span>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-800 mb-4 leading-tight" style={{ fontFamily: 'Sora,sans-serif' }}>
            {slide.title}{' '}
            <span style={{ color: BRAND }}>{slide.accent}</span>
          </h1>
          <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-md">{slide.sub}</p>
          <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-white rounded-2xl px-4 py-2 mb-8 border border-slate-200"
            style={{ boxShadow: '0 8px 40px rgba(0,0,0,.08)' }}>
            <i className="fas fa-map-marker-alt self-center mx-1 flex-shrink-0" style={{ color: BRAND }} />
            <input
              type="text" placeholder="Enter your delivery address…"
              value={address} onChange={e => setAddress(e.target.value)}
              className="flex-1 border-none outline-none py-3 px-2 text-sm text-slate-700 bg-transparent"
            />
            <Link
              to={`/menu${address ? `?address=${encodeURIComponent(address)}` : ''}`}
              className="flex items-center justify-center gap-2 px-7 py-3 text-white font-bold text-sm rounded-xl transition"
              style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 4px 14px ${BRAND}40` }}
            >
              <i className="fas fa-search text-xs" /> Find Food
            </Link>
          </div>
          <div className="flex gap-8 flex-wrap">
            <StatNum num={500}   suffix="+" label="Restaurants"      />
            <StatNum num={10000} suffix="+" label="Happy Customers"  />
            <StatNum num={50000} suffix="+" label="Orders Delivered" />
          </div>
          <div className="flex gap-2 mt-8">
            {HERO_SLIDES.map((_, i) => (
              <button key={i} onClick={() => setHeroIndex(i)}
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: i === heroIndex ? 28 : 8, background: i === heroIndex ? BRAND : '#e2e8f0' }}
              />
            ))}
          </div>
        </div>
        <div className="hidden lg:block relative" style={{ height: 440 }}>
          {slide.useImg ? (
            <div key={heroIndex} className="h-full rounded-[28px] overflow-hidden" style={{ boxShadow: '0 24px 80px rgba(0,0,0,.14)' }}>
              <img src={slide.img} alt="Food" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-[28px]" />
            </div>
          ) : (
            <div key={heroIndex} className="h-full flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full opacity-10 blur-3xl" style={{ background: BRAND }} />
              <img src={slide.img} alt="Featured" className="relative z-10 w-full h-full object-contain"
                style={{ filter: 'drop-shadow(0 24px 48px rgba(245,98,48,.25))' }} />
            </div>
          )}
          <FloatingBadge icon="fa-fire"       title="Trending Now" sub="Burgers & Pizza"  style={{ top: '8%',   left: '-8%',  animationDelay: '0s'   }} />
          <FloatingBadge icon="fa-motorcycle" title="30 min avg"   sub="Delivery time"    style={{ bottom: '18%', right: '-6%', animationDelay: '.6s' }} />
          <FloatingBadge icon="fa-star"       title="4.9 Rating"   sub="8,400+ reviews"   style={{ bottom: '4%',  left: '4%',   animationDelay: '1.2s' }} />
        </div>
      </section>

      {/* ════ HOW IT WORKS ════ */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-5">
          <p className="text-center text-xs font-bold tracking-widest uppercase mb-3" style={{ color: BRAND }}>Simple Process</p>
          <h2 className="text-center text-4xl font-black text-slate-800 mb-2" style={{ fontFamily: 'Sora,sans-serif' }}>How It Works</h2>
          <p className="text-center text-slate-500 mb-14 max-w-md mx-auto">Order your favourite food in 3 simple steps and have it at your door fast.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: 'fa-map-marker-alt', step: '01', title: 'Choose Location',  desc: 'Enter your delivery address to find restaurants near you.' },
              { icon: 'fa-hamburger',      step: '02', title: 'Select Your Food', desc: 'Browse menus, customise items, and add your favourites to cart.' },
              { icon: 'fa-truck',          step: '03', title: 'Fast Delivery',    desc: 'Confirm & pay — food delivered hot and fresh straight to your doorstep.' },
            ].map(s => (
              <div key={s.step} className="text-center p-8 rounded-[24px] bg-white border border-slate-100 group hover:-translate-y-2 transition-all duration-300 hover:shadow-xl relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-1 rounded-full text-white" style={{ background: BRAND }}>Step {s.step}</div>
                <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}>
                  <i className={`fas ${s.icon} text-3xl text-white`} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2" style={{ fontFamily: 'Sora,sans-serif' }}>{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ FEATURED RESTAURANTS ════ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex flex-wrap justify-between items-end mb-12 gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: BRAND }}>Top Picks</p>
              <h2 className="text-4xl font-black text-slate-800" style={{ fontFamily: 'Sora,sans-serif' }}>Featured Restaurants</h2>
            </div>
            <Link to="/restaurants" className="flex items-center gap-2 text-sm font-bold" style={{ color: BRAND }}>View all <i className="fas fa-arrow-right text-xs" /></Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {featured.map(r => <RestaurantCard key={r.id} r={r} />)}
          </div>
          {restaurants.length > 4 && (
            <div className="text-center">
              <button onClick={() => setShowAll(v => !v)}
                className="inline-flex items-center gap-2 px-8 py-3.5 font-bold text-sm rounded-xl text-white"
                style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 6px 20px ${BRAND}33` }}>
                <i className={`fas ${showAll ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
                {showAll ? 'Show Less' : `Show ${restaurants.length - 4} More`}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ════ CATEGORIES ════ */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-5">
          <p className="text-center text-xs font-bold tracking-widest uppercase mb-2" style={{ color: BRAND }}>Browse by Type</p>
          <h2 className="text-center text-4xl font-black text-slate-800 mb-2" style={{ fontFamily: 'Sora,sans-serif' }}>Popular Categories</h2>
          <p className="text-center text-slate-500 mb-12">Explore food by category — find exactly what you're craving</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoriesToShow.map(c => (
              <Link key={c.id} to={`/menu?category=${c.id}`} className="relative h-48 rounded-[20px] overflow-hidden group">
                <img src={c.img} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-bold text-base text-white" style={{ fontFamily: 'Sora,sans-serif' }}>{c.name}</h3>
                  <span className="text-xs text-white/70">25+ options</span>
                </div>
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <i className="fas fa-arrow-right text-white text-xs" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════ PROMOS ════ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-[1200px] mx-auto px-5">
          <p className="text-center text-xs font-bold tracking-widest uppercase mb-2" style={{ color: BRAND }}>Deals & Offers</p>
          <h2 className="text-center text-4xl font-black text-slate-800 mb-2" style={{ fontFamily: 'Sora,sans-serif' }}>Special Offers</h2>
          <p className="text-center text-slate-500 mb-12">Click to copy the promo code and save on your next order</p>
          <PromoBanner />
        </div>
      </section>

      {/* ════ TESTIMONIALS ════ */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-5">
          <p className="text-center text-xs font-bold tracking-widest uppercase mb-2" style={{ color: BRAND }}>Reviews</p>
          <h2 className="text-center text-4xl font-black text-slate-800 mb-2" style={{ fontFamily: 'Sora,sans-serif' }}>What Customers Say</h2>
          <p className="text-center text-slate-500 mb-12">Real reviews from real ZestyGo customers</p>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonialsToShow.map(t => (
              <div key={t.name} className="bg-slate-50 border border-slate-100 p-7 rounded-[24px] hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="flex gap-0.5 mb-4">{[...Array(t.stars)].map((_,j) => <i key={j} className="fas fa-star text-yellow-400 text-sm" />)}</div>
                <p className="text-slate-600 italic mb-6 leading-relaxed text-sm">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.img} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm" style={{ fontFamily: 'Sora,sans-serif' }}>{t.name}</h4>
                    <span className="text-xs text-slate-400">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ APP DOWNLOAD ════ */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg,#1e293b,#334155)' }}>
        <div className="max-w-[1200px] mx-auto px-5 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-5 border border-white/20 text-white/60">Coming Soon</span>
            <h2 className="text-4xl font-black text-white mb-4 leading-tight" style={{ fontFamily: 'Sora,sans-serif' }}>
              Download the<br />ZestyGo App
            </h2>
            <p className="text-white/70 mb-8 leading-relaxed">Get exclusive app-only deals, real-time order tracking, and reorder your favourites with one tap.</p>
            <div className="flex flex-wrap gap-4">
              {[
                { icon: 'fa-apple',       store: 'App Store',   sub: 'Download on the' },
                { icon: 'fa-google-play', store: 'Google Play', sub: 'Get it on' },
              ].map(a => (
                <a key={a.store} href="#" className="flex items-center gap-3 bg-white/10 border border-white/20 px-5 py-3 rounded-2xl hover:bg-white/20 transition">
                  <i className={`fab ${a.icon} text-3xl text-white`} />
                  <div>
                    <span className="block text-[10px] text-white/60">{a.sub}</span>
                    <strong className="text-white text-sm">{a.store}</strong>
                  </div>
                </a>
              ))}
            </div>
          </div>
          <div className="hidden lg:block">
            <img src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500" alt="App" className="rounded-[24px] shadow-2xl w-full object-cover" style={{ maxHeight: 380 }} />
          </div>
        </div>
      </section>

      {/* ════ FLOATING CHAT ════ */}
      <div className="fixed bottom-6 right-6 z-[1200] flex flex-col items-end gap-3">
        <AIChat open={chatOpen} onClose={() => setChatOpen(false)} />
        <button
          onClick={() => setChatOpen(v => !v)}
          className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}
          title="Chat with ZestyGo AI"
        >
          <i className={`fas ${chatOpen ? 'fa-times' : 'fa-robot'} text-xl`} />
        </button>
      </div>
    </>
  );
}