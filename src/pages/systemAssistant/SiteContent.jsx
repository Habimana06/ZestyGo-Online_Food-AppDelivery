import { useEffect, useState } from 'react';
import { api } from '../../api';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';

const BRAND = '#F56230';
const BRAND_D = '#d94e22';

const baseInput = `w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white outline-none transition-all`;

const ICON_CHOICES = [
  'fa-facebook-f',
  'fa-twitter',
  'fa-instagram',
  'fa-linkedin-in',
  'fa-youtube',
  'fa-tiktok',
  'fa-whatsapp',
  'fa-envelope',
  'fa-globe',
];

function makeAvatarUrl(name) {
  const nm = String(name || '').trim() || 'Team';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nm)}&background=F56230&color=fff&bold=true`;
}

export default function SystemAssistantSiteContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [content, setContent] = useState({
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    aboutStory: '',
    aboutImageUrl: '',
  });
  const [aboutImageFile, setAboutImageFile] = useState(null);

  const [socials, setSocials] = useState([]);
  const [socialDrafts, setSocialDrafts] = useState({});
  const [newSocial, setNewSocial] = useState({ icon: 'fa-facebook-f', href: '#', scope: 'both' });

  const [team, setTeam] = useState([]);
  const [teamDrafts, setTeamDrafts] = useState({});
  const [teamImageFiles, setTeamImageFiles] = useState({});
  const [newTeam, setNewTeam] = useState({ name: '', role: '' });
  const [newTeamImageFile, setNewTeamImageFile] = useState(null);
  const [pendingDeleteSocialId, setPendingDeleteSocialId] = useState(null);
  const [pendingDeleteTeamId, setPendingDeleteTeamId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await api.systemAssistant.site.getContent();
      const c = d?.content || {};

      setContent({
        companyAddress: c.company_address || c.companyAddress || '',
        companyPhone: c.company_phone || c.companyPhone || '',
        companyEmail: c.company_email || c.companyEmail || '',
        aboutStory: c.about_story || c.aboutStory || '',
        aboutImageUrl: c.about_image_url || c.aboutImageUrl || '',
      });

      const s = Array.isArray(d?.socials) ? d.socials : [];
      setSocials(s);
      setSocialDrafts(
        Object.fromEntries(
          s.map((x) => [x.id, { icon: x.icon || 'fa-facebook-f', href: x.href || '#', scope: x.scope || 'both' }]),
        ),
      );

      const t = Array.isArray(d?.team) ? d.team : [];
      setTeam(t);
      setTeamDrafts(
        Object.fromEntries(
          t.map((x) => [
            x.id,
            {
              name: x.name || '',
              role: x.role || '',
              imageUrl: x.image_url || x.imageUrl || null,
            },
          ]),
        ),
      );
    } catch (e) {
      setError(e?.message || 'Failed to load site content');
      setSocials([]);
      setTeam([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!error) return;
    setToastType('error');
    setToastMessage(error);
  }, [error]);

  const saveMainContent = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      let aboutImageUrl = content.aboutImageUrl;
      if (aboutImageFile) {
        const up = await api.profile.uploadAvatar(aboutImageFile);
        aboutImageUrl = up?.url || up?.imageUrl || aboutImageUrl;
      }

      await api.systemAssistant.site.updateContent({
        companyAddress: content.companyAddress,
        companyPhone: content.companyPhone,
        companyEmail: content.companyEmail,
        aboutStory: content.aboutStory,
        aboutImageUrl,
      });

      setAboutImageFile(null);
      await load();
      setToastType('success');
      setToastMessage('Main site content saved.');
    } catch (e2) {
      setError(e2?.message || 'Failed to save main content');
    } finally {
      setBusy(false);
    }
  };

  const addSocial = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.systemAssistant.site.socials.add(newSocial);
      setNewSocial({ icon: 'fa-facebook-f', href: '#', scope: 'both' });
      await load();
      setToastType('success');
      setToastMessage('Social link added.');
    } catch (e2) {
      setError(e2?.message || 'Failed to add social link');
    } finally {
      setBusy(false);
    }
  };

  const updateSocial = async (id) => {
    const draft = socialDrafts[id];
    if (!draft) return;
    setBusy(true);
    setError('');
    try {
      await api.systemAssistant.site.socials.update(id, draft);
      await load();
      setToastType('success');
      setToastMessage('Social link updated.');
    } catch (e2) {
      setError(e2?.message || 'Failed to update social link');
    } finally {
      setBusy(false);
    }
  };

  const deleteSocial = async (id) => {
    setPendingDeleteSocialId(null);
    setBusy(true);
    setError('');
    try {
      await api.systemAssistant.site.socials.remove(id);
      await load();
      setToastType('success');
      setToastMessage('Social link deleted.');
    } catch (e2) {
      setError(e2?.message || 'Failed to delete social link');
      setToastType('error');
      setToastMessage(e2?.message || 'Failed to delete social link');
    } finally {
      setBusy(false);
    }
  };

  const addTeam = async (e) => {
    e.preventDefault();
    const name = String(newTeam.name || '').trim();
    const role = String(newTeam.role || '').trim();
    if (!name || !role) return;

    setBusy(true);
    setError('');
    try {
      let imageUrl = null;
      if (newTeamImageFile) {
        const up = await api.profile.uploadAvatar(newTeamImageFile);
        imageUrl = up?.url || up?.imageUrl || null;
      }
      await api.systemAssistant.site.team.add({ name, role, imageUrl });
      setNewTeam({ name: '', role: '' });
      setNewTeamImageFile(null);
      await load();
      setToastType('success');
      setToastMessage('Team member added.');
    } catch (e2) {
      setError(e2?.message || 'Failed to add team member');
    } finally {
      setBusy(false);
    }
  };

  const updateTeam = async (id) => {
    const draft = teamDrafts[id];
    if (!draft) return;
    const name = String(draft.name || '').trim();
    const role = String(draft.role || '').trim();
    if (!name || !role) return;

    setBusy(true);
    setError('');
    try {
      let imageUrl = draft.imageUrl || null;
      const file = teamImageFiles[id] || null;
      if (file) {
        const up = await api.profile.uploadAvatar(file);
        imageUrl = up?.url || up?.imageUrl || imageUrl;
      }
      await api.systemAssistant.site.team.update(id, { name, role, imageUrl });
      setTeamImageFiles((p) => ({ ...p, [id]: null }));
      await load();
      setToastType('success');
      setToastMessage('Team member updated.');
    } catch (e2) {
      setError(e2?.message || 'Failed to update team member');
    } finally {
      setBusy(false);
    }
  };

  const deleteTeam = async (id) => {
    setPendingDeleteTeamId(null);
    setBusy(true);
    setError('');
    try {
      await api.systemAssistant.site.team.remove(id);
      await load();
      setToastType('success');
      setToastMessage('Team member deleted.');
    } catch (e2) {
      setError(e2?.message || 'Failed to delete team member');
      setToastType('error');
      setToastMessage(e2?.message || 'Failed to delete team member');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <ConfirmDialog
        open={Boolean(pendingDeleteSocialId)}
        title="Delete social link?"
        message="This social link will be removed from the site."
        confirmText="Delete"
        cancelText="Cancel"
        confirmType="danger"
        loading={busy}
        onCancel={() => setPendingDeleteSocialId(null)}
        onConfirm={() => deleteSocial(pendingDeleteSocialId)}
      />
      <ConfirmDialog
        open={Boolean(pendingDeleteTeamId)}
        title="Delete team member?"
        message="This member will be removed from the About page."
        confirmText="Delete"
        cancelText="Cancel"
        confirmType="danger"
        loading={busy}
        onCancel={() => setPendingDeleteTeamId(null)}
        onConfirm={() => deleteTeam(pendingDeleteTeamId)}
      />
      <Toast
        message={toastMessage}
        type={toastType}
        duration={2400}
        position="top-right"
        onClose={() => { setToastMessage(''); setError(''); }}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Site Content</h1>
            <p className="text-sm text-slate-500 mt-1">
              Edit footer social links, contact details, About story + image, and the About team.
            </p>
          </div>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border"
            style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#334155' }}
          >
            <i className="fas fa-globe" style={{ color: BRAND }} />
            {loading ? 'Loading…' : `${socials.length} socials · ${team.length} team`}
          </div>
        </div>

        <div className="grid xl:grid-cols-2 gap-6 items-start">
          <div className="rounded-[22px] border border-slate-100 p-5 bg-slate-50">
            <h2 className="font-black text-slate-800 mb-3">Main Content</h2>
            <form onSubmit={saveMainContent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Address</label>
                <input
                  className={baseInput}
                  value={content.companyAddress}
                  onChange={(e) => setContent((p) => ({ ...p, companyAddress: e.target.value }))}
                  disabled={busy}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Phone</label>
                <input
                  className={baseInput}
                  value={content.companyPhone}
                  onChange={(e) => setContent((p) => ({ ...p, companyPhone: e.target.value }))}
                  disabled={busy}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Email</label>
                <input
                  className={baseInput}
                  value={content.companyEmail}
                  onChange={(e) => setContent((p) => ({ ...p, companyEmail: e.target.value }))}
                  disabled={busy}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">About story</label>
                <textarea
                  className={`${baseInput} min-h-[140px] resize-none`}
                  value={content.aboutStory}
                  onChange={(e) => setContent((p) => ({ ...p, aboutStory: e.target.value }))}
                  placeholder="Write your story. Use blank line between paragraphs."
                  disabled={busy}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">About image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAboutImageFile(e.target.files?.[0] || null)}
                  disabled={busy}
                  className="block w-full text-sm text-slate-600"
                />
                {content.aboutImageUrl ? (
                  <div className="mt-3">
                    <img
                      src={content.aboutImageUrl}
                      alt="About"
                      className="w-full max-w-[320px] rounded-2xl border border-slate-100"
                      style={{ boxShadow: '0 10px 36px rgba(0,0,0,.08)' }}
                    />
                  </div>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3.5 text-white font-black text-sm rounded-2xl transition-all disabled:opacity-60"
                style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 6px 20px ${BRAND}40` }}
              >
                {busy ? 'Saving…' : 'Save Main Content'}
              </button>
            </form>
          </div>

          <div className="rounded-[22px] border border-slate-100 p-5 bg-slate-50">
            <h2 className="font-black text-slate-800 mb-3">Footer + Contact Socials</h2>

            <form onSubmit={addSocial} className="grid grid-cols-1 gap-3 mb-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Icon</label>
                  <select
                    className={baseInput}
                    value={newSocial.icon}
                    onChange={(e) => setNewSocial((p) => ({ ...p, icon: e.target.value }))}
                    disabled={busy}
                  >
                    {ICON_CHOICES.map((ic) => (
                      <option key={ic} value={ic}>
                        {ic}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Scope</label>
                  <select
                    className={baseInput}
                    value={newSocial.scope}
                    onChange={(e) => setNewSocial((p) => ({ ...p, scope: e.target.value }))}
                    disabled={busy}
                  >
                    <option value="both">Both</option>
                    <option value="footer">Footer only</option>
                    <option value="contact">Contact only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Link (href)</label>
                <input
                  className={baseInput}
                  value={newSocial.href}
                  onChange={(e) => setNewSocial((p) => ({ ...p, href: e.target.value }))}
                  placeholder="https://..."
                  disabled={busy}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3.5 text-white font-black text-sm rounded-2xl transition-all disabled:opacity-60"
                style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})`, boxShadow: `0 6px 20px ${BRAND}40` }}
              >
                Add Social
              </button>
            </form>

            {loading ? <div className="text-sm text-slate-500">Loading socials…</div> : null}
            {!loading && socials.length === 0 ? <div className="text-sm text-slate-500">No social links yet.</div> : null}

            {!loading && socials.length > 0 ? (
              <div className="space-y-3 max-h-[460px] overflow-auto pr-1">
                {socials.map((s) => {
                  const draft = socialDrafts[s.id] || s;
                  return (
                    <div key={s.id} className="bg-white border border-slate-100 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                          style={{ background: BRAND }}
                        >
                          <i className={`fab ${draft.icon} text-sm`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Social #{s.id}</div>
                          <div className="text-sm font-black text-slate-800 truncate">{draft.href}</div>
                        </div>
                        <button
                          className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-100"
                          type="button"
                          onClick={() => setPendingDeleteSocialId(s.id)}
                          disabled={busy}
                        >
                          Delete
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Icon</label>
                            <select
                              className={baseInput}
                              value={draft.icon}
                              onChange={(e) =>
                                setSocialDrafts((p) => ({ ...p, [s.id]: { ...draft, icon: e.target.value } }))
                              }
                              disabled={busy}
                            >
                              {ICON_CHOICES.map((ic) => (
                                <option key={ic} value={ic}>
                                  {ic}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Scope</label>
                            <select
                              className={baseInput}
                              value={draft.scope}
                              onChange={(e) =>
                                setSocialDrafts((p) => ({ ...p, [s.id]: { ...draft, scope: e.target.value } }))
                              }
                              disabled={busy}
                            >
                              <option value="both">Both</option>
                              <option value="footer">Footer</option>
                              <option value="contact">Contact</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Link (href)</label>
                          <input
                            className={baseInput}
                            value={draft.href}
                            onChange={(e) =>
                              setSocialDrafts((p) => ({ ...p, [s.id]: { ...draft, href: e.target.value } }))
                            }
                            disabled={busy}
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            className="px-4 py-3.5 rounded-xl text-xs font-black text-white disabled:opacity-60"
                            style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}
                            type="button"
                            onClick={() => updateSocial(s.id)}
                            disabled={busy}
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 xl:col-span-2 rounded-[22px] border border-slate-100 p-5 bg-slate-50">
          <h2 className="font-black text-slate-800 mb-3">About Team</h2>

          <form onSubmit={addTeam} className="grid grid-cols-3 gap-3 mb-6">
            <div className="col-span-1">
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Name</label>
              <input
                className={baseInput}
                value={newTeam.name}
                onChange={(e) => setNewTeam((p) => ({ ...p, name: e.target.value }))}
                disabled={busy}
                placeholder="e.g. Jane Doe"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Role</label>
              <input
                className={baseInput}
                value={newTeam.role}
                onChange={(e) => setNewTeam((p) => ({ ...p, role: e.target.value }))}
                disabled={busy}
                placeholder="e.g. Head of Operations"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Image (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewTeamImageFile(e.target.files?.[0] || null)}
                disabled={busy}
                className="block w-full text-sm text-slate-600"
              />
            </div>
            <div className="col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={busy || !String(newTeam.name || '').trim() || !String(newTeam.role || '').trim()}
                className="px-5 py-3.5 rounded-xl text-xs font-black text-white disabled:opacity-60"
                style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}
              >
                Add Team Member
              </button>
            </div>
          </form>

          {loading ? <div className="text-sm text-slate-500">Loading team…</div> : null}
          {!loading && team.length === 0 ? <div className="text-sm text-slate-500">No team members yet.</div> : null}

          {!loading && team.length > 0 ? (
            <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
              {team.map((m) => {
                const draft = teamDrafts[m.id] || { name: '', role: '', imageUrl: null };
                const preview = draft.imageUrl || makeAvatarUrl(draft.name);
                const file = teamImageFiles[m.id] || null;
                return (
                  <div key={m.id} className="bg-white border border-slate-100 rounded-2xl p-4">
                    <div className="flex items-center gap-4 mb-3 flex-wrap">
                      <img
                        src={file ? URL.createObjectURL(file) : preview}
                        alt={draft.name || 'Team'}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow"
                      />
                      <div className="flex-1 min-w-[220px]">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Team #{m.id}</div>
                        <div className="text-sm font-black text-slate-800">{draft.name}</div>
                        <div className="text-xs text-slate-500">{draft.role}</div>
                      </div>
                      <button
                        className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-100"
                        type="button"
                        onClick={() => setPendingDeleteTeamId(m.id)}
                        disabled={busy}
                      >
                        Delete
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Name</label>
                          <input
                            className={baseInput}
                            value={draft.name || ''}
                            onChange={(e) =>
                              setTeamDrafts((p) => ({ ...p, [m.id]: { ...draft, name: e.target.value } }))
                            }
                            disabled={busy}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Role</label>
                          <input
                            className={baseInput}
                            value={draft.role || ''}
                            onChange={(e) =>
                              setTeamDrafts((p) => ({ ...p, [m.id]: { ...draft, role: e.target.value } }))
                            }
                            disabled={busy}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Replace image (optional)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setTeamImageFiles((p) => ({ ...p, [m.id]: e.target.files?.[0] || null }))
                          }
                          disabled={busy}
                          className="block w-full text-sm text-slate-600"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          className="px-4 py-3.5 rounded-xl text-xs font-black text-white disabled:opacity-60"
                          style={{ background: `linear-gradient(135deg,${BRAND},${BRAND_D})` }}
                          type="button"
                          onClick={() => updateTeam(m.id)}
                          disabled={busy}
                        >
                          Save Updates
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

