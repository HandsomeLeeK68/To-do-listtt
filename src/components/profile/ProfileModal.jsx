import React from 'react';

export default function ProfileModal({ show, onClose, profile, onChange, onSave, saving, error }) {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center backdrop-blur-xs"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal Content */}
      <div
        className="relative bg-white/90 border border-white/80 rounded-2xl shadow-2xl backdrop-blur-lg p-6 w-full max-w-lg mx-2 z-10"
        style={{
          boxShadow: '0 8px 64px 0 rgba(0, 159, 193, 0.15)',
        }}
      >
        <button
          className="absolute top-3 right-3 px-2 py-1 text-2xl text-gray-400 hover:text-cyan-500 transition rounded focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-5">User Profile</h2>
        <form
          onSubmit={e => {
            onSave(e);
          }}
        >
          {/* Avatar preview */}
          <div className="flex justify-center mb-5">
            {profile.avatarUrl ?
              <img
                src={profile.avatarUrl}
                alt={profile.displayName || profile.username || 'Avatar'}
                className="w-20 h-20 rounded-full border-4 border-cyan-200 object-cover shadow"
                onError={e => { e.target.onerror = null; e.target.src = ""; }}
              /> :
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 flex items-center justify-center text-white font-extrabold text-4xl border-4 border-cyan-200 shadow">
                {(profile.displayName || profile.username || 'U')[0]?.toUpperCase()}
              </div>
            }
          </div>
          <div className="mb-3">
            <label className="block text-slate-700 font-semibold mb-1">Display Name</label>
            <input
              type="text"
              value={profile.displayName || ""}
              onChange={e => onChange({ ...profile, displayName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white border border-cyan-200 focus:ring-2 focus:ring-cyan-400 outline-none font-medium"
              maxLength={40}
              required
            />
          </div>
          <div className="mb-3">
            <label className="block text-slate-700 font-semibold mb-1">Avatar URL</label>
            <input
              type="url"
              placeholder="Paste image link..."
              value={profile.avatarUrl || ""}
              onChange={e => onChange({ ...profile, avatarUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white border border-cyan-200 focus:ring-2 focus:ring-cyan-400 outline-none font-medium"
            />
            {profile.avatarUrl && (
              <div className="text-xs mt-1 text-gray-400">
                <span>Preview above if valid.</span>
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="block text-slate-700 font-semibold mb-1">Birthday</label>
            <input
              type="date"
              value={profile.birthday ? profile.birthday.slice(0, 10) : ""}
              onChange={e => onChange({ ...profile, birthday: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white border border-cyan-200 focus:ring-2 focus:ring-cyan-400 outline-none"
            />
          </div>
          <div className="mb-4">
            <label className="block text-slate-700 font-semibold mb-1">Bio</label>
            <textarea
              value={profile.bio || ""}
              onChange={e => onChange({ ...profile, bio: e.target.value })}
              rows={3}
              maxLength={240}
              className="w-full px-3 py-2 rounded-lg bg-white border border-cyan-200 focus:ring-2 focus:ring-cyan-400 outline-none font-medium resize-none"
            />
            <div className="text-xs mt-1 text-gray-400">
              {profile.bio?.length || 0}/240
            </div>
          </div>
          {error && <div className="text-red-500 font-semibold text-center mb-3">{error}</div>}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold shadow transition disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}