import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { useSearchParams } from 'react-router-dom';

const roleBadge = (role) => {
  const r = String(role || '');
  if (r === 'admin') return 'bg-indigo-100 text-indigo-700';
  if (r === 'restaurant') return 'bg-amber-100 text-amber-800';
  if (r === 'delivery') return 'bg-emerald-100 text-emerald-800';
  if (r === 'system_assistant') return 'bg-fuchsia-100 text-fuchsia-700';
  return 'bg-gray-100 text-gray-700';
};

export default function MessagesPanel({ title = 'Messages' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const preselectUserId = searchParams.get('with') || '';
  const preselectOrderId = searchParams.get('orderId') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState(preselectUserId);
  const [orderId, setOrderId] = useState(preselectOrderId);
  const [thread, setThread] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);

  const active = useMemo(() => users.find((u) => String(u.id) === String(activeUserId)), [users, activeUserId]);

  const loadConversations = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.messages.conversations();
      setUsers(Array.isArray(data) ? data : []);
      if (!activeUserId && Array.isArray(data) && data.length) {
        setActiveUserId(String(data[0].id));
      }
    } catch (e) {
      setError(e.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadThread = async () => {
    if (!activeUserId) return;
    setError('');
    try {
      const q = orderId ? `?orderId=${encodeURIComponent(orderId)}` : '';
      const data = await api.messages.thread(activeUserId, q);
      setThread(Array.isArray(data) ? data : []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    } catch (e) {
      setError(e.message || 'Failed to load messages');
      setThread([]);
    }
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeUserId) return;
    const next = new URLSearchParams(searchParams);
    next.set('with', String(activeUserId));
    if (orderId) next.set('orderId', String(orderId));
    else next.delete('orderId');
    setSearchParams(next, { replace: true });
    loadThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUserId, orderId]);

  useEffect(() => {
    if (!activeUserId) return;
    const id = setInterval(() => loadThread(), 2500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUserId, orderId]);

  const send = async () => {
    const body = String(text || '').trim();
    if (!activeUserId || !body) return;
    setSending(true);
    setError('');
    try {
      await api.messages.send({ toUserId: Number(activeUserId), body, ...(orderId ? { orderId } : {}) });
      setText('');
      await loadThread();
    } catch (e) {
      setError(e.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <header className="bg-white shadow-custom p-6 flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary">{title}</h1>
          <p className="text-sm text-gray-500">Chat is limited to allowed contacts for your role.</p>
        </div>
      </header>

      <div className="p-8">
        {error && <div className="mb-6 bg-white rounded-[20px] p-6 shadow-custom text-red-600">{error}</div>}

        <div className="bg-white rounded-[20px] shadow-custom overflow-hidden grid grid-cols-1 lg:grid-cols-[360px_1fr] min-h-[520px]">
          <aside className="border-b lg:border-b-0 lg:border-r border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <div className="text-sm font-semibold text-secondary">Conversations</div>
              {orderId ? <div className="text-xs text-gray-500 mt-1">Filtered by order: {orderId}</div> : null}
            </div>
            {loading ? (
              <div className="p-4 text-gray-600">Loading...</div>
            ) : users.length === 0 ? (
              <div className="p-4 text-gray-600">No conversations available.</div>
            ) : (
              <div className="divide-y">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setActiveUserId(String(u.id))}
                    className={`w-full text-left p-4 hover:bg-gray-50 ${
                      String(u.id) === String(activeUserId) ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-secondary">{u.name}</div>
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${roleBadge(u.role)}`}>{u.role}</span>
                    </div>
                    {u.phone ? <div className="text-xs text-gray-500 mt-1">{u.phone}</div> : null}
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-secondary">{active?.name || 'Select a conversation'}</div>
                <div className="text-xs text-gray-500">{active?.role ? `Role: ${active.role}` : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="px-3 py-2 border rounded-[12px] text-sm"
                  placeholder="Order ID filter (optional)"
                />
                <button
                  type="button"
                  onClick={() => setOrderId('')}
                  className="px-3 py-2 rounded-[12px] border border-gray-200 text-sm font-semibold hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50">
              {!activeUserId ? (
                <div className="text-gray-600">Select a user to start chatting.</div>
              ) : thread.length === 0 ? (
                <div className="text-gray-600">No messages yet.</div>
              ) : (
                thread.map((m) => {
                  const mine = String(m.fromUserId) !== String(activeUserId);
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] rounded-[16px] px-4 py-3 shadow-sm ${mine ? 'bg-primary text-white' : 'bg-white'}`}>
                        <div className="text-sm whitespace-pre-wrap">{m.body}</div>
                        <div className={`text-[11px] mt-2 ${mine ? 'text-white/80' : 'text-gray-400'}`}>
                          {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                          {m.orderId ? ` • ${m.orderId}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 px-4 py-3 border rounded-[14px]"
                placeholder={activeUserId ? 'Type a message…' : 'Select a conversation first'}
                disabled={!activeUserId || sending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send();
                }}
              />
              <button
                type="button"
                onClick={send}
                disabled={!activeUserId || sending || !String(text || '').trim()}
                className="px-5 py-3 rounded-[14px] bg-primary text-white font-semibold hover:bg-primary-dark disabled:opacity-60"
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

