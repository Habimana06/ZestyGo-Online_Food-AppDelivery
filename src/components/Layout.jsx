import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CustomerAssistant from './CustomerAssistant';

const noFooterPaths = ['/login', '/register'];

export default function Layout() {
  const location = useLocation();
  const showFooter = !noFooterPaths.some((p) => location.pathname.startsWith(p));
  // Only show the "Customer Assistant" bot on the public Home page.
  const showAssistant = location.pathname === '/';

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[72px]">
        <Outlet />
      </main>
      {showAssistant ? <CustomerAssistant /> : null}
      {showFooter && <Footer />}
    </>
  );
}
