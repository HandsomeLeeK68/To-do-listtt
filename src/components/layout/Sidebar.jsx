import React from 'react';
import { SIDEBAR_NAV } from '../../constants';
import { formatBirthday } from '../../utils/dateUtils';

export default function Sidebar({
  activeTab,
  setActiveTab,
  handleLogout,
  sidebarOpen,
  setSidebarOpen,
  userProfile,
  onAvatarClick,
}) {
  // Fallbacks for display
  const displayName = userProfile?.displayName || userProfile?.username || "Welcome!";
  const avatarUrl = userProfile?.avatarUrl;
  const birthday = userProfile?.birthday;
  const bio = userProfile?.bio;

  return (
    <>
      {/* Overlay for mobile menu */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed z-40 inset-0 bg-black/20 md:hidden transition ${sidebarOpen ? 'block' : 'hidden'}`}
        aria-hidden={!sidebarOpen}
      />
      <aside
        className={`
          fixed md:relative z-50 top-0 left-0 h-full
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:block
          w-60 md:w-1/4
          bg-slate-50/80 backdrop-blur-2xl border-r border-white/20 shadow-lg
          px-6 pt-8 pb-6
          transition-transform duration-300
          flex flex-col
          min-h-screen
        `}
        style={{
          maxWidth: "340px",
          boxShadow: "0 12px 32px 0 rgba(31, 38, 135, 0.10)"
        }}
        aria-label="Sidebar"
      >
        <div className="mb-8 flex flex-col items-center">
          {/* User avatar/icon, now clickable for Profile */}
          <button
            className="rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-inner w-20 h-20 flex items-center justify-center text-white text-3xl font-black select-none mb-3 border-4 border-white/60 focus:outline-none group relative"
            aria-label="Open Profile"
            tabIndex={0}
            style={{ outline: 'none', overflow: 'hidden' }}
            onClick={onAvatarClick}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="object-cover w-full h-full rounded-full"
                onError={e => { e.target.onerror = null; e.target.src = ""; }}
              />
            ) : (
              <span aria-label="user" className="drop-shadow">
                {displayName?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
            {/* Small badge for Profile/Settings hint */}
            <span className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-cyan-300 flex items-center justify-center text-cyan-900 text-xs font-extrabold shadow border-2 border-white group-hover:bg-cyan-500 transition">
              <svg width={16} height={16} fill="none" viewBox="0 0 24 24"><circle cx={12} cy={12} r={10} stroke="#0891b2" strokeWidth="2"/><path d="M12 16v2m0-10.5V8m0 0a2 2 0 110-4 2 2 0 010 4z" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" /></svg>
            </span>
          </button>
          <div className="text-xl font-semibold text-slate-900 mb-1 text-center truncate max-w-[90%]">{displayName}</div>
          {birthday && (
            <div className="text-xs text-slate-700 font-medium mb-1">🎂 {formatBirthday(birthday)}</div>
          )}
          {bio && (
            <div className="text-xs text-slate-700/80 mb-1 text-center max-w-[94%] truncate">{bio}</div>
          )}
          <button
            onClick={handleLogout}
            className="mt-1 px-4 py-1 rounded-lg bg-white/60 text-red-500 border border-white/30 shadow hover:bg-red-500 hover:text-white transition font-semibold text-sm"
          >
            Logout
          </button>
        </div>
        <nav className="flex-1">
          {SIDEBAR_NAV.map(item => (
            <button
              key={item.key}
              onClick={() => {
                setActiveTab(item.key);
                setSidebarOpen(false); // auto close on mobile
              }}
              className={`
                flex items-center w-full mb-2 py-2 px-3 rounded-lg
                text-lg font-medium
                transition 
                ${activeTab === item.key
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 font-bold"
                  : "hover:bg-blue-100/90 hover:text-blue-900 text-blue-700"}
                ${item.key === "IMPORTANT" ? "mt-6" : ""}
              `}
              style={{ outline: 'none' }}
            >
              <span className="mr-3">{item.icon}</span>
              <span className="">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="text-xs text-slate-700/40 text-center mt-auto select-none pt-2 tracking-widest">Powered by Todo App</div>
      </aside>
    </>
  );
}