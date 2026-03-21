const envBaseRaw = String(import.meta.env.VITE_API_URL || '').trim();
const normalizedEnvBase = envBaseRaw.replace(/\/+$/, '');
const API_BASE = (() => {
  if (!normalizedEnvBase) return '/api';
  // If user sets root backend URL, auto-append /api for convenience.
  if (/^https?:\/\//i.test(normalizedEnvBase) && !/\/api$/i.test(normalizedEnvBase)) {
    return `${normalizedEnvBase}/api`;
  }
  return normalizedEnvBase;
})();

/** Multipart upload (no JSON Content-Type — browser sets boundary). */
const uploadMultipart = async (endpoint, file, fieldName = 'image') => {
  const token = localStorage.getItem('token');
  const form = new FormData();
  form.append(fieldName, file);
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Upload failed');
  return data;
};

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
};

const download = async (endpoint) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  const res = await fetch(`${API_BASE}${endpoint}`, { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.message || 'Download failed');
  }
  const blob = await res.blob();
  const dispo = res.headers.get('Content-Disposition') || '';
  const match = dispo.match(/filename=\"?([^\";]+)\"?/i);
  const filename = match?.[1] || 'download';
  return { blob, filename };
};

export const api = {
  /** Use for production: relative /api only works on same host as backend. */
  uploads: {
    restaurantLogo: (file) => uploadMultipart('/uploads/restaurant-logo', file),
  },
  site: {
    getContent: () => request('/site-content'),
  },
  paymentMethods: {
    list: () => request('/payment-methods'),
    add: (data) => request('/payment-methods', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id) => request(`/payment-methods/${id}`, { method: 'DELETE' }),
  },
  announcements: {
    getActive: () => request('/announcements/active'),
  },
  coupons: {
    validate: (data) => request('/coupons/validate', { method: 'POST', body: JSON.stringify(data) }),
  },
  reviews: {
    getApproved: (params = '') => request(`/reviews/approved${params}`),
    create: (data) => request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  },
  catalog: {
    getCuisines: () => request('/catalog/cuisines'),
    getFoodTypes: () => request('/catalog/food-types'),
  },
  systemAssistant: {
    botRequests: {
      getRequests: () => request('/system-assistant/bot-requests'),
    },
    announcements: {
      list: () => request('/system-assistant/announcements'),
      create: (data) =>
        request('/system-assistant/announcements', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) =>
        request(`/system-assistant/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      remove: (id) => request(`/system-assistant/announcements/${id}`, { method: 'DELETE' }),
    },
    coupons: {
      list: () => request('/system-assistant/coupons'),
      upsert: (data) => request('/system-assistant/coupons', { method: 'POST', body: JSON.stringify(data) }),
    },
    site: {
      getContent: () => request('/system-assistant/site-content'),
      updateContent: (data) =>
        request('/system-assistant/site-content', { method: 'PUT', body: JSON.stringify(data) }),
      socials: {
        list: () => request('/system-assistant/site-socials'),
        add: (data) => request('/system-assistant/site-socials', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) =>
          request(`/system-assistant/site-socials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        remove: (id) => request(`/system-assistant/site-socials/${id}`, { method: 'DELETE' }),
      },
      team: {
        list: () => request('/system-assistant/site-team'),
        add: (data) => request('/system-assistant/site-team', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) =>
          request(`/system-assistant/site-team/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        remove: (id) => request(`/system-assistant/site-team/${id}`, { method: 'DELETE' }),
      },
    },
    reviews: {
      getPending: () => request('/system-assistant/reviews/pending'),
      approve: (id) => request(`/system-assistant/reviews/${id}/approve`, { method: 'PATCH', body: JSON.stringify({}) }),
      reject: (id, reason = '') =>
        request(`/system-assistant/reviews/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
    },
    catalog: {
      addCuisine: (name) => request('/system-assistant/catalog/cuisines', { method: 'POST', body: JSON.stringify({ name }) }),
      addFoodType: (data) =>
        request('/system-assistant/catalog/food-types', { method: 'POST', body: JSON.stringify(data) }),
    },
    withdrawals: {
      pending: () => request('/system-assistant/withdrawals/pending'),
      update: (type, id, action) =>
        request(`/system-assistant/withdrawals/${type}/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ action }),
        }),
    },
  },
  restaurants: {
    getAll: () => request('/restaurants'),
    getById: (id) => request(`/restaurants/${id}`),
  },
  menu: {
    getAll: () => request('/menu'),
    getByRestaurant: (id) => request(`/menu/restaurant/${id}`),
    getByCategory: (category) => request(`/menu/category/${category}`),
  },
  auth: {
    login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request('/auth/me'),
    requestOtp: (email, purpose) => request('/auth/request-otp', { method: 'POST', body: JSON.stringify({ email, purpose }) }),
    verifyOtp: (email, purpose, code, meta = {}) =>
      request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, purpose, code, ...meta }) }),
    resetPassword: (otpToken, newPassword) =>
      request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ otpToken, newPassword }) }),
    completeLogin: (otpToken) => request('/auth/complete-login', { method: 'POST', body: JSON.stringify({ otpToken }) }),
    emailStatus: () => request('/auth/email-status'),
  },
  profile: {
    update: (data) => request('/profile', { method: 'PUT', body: JSON.stringify(data) }),
    uploadAvatar: (file) => uploadMultipart('/uploads/avatar', file),
  },
  orders: {
    create: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
    getById: (id) => request(`/orders/${id}`),
    getMyOrders: () => request('/orders/my'),
    cancel: (id) => request(`/orders/${id}/cancel`, { method: 'POST' }),
    remove: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
    downloadReceipt: (id) => download(`/orders/${id}/receipt`),
    emailReceipt: (id) => request(`/orders/${id}/receipt/email`, { method: 'POST', body: JSON.stringify({}) }),
  },
  contact: {
    submit: (data) => request('/contact', { method: 'POST', body: JSON.stringify(data) }),
  },
  restaurant: {
    stats: () => request('/restaurant/stats'),
    wallet: () => request('/restaurant/wallet'),
    withdraw: (data) => request('/restaurant/withdrawals', { method: 'POST', body: JSON.stringify(data) }),
    reports: {
      sales: (params = '') => request(`/restaurant/reports/sales${params}`),
      orderStats: (params = '') => request(`/restaurant/reports/order-stats${params}`),
    },
    profile: () => request('/restaurant/profile'),
    updateProfile: (data) => request('/restaurant/profile', { method: 'PUT', body: JSON.stringify(data) }),
    menu: {
      getAll: () => request('/restaurant/menu'),
      uploadImage: (file) => uploadMultipart('/restaurant/menu/upload', file),
      add: (data) => request('/restaurant/menu', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => request(`/restaurant/menu/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      remove: (id) => request(`/restaurant/menu/${id}`, { method: 'DELETE' }),
    },
    orders: {
      getAll: (params = '') => request(`/restaurant/orders${params}`),
      updateStatus: (id, status, extra = {}) =>
        request(`/restaurant/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...extra }) }),
    },
  },
  delivery: {
    getOrders: (params = '') => request(`/delivery/orders${params}`),
    getOrderById: (id) => request(`/delivery/orders/${id}`),
    pick: (id) => request(`/delivery/orders/${id}/pick`, { method: 'POST' }),
    updateStatus: (id, status) =>
      request(`/delivery/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    wallet: () => request('/delivery/wallet'),
    withdraw: (data) => request('/delivery/withdrawals', { method: 'POST', body: JSON.stringify(data) }),
    reports: {
      deliveries: (params = '') => request(`/delivery/reports/deliveries${params}`),
      orderStats: (params = '') => request(`/delivery/reports/order-stats${params}`),
    },
  },
  messages: {
    conversations: () => request('/messages/conversations'),
    thread: (userId, params = '') => request(`/messages/thread/${userId}${params}`),
    send: (data) => request('/messages', { method: 'POST', body: JSON.stringify(data) }),
  },
  admin: {
    stats: () => request('/admin/stats'),
    logs: {
      getAll: (params = '') => request(`/admin/logs${params}`),
    },
    users: {
      getAll: () => request('/admin/users'),
      getById: (id) => request(`/admin/users/${id}`),
      update: (id, data) => request(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      create: (data) => request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
      approve: (id, approved) =>
        request(`/admin/users/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ approved }) }),
      setBlocked: (id, blocked) => request(`/admin/users/${id}/block`, { method: 'PATCH', body: JSON.stringify({ blocked }) }),
      remove: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
    },
    restaurants: {
      getAll: () => request('/admin/restaurants'),
      getById: (id) => request(`/admin/restaurants/${id}`),
      update: (id, data) => request(`/admin/restaurants/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      create: (data) => request('/admin/restaurants', { method: 'POST', body: JSON.stringify(data) }),
      approve: (id, approved) =>
        request(`/admin/restaurants/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ approved }) }),
      remove: (id) => request(`/admin/restaurants/${id}`, { method: 'DELETE' }),
    },
    pending: {
      delivery: () => request('/admin/pending/delivery'),
      restaurants: () => request('/admin/pending/restaurants'),
    },
    orders: {
      getAll: () => request('/admin/orders'),
    },
    reports: {
      sales: (params = '') => request(`/admin/reports/sales${params}`),
      orderStats: (params = '') => request(`/admin/reports/order-stats${params}`),
      salesByRestaurant: (params = '') => request(`/admin/reports/sales-by-restaurant${params}`),
      ordersDetailed: (params = '') => request(`/admin/reports/orders-detailed${params}`),
      downloads: {
        ordersCsv: (params = '') => download(`/admin/reports/orders.csv${params}`),
        ordersPdf: (params = '') => download(`/admin/reports/orders.pdf${params}`),
        ordersDetailedCsv: (params = '') => download(`/admin/reports/orders-detailed.csv${params}`),
        ordersDetailedPdf: (params = '') => download(`/admin/reports/orders-detailed.pdf${params}`),
        salesCsv: (params = '') => download(`/admin/reports/sales.csv${params}`),
        salesPdf: (params = '') => download(`/admin/reports/sales.pdf${params}`),
        salesByRestaurantCsv: (params = '') => download(`/admin/reports/sales-by-restaurant.csv${params}`),
        salesByRestaurantPdf: (params = '') => download(`/admin/reports/sales-by-restaurant.pdf${params}`),
      },
    },
  },
};
