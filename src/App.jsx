import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import RestaurantLayout from './components/RestaurantLayout';
import DeliveryLayout from './components/DeliveryLayout';
import SystemAssistantLayout from './components/SystemAssistantLayout';
import Home from './pages/Home';
import Restaurants from './pages/Restaurants';
import Menu from './pages/Menu';
import RestaurantDetail from './pages/RestaurantDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import About from './pages/About';
import Contact from './pages/Contact';
import CustomerMessages from './pages/customer/Messages';
import CustomerProfile from './pages/Profile';
import OrderTracking from './pages/OrderTracking';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp from './pages/VerifyOtp';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminRestaurants from './pages/admin/Restaurants';
import AdminOrders from './pages/admin/Orders';
import AdminReports from './pages/admin/Reports';
import AdminPendingDelivery from './pages/admin/PendingDelivery';
import AdminPendingRestaurants from './pages/admin/PendingRestaurants';
import AdminMessages from './pages/admin/Messages';
import AdminLogs from './pages/admin/Logs';
import SystemAssistantDashboard from './pages/systemAssistant/Dashboard';
import SystemAssistantReviews from './pages/systemAssistant/Reviews';
import SystemAssistantMessages from './pages/systemAssistant/Messages';
import SystemAssistantCatalog from './pages/systemAssistant/Catalog';
import SystemAssistantChatbotRequests from './pages/systemAssistant/ChatbotRequests';
import SystemAssistantCoupons from './pages/systemAssistant/Coupons';
import SystemAssistantAnnouncements from './pages/systemAssistant/Announcements';
import SystemAssistantSiteContent from './pages/systemAssistant/SiteContent';
import SystemAssistantWithdrawals from './pages/systemAssistant/Withdrawals';
import RestaurantDashboard from './pages/restaurant/Dashboard';
import RestaurantMenu from './pages/restaurant/Menu';
import RestaurantOrders from './pages/restaurant/Orders';
import RestaurantProfile from './pages/restaurant/Profile';
import RestaurantMessages from './pages/restaurant/Messages';
import RestaurantWallet from './pages/restaurant/Wallet';
import DeliveryDashboard from './pages/delivery/Dashboard';
import DeliveryOrders from './pages/delivery/Orders';
import DeliveryOrderDetails from './pages/delivery/OrderDetails';
import DeliveryProfile from './pages/delivery/Profile';
import DeliveryWallet from './pages/delivery/Wallet';
import DeliveryMessages from './pages/delivery/Messages';
import appLogo from '../image/ChatGPT Image Mar 15, 2026, 05_05_02 PM.png';

export default function App() {
  useEffect(() => {
    const link = document.querySelector("link[rel='icon']") || document.createElement('link');
    link.setAttribute('rel', 'icon');
    link.setAttribute('type', 'image/png');
    link.setAttribute('href', appLogo);
    if (!link.parentNode) document.head.appendChild(link);
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          {/* Customer: navbar + footer */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="restaurants" element={<Restaurants />} />
            <Route path="menu" element={<Menu />} />
            <Route path="restaurant/:id" element={<RestaurantDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="orders" element={<Orders />} />
            <Route path="order-tracking/:id" element={<OrderTracking />} />
            <Route path="profile" element={<CustomerProfile />} />
            <Route path="messages" element={<CustomerMessages />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
          </Route>

          {/* Admin: sidebar only */}
          <Route path="admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="pending/delivery" element={<AdminPendingDelivery />} />
            <Route path="pending/restaurants" element={<AdminPendingRestaurants />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="restaurants" element={<AdminRestaurants />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="logs" element={<AdminLogs />} />
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          {/* System Assistant: sidebar only */}
          <Route path="system-assistant" element={<SystemAssistantLayout />}>
            <Route path="dashboard" element={<SystemAssistantDashboard />} />
            <Route path="reviews" element={<SystemAssistantReviews />} />
            <Route path="messages" element={<SystemAssistantMessages />} />
            <Route path="chatbot-answers" element={<SystemAssistantChatbotRequests />} />
            <Route path="announcements" element={<SystemAssistantAnnouncements />} />
            <Route path="coupons" element={<SystemAssistantCoupons />} />
            <Route path="withdrawals" element={<SystemAssistantWithdrawals />} />
            <Route path="catalog" element={<SystemAssistantCatalog />} />
            <Route path="site-content" element={<SystemAssistantSiteContent />} />
            <Route index element={<Navigate to="/system-assistant/dashboard" replace />} />
          </Route>

          {/* Restaurant: sidebar only */}
          <Route path="restaurant" element={<RestaurantLayout />}>
            <Route path="dashboard" element={<RestaurantDashboard />} />
            <Route path="menu" element={<RestaurantMenu />} />
            <Route path="orders" element={<RestaurantOrders />} />
            <Route path="wallet" element={<RestaurantWallet />} />
            <Route path="messages" element={<RestaurantMessages />} />
            <Route path="profile" element={<RestaurantProfile />} />
            <Route index element={<Navigate to="/restaurant/dashboard" replace />} />
          </Route>

          {/* Delivery: sidebar only */}
          <Route path="delivery" element={<DeliveryLayout />}>
            <Route path="dashboard" element={<DeliveryDashboard />} />
            <Route path="orders" element={<DeliveryOrders />} />
            <Route path="orders/:id" element={<DeliveryOrderDetails />} />
            <Route path="messages" element={<DeliveryMessages />} />
            <Route path="wallet" element={<DeliveryWallet />} />
            <Route path="profile" element={<DeliveryProfile />} />
            <Route index element={<Navigate to="/delivery/dashboard" replace />} />
          </Route>

          {/* Auth: no navbar */}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="verify-otp" element={<VerifyOtp />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}
