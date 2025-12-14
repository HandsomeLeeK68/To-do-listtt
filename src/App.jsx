import React, { useState, useEffect, useRef } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

// --- DND Imports ---
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// --- Icon for Date Picker using lucide-react style SVG ---
function CalendarIcon({ size = 22, color = "#0e7490", ...props }) {
  return (
    <svg width={size} height={size} stroke={color} fill="none" viewBox="0 0 24 24" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="3" strokeWidth="2" />
      <path d="M16 2v4M8 2v4" strokeWidth="2" />
      <path d="M3 10h18" strokeWidth="2" />
    </svg>
  );
}

const API_URL = 'https://my-to-do-listtt.onrender.com/api/todos';
const API_PROFILE_URL = 'https://my-to-do-listtt.onrender.com/api/user/profile';
const API_ME_URL = 'https://my-to-do-listtt.onrender.com/api/user/me';

const SIDEBAR_NAV = [
  { key: 'INBOX', label: 'Inbox', icon: <svg width={20} height={20} fill="none" viewBox="0 0 20 20"><rect x="2.5" y="4.5" width="15" height="11" rx="2.5" stroke="#06b6d4" strokeWidth="2"/></svg> },
  { key: 'TODAY', label: 'Today', icon: <svg width={20} height={20} fill="none" viewBox="0 0 20 20"><rect x="3.5" y="4.5" width="13" height="12" rx="2.5" stroke="#3b82f6" strokeWidth="2"/><rect x="6" y="1.5" width="2" height="5" rx="1" fill="#3b82f6"/><rect x="12" y="1.5" width="2" height="5" rx="1" fill="#3b82f6"/></svg> },
  { key: 'UPCOMING', label: 'Upcoming', icon: <svg width={20} height={20} fill="none" viewBox="0 0 20 20"><path d="M10 3l7 7-7 7M3 10h14" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { key: 'IMPORTANT', label: 'Important', icon: <svg width={20} height={20} fill="none" viewBox="0 0 20 20"><path d="M10 2l2.09 6.26L18 9.27l-5 4.73L14.18 18 10 15.27 5.82 18 7 14l-5-4.73 5.91-.91L10 2z" fill="#ef4444"/></svg> }
];

const PRIORITY_OPTIONS = [
  { label: "High", value: "High", color: "bg-red-500 text-white" },
  { label: "Medium", value: "Medium", color: "bg-yellow-400 text-gray-900" },
  { label: "Low", value: "Low", color: "bg-green-500 text-white" },
];

function getPriorityColor(priority) {
  const found = PRIORITY_OPTIONS.find(opt => opt.value === priority);
  return found ? found.color : "bg-gray-300 text-gray-600";
}

// New helper for border color by priority (case-insensitive, null safe)
const getPriorityBorderColor = (priority) => {
  const p = priority ? priority.toLowerCase() : 'medium';
  if (p === 'high') return 'border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]';
  if (p === 'low') return 'border-green-500 shadow-[0_0_0_1px_rgba(34,197,94,0.2)]';
  return 'border-yellow-400 shadow-[0_0_0_1px_rgba(250,204,21,0.2)]'; // Default Medium
};

// --- NEW: Robust border helper for mutually exclusive borders ---
const getPriorityBorder = (priority) => {
  const p = (priority || 'Medium').toLowerCase().trim();
  if (p === 'high') return 'border-red-500 ring-1 ring-red-500/50';
  if (p === 'low') return 'border-green-500 ring-1 ring-green-500/50';
  return 'border-yellow-400 ring-1 ring-yellow-400/50'; // Default to Medium
};

// --------- DATE/TIME HELPERS FOR DUE DATE ---------

function getNowDatetimeLocal() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  // Local time, pad
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const mins = pad(now.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mins}`;
}

function getTodayThresholdDatetimeLocal() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  // Start of today at 00:00
  return `${yyyy}-${mm}-${dd}T00:00`;
}

function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  let datePart = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  let hours = d.getHours();
  let mins = d.getMinutes();
  if (!isNaN(hours) && !isNaN(mins)) {
    return `${datePart}, ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  } else {
    return datePart;
  }
}

