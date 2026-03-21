import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../../image/ChatGPT Image Mar 15, 2026, 05_05_02 PM.png';

const BRAND = '#F56230';
const BRAND_D = '#d94e22';

const NAV_SECTIONS = [
  {
    items: [
      { to: '/system-assistant/dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard', end: true },
    ],
  },
  {
    heading: 'Approvals',
    items: [
      { to: '/system-assistant/reviews', icon: 'fa-star', label: 'Pending Reviews' },
      { to: '/system-assistant/withdrawals', icon: 'fa-money-check-dollar', label: 'Withdrawals' },
    ],
  },
  {
    heading: 'Manage',
    items: [
      { to: '/system-assistant/messages', icon: 'fa-comments', label: 'Messages' },
      { to: '/system-assistant/chatbot-answers', icon: 'fa-robot', label: 'Chatbot Answers' },
      { to: '/system-assistant/announcements', icon: 'fa-bullhorn', label: 'Home News' },
      { to: '/system-assistant/coupons', icon: 'fa-tag', label: 'Coupons' },
      { to: '/system-assistant/catalog', icon: 'fa-utensils', label: 'Catalog' },
      { to: '/system-assistant/site-content', icon: 'fa-globe', label: 'Site Content' },
    ],
  },
];

export default function SystemAssistantLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        :not(i) { font-family: 'Sora', sans-serif; }
        .nav-active {
          background: linear-gradient(135deg, ${BRAND}, ${BRAND_D}) !important;
          color: #fff !important;
          box-shadow: 0 4px 12px ${BRAND}40;
        }
        .nav-active i { color: #fff !important; }
        .nav-item:not(.nav-active):hover { background: rgba(255,255,255,0.07); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 99px; }
      `}</style>

      <div className="flex min-h-screen">
        {/* ── SIDEBAR ── */}
        <aside
          className="w-64 fixed h-screen flex flex-col z-20 overflow-y-auto"
          style={{ background: 'linear-gradient(180deg,#0f172a 0%,#1e293b 100%)' }}
        >
          {/* Logo */}
          <Link
            to="/system-assistant/dashboard"
            className="flex items-center gap-3 px-6 py-5 flex-shrink-0 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div className="relative flex-shrink-0">
              <img
                src={logo}
                alt="ZestyGo"
                className="h-9 w-9 rounded-xl object-cover"
                style={{ boxShadow: `0 0 0 2px ${BRAND}60` }}
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 bg-fuchsia-400"
                style={{ borderColor: '#0f172a' }}
              />
            </div>
            <div>
              <p className="text-sm font-black text-white leading-none">ZestyGo</p>
              <p className="text-[10px] font-bold mt-0.5" style={{ color: BRAND }}>System Assistant</p>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-5">
            {NAV_SECTIONS.map((section, si) => (
              <div key={si}>
                {section.heading ? (
                  <p
                    className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    {section.heading}
                  </p>
                ) : null}
                <div className="space-y-0.5">
                  {section.items.map(({ to, icon, label, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        `nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          isActive ? 'nav-active' : 'text-slate-400'
                        }`
                      }
                    >
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <i className={`fas ${icon} text-xs`} />
                      </span>
                      {label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom */}
          <div
            className="px-3 pb-4 flex-shrink-0 space-y-1 border-t pt-3"
            style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-400 transition-all hover:bg-white/5"
            >
              <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <i className="fas fa-home text-xs" />
              </span>
              View Customer Site
            </Link>

            <div className="mt-2 p-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}>
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate">{user?.name || 'System Assistant'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || ''}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                title="Logout"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0"
              >
                <i className="fas fa-sign-out-alt text-xs" />
              </button>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 ml-64 bg-slate-50 min-h-screen">
          <Outlet />
        </main>
      </div>
    </>
  );
}

