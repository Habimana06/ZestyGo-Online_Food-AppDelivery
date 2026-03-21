import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';
const CUSTOMER_HERO_BG = 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1600&auto=format&fit=crop&q=80';

const VALUES = [
  { icon: 'fa-heart',       title: 'Customer First',      desc: 'We put our customers at the heart of everything we do.'          },
  { icon: 'fa-bolt',        title: 'Speed & Reliability', desc: 'Fast delivery and consistent service you can count on.'          },
  { icon: 'fa-leaf',        title: 'Quality & Freshness', desc: 'We partner with restaurants committed to quality.'               },
  { icon: 'fa-handshake',   title: 'Partnership',         desc: 'We grow together with our restaurant partners.'                  },
  { icon: 'fa-shield-alt',  title: 'Trust & Safety',      desc: 'Your safety and security are our top priorities.'               },
  { icon: 'fa-globe',       title: 'Sustainability',       desc: 'Committed to reducing our environmental impact.'                },
];

const STATS = [
  { num: 500,   suffix: '+', label: 'Restaurant Partners' },
  { num: 10000, suffix: '+', label: 'Happy Customers'     },
  { num: 50000, suffix: '+', label: 'Orders Delivered'    },
  { num: 4.8,   suffix: '',  label: 'Average Rating'      },
];

const TEAM = [
  { name: 'Amara Nkusi',    role: 'CEO & Co-founder',     img: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { name: 'David Mugisha',  role: 'CTO & Co-founder',     img: 'https://randomuser.me/api/portraits/men/32.jpg'   },
  { name: 'Claire Uwase',   role: 'Head of Operations',   img: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { name: 'Eric Habimana',  role: 'Head of Partnerships', img: 'https://randomuser.me/api/portraits/men/75.jpg'   },
];

const FALLBACK_ABOUT_STORY_PARAS = [
  'ZestyGo was founded with a simple idea: make ordering food as exciting as eating it. We believe great food with bold flavours should be accessible to everyone, anywhere, anytime.',
  'Today we serve thousands of customers across Kigali, partnering with top local restaurants to bring you the widest selection of cuisines — from classic Rwandan comfort food to international favourites.',
];

/* ── Count-up with IntersectionObserver ── */
function useCountUp(target, dur = 1400) {
  const [v, setV]   = useState(0);
  const started     = useRef(false);
  const elRef       = useRef(null);
  const isDecimal   = !Number.isInteger(target);

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
          else setV(isDecimal ? Math.round(cur * 10) / 10 : Math.floor(cur));
        }, 16);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, dur, isDecimal]);

  return [v, elRef];
}

function StatCard({ num, suffix, label }) {
  const [v, ref] = useCountUp(num);
  return (
    <div ref={ref} className="text-center p-8 rounded-[24px] border border-white/10"
      style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
      <div className="text-4xl lg:text-5xl font-black text-white mb-2" style={{ fontFamily: 'Sora,sans-serif' }}>
        {typeof num === 'number' && !Number.isInteger(num) ? v.toFixed(1) : v.toLocaleString()}{suffix}
      </div>
      <p className="text-white/50 text-sm font-medium">{label}</p>
    </div>
  );
}