// Helper to format ISO birthdate to nice string
function formatBirthday(birthday) {
  if (!birthday) return null;
  const d = new Date(birthday);
  if (isNaN(d.getTime())) return null;
  // e.g. "Jan 20, 1990"
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function isDateToday(dueDateStr) {
  if (!dueDateStr) return false;
  const due = new Date(dueDateStr);
  const now = new Date();
  return (
    due instanceof Date &&
    now instanceof Date &&
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

function isDateUpcoming(dueDateStr) {
  if (!dueDateStr) return false;
  const due = new Date(dueDateStr);
  const now = new Date();
  return due > now && !isDateToday(dueDateStr);
}

function isDateOverdue(dueDateStr) {
  if (!dueDateStr) return false;
  const due = new Date(dueDateStr);
  const now = new Date();
  return due < now && !isDateToday(dueDateStr);
}

function getDueStatus(dueDateStr) {
  if (!dueDateStr) return null;
  const due = new Date(dueDateStr);
  const now = new Date();
  if (isNaN(due.getTime())) return null;
  if (due < now && !isDateToday(dueDateStr)) return "overdue";
  if (isDateToday(dueDateStr)) return "today";
  if (due > now) return "upcoming";
  return null;
}

// --- Protected Route ---
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

// --- User Profile Modal ---
function ProfileModal({ show, onClose, profile, onChange, onSave, saving, error }) {
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
        <h2 className="text-2xl font-bold text-cyan-900 text-center mb-5">User Profile</h2>
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
            <label className="block text-cyan-800 font-semibold mb-1">Display Name</label>
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
            <label className="block text-cyan-800 font-semibold mb-1">Avatar URL</label>
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
            <label className="block text-cyan-800 font-semibold mb-1">Birthday</label>
            <input
              type="date"
              value={profile.birthday ? profile.birthday.slice(0, 10) : ""}
              onChange={e => onChange({ ...profile, birthday: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white border border-cyan-200 focus:ring-2 focus:ring-cyan-400 outline-none"
            />
          </div>
          <div className="mb-4">
            <label className="block text-cyan-800 font-semibold mb-1">Bio</label>
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

// --- Login & Register Components unchanged ---
function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('https://my-to-do-listtt.onrender.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const { token } = await res.json();
        localStorage.setItem('token', token);
        navigate('/');
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-500 to-blue-700">
      <form
        onSubmit={handleSubmit}
        className="
          relative
          bg-white/40
          border border-white/30
          backdrop-blur-md
          shadow-2xl
          rounded-3xl
          p-8
          w-full max-w-md 
          mx-4
          transition
          duration-300
          "
        style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, .25)' }}
      >
        <h1 className="text-3xl font-bold text-center mb-8 text-white drop-shadow-sm">Login</h1>
        {error && (
          <div className="text-red-400 text-center mb-4 font-medium">{error}</div>
        )}
        <div className="mb-4">
          <input
            type="text"
            autoFocus
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border-none focus:border-transparent shadow focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-white/50 text-gray-800 placeholder-gray-400 font-medium backdrop-blur"
            required
          />
        </div>
        <div className="mb-8">
          <input
            type="password"
            placeholder="Password"
            value={password}
            autoComplete="current-password"
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border-none focus:border-transparent shadow focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-white/50 text-gray-800 placeholder-gray-400 font-medium backdrop-blur"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-5 py-2 rounded-xl font-semibold shadow hover:from-cyan-600 hover:to-blue-600 transition tracking-wide"
        >
          Login
        </button>
        <div className="text-center mt-4 text-white/80 font-light">
          Don't have an account?{' '}
          <a
            className="text-cyan-200 underline underline-offset-2 hover:text-cyan-100 cursor-pointer transition"
            href="/register"
            onClick={e => {
              e.preventDefault();
              navigate('/register');
            }}
          >
            Register
          </a>
        </div>
      </form>
    </div>
  );
}

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('https://my-to-do-listtt.onrender.com/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        setSuccess('Registration successful. You can now log in.');
        setTimeout(() => navigate('/login'), 1000);
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-500 to-blue-700">
      <form
        onSubmit={handleSubmit}
        className="
          relative
          bg-white/40
          border border-white/30
          backdrop-blur-md
          shadow-2xl
          rounded-3xl
          p-8
          w-full max-w-md 
          mx-4
          transition
          duration-300
          "
        style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, .25)' }}
      >
        <h1 className="text-3xl font-bold text-center mb-8 text-white drop-shadow-sm">Register</h1>
        {error && (
          <div className="text-red-400 text-center mb-4 font-medium">{error}</div>
        )}
        {success && (
          <div className="text-green-400 text-center mb-4 font-medium">{success}</div>
        )}
        <div className="mb-4">
          <input
            type="text"
            autoFocus
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border-none focus:border-transparent shadow focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-white/50 text-gray-800 placeholder-gray-400 font-medium backdrop-blur"
            required
          />
        </div>
        <div className="mb-8">
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border-none focus:border-transparent shadow focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-white/50 text-gray-800 placeholder-gray-400 font-medium backdrop-blur"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-5 py-2 rounded-xl font-semibold shadow hover:from-cyan-600 hover:to-blue-600 transition tracking-wide"
        >
          Register
        </button>
        <div className="text-center mt-4 text-white/80 font-light">
          Already have an account?{' '}
          <a
            className="text-cyan-200 underline underline-offset-2 hover:text-cyan-100 cursor-pointer transition"
            href="/login"
            onClick={e => {
              e.preventDefault();
              navigate('/login');
            }}
          >
            Login
          </a>
        </div>
      </form>
    </div>
  );
}

// --- Sidebar with Profile Integration ---
function Sidebar({
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
          bg-white/30 backdrop-blur-xl border-r border-white/20 shadow-lg
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
          <div className="text-xl font-semibold text-cyan-900 mb-1 text-center truncate max-w-[90%]">{displayName}</div>
          {birthday && (
            <div className="text-xs text-cyan-700 font-medium mb-1">🎂 {formatBirthday(birthday)}</div>
          )}
          {bio && (
            <div className="text-xs text-cyan-600/80 mb-1 text-center max-w-[94%] truncate">{bio}</div>
          )}
          <button
            onClick={handleLogout}
            className="mt-1 px-4 py-1 rounded-lg bg-white/40 text-red-500 border border-white/30 shadow hover:bg-red-500 hover:text-white transition font-semibold text-sm"
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
                  ? "bg-cyan-500/95 text-white shadow font-bold"
                  : "hover:bg-cyan-200/70 hover:text-cyan-900 text-cyan-700"}
                ${item.key === "IMPORTANT" ? "mt-6" : ""}
              `}
              style={{ outline: 'none' }}
            >
              <span className="mr-3">{item.icon}</span>
              <span className="">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="text-xs text-cyan-900/40 text-center mt-auto select-none pt-2 tracking-widest">Powered by Todo App</div>
      </aside>
    </>
  );
}

// -------- FILTER LOGIC: Now using TIME as well --------
function getFilteredTodos(tasks, activeTab) {
  if (activeTab === 'TODAY') {
    return tasks.filter(task =>
      !!task.dueDate && isDateToday(task.dueDate)
    );
  }
  if (activeTab === 'UPCOMING') {
    return tasks.filter(task =>
      !!task.dueDate && isDateUpcoming(task.dueDate)
    );
  }
  if (activeTab === 'IMPORTANT') {
    return tasks.filter(task => task.priority === 'High');
  }
  return tasks;
}

function getTabTitle(tab) {
  switch (tab) {
    case "TODAY": return "Today";
    case "UPCOMING": return "Upcoming";
    case "IMPORTANT": return "Important";
    default: return "Inbox";
  }
}

function TodoAppMain() {
  // -- Main state --
  const [input, setInput] = useState('');
  const [inputPriority, setInputPriority] = useState('Medium');
  const [inputDueDate, setInputDueDate] = useState(getNowDatetimeLocal());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editDueDate, setEditDueDate] = useState('');

  const [activeTab, setActiveTab] = useState('INBOX');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showCelebration, setShowCelebration] = useState(false);
  const timerRef = useRef(null);

  // --- Profile feature state ---
  const [userProfile, setUserProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    displayName: "",
    avatarUrl: "",
    birthday: "",
    bio: "",
    username: ""
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  const { width, height } = useWindowSize();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserProfile(null);
    navigate('/login');
  };

  // Fetch todos on mount or when token changes
  useEffect(() => {
    if (!token) {
      setTasks([]);
      setLoading(false);
      setUserProfile(null);
      return;
    }
    setLoading(true);
    fetch(API_URL, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          handleLogout();
          return [];
        }
        return res.json();
      })
      .then(data => {
        setTasks(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line
  }, [token]);

  // Fetch user profile on mount/token
  useEffect(() => {
    if (!token) {
      setUserProfile(null);
      return;
    }
    fetch(API_ME_URL, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          handleLogout();
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && typeof data === 'object') {
          setUserProfile(data);
        }
      })
      .catch(() => { /* Ignore */ });
    // eslint-disable-next-line
  }, [token]);

  // Prepare profile draft when modal opens
  useEffect(() => {
    if (showProfileModal && userProfile) {
      setProfileDraft({
        displayName: userProfile.displayName || "",
        avatarUrl: userProfile.avatarUrl || "",
        birthday: userProfile.birthday ? userProfile.birthday.slice(0, 10) : "",
        bio: userProfile.bio || "",
        username: userProfile.username || ""
      });
    }
    if (!showProfileModal) {
      setProfileError('');
    }
  }, [showProfileModal, userProfile]);

  // Save Profile handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    try {
      const payload = {
        displayName: profileDraft.displayName,
        avatarUrl: profileDraft.avatarUrl,
        bio: profileDraft.bio,
        // Convert empty string to null before sending
        birthday: profileDraft.birthday === "" ? null : profileDraft.birthday 
      };
      console.log("Sending payload:", payload);

      const res = await fetch(API_PROFILE_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token 
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        alert("Profile saved successfully!");
        setShowProfileModal(false);
        // Update local user state - data is the full user object (without password)
        if (data && typeof data === 'object') {
          setUserProfile(data);
        } else {
          // Fallback: Re-fetch profile to get updated data
          fetch(API_ME_URL, {
            headers: {
              Authorization: 'Bearer ' + token,
            },
          })
            .then(res => res.json())
            .then(profileData => {
              if (profileData && typeof profileData === 'object') {
                setUserProfile(profileData);
              }
            })
            .catch(() => { /* Ignore */ });
        }
      } else {
        console.error("Server Error:", data);
        alert(`Could not save profile: ${data.error || res.statusText}`);
        setProfileError(data.error || "Failed to save profile");
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert("Network error. Check console for details.");
      setProfileError("Could not save profile. Try again.");
    }
    setProfileSaving(false);
  };

  // Progress calculation
  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;
  const pct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // Confetti/celebration effect
  useEffect(() => {
    if (pct === 100 && totalCount > 0) {
      setShowCelebration(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShowCelebration(false);
        timerRef.current = null;
      }, 4000);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setShowCelebration(false);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [pct, totalCount]);

  // Add Task
  const handleAddTask = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const outgoingDueDate = inputDueDate || getNowDatetimeLocal();
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          text: trimmed,
          priority: inputPriority,
          dueDate: outgoingDueDate,
        }),
      });

      if (res.ok) {
        const newTask = await res.json();
        setTasks(prev => [...prev, newTask]);
        setInput('');
        setInputPriority('Medium');
        setInputDueDate(getNowDatetimeLocal());
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (e) {
      console.error("Lỗi khi thêm task:", e);
    }
  };

  // Delete Task
  const handleDeleteTask = async (_id) => {
    try {
      const res = await fetch(`${API_URL}/${_id}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
      if (res.ok) {
        setTasks(tasks => tasks.filter(task => task._id !== _id));
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (e) { }
  };

  // Toggle Complete
  const handleToggleCompleted = async (_id) => {
    const task = tasks.find(t => t._id === _id);
    if (!task) return;
    try {
      const res = await fetch(`${API_URL}/${_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          completed: !task.completed,
          text: task.text,
          priority: task.priority,
          dueDate: task.dueDate || getNowDatetimeLocal(),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(tasks =>
          tasks.map(task =>
            task._id === _id ? { ...task, completed: updated.completed } : task
          )
        );
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (e) { }
  };

  // Edit handling
  const startEditTask = task => {
    setEditingId(task._id);
    setEditValue(task.text);
    setEditPriority(task.priority || "Medium");
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      if (!isNaN(d.getTime())) {
        const pad = n => String(n).padStart(2, '0');
        const yyyy = d.getFullYear();
        const mm = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const hh = pad(d.getHours());
        const mins = pad(d.getMinutes());
        setEditDueDate(`${yyyy}-${mm}-${dd}T${hh}:${mins}`);
      } else {
        setEditDueDate('');
      }
    } else {
      setEditDueDate('');
    }
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
    setEditPriority('Medium');
    setEditDueDate('');
  };

  const handleSaveEdit = async (_id) => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    const outgoingDueDate = editDueDate || getNowDatetimeLocal();
    try {
      const original = tasks.find(task => task._id === _id);
      const res = await fetch(`${API_URL}/${_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          text: trimmed,
          priority: editPriority,
          dueDate: outgoingDueDate,
          completed: original.completed,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(tasks =>
          tasks.map(task =>
            task._id === _id
              ? { ...task, text: updated.text, priority: updated.priority, dueDate: updated.dueDate }
              : task
          )
        );
        setEditingId(null);
        setEditValue('');
        setEditPriority('Medium');
        setEditDueDate('');
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (e) { }
  };

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const filteredTodos = getFilteredTodos(tasks, activeTab);

  // For inline overdue date edit
  const [overdueInlineEditId, setOverdueInlineEditId] = useState(null);
  const [overdueInlineEditDate, setOverdueInlineEditDate] = useState('');
  const overdueInlineInputRef = useRef();

  useEffect(() => {
    if (overdueInlineEditId && overdueInlineInputRef.current) {
      overdueInlineInputRef.current.focus();
    }
  }, [overdueInlineEditId]);

  const handleOverdueReschedule = async (task, newDateTime) => {
    const outgoingDueDate = newDateTime || getNowDatetimeLocal();
    try {
      const res = await fetch(`${API_URL}/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          text: task.text,
          priority: task.priority,
          dueDate: outgoingDueDate,
          completed: task.completed,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(tasks =>
          tasks.map(t =>
            t._id === task._id
              ? { ...t, dueDate: updated.dueDate }
              : t
          )
        );
        setOverdueInlineEditId(null);
        setOverdueInlineEditDate('');
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
        setOverdueInlineEditId(null);
      }
    } catch (e) {
      setOverdueInlineEditId(null);
    }
  };

  // === DRAG AND DROP ===

  /**
   * Only allow drag-drop for 'INBOX'
   * Reorder the `tasks` array and persist to backend.
   */
  const handleOnDragEnd = async result => {
    if (!result.destination) return;
    // Only act if not filtered, i.e., INBOX (this function only available for INBOX view)
    if (activeTab !== "INBOX") return;

    const fromIdx = result.source.index;
    const toIdx = result.destination.index;
    if (fromIdx === toIdx) return;

    // 1. Reorder `tasks` locally
    const newTasks = Array.from(tasks);
    const [removedTask] = newTasks.splice(fromIdx, 1);
    newTasks.splice(toIdx, 0, removedTask);

    setTasks(newTasks);

    // 2. Prepare new order data: array of { _id, position } (0-based index)
    const reorderPayload = newTasks.map((task, idx) => ({ _id: task._id, position: idx }));

    try {
      // 3. Send PUT to /api/todos/reorder
      await fetch(`${API_URL}/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ order: reorderPayload }),
      });
    } catch (e) {
      // Optionally, roll back, or handle error
      // For now, just leave as is
    }
  };

  // Main
  return (
    <div className="w-screen h-screen bg-gradient-to-br from-cyan-500 to-blue-700 transition duration-500 flex relative overflow-hidden">
      {/* Confetti and Celebration Overlay */}
      {pct === 100 && totalCount > 0 && (
        <Confetti width={width} height={height} numberOfPieces={700} gravity={0.22} recycle={false} style={{ zIndex: 40, pointerEvents: "none" }} />
      )}
      <div
        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        aria-live="polite"
        style={{ pointerEvents: "none" }}
      >
        {showCelebration && (
          <span
            className={
              `select-none drop-shadow-xl text-white
              font-extrabold
              text-[clamp(2.2rem,7vw,4.6rem)]
              transition-all duration-700
              will-change-transform
              opacity-100 scale-110
              animate-[none]
              `
            }
            style={{
              textShadow: "0 4px 30px rgba(31,38,135,0.4), 0 0px 1px #fff, 0 1px 1px #0006",
              transition: showCelebration
                ? 'opacity 0.7s cubic-bezier(.42,.6,.52,1.05), transform 0.7s cubic-bezier(.42,.6,.52,1.05)'
                : 'opacity 1s',
              opacity: showCelebration ? 1 : 0,
              transform: showCelebration ? "scale(1.1)" : "scale(0.5)",
              pointerEvents: "none",
            }}
          >
            Congratulations! <span role="img" aria-label="party">🎉</span>
          </span>
        )}
      </div>

      {/* Profile Modal */}
      <ProfileModal
        show={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={profileDraft}
        onChange={setProfileDraft}
        onSave={handleSaveProfile}
        saving={profileSaving}
        error={profileError}
      />

      {/* Hamburger menu (mobile) */}
      <button
        onClick={() => setSidebarOpen(s => !s)}
        className="absolute top-5 left-5 z-50 md:hidden rounded-full p-2 bg-white/60 shadow border border-white/30 transition hover:bg-cyan-400/70 focus:outline-none"
        aria-label={sidebarOpen ? "Close Menu" : "Open Menu"}
        style={{}}
        tabIndex={0}
      >
        <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
          {sidebarOpen ? (
            <path stroke="#0e7490" strokeWidth="2.5" strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
          ) : (
            <path stroke="#0e7490" strokeWidth="2.5" strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16"/>
          )}
        </svg>
      </button>
      {/* Sidebar (Desktop and mobile offcanvas) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        userProfile={userProfile}
        onAvatarClick={() => setShowProfileModal(true)}
      />
      {/* Main Content Area */}
      <main
        className="
          flex-1 w-full flex flex-col h-full overflow-hidden
          bg-white/50 backdrop-blur-xl
          shadow-2xl
          rounded-l-3xl md:rounded-l-none
          px-0 md:px-12 py-6
          transition-all duration-300
          ml-0 md:ml-0
          "
        style={{
          minWidth: 0,
        }}
      >
        {/* On mobile, fake margin if sidebar is open */}
        <span className={`block md:hidden ${sidebarOpen ? 'h-8' : 'h-0'}`} />
        {/* Progress bar row */}
        <div className="mb-6">
          <div className="flex items-center justify-between mt-1 mb-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-cyan-900 drop-shadow-sm select-none">
              {getTabTitle(activeTab)}
            </h1>
            <span className="text-xs font-semibold text-cyan-700 tracking-wide drop-shadow-sm">
              {totalCount === 0
                ? "0/0 Completed - 0%"
                : `${completedCount}/${totalCount} Completed - ${pct}%`}
            </span>
          </div>
          <div className="w-full h-3 bg-white/25 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full transition-all duration-400"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg,#22c55e 0%,#16a34a 100%)",
                borderRadius: "8px",
                boxShadow: pct === 0 ? undefined : '0px 0px 4px #16a34a55'
              }}
            />
          </div>
        </div>
        {/* Add Task */}
        <div className="flex flex-row gap-2 mb-7 mt-3 items-stretch">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Add a task"
            className="flex-1 px-4 py-2 rounded-xl border-none focus:border-transparent shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-white/70 text-gray-900 placeholder-gray-400 font-semibold backdrop-blur transition"
            onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); }}
            autoFocus
          />
          <select
            value={inputPriority}
            onChange={e => setInputPriority(e.target.value)}
            className="px-4 py-2 rounded-xl border-none focus:border-transparent bg-white/90 text-gray-700 font-semibold shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
            aria-label="Choose priority"
          >
            {PRIORITY_OPTIONS.map(opt =>
              <option value={opt.value} key={opt.value}>{opt.label}</option>
            )}
          </select>
          <div className="relative flex items-center">
            <div 
              className={`
                flex items-center cursor-pointer px-3 py-2 bg-white/90 rounded-xl shadow-sm border border-transparent
                hover:bg-cyan-100 transition select-none
                ${inputDueDate ? "ring-2 ring-cyan-300" : ""}
              `}
              onClick={() => {
                const dateInput = document.getElementById('date-picker-input');
                if (dateInput && dateInput.showPicker) dateInput.showPicker();
              }}
            >
              <CalendarIcon size={21} color="#2dd4bf" />
              <input
                id="date-picker-input"
                type="datetime-local"
                value={inputDueDate}
                min={getTodayThresholdDatetimeLocal()}
                onChange={e => setInputDueDate(e.target.value)}
                className="absolute opacity-0 w-0 h-0"
              />
              {inputDueDate && (
                <span className="ml-2 text-xs text-cyan-700 font-semibold">
                  {formatDueDate(inputDueDate)}
                </span>
              )}
              {inputDueDate && (
                <button
                  type="button"
                  className="ml-2 text-gray-400 hover:text-red-500 font-bold px-1"
                  onClick={e => {
                    e.stopPropagation();
                    setInputDueDate(getNowDatetimeLocal());
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>
          <button
            onClick={handleAddTask}
            className="
              px-5 py-2 rounded-xl 
              bg-gradient-to-r from-green-400 via-emerald-500 to-cyan-500 
              text-white font-semibold shadow
              hover:from-green-500 hover:to-cyan-600
              transition
              uppercase tracking-wide
              disabled:opacity-50
              "
            disabled={!input.trim()}
          >
            Add
          </button>
        </div>
        {/* Task List */}
        <div className="flex-1 overflow-y-auto hide-scrollbar py-2">
          {loading ? (
            <p className="text-cyan-500 text-center my-16 select-none text-lg animate-pulse">Loading...</p>
          ) : (
            filteredTodos.length === 0 ? (
              <p className="text-cyan-600/80 text-center my-14 select-none text-lg">No tasks here yet.</p>
            ) : (
              activeTab === "INBOX" ? (
                // Drag and Drop enabled only for INBOX
                <DragDropContext onDragEnd={handleOnDragEnd}>
                  <Droppable droppableId="tasksDroppable">
                    {(provided, snapshot) => (
                      <ul
                        className="divide-y divide-cyan-100"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {tasks.map((task, index) => {
                          const isOverdue = isDateOverdue(task.dueDate);
                          const isDueToday = isDateToday(task.dueDate);
                          const isEditing = editingId === task._id;
                          let borderClass = "";
                          if (isOverdue) {
                            borderClass = "border-2 border-red-500 shadow-sm";
                          } else if (isDueToday) {
                            borderClass = `border-2 animate-pulse ${getPriorityBorder(task.priority)}`;
                          } else {
                            borderClass = "border border-white/30";
                          }
                          return (
                            <Draggable
                              draggableId={task._id}
                              index={index}
                              key={task._id}
                              isDragDisabled={!!isEditing || !!overdueInlineEditId}
                            >
                              {(provided, snapshot) => (
                                <li
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`
                                    group flex items-center px-3 py-3.5 gap-4 rounded-2xl
                                    hover:bg-cyan-50/75 transition 
                                    ${task.completed ? 'opacity-60 line-through' : ''} 
                                    ${borderClass}
                                    ${snapshot.isDragging ? "z-10 bg-blue-100/80 shadow-lg scale-105" : ""}
                                  `}
                                  style={{ ...provided.draggableProps.style }}
                                >
                                  {/* Drag Handle Icon only when not editing/overdue inline edit */}
                                  {(!isEditing && !overdueInlineEditId) ? (
                                    <span className="cursor-grab pr-1 flex items-center select-none opacity-60 hover:opacity-100 transition">
                                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                        <circle cx="5.5" cy="6" r="1.2" fill="#94a3b8"/>
                                        <circle cx="5.5" cy="10" r="1.2" fill="#94a3b8"/>
                                        <circle cx="5.5" cy="14" r="1.2" fill="#94a3b8"/>
                                        <circle cx="9.5" cy="6" r="1.2" fill="#94a3b8"/>
                                        <circle cx="9.5" cy="10" r="1.2" fill="#94a3b8"/>
                                        <circle cx="9.5" cy="14" r="1.2" fill="#94a3b8"/>
                                      </svg>
                                    </span>
                                  ) : (
                                    <span className="pr-1" />
                                  )}

                                  {/* Checkbox */}
                                  <input type="checkbox" checked={!!task.completed} onChange={() => handleToggleCompleted(task._id)} className="accent-emerald-500 w-5 h-5 shrink-0 cursor-pointer" />

                                  {/* Priority Badge */}
                                  <span className={`flex items-center min-w-[72px] px-2 py-1.5 rounded-lg font-bold text-xs text-center border border-white/20 shadow-sm select-none gap-1.5 ${getPriorityColor(task.priority)}`}>
                                    <span className={`w-2.5 h-2.5 rounded-full inline-block ring-1 ring-white/90 ${task.priority === 'High' ? 'bg-red-400' : task.priority === 'Medium' ? 'bg-yellow-300' : 'bg-green-400'}`} />
                                    {task.priority || 'Medium'}
                                  </span>
                                  {/* Task Text or Edit Form */}
                                  <div className="flex-1 flex items-center min-w-0">
                                    {isEditing ? (
                                      <>
                                        <input
                                          type="text"
                                          value={editValue}
                                          onChange={e => setEditValue(e.target.value)}
                                          className="flex-1 text-base rounded-md px-2 py-1 mr-2 focus:ring-2 focus:ring-cyan-200 bg-white/70 outline-none text-gray-900 shadow"
                                          onKeyDown={e => {
                                            if (e.key === 'Enter') handleSaveEdit(task._id);
                                            if (e.key === 'Escape') cancelEdit();
                                          }}
                                          autoFocus
                                        />
                                        {/* Priority Select */}
                                        <select value={editPriority} onChange={e => setEditPriority(e.target.value)} className="px-2 py-1 rounded-md border-none bg-white/80 text-gray-800 text-sm focus:ring-2 focus:ring-cyan-300 shadow-sm font-semibold">
                                          {PRIORITY_OPTIONS.map(opt => <option value={opt.value} key={opt.value}>{opt.label}</option>)}
                                        </select>
                                        {/* Date Input */}
                                        <div className="relative flex items-center ml-2">
                                          <div className="relative flex items-center cursor-pointer px-2 py-1.5 bg-white/90 rounded-lg shadow-sm border border-transparent focus-within:ring-2 focus-within:ring-cyan-300">
                                            <CalendarIcon size={18} color="#0891b2" />
                                            <input
                                              type="datetime-local"
                                              value={editDueDate}
                                              onChange={e => setEditDueDate(e.target.value)}
                                              className="ml-2 bg-transparent text-xs text-cyan-800 font-semibold outline-none"
                                              style={{maxWidth: '130px'}}
                                            />
                                          </div>
                                        </div>
                                        {/* Save/Cancel Buttons */}
                                        <button onClick={() => handleSaveEdit(task._id)} className="ml-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded font-bold shadow transition">Save</button>
                                        <button onClick={cancelEdit} className="ml-2 bg-white/70 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded font-medium shadow transition">Cancel</button>
                                      </>
                                    ) : (
                                      <span className={`flex-1 text-base font-medium min-w-0 break-words pl-0 select-text truncate ${task.completed ? 'text-gray-400' : 'text-cyan-900'}`}>
                                        {task.text}
                                      </span>
                                    )}
                                  </div>
                                  {/* Due Date Badge (Hidden in Edit Mode) */}
                                  {!isEditing && (task.dueDate || isDueToday || isOverdue) && (
                                    <div className="flex flex-col items-start min-w-[73px] mx-2">
                                      {isDueToday && <span className="text-xs text-orange-500 font-bold select-none">Due today</span>}
                                      {isOverdue && <span className="text-xs text-red-600 font-bold select-none">Overdue</span>}
                                      {!isOverdue && !isDueToday && task.dueDate && (
                                        <span className="flex items-center text-xs font-semibold text-gray-400 gap-1">
                                          <CalendarIcon size={15} color="#64748b" />
                                          <span>{formatDueDate(task.dueDate)}</span>
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {/* Action Buttons (Hidden in Edit Mode) */}
                                  {!isEditing && !overdueInlineEditId && (
                                    <div className="flex items-center gap-2 ml-2 opacity-70 group-hover:opacity-100 transition">
                                      <button onClick={() => startEditTask(task)} className="rounded-full p-1.5 hover:bg-cyan-100/60 transition" aria-label="Edit">
                                        <svg height="18" width="18" viewBox="0 0 20 20" fill="none"><path d="M14.85 2.85a1.207 1.207 0 0 1 1.7 1.7l-1 1-1.7-1.7 1-1zM3 13.75l8.73-8.73 1.7 1.7L4.7 15.4H3v-1.65z" fill="#06b6d4" /></svg>
                                      </button>
                                      <button onClick={() => handleDeleteTask(task._id)} className="rounded-full p-1.5 hover:bg-red-100/70 transition text-red-500" aria-label="Delete">
                                        <svg width={18} height={18} fill="none" viewBox="0 0 20 20"><path d="M6 7v7m4-7v7m4-10v1m-8-1v1m4 8a1 1 0 001 1h2a1 1 0 001-1V7a1 1 0 00-1-1h-6a1 1 0 00-1 1v7a1 1 0 001 1h2a1 1 0 001-1z" stroke="#ef4444" strokeWidth="1.5"/></svg>
                                      </button>
                                    </div>
                                  )}
                                </li>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </ul>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                // For filtered views - no drag & drop - show filteredTodos only
                <ul className="divide-y divide-cyan-100">
                  {filteredTodos.map(task => {
                    const isOverdue = isDateOverdue(task.dueDate);
                    const isDueToday = isDateToday(task.dueDate);
                    const isEditing = editingId === task._id;
                    let borderClass = "";
                    if (isOverdue) {
                      borderClass = "border-2 border-red-500 shadow-sm";
                    } else if (isDueToday) {
                      borderClass = `border-2 animate-pulse ${getPriorityBorder(task.priority)}`;
                    } else {
                      borderClass = "border border-white/30";
                    }
                    return (
                      <li
                        key={task._id}
                        className={`
                          group flex items-center px-3 py-3.5 gap-4 rounded-2xl 
                          hover:bg-cyan-50/75 transition 
                          ${task.completed ? 'opacity-60 line-through' : ''} 
                          ${borderClass}
                        `}
                      >
                        {/* Drag Handle - Hidden for filtered views */}
                        <span className="pr-1" />
                        <input type="checkbox" checked={!!task.completed} onChange={() => handleToggleCompleted(task._id)} className="accent-emerald-500 w-5 h-5 shrink-0 cursor-pointer" />
                        <span className={`flex items-center min-w-[72px] px-2 py-1.5 rounded-lg font-bold text-xs text-center border border-white/20 shadow-sm select-none gap-1.5 ${getPriorityColor(task.priority)}`}>
                          <span className={`w-2.5 h-2.5 rounded-full inline-block ring-1 ring-white/90 ${task.priority === 'High' ? 'bg-red-400' : task.priority === 'Medium' ? 'bg-yellow-300' : 'bg-green-400'}`} />
                          {task.priority || 'Medium'}
                        </span>
                        <div className="flex-1 flex items-center min-w-0">
                          {isEditing ? (
                            <>
                              <input
                                type="text"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                className="flex-1 text-base rounded-md px-2 py-1 mr-2 focus:ring-2 focus:ring-cyan-200 bg-white/70 outline-none text-gray-900 shadow"
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveEdit(task._id);
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                autoFocus
                              />
                              <select value={editPriority} onChange={e => setEditPriority(e.target.value)} className="px-2 py-1 rounded-md border-none bg-white/80 text-gray-800 text-sm focus:ring-2 focus:ring-cyan-300 shadow-sm font-semibold">
                                {PRIORITY_OPTIONS.map(opt => <option value={opt.value} key={opt.value}>{opt.label}</option>)}
                              </select>
                              <div className="relative flex items-center ml-2">
                                <div className="relative flex items-center cursor-pointer px-2 py-1.5 bg-white/90 rounded-lg shadow-sm border border-transparent focus-within:ring-2 focus-within:ring-cyan-300">
                                  <CalendarIcon size={18} color="#0891b2" />
                                  <input
                                    type="datetime-local"
                                    value={editDueDate}
                                    onChange={e => setEditDueDate(e.target.value)}
                                    className="ml-2 bg-transparent text-xs text-cyan-800 font-semibold outline-none"
                                    style={{maxWidth: '130px'}}
                                  />
                                </div>
                              </div>
                              <button onClick={() => handleSaveEdit(task._id)} className="ml-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded font-bold shadow transition">Save</button>
                              <button onClick={cancelEdit} className="ml-2 bg-white/70 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded font-medium shadow transition">Cancel</button>
                            </>
                          ) : (
                            <span className={`flex-1 text-base font-medium min-w-0 break-words pl-0 select-text truncate ${task.completed ? 'text-gray-400' : 'text-cyan-900'}`}>
                              {task.text}
                            </span>
                          )}
                        </div>
                        {/* Due Date Badge (Hidden in Edit Mode) */}
                        {!isEditing && (task.dueDate || isDueToday || isOverdue) && (
                          <div className="flex flex-col items-start min-w-[73px] mx-2">
                            {isDueToday && <span className="text-xs text-orange-500 font-bold select-none">Due today</span>}
                            {isOverdue && <span className="text-xs text-red-600 font-bold select-none">Overdue</span>}
                            {!isOverdue && !isDueToday && task.dueDate && (
                              <span className="flex items-center text-xs font-semibold text-gray-400 gap-1">
                                <CalendarIcon size={15} color="#64748b" />
                                <span>{formatDueDate(task.dueDate)}</span>
                              </span>
                            )}
                          </div>
                        )}
                        {/* Action Buttons (Hidden in Edit Mode) */}
                        {!isEditing && !overdueInlineEditId && (
                          <div className="flex items-center gap-2 ml-2 opacity-70 group-hover:opacity-100 transition">
                            <button onClick={() => startEditTask(task)} className="rounded-full p-1.5 hover:bg-cyan-100/60 transition" aria-label="Edit">
                              <svg height="18" width="18" viewBox="0 0 20 20" fill="none"><path d="M14.85 2.85a1.207 1.207 0 0 1 1.7 1.7l-1 1-1.7-1.7 1-1zM3 13.75l8.73-8.73 1.7 1.7L4.7 15.4H3v-1.65z" fill="#06b6d4" /></svg>
                            </button>
                            <button onClick={() => handleDeleteTask(task._id)} className="rounded-full p-1.5 hover:bg-red-100/70 transition text-red-500" aria-label="Delete">
                              <svg width={18} height={18} fill="none" viewBox="0 0 20 20"><path d="M6 7v7m4-7v7m4-10v1m-8-1v1m4 8a1 1 0 001 1h2a1 1 0 001-1V7a1 1 0 00-1-1h-6a1 1 0 00-1 1v7a1 1 0 001 1h2a1 1 0 001-1z" stroke="#ef4444" strokeWidth="1.5"/></svg>
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )
            )
          )}
        </div>
      </main>
    </div>
  );
}

// --- App Component with Routing ---
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <TodoAppMain />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
