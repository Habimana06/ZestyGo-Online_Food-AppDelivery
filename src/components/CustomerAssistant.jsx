import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const normalize = (s) => String(s || '').toLowerCase().replaceAll(/[^a-z0-9\s]/g, ' ').replaceAll(/\s+/g, ' ').trim();

const cannedAnswer = (q) => {
  const t = normalize(q);
  if (!t) return null;
  if (t.includes('track') || t.includes('where is my order') || t.includes('order status')) {
    return "You can track your order from the 'Orders' page. Open an order to see its latest status and updates.";
  }
  if (t.includes('delivery fee') || t.includes('fee') || t.includes('shipping')) {
    return 'Delivery fee is set by the restaurant during order acceptance and is included in your checkout total.';
  }
  if (t.includes('refund') || t.includes('cancel')) {
    return 'For cancellations/refunds, please share your Order ID and a short explanation so our Human Assistant can help.';
  }
  if (t.includes('contact') || t.includes('support') || t.includes('help')) {
    return 'You can message our Human Assistant here. If you share your Order ID (if any), we can help faster.';
  }
  return null;
};

export default function CustomerAssistant() {
  const { user } = useAuth();
  const isCustomer = user?.role === 'customer';

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [msgs, setMsgs] = useState(() => [
    { from: 'bot', body: 'Hi! Ask me anything about orders, delivery fees, tracking, or support.' },
  ]);

  const canUse = !!user && isCustomer;

  const suggested = useMemo(
    () => ['How do I track my order?', 'What is the delivery fee?', 'I need help with a refund'],
    [],
  );

  useEffect(() => {
    if (!open) setError('');
  }, [open]);

  const push = (m) => setMsgs((arr) => [...arr, m]);

  const escalateToHuman = async (question) => {
    setBusy(true);
    setError('');
    try {
      const conv = await api.messages.conversations();
      const sa = Array.isArray(conv) ? conv.find((u) => u.role === 'system_assistant') : null;
      if (!sa?.id) throw new Error('No System Assistant available to receive the message');
      await api.messages.send({
        toUserId: Number(sa.id),
        body: `[Human Assistant request]\nCustomer: ${user?.name || user?.email || user?.id}\nQuestion: ${question}`,
      });
      push({ from: 'bot', body: 'Done. A Human Assistant will reply in System Assistant Messages soon.' });
      push({ from: 'bot', body: 'Tip: you can include your Order ID to speed things up.' });
    } catch (e) {
      setError(e.message || 'Failed to contact Human Assistant');
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    const q = String(text || '').trim();
    if (!q) return;
    setText('');
    push({ from: 'me', body: q });

    const ans = cannedAnswer(q);
    if (ans) {
      push({ from: 'bot', body: ans });
      return;
    }

    push({ from: 'bot', body: "I’m not fully sure. Do you want me to send this to a Human Assistant?" });
    await escalateToHuman(q);
  };

  if (!isCustomer) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-[360px] max-w-[92vw] bg-white rounded-[22px] shadow-custom overflow-hidden border border-gray-100">
          <div className="p-4 flex items-center justify-between gap-3 bg-gray-50 border-b border-gray-100">
            <div>
              <div className="font-extrabold text-secondary">Assistant</div>
              <div className="text-xs text-gray-500">Escalates to Human Assistant when needed.</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 w-9 rounded-[12px] hover:bg-white border border-gray-200 text-gray-600"
              aria-label="Close assistant"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="p-4 space-y-3 max-h-[360px] overflow-auto bg-white">
            {!canUse ? (
              <div className="rounded-[16px] bg-amber-50 border border-amber-100 p-4 text-amber-900 text-sm">
                Please <Link className="font-semibold underline" to="/login">sign in</Link> as a customer to use the assistant.
              </div>
            ) : null}
            {error ? <div className="rounded-[16px] bg-red-50 border border-red-100 p-3 text-sm text-red-700">{error}</div> : null}

            {msgs.map((m, idx) => (
              <div key={idx} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-[16px] px-4 py-3 text-sm whitespace-pre-wrap ${m.from === 'me' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-900'}`}>
                  {m.body}
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-2 mb-3">
              {suggested.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={!canUse || busy}
                  onClick={() => setText(s)}
                  className="px-3 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={!canUse || busy}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-[14px] focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder={canUse ? 'Type your question…' : 'Sign in to ask'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send();
                }}
              />
              <button
                type="button"
                disabled={!canUse || busy || !String(text || '').trim()}
                onClick={send}
                className="px-4 py-3 rounded-[14px] bg-secondary text-white font-extrabold hover:bg-secondary/90 disabled:opacity-60"
                aria-label="Send"
              >
                {busy ? '…' : <i className="fas fa-paper-plane"></i>}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-14 w-14 rounded-[18px] bg-primary text-white shadow-custom hover:bg-primary-dark grid place-items-center"
        aria-label="Open assistant"
      >
        <i className="fas fa-comment-dots text-xl"></i>
      </button>
    </div>
  );
}

