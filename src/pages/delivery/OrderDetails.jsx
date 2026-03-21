import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';

const money = (n) => `RWF ${Number(n || 0).toLocaleString()}`;

const badge = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'delivered') return 'bg-green-100 text-green-700';
  if (s === 'on_the_way' || s === 'out_for_delivery') return 'bg-blue-100 text-blue-700';
  if (s === 'picked') return 'bg-amber-100 text-amber-800';
  return 'bg-gray-100 text-gray-700';
};

export default function DeliveryOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const actions = useMemo(() => {
    const s = String(order?.status || '').toLowerCase();
    if (!s) return [];
    if (s === 'picked') return [{ id: 'on_the_way', label: 'Mark On The Way', className: 'bg-blue-600 hover:bg-blue-700' }];
    if (s === 'on_the_way' || s === 'out_for_delivery') return [{ id: 'delivered', label: 'Mark Delivered', className: 'bg-green-600 hover:bg-green-700' }];
    if (s === 'accepted' || s === 'preparing') return [{ id: 'picked', label: 'Mark Picked', className: 'bg-amber-600 hover:bg-amber-700' }];
    return [];
  }, [order?.status]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.delivery.getOrderById(id);
      setOrder(data);
    } catch (e) {
      setError(e.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const update = async (status) => {
    setSaving(true);
    setError('');
    try {
      await api.delivery.updateStatus(id, status);
      await load();
    } catch (e) {
      setError(e.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="bg-white shadow-custom p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 grid place-items-center"
            aria-label="Go back"
            title="Back"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary">Order Details</h1>
            <p className="text-sm text-gray-500">Order ID: {id}</p>
          </div>
        </div>
        {order?.status && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge(order.status)}`}>
            {String(order.status).replaceAll('_', ' ')}
          </span>
        )}
      </header>

      <div className="p-8 space-y-6">
        {loading && <div className="bg-white rounded-[20px] p-8 shadow-custom">Loading...</div>}
        {!loading && error && <div className="bg-white rounded-[20px] p-6 shadow-custom text-red-600">{error}</div>}

        {!loading && !error && order && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-[20px] p-6 shadow-custom lg:col-span-2">
                <h2 className="font-semibold text-secondary mb-4">Customer</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Name</div>
                    <div className="font-medium text-secondary">{order.customerName || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Phone</div>
                    <a className="font-medium text-primary hover:underline" href={order.customerPhone ? `tel:${order.customerPhone}` : undefined}>
                      {order.customerPhone || '—'}
                    </a>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-gray-500">Delivery address</div>
                    <div className="font-medium text-secondary whitespace-pre-wrap">{order.deliveryAddress || '—'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[20px] p-6 shadow-custom">
                <h2 className="font-semibold text-secondary mb-4">Restaurant</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-gray-500">Name</div>
                    <div className="font-medium text-secondary">{order.restaurantName || '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Phone</div>
                    <a className="font-medium text-primary hover:underline" href={order.restaurantPhone ? `tel:${order.restaurantPhone}` : undefined}>
                      {order.restaurantPhone || '—'}
                    </a>
                  </div>
                  <div>
                    <div className="text-gray-500">Address</div>
                    <div className="font-medium text-secondary whitespace-pre-wrap">{order.restaurantAddress || '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-6 shadow-custom">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="font-semibold text-secondary">Items</h2>
                <Link to="/delivery/orders" className="text-sm text-primary hover:underline">
                  Back to My Deliveries
                </Link>
              </div>
              <div className="divide-y">
                {(order.items || []).map((it, idx) => (
                  <div key={`${it?.id || idx}`} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-secondary">{it?.name || 'Item'}</div>
                      <div className="text-sm text-gray-500">
                        Qty: {it?.quantity ?? 1}
                        {it?.price != null ? ` • ${money(it.price)} each` : ''}
                      </div>
                    </div>
                    <div className="font-semibold text-secondary">
                      {money((Number(it?.price || 0) * Number(it?.quantity ?? 1)) || 0)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium text-secondary">{money(order.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Delivery fee</span><span className="font-medium text-secondary">{money(order.deliveryFee)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="font-medium text-secondary">{money(order.tax)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="font-medium text-secondary">{money(order.discount)}</span></div>
                <div className="flex justify-between md:col-span-2 text-base pt-2 border-t"><span className="font-semibold text-secondary">Total</span><span className="font-bold text-secondary">{money(order.total)}</span></div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {actions.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => update(a.id)}
                    disabled={saving}
                    className={`px-4 py-3 rounded-[12px] text-white font-semibold disabled:opacity-60 ${a.className}`}
                  >
                    {saving ? 'Saving...' : a.label}
                  </button>
                ))}
                {!actions.length && (
                  <div className="text-sm text-gray-500">No actions available for this status.</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

