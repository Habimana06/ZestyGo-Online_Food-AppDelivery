import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../image/ChatGPT Image Mar 15, 2026, 05_05_02 PM.png';
import { api } from '../api';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';

const QUICK_LINKS = [
  { to: '/',            label: 'Home'        },
  { to: '/restaurants', label: 'Restaurants' },
  { to: '/menu',        label: 'Menu'        },
  { to: '/about',       label: 'About'       },
  { to: '/contact',     label: 'Contact'     },
];

const RESTAURANT_LINKS = [
  { href: '/login',    label: 'Partner Login'       },
  { href: '/register', label: 'Register Restaurant' },
  { href: '#',         label: 'Business Support'    },
];

const FALLBACK_SOCIALS = [
  { icon: 'fa-facebook-f',  href: '#' },
  { icon: 'fa-twitter',     href: '#' },
  { icon: 'fa-instagram',   href: '#' },
  { icon: 'fa-linkedin-in', href: '#' },
];

const FALLBACK_CONTACT = [
  { icon: 'fa-map-marker-alt', text: '123 Food Street, Kigali' },
  { icon: 'fa-phone',          text: '+250 781 564 312'         },
  { icon: 'fa-envelope',       text: 'support@zestygo.com'      },
];

export default function Footer() {
  const [site, setSite] = useState(null);

  useEffect(() => {
    api.site.getContent()
      .then((d) => setSite(d))
      .catch(() => setSite(null));
  }, []);

  const socialsToShow = site?.socials?.length
    ? site.socials
      .filter((s) => s.scope === 'footer' || s.scope === 'both')
      .filter((s, idx, arr) => {
        const scope = s.scope || 'both';
        const key = `${s.icon || ''}__${s.href || ''}__${scope}`;
        return idx === arr.findIndex((x) => `${x.icon || ''}__${x.href || ''}__${x.scope || 'both'}` === key);
      })
    : FALLBACK_SOCIALS;

  const contactToShow = site?.content
    ? [
        { icon: 'fa-map-marker-alt', text: site.content.companyAddress },
        { icon: 'fa-phone', text: site.content.companyPhone },
        { icon: 'fa-envelope', text: site.content.companyEmail },
      ]
    : FALLBACK_CONTACT;

  return (
    <footer style={{ background: 'linear-gradient(180deg,#0f172a 0%,#1e293b 100%)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        .footer-root :not(i) { font-family: 'Sora', sans-serif; }
      `}</style>

      <div className="footer-root max-w-[1200px] mx-auto px-5">

        {/* ── TOP DIVIDER ACCENT ── */}
        <div className="h-1 w-full rounded-b-full mb-12"
          style={{ background: `linear-gradient(90deg,${BRAND},${BRAND_D},transparent)` }} />

        {/* ── GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12">

          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <img src={logo} alt="ZestyGo"
                className="h-10 w-10 rounded-xl object-cover"
                style={{ boxShadow: `0 0 0 2px ${BRAND}60` }} />
              <span className="text-xl font-black text-white">
                Zesty<span style={{ color: BRAND }}>Go</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Spicing up your day with fast, fresh food from your favorite local spots.
            </p>
            {/* Socials */}
            <div className="flex gap-3">
              {socialsToShow.map(({ icon, href }) => (
                <a key={icon} href={href}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                  onMouseEnter={e => e.currentTarget.style.background = BRAND}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}>
                  <i className={`fab ${icon} text-sm text-white`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-5">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-all group">
                    <span className="w-1 h-1 rounded-full flex-shrink-0 transition-all group-hover:w-2"
                      style={{ background: BRAND }} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Restaurants */}
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-5">
              For Restaurants
            </h4>
            <ul className="space-y-2.5">
              {RESTAURANT_LINKS.map(({ href, label }) => (
                <li key={label}>
                  <a href={href}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-all group">
                    <span className="w-1 h-1 rounded-full flex-shrink-0 transition-all group-hover:w-2"
                      style={{ background: BRAND }} />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-5">
              Contact Us
            </h4>
            <ul className="space-y-3.5">
              {contactToShow.map(({ icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${BRAND}20` }}>
                    <i className={`fas ${icon} text-xs`} style={{ color: BRAND }}></i>
                  </span>
                  <span className="text-sm text-slate-400 leading-snug">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="border-t py-6 flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} <span className="font-black text-slate-400">ZestyGo</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <a href="#"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-white hover:bg-white/5 transition-all">
              Privacy Policy
            </a>
            <span className="text-slate-700">·</span>
            <a href="#"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-white hover:bg-white/5 transition-all">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}