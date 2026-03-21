import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

const BRAND = '#F56230';
const BRAND_D = '#d94e22';
const CUSTOMER_HERO_BG = 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1600&auto=format&fit=crop&q=80';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inputCls = `w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-slate-50 outline-none transition-all`;

function TextInput({ value, onChange, ...props }) {
  return (
    <input
      {...props}
      value={value}
      onChange={onChange}
      className={inputCls}
    />
  );
}

function SelectInput({ value, onChange, children, ...props }) {
  return (
    <select
      {...props}
      value={value}
      onChange={onChange}
      className={inputCls}
    >
      {children}
    </select>
  );
}

function EmptyState({ message }) {
  return (
    <div className="p-6 bg-slate-50 border border-slate-100 rounded-[18px] text-sm text-slate-500">
      {message}
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [password, setPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const [methods, setMethods] = useState([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [methodsError, setMethodsError] = useState('');

  const [newType, setNewType] = useState('card');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newAccount, setNewAccount] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newExtra, setNewExtra] = useState('');
  const [saveDefault, setSaveDefault] = useState(true);
  const [addingMethod, setAddingMethod] = useState(false);
  const [pendingRemoveMethodId, setPendingRemoveMethodId] = useState(null);

  const methodListTitle = useMemo(() => {
    const n = methods.length;
    return n ? `${n} payment method${n === 1 ? '' : 's'}` : 'No payment methods saved';
  }, [methods.length]);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setPhone(user.phone || '');
    setAvatarUrl(user.avatar || '');
  }, [user]);

  useEffect(() => {
    if (!user) navigate('/login?redirect=/profile');
  }, [user, navigate]);

  const loadMethods = async () => {
    setMethodsLoading(true);
    setMethodsError('');
    try {
      const list = await api.paymentMethods.list();
      setMethods(Array.isArray(list) ? list : []);
    } catch (e) {
      setMethodsError(e.message || 'Failed to load payment methods');
      setMethods([]);
    } finally {
      setMethodsLoading(false);
    }
  };

  useEffect(() => {
    loadMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAvatarFile = async (file) => {
    if (!file) return;
    setProfileMsg('');
    try {
      const data = await api.profile.uploadAvatar(file);
      if (data?.url) setAvatarUrl(data.url);
    } catch (e) {
      setToastType('error');
      setProfileMsg(e.message || 'Failed to upload avatar');
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?]).{8,}$/;
    if (password && !strongPassword.test(password)) {
      setToastType('error');
      setProfileMsg('New password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      return;
    }
    setSavingProfile(true);
    setProfileMsg('');
    try {
      await api.profile.update({
        name: name.trim(),
        phone: phone.trim(),
        avatar: avatarUrl || null,
        password: password ? password : undefined,
      });
      setToastType('success');
      setProfileMsg('Profile saved successfully.');
      setPassword('');
    } catch (err) {
      setToastType('error');
      setProfileMsg(err.message || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const addMethod = async (e) => {
    e.preventDefault();
    if (!newAccount.trim()) return;
    if (newType === 'bank' && !newBankName.trim()) {
      setToastType('error');
      setProfileMsg('Bank name is required for bank transfers.');
      return;
    }
    setAddingMethod(true);
    try {
      let extraObj = null;

      // For bank transfers we always store bankName in `extra`.
      if (newType === 'bank') extraObj = { bankName: newBankName.trim() };

      // For card/mobile we allow optional JSON in the "extra" field.
      if (newType !== 'bank') {
        const raw = String(newExtra || '').trim();
        if (raw) {
          try {
            extraObj = JSON.parse(raw);
          } catch {
            extraObj = raw;
          }
        }
      }

      await api.paymentMethods.add({
        type: newType,
        displayName: newDisplayName.trim() || null,
        account: newAccount.trim(),
        extra: extraObj,
        isDefault: saveDefault,
      });
      setNewDisplayName('');
      setNewAccount('');
      setNewBankName('');
      setNewExtra('');
      setSaveDefault(true);
      setNewType('card');
      await loadMethods();
    } catch (err) {
      setToastType('error');
      setProfileMsg(err.message || 'Failed to add payment method');
    } finally {
      setAddingMethod(false);
    }
  };

  const removeMethod = async (id) => {
    try {
      await api.paymentMethods.remove(id);
      await loadMethods();
      setToastType('success');
      setProfileMsg('Payment method unlinked.');
    } catch (e) {
      setToastType('error');
      setProfileMsg(e.message || 'Failed to remove payment method');
    } finally {
      setPendingRemoveMethodId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      <Toast
        message={profileMsg}
        type={toastType}
        duration={2600}
        position="top-right"
        onClose={() => setProfileMsg('')}
      />
      <ConfirmDialog
        open={Boolean(pendingRemoveMethodId)}
        title="Unlink payment method?"
        message="This will remove the payment method from your profile."
        confirmText="Unlink"
        cancelText="Keep"
        confirmType="danger"
        onCancel={() => setPendingRemoveMethodId(null)}
        onConfirm={() => removeMethod(pendingRemoveMethodId)}
      />
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-[24px] text-white p-8 mb-6"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(245,98,48,.92) 0%, rgba(217,78,34,.92) 100%), url(${CUSTOMER_HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute w-72 h-72 rounded-full bg-white/10 -top-24 -right-16 pointer-events-none" />
        <div className="absolute w-56 h-56 rounded-full bg-white/[0.04] -bottom-20 -left-10 pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-[220px]">
            <div className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full mb-4 border border-white/20 bg-white/10">
              <i className="fas fa-user-cog text-[10px]" />
              Account & Payment
            </div>
            <h1 className="text-3xl font-black" style={{ fontFamily: 'Sora,sans-serif' }}>
              My Profile
            </h1>
            <p className="text-white/70 text-sm mt-2">
              Update your details and manage linked cards/banks.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link
              to="/orders"
              className="px-4 py-2.5 rounded-xl bg-white/15 border border-white/20 text-sm font-bold hover:bg-white/25 transition"
            >
              <i className="fas fa-receipt mr-2" style={{ color: '#fff' }} /> My Orders
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Profile */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[24px] border border-slate-100 p-7" style={{ boxShadow: '0 2px 16px rgba(0,0,0,.04)' }}>
            <h2 className="text-lg font-black text-slate-800 mb-4">Account</h2>

            <div className="flex items-center gap-4 mb-5">
              <img
                src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || user.email)}&background=F56230&color=fff&bold=true`}
                alt=""
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white shadow"
              />
              <div className="min-w-0">
                <div className="font-black text-slate-800 truncate">{name || user.name || '—'}</div>
                <div className="text-xs text-slate-500 truncate">{user.email}</div>
              </div>
            </div>

            <form onSubmit={saveProfile} className="space-y-4">
              <Field label="Name">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </Field>
              <Field label="Phone">
                <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 ..." />
              </Field>

              <Field label="Avatar">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => onAvatarFile(e.target.files?.[0])}
                  className="block w-full text-sm text-slate-600"
                  disabled={savingProfile}
                />
              </Field>

              <Field label="New Password (optional)">
                <TextInput
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank or use strong password"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Use at least 8 characters with uppercase, lowercase, number, and special character.
                </p>
              </Field>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-3.5 rounded-2xl text-white font-black text-sm transition"
                style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 6px 20px ${BRAND}40` }}
              >
                {savingProfile ? 'Saving…' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>

        {/* Payment methods */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[24px] border border-slate-100 p-7 mb-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,.04)' }}>
            <h2 className="text-lg font-black text-slate-800 mb-1">Payment Methods</h2>
            <p className="text-sm text-slate-500 mb-5">{methodListTitle}</p>

            {methodsError ? <div className="mb-4 text-sm text-red-600">{methodsError}</div> : null}

            <div className="space-y-4 mb-6">
              {methodsLoading ? (
                <EmptyState message="Loading saved methods..." />
              ) : methods.length === 0 ? (
                <EmptyState message="No saved methods yet. Add one below." />
              ) : (
                methods.map((m) => (
                  <div key={m.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-black text-slate-800">
                          {m.displayName || m.type.toUpperCase()}
                          {m.isDefault ? (
                            <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              Default
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {m.type === 'card'
                            ? `Card •••• ${m.account}`
                            : m.type === 'mobile'
                              ? `Mobile: ${m.account}`
                              : `Bank: ${m.extra?.bankName || 'Bank'} ••• ${m.account}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPendingRemoveMethodId(m.id)}
                        className="px-3 py-2 rounded-xl border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                      >
                        Unlink
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={addMethod} className="bg-slate-50 border border-slate-100 rounded-[20px] p-5">
              <div className="grid lg:grid-cols-3 gap-4">
                <Field label="Type">
                  <SelectInput value={newType} onChange={(e) => setNewType(e.target.value)} disabled={addingMethod}>
                    <option value="card">Card</option>
                    <option value="mobile">Mobile</option>
                    <option value="bank">Bank</option>
                  </SelectInput>
                </Field>
                <Field label="Display Name (optional)">
                  <TextInput value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} disabled={addingMethod} placeholder="e.g. My Visa" />
                </Field>
                <Field label="Account / Identifier">
                  <TextInput
                    value={newAccount}
                    onChange={(e) => setNewAccount(e.target.value)}
                    disabled={addingMethod}
                    placeholder={newType === 'card' ? 'Last4' : newType === 'mobile' ? '+250 7XX...' : 'Reference / Account number'}
                  />
                </Field>

                {newType === 'bank' ? (
                  <Field label="Bank Name">
                    <TextInput
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                      disabled={addingMethod}
                      placeholder="e.g. Access Bank"
                    />
                  </Field>
                ) : null}
              </div>

              {newType !== 'bank' ? (
                <Field label="Extra (optional, JSON)">
                  <TextInput
                    value={newExtra}
                    onChange={(e) => setNewExtra(e.target.value)}
                    disabled={addingMethod}
                    placeholder={newType === 'card' ? 'e.g. {"expiry":"12/28"}' : 'optional JSON (e.g. {"provider":"MTN"})'}
                  />
                </Field>
              ) : null}

              <label className="flex items-center gap-3 text-sm font-bold text-slate-700 mt-3">
                <input type="checkbox" checked={saveDefault} onChange={(e) => setSaveDefault(e.target.checked)} disabled={addingMethod} />
                Set as default
              </label>

              <button
                type="submit"
                disabled={addingMethod || !newAccount.trim() || (newType === 'bank' && !newBankName.trim())}
                className="mt-5 w-full py-3.5 rounded-2xl text-white font-black text-sm transition disabled:opacity-60"
                style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 6px 20px ${BRAND}40` }}
              >
                {addingMethod ? 'Saving…' : 'Save Payment Method'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