/* ── Value card ── */
function ValueCard({ v, index }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="bg-white p-8 rounded-[24px] border border-slate-100 text-center transition-all duration-300"
      style={{
        transform: hov ? 'translateY(-6px)' : 'none',
        boxShadow: hov ? '0 20px 50px rgba(0,0,0,.1)' : '0 2px 12px rgba(0,0,0,.05)',
        animationDelay: `${index * 80}ms`,
        animation: 'cardIn .5s ease both',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div
        className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center transition-transform duration-300"
        style={{
          background: `linear-gradient(135deg,${BRAND},${BRAND_D})`,
          transform: hov ? 'scale(1.1) rotate(-4deg)' : 'scale(1)',
          boxShadow: hov ? `0 8px 24px ${BRAND}44` : 'none',
        }}
      >
        <i className={`fas ${v.icon} text-3xl text-white`} />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2" style={{ fontFamily: 'Sora,sans-serif' }}>{v.title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
    </div>
  );
}

/* ── Team card ── */
function TeamCard({ member, index }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="bg-white rounded-[24px] border border-slate-100 overflow-hidden text-center transition-all duration-300"
      style={{
        transform: hov ? 'translateY(-6px)' : 'none',
        boxShadow: hov ? '0 20px 50px rgba(0,0,0,.1)' : '0 2px 12px rgba(0,0,0,.05)',
        animationDelay: `${index * 100}ms`,
        animation: 'cardIn .5s ease both',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div className="h-3 w-full" style={{ background: `linear-gradient(90deg,${BRAND},${BRAND_D})` }} />
      <div className="p-7">
        <img
          src={member.img}
          alt={member.name}
          className="w-20 h-20 rounded-full object-cover mx-auto mb-4 ring-4 ring-white shadow-lg"
          style={{ transition: 'transform .3s', transform: hov ? 'scale(1.06)' : 'scale(1)' }}
        />
        <h4 className="font-bold text-slate-800 mb-1" style={{ fontFamily: 'Sora,sans-serif' }}>{member.name}</h4>
        <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: `${BRAND}10`, color: BRAND }}>
          {member.role}
        </span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════════════ */
export default function About() {
  const { user } = useAuth();
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [stars, setStars] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [siteContent, setSiteContent] = useState(null);

  useEffect(() => {
    api.reviews.getApproved().then(setApprovedReviews).catch(() => setApprovedReviews([]));
  }, []);

  useEffect(() => {
    api.site.getContent()
      .then((d) => setSiteContent(d))
      .catch(() => setSiteContent(null));
  }, []);

  const aboutStoryParas = siteContent?.content?.aboutStory
    ? String(siteContent.content.aboutStory)
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean)
    : FALLBACK_ABOUT_STORY_PARAS;

  const aboutImageUrl = siteContent?.content?.aboutImageUrl || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600';

  const teamToShow = siteContent?.team?.length
    ? (() => {
        // Dedupe in case DB has repeated rows (happens if server was restarted before unique seeds).
        const seen = new Set();
        const deduped = [];
        for (const t of siteContent.team) {
          const key = `${t.name || ''}__${t.role || ''}`.trim();
          if (!key || seen.has(key)) continue;
          seen.add(key);
          deduped.push(t);
        }

        return deduped.map((t) => ({
          name: t.name,
          role: t.role,
          img: t.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=F56230&color=fff&bold=true`,
        }));
      })()
    : TEAM;

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitMsg('');
    if (!user) return setSubmitMsg('Please sign in as a customer to submit a review.');
    if (user.role !== 'customer') return setSubmitMsg('Only customer accounts can submit reviews.');

    const text = String(reviewText || '').trim();
    if (!text) return setSubmitMsg('Please write a review.');

    setSubmitBusy(true);
    try {
      await api.reviews.create({ stars, reviewText: text });
      setReviewText('');
      setStars(5);
      setSubmitMsg('Thanks! Your review has been submitted for approval.');
    } catch (err) {
      setSubmitMsg(err.message || 'Failed to submit review');
    } finally {
      setSubmitBusy(false);
    }
  };

  const canSubmit = !!user && user.role === 'customer';
  const testimonialsToShow = approvedReviews;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        @keyframes cardIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden py-28 text-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(30,41,59,.95) 0%, rgba(51,65,85,.92) 55%, rgba(30,41,59,.95) 100%), url(${CUSTOMER_HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: BRAND }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-5 blur-3xl pointer-events-none" style={{ background: BRAND }} />

        <div className="max-w-[1200px] mx-auto px-5 relative z-10" style={{ animation: 'fadeSlide .6s ease both' }}>
          <span className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-6 border"
            style={{ color: BRAND, background: `${BRAND}15`, borderColor: `${BRAND}30` }}>
            <span className="w-2 h-2 rounded-full" style={{ background: BRAND, animation: 'pulse 2s infinite' }} />
            🍴 Delivering bold flavours since 2022
          </span>
          <h1 className="text-5xl lg:text-6xl font-black text-white mb-6 leading-tight" style={{ fontFamily: 'Sora,sans-serif' }}>
            About <span style={{ color: BRAND }}>ZestyGo</span>
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            We're on a mission to bring bold, zesty flavours to your doorstep — one meal at a time, across Kigali and beyond.
          </p>
        </div>
      </section>

      {/* ── OUR STORY ── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-5 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: BRAND }}>Who We Are</p>
            <h2 className="text-4xl font-black text-slate-800 mb-6 leading-tight" style={{ fontFamily: 'Sora,sans-serif' }}>
              Our Story
            </h2>
            {aboutStoryParas.map((p, idx) => (
              <p
                key={`${idx}`}
                className={`text-slate-500 leading-relaxed ${idx === 0 ? 'mb-5' : 'mb-8'}`}
              >
                {p}
              </p>
            ))}
            <div className="flex flex-wrap gap-4">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-white font-bold text-sm rounded-xl"
                style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 6px 20px ${BRAND}33` }}
              >
                <i className="fas fa-utensils text-xs" /> Explore Menu
              </Link>
              <Link
                to="/restaurants"
                className="inline-flex items-center gap-2 px-7 py-3.5 font-bold text-sm rounded-xl border"
                style={{ color: BRAND, borderColor: `${BRAND}40` }}
              >
                <i className="fas fa-store text-xs" /> Our Restaurants
              </Link>
            </div>
          </div>

          <div className="relative">
            <img
              src={aboutImageUrl}
              alt="Our Story"
              className="rounded-[28px] w-full object-cover"
              style={{ maxHeight: 420, boxShadow: '0 24px 80px rgba(0,0,0,.14)' }}
            />
            {/* floating badge */}
            <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl px-5 py-4 flex items-center gap-3 border border-slate-100">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${BRAND}15` }}>
                <i className="fas fa-award text-xl" style={{ color: BRAND }} />
              </div>
              <div>
                <div className="text-xs font-black text-slate-800" style={{ fontFamily: 'Sora,sans-serif' }}>Best Food App</div>
                <div className="text-[10px] text-slate-400">Kigali Tech Awards 2024</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section
        className="py-20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1e293b 0%,#334155 100%)' }}
      >
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: BRAND }} />
        <div className="max-w-[1200px] mx-auto px-5 relative z-10">
          <p className="text-center text-xs font-bold tracking-widest uppercase mb-3" style={{ color: BRAND }}>By the Numbers</p>
          <h2 className="text-center text-4xl font-black text-white mb-12" style={{ fontFamily: 'Sora,sans-serif' }}>
            ZestyGo in Numbers
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {STATS.map(s => <StatCard key={s.label} {...s} />)}
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-[1200px] mx-auto px-5">
          <p className="text-center text-xs font-bold tracking-widest uppercase mb-3" style={{ color: BRAND }}>What Drives Us</p>
          <h2 className="text-center text-4xl font-black text-slate-800 mb-2" style={{ fontFamily: 'Sora,sans-serif' }}>Our Values</h2>
          <p className="text-center text-slate-500 mb-14 max-w-md mx-auto">The principles that guide everything we do at ZestyGo.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((v, i) => <ValueCard key={v.title} v={v} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-5">
          <p className="text-center text-xs font-bold tracking-widest uppercase mb-3" style={{ color: BRAND }}>The People</p>
          <h2 className="text-center text-4xl font-black text-slate-800 mb-2" style={{ fontFamily: 'Sora,sans-serif' }}>Meet the Team</h2>
          <p className="text-center text-slate-500 mb-14 max-w-md mx-auto">The passionate people behind ZestyGo working to feed Kigali.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamToShow.map((m, i) => <TeamCard key={m.name} member={m} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── REVIEWS (Customer submits, System Assistant approves) ── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-5">
          <p className="text-center text-xs font-bold tracking-widest uppercase mb-2" style={{ color: BRAND }}>Reviews</p>
          <h2 className="text-center text-4xl font-black text-slate-800 mb-2" style={{ fontFamily: 'Sora,sans-serif' }}>What Customers Say</h2>
          <p className="text-center text-slate-500 mb-8">Real reviews from real ZestyGo customers</p>

          <div className="max-w-2xl mx-auto mb-12 bg-slate-50 border border-slate-100 rounded-[24px] p-7">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
              <div>
                <div className="text-sm font-extrabold text-secondary mb-1">Add your review</div>
                <div className="text-xs text-slate-500">Submitted reviews are approved by the System Assistant.</div>
              </div>
              {submitMsg ? (
                <div className="text-xs font-bold px-3 py-1.5 rounded-full border" style={{ background: '#fff7ed', color: '#9a3412', borderColor: '#fed7aa' }}>
                  {submitMsg}
                </div>
              ) : null}
            </div>

            {!canSubmit ? (
              <div className="rounded-[18px] bg-white border border-slate-100 p-5 text-sm text-slate-600">
                Please <Link to="/login" className="font-bold underline" style={{ color: BRAND }}>sign in as a customer</Link> to submit a review.
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Stars</div>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setStars(n)}
                        className="w-10 h-10 rounded-2xl border flex items-center justify-center transition-all hover:scale-105"
                        style={{
                          borderColor: n <= stars ? '#fbbf24' : '#e2e8f0',
                          background: n <= stars ? '#fef3c7' : '#ffffff',
                          color: n <= stars ? '#f59e0b' : '#94a3b8',
                        }}
                        aria-label={`Set ${n} stars`}
                      >
                        <i className="fas fa-star text-sm" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Your review</div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Write your experience..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[110px] resize-none"
                    disabled={submitBusy}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitBusy || !String(reviewText || '').trim()}
                  className="w-full py-3.5 text-white font-black text-sm rounded-2xl transition-all disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 6px 20px ${BRAND}40` }}
                >
                  {submitBusy ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>

          {testimonialsToShow.length ? (
            <div className="grid md:grid-cols-3 gap-6">
              {testimonialsToShow.map((t) => (
                <div key={t.id} className="bg-slate-50 border border-slate-100 p-7 rounded-[24px] hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                  <div className="flex gap-0.5 mb-4">{[...Array(t.stars)].map((_, j) => <i key={j} className="fas fa-star text-yellow-400 text-sm" />)}</div>
                  <p className="text-slate-600 italic mb-6 leading-relaxed text-sm">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={t.customerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.customerName)}&background=F56230&color=fff&bold=true`}
                      alt=""
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow"
                    />
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm" style={{ fontFamily: 'Sora,sans-serif' }}>{t.customerName}</h4>
                      <span className="text-xs text-slate-400">{t.customerRole}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-10">No approved reviews yet. Be the first to write one.</div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-[1200px] mx-auto px-5">
          <div
            className="rounded-[28px] p-14 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#1e293b,#334155)' }}
          >
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: BRAND }} />
            <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full opacity-5 blur-3xl pointer-events-none" style={{ background: BRAND }} />
            <div className="relative z-10">
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: BRAND }}>Get Started</p>
              <h2 className="text-4xl font-black text-white mb-4" style={{ fontFamily: 'Sora,sans-serif' }}>
                Ready to Order?
              </h2>
              <p className="text-white/60 mb-10 max-w-md mx-auto leading-relaxed">
                Join thousands of satisfied customers and experience the best food delivery in Kigali.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  to="/menu"
                  className="inline-flex items-center gap-2 px-9 py-4 text-white font-bold text-sm rounded-xl"
                  style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 6px 24px ${BRAND}44` }}
                >
                  <i className="fas fa-utensils text-xs" /> Order Now
                </Link>
                <Link
                  to="/restaurants"
                  className="inline-flex items-center gap-2 px-9 py-4 font-bold text-sm rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
                >
                  <i className="fas fa-store text-xs" /> Browse Restaurants
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}