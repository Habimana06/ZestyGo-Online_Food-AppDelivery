import { useEffect, useState } from 'react';
import { api } from '../api';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';
const CUSTOMER_HERO_BG = 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1600&auto=format&fit=crop&q=80';

const FALLBACK_CONTACT_INFO = [
  { icon: 'fa-map-marker-alt', title: 'Location', text: '123 Food Street, Downtown, Kigali'          },
  { icon: 'fa-phone',          title: 'Phone',    text: '+250 788 856 021'                            },
  { icon: 'fa-envelope',       title: 'Email',    text: 'support@zestygo.com'                        },
  { icon: 'fa-clock',          title: 'Hours',    text: 'Mon–Fri 9AM–10PM · Sat–Sun 10AM–11PM'       },
];

const FAQS = [
  { q: 'How do I place an order?',           a: 'Browse restaurants, add items to your cart, and proceed to checkout. Pay online or choose cash on delivery.' },
  { q: 'What are delivery hours?',           a: 'Most restaurants deliver from 10AM to 10PM. Check individual restaurant pages for specific hours.'           },
  { q: 'How can I track my order?',          a: 'Use the tracking link sent to your email after checkout, or visit the My Orders section in your account.'    },
  { q: 'What payment methods do you accept?', a: 'We accept credit/debit cards, mobile money (MTN & Airtel), and cash on delivery.'                           },
  { q: 'Can I cancel or edit my order?',     a: 'Orders can be cancelled within 2 minutes of placing them. Contact support immediately if you need help.'     },
  { q: 'How do I apply a promo code?',       a: 'Enter your promo code at checkout in the "Apply Code" field before confirming your order.'                   },
];

/* ── Styled input ── */
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inputCls = `w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-slate-50 outline-none transition-all`;

function StyledInput({ onFocus, onBlur, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      className={inputCls}
      style={{ borderColor: focused ? BRAND : undefined, boxShadow: focused ? `0 0 0 3px ${BRAND}18` : undefined }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function StyledSelect({ children, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        required
        className={`${inputCls} appearance-none pr-9 cursor-pointer`}
        style={{ borderColor: focused ? BRAND : undefined, boxShadow: focused ? `0 0 0 3px ${BRAND}18` : undefined }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {children}
      </select>
      <i className="fas fa-chevron-down text-[10px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

function StyledTextarea({ value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={onChange}
      required
      rows={4}
      className={`${inputCls} resize-none`}
      style={{ borderColor: focused ? BRAND : undefined, boxShadow: focused ? `0 0 0 3px ${BRAND}18` : undefined }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

/* ── FAQ accordion item ── */
function FaqItem({ faq, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="bg-white rounded-[20px] border border-slate-100 overflow-hidden transition-all duration-200"
      style={{ boxShadow: open ? `0 8px 30px ${BRAND}15` : '0 2px 12px rgba(0,0,0,.05)', animationDelay: `${index * 60}ms`, animation: 'cardIn .5s ease both' }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 p-6 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: open ? BRAND : `${BRAND}12` }}>
            <i className="fas fa-question text-xs" style={{ color: open ? '#fff' : BRAND }} />
          </div>
          <span className="font-bold text-slate-800 text-sm" style={{ fontFamily: 'Sora,sans-serif' }}>{faq.q}</span>
        </div>
        <i className={`fas fa-chevron-down text-xs text-slate-400 transition-transform duration-300 flex-shrink-0`}
          style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div className="px-6 pb-6 pt-0">
          <p className="text-slate-500 text-sm leading-relaxed pl-11">{faq.a}</p>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════════════ */
export default function Contact() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [siteContent, setSiteContent] = useState(null);

  useEffect(() => {
    api.site.getContent().then(setSiteContent).catch(() => setSiteContent(null));
  }, []);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.contact.submit(form);
      setSent(true);
      setForm({ firstName: '', lastName: '', email: '', phone: '', subject: '', message: '' });
    } catch {
      setSent(false);
    } finally {
      setLoading(false);
    }
  };

  const contactInfoToShow = siteContent?.content
    ? [
        { icon: 'fa-map-marker-alt', title: 'Location', text: siteContent.content.companyAddress },
        { icon: 'fa-phone', title: 'Phone', text: siteContent.content.companyPhone },
        { icon: 'fa-envelope', title: 'Email', text: siteContent.content.companyEmail },
        { icon: 'fa-clock', title: 'Hours', text: 'Mon–Fri 9AM–10PM · Sat–Sun 10AM–11PM' },
      ]
    : FALLBACK_CONTACT_INFO;

  const SOCIAL_BG = {
    'fa-facebook-f': '#1877f2',
    'fa-twitter': '#1da1f2',
    'fa-instagram': 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
    'fa-linkedin-in': '#0a66c2',
    'fa-tiktok': '#010101',
  };

  const socialsToShow = siteContent?.socials?.length
    ? siteContent.socials.filter((s) => s.scope === 'contact' || s.scope === 'both')
        .filter((s, idx, arr) => {
          const scope = s.scope || 'both';
          const key = `${s.icon || ''}__${s.href || ''}__${scope}`;
          return idx === arr.findIndex((x) => {
            const xScope = x.scope || 'both';
            return `${x.icon || ''}__${x.href || ''}__${xScope}` === key;
          });
        })
    : [
        { icon: 'fa-facebook-f', bg: '#1877f2' },
        { icon: 'fa-instagram', bg: `linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)` },
        { icon: 'fa-twitter', bg: '#1da1f2' },
        { icon: 'fa-tiktok', bg: '#010101' },
      ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        :not(i) { font-family: 'Sora', sans-serif; }
        @keyframes cardIn   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlide{ from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes checkPop { 0%{transform:scale(0)} 70%{transform:scale(1.2)} 100%{transform:scale(1)} }
      `}</style>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden py-28 text-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(30,41,59,.95) 0%, rgba(51,65,85,.92) 60%, rgba(30,41,59,.95) 100%), url(${CUSTOMER_HERO_BG})`,
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
            💬 We typically reply within 2 hours
          </span>
          <h1 className="text-5xl lg:text-6xl font-black text-white mb-6 leading-tight" style={{ fontFamily: 'Sora,sans-serif' }}>
            Get in <span style={{ color: BRAND }}>Touch</span>
          </h1>
          <p className="text-lg text-white/60 max-w-md mx-auto leading-relaxed">
            Have questions, feedback, or need help with an order? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* ── CONTACT SECTION ── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-5 grid lg:grid-cols-2 gap-16 items-start">

          {/* left — info */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: BRAND }}>Contact Info</p>
            <h2 className="text-4xl font-black text-slate-800 mb-4 leading-tight" style={{ fontFamily: 'Sora,sans-serif' }}>
              We're Here to Help
            </h2>
            <p className="text-slate-500 mb-10 leading-relaxed">
              Reach out any time — our support team is always ready to assist with orders, partnerships, or general questions.
            </p>

            <div className="space-y-4 mb-12">
              {contactInfoToShow.map((c, i) => (
                <div
                  key={c.title}
                  className="flex items-center gap-4 p-5 rounded-2xl border border-slate-100 transition-all duration-200 hover:-translate-y-0.5"
                  style={{ boxShadow: '0 2px 12px rgba(0,0,0,.04)', animationDelay: `${i * 80}ms`, animation: 'cardIn .5s ease both' }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${BRAND}12` }}>
                    <i className={`fas ${c.icon} text-base`} style={{ color: BRAND }} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{c.title}</div>
                    <div className="font-bold text-slate-700 text-sm">{c.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* social */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Follow Us</p>
              <div className="flex gap-3">
                {socialsToShow.map((s) => (
                  <a key={s.icon} href={s.href || '#'}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-transform hover:scale-110"
                    style={{ background: s.bg || SOCIAL_BG[s.icon] || 'rgba(255,255,255,0.15)' }}>
                    <i className={`fab ${s.icon} text-sm`} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* right — form */}
          <div className="bg-white rounded-[28px] border border-slate-100 p-10"
            style={{ boxShadow: '0 8px 48px rgba(0,0,0,.08)' }}>

            {sent ? (
              <div className="text-center py-10">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: '#22c55e', animation: 'checkPop .4s ease both' }}>
                  <i className="fas fa-check text-white text-3xl" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2" style={{ fontFamily: 'Sora,sans-serif' }}>Message Sent!</h3>
                <p className="text-slate-500 mb-8">Thanks for reaching out. We'll get back to you within 2 hours.</p>
                <button onClick={() => setSent(false)}
                  className="inline-flex items-center gap-2 px-7 py-3 text-white font-bold text-sm rounded-xl"
                  style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}>
                  <i className="fas fa-paper-plane text-xs" /> Send Another
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: BRAND }}>Message Us</p>
                <h3 className="text-2xl font-black text-slate-800 mb-7" style={{ fontFamily: 'Sora,sans-serif' }}>Send a Message</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="First Name">
                      <StyledInput type="text" value={form.firstName} onChange={set('firstName')} required placeholder="John" />
                    </Field>
                    <Field label="Last Name">
                      <StyledInput type="text" value={form.lastName} onChange={set('lastName')} required placeholder="Doe" />
                    </Field>
                  </div>
                  <Field label="Email">
                    <StyledInput type="email" value={form.email} onChange={set('email')} required placeholder="john@example.com" />
                  </Field>
                  <Field label="Phone (optional)">
                    <StyledInput type="tel" value={form.phone} onChange={set('phone')} placeholder="+250 7XX XXX XXX" />
                  </Field>
                  <Field label="Subject">
                    <StyledSelect value={form.subject} onChange={set('subject')}>
                      <option value="">Select a topic…</option>
                      <option value="general">General Inquiry</option>
                      <option value="order">Order Issue</option>
                      <option value="feedback">Feedback</option>
                      <option value="partnership">Restaurant Partnership</option>
                      <option value="other">Other</option>
                    </StyledSelect>
                  </Field>
                  <Field label="Message">
                    <StyledTextarea value={form.message} onChange={set('message')} />
                  </Field>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: loading ? '#e2e8f0' : `linear-gradient(135deg,${BRAND},${BRAND_D})`,
                      color: loading ? '#94a3b8' : '#fff',
                      boxShadow: loading ? 'none' : `0 6px 20px ${BRAND}33`,
                    }}
                  >
                    {loading
                      ? <><i className="fas fa-spinner fa-spin text-xs" /> Sending…</>
                      : <><i className="fas fa-paper-plane text-xs" /> Send Message</>
                    }
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-[1200px] mx-auto px-5">
          <p className="text-center text-xs font-bold tracking-widest uppercase mb-3" style={{ color: BRAND }}>Help Center</p>
          <h2 className="text-center text-4xl font-black text-slate-800 mb-2" style={{ fontFamily: 'Sora,sans-serif' }}>
            Frequently Asked Questions
          </h2>
          <p className="text-center text-slate-500 mb-14 max-w-md mx-auto">
            Quick answers to the most common questions about ZestyGo.
          </p>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {FAQS.map((faq, i) => <FaqItem key={faq.q} faq={faq} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── MAP PLACEHOLDER ── */}
      <section className="pb-24 bg-slate-50">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="rounded-[28px] overflow-hidden border border-slate-100" style={{ height: 340, boxShadow: '0 8px 48px rgba(0,0,0,.08)' }}>
            <iframe
              title="ZestyGo Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63800.26282063856!2d30.0187!3d-1.9441!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca4258ed8e797%3A0xf32b36a5411d0bc8!2sKigali%2C%20Rwanda!5e0!3m2!1sen!2s!4v1680000000000"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'grayscale(20%) contrast(1.05)' }}
              allowFullScreen=""
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </>
  );
}