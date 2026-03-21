import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import logo from '../../image/ChatGPT Image Mar 15, 2026, 05_05_02 PM.png';

const BRAND   = '#F56230';
const BRAND_D = '#d94e22';

const NAV_LINKS = [
  { to: '/',            label: 'Home',        end: true },
  { to: '/restaurants', label: 'Restaurants'            },
  { to: '/menu',        label: 'Menu'                   },
  { to: '/about',       label: 'About'                  },
  { to: '/contact',     label: 'Contact'                },
];

export default function Navbar() {
  const { cartCount }                     = useCart();
  const { user, logout }                  = useAuth();
  const navigate                          = useNavigate();
  const [menuOpen, setMenuOpen]           = useState(false);
  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const [scrolled, setScrolled]           = useState(false);
  const userMenuRef                       = useRef(null);

  // shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // close mobile menu on resize
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        .navbar-root :not(i) { font-family: 'Sora', sans-serif; }
        @keyframes slideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .slide-down { animation: slideDown .15s ease both; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp .2s ease both; }
      `}</style>

      <nav className={`navbar-root fixed top-0 left-0 right-0 z-[1000] bg-white transition-all duration-200 ${scrolled ? 'shadow-[0_2px_20px_rgba(0,0,0,0.10)]' : 'shadow-[0_1px_0_#f1f5f9]'}`}>
        <div className="max-w-[1200px] mx-auto px-5 h-16 flex items-center justify-between gap-6">

          {/* ── LOGO ── */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="relative">
              <img src={logo} alt="ZestyGo"
                className="h-9 w-9 rounded-xl object-cover"
                style={{ boxShadow: `0 0 0 2px ${BRAND}40` }} />
            </div>
            <span className="text-xl font-black text-slate-800">
              Zesty<span style={{ color: BRAND }}>Go</span>
            </span>
          </Link>

          {/* ── DESKTOP NAV ── */}
          <ul className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink to={to} end={end}
                  className={({ isActive }) =>
                    `relative px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                  style={({ isActive }) => isActive
                    ? { background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 4px 10px ${BRAND}35` }
                    : {}
                  }
                  onClick={() => setMenuOpen(false)}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* ── RIGHT ACTIONS ── */}
          <div className="flex items-center gap-2">

            {/* Cart */}
            <Link to="/cart"
              className="relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-all">
              <i className="fas fa-shopping-cart text-lg"></i>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black text-white flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Authenticated user */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-slate-100 transition-all">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=F56230&color=fff&bold=true`}
                    alt=""
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <span className="hidden sm:inline text-sm font-black text-slate-700">
                    {user.name?.split(' ')[0]}
                  </span>
                  <i className="fas fa-chevron-down text-xs text-slate-400 transition-transform duration-200"
                    style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}></i>
                </button>

                {userMenuOpen && (
                  <div className="slide-down absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-slate-100 py-2 z-50"
                    style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
                    {/* user info */}
                    <div className="px-4 py-2.5 border-b border-slate-100 mb-1">
                      <p className="text-xs font-black text-slate-800 truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
                    </div>
                    <Link to="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-slate-100">
                        <i className="fas fa-receipt text-xs text-slate-500"></i>
                      </span>
                      My Orders
                    </Link>
                    <div className="px-3 pt-1 pb-1">
                      <div className="h-px bg-slate-100" />
                    </div>
                    <Link to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-slate-100">
                        <i className="fas fa-user-cog text-xs text-slate-500"></i>
                      </span>
                      Profile
                    </Link>
                    <div className="px-3 pt-1 pb-1">
                      <div className="h-px bg-slate-100" />
                    </div>
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); navigate('/'); }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-all">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-red-50">
                        <i className="fas fa-sign-out-alt text-xs text-red-400"></i>
                      </span>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-black border-2 transition-all text-slate-700 hover:border-orange-300 hover:text-orange-500"
                  style={{ borderColor: '#e2e8f0' }}>
                  Login
                </Link>
                <Link to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-black text-white transition-all"
                  style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 4px 12px ${BRAND}40` }}>
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-slate-100 transition-all">
              <span className={`w-5 h-0.5 bg-slate-700 rounded-full block transition-all origin-center ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`w-5 h-0.5 bg-slate-700 rounded-full block transition-all ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`w-5 h-0.5 bg-slate-700 rounded-full block transition-all origin-center ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── MOBILE MENU ── */}
        {menuOpen && (
          <div className="fade-up md:hidden border-t border-slate-100 bg-white px-4 pb-4 pt-2">
            <ul className="space-y-0.5">
              {NAV_LINKS.map(({ to, label, end }) => (
                <li key={to}>
                  <NavLink to={to} end={end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        isActive ? 'text-white' : 'text-slate-600 hover:bg-slate-50'
                      }`
                    }
                    style={({ isActive }) => isActive
                      ? { background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }
                      : {}
                    }>
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* mobile auth */}
            {!user && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                <Link to="/login" onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-black border-2 border-slate-200 text-slate-700">
                  Login
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-black text-white"
                  style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}