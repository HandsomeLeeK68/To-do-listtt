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

// --- Icon for Date Picker using lucide-react style SVG ---
function CalendarIcon({ size = 22, color = "#0e7490", ...props }) {
  return (
    <svg width={size} height={size} stroke={color} fill="none" viewBox="0 0 24 24" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="3" strokeWidth="2"/>
      <path d="M16 2v4M8 2v4" strokeWidth="2"/>
      <path d="M3 10h18" strokeWidth="2"/>
    </svg>
  );
}

const API_URL = 'https://my-to-do-listtt.onrender.com/api/todos';

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

// Format due date as "Oct 26"
function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

// --- Determines if dueDate is overdue, due today, or in future ---
function getDueStatus(dueDateStr) {
  if (!dueDateStr) return null;
  const today = new Date();
  today.setHours(0,0,0,0);
  const due = new Date(dueDateStr);
  due.setHours(0,0,0,0);
  if (isNaN(due.getTime())) return null;
  // Compare yyyy-mm-dds
  const todayISO = today.toISOString().split('T')[0];
  const dueISO = due.toISOString().split('T')[0];
  if (dueISO < todayISO) return "overdue";
  if (dueISO === todayISO) return "today";
  return "upcoming";
}

function isDateToday(dueDateStr) {
  if (!dueDateStr) return false;
  const due = new Date(dueDateStr);
  const now = new Date();
  return (
    due instanceof Date &&
    now instanceof Date &&
    due.toDateString() === now.toDateString()
  );
}

// --- FIXED isDateUpcoming FILTER LOGIC ---
function isDateUpcoming(dueDateStr) {
  if (!dueDateStr) return false;
  // Use only the date portion (YYYY-MM-DD) for compare
  const due = new Date(dueDateStr);
  const now = new Date();
  due.setHours(0,0,0,0);
  now.setHours(0,0,0,0);
  // Due is in the future and not today
  return (
    due > now &&
    due.toDateString() !== now.toDateString()
  );
}

function isDateOverdue(dueDateStr) {
  if (!dueDateStr) return false;
  const due = new Date(dueDateStr);
  const now = new Date();
  due.setHours(0,0,0,0);
  now.setHours(0,0,0,0);
  return due < now && due.toDateString() !== now.toDateString();
}

function actuallyZeroTime(date) {
  if (date) date.setHours(0,0,0,0);
}

// --- Protected Route ---
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

// --- Login Component (Unchanged) ---
// ... no changes to Login/Registration/Sidebar ... omitted

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

// --- Register Component (Unchanged) ---
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

function Sidebar({
  activeTab,
  setActiveTab,
  handleLogout,
  sidebarOpen,
  setSidebarOpen,
}) {
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
          {/* User avatar/icon */}
          <div className="rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-inner w-20 h-20 flex items-center justify-center text-white text-3xl font-black select-none mb-3 border-4 border-white/60">
            <span role="img" aria-label="user">👤</span>
          </div>
          <div className="text-xl font-semibold text-cyan-900 mb-2">Welcome!</div>
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

// -------- FILTER LOGIC: Corrected for Date (TODAY/UPCOMING) --------
function getFilteredTodos(tasks, activeTab) {
  if (activeTab === 'TODAY') {
    // Due date is today (ignore time)
    return tasks.filter(task =>
      !!task.dueDate && isDateToday(task.dueDate)
    );
  }
  if (activeTab === 'UPCOMING') {
    // Due date is in the future (and not today), ignore time (FIXED)
    return tasks.filter(task =>
      !!task.dueDate && isDateUpcoming(task.dueDate)
    );
  }
  if (activeTab === 'IMPORTANT') {
    return tasks.filter(task => task.priority === 'High');
  }
  // INBOX: all tasks
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
  const [inputDueDate, setInputDueDate] = useState(''); // YYYY-MM-DD

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editDueDate, setEditDueDate] = useState(''); // YYYY-MM-DD

  const [activeTab, setActiveTab] = useState('INBOX');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const timerRef = useRef(null);

  const { width, height } = useWindowSize();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Fetch todos on mount or when token changes
  useEffect(() => {
    if (!token) {
      setTasks([]);
      setLoading(false);
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
  }, [pct, totalCount]);{/* Due date input (edit mode) - improved date picker */}
  <div className="relative flex items-center ml-2">
    <div className="relative">
      <input
        type="date"
        value={editDueDate}
        min={getTodayISO()}
        onChange={e => setEditDueDate(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        tabIndex={0}
        aria-label="Pick Due Date"
        style={{}}
      />
      <div
        className={`
          flex items-center cursor-pointer px-2 py-1.5 bg-white/90 rounded-lg shadow-sm border border-transparent
          focus-within:ring-2 focus-within:ring-cyan-300
          ${editDueDate ? "ring-2 ring-cyan-300" : "hover:bg-cyan-200/70"}
          transition
          z-0
        `}
        style={{ height: '100%', userSelect: "none" }}
      >
        <CalendarIcon size={18} color="#0891b2" />
        {editDueDate && (
          <span className="ml-2 text-xs text-cyan-800 font-semibold select-none">{formatDueDate(editDueDate)}</span>
        )}
        {editDueDate &&
          <button
            type="button"
            className="ml-1 text-gray-400 hover:text-red-400 focus:outline-none relative"
            aria-label="Clear Due Date"
            onClick={e => { e.preventDefault(); e.stopPropagation(); setEditDueDate(''); }}
            tabIndex={0}
            style={{ background: 'none', border: 'none' }}
          >×</button>
        }
      </div>
    </div>
  </div>

  // Add Task (fix: always send dueDate, can be null)
// Add Task (Đã sửa lỗi tên biến)
  const handleAddTask = async () => {
    // Sửa console.log để dùng đúng tên biến state
    console.log("Dữ liệu chuẩn bị gửi:", { text: input, priority: inputPriority, dueDate: inputDueDate });
    
    const trimmed = input.trim();
    if (!trimmed) return;
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
          // Gửi ngày (nếu rỗng thì gửi null)
          dueDate: inputDueDate ? inputDueDate : null,
        }),
      });

      if (res.ok) {
        const newTask = await res.json();
        setTasks(prev => [...prev, newTask]);
        // Reset form sau khi thêm thành công
        setInput('');
        setInputPriority('Medium');
        setInputDueDate('');
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
          dueDate: task.dueDate || null,
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
    setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
    setEditPriority('Medium');
    setEditDueDate('');
  };
  // Edit/Save Task (fix: send dueDate)
  const handleSaveEdit = async (_id) => {
    const trimmed = editValue.trim();
    if (!trimmed) return;

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
          dueDate: editDueDate ? editDueDate : null,
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

  // Responsive - prevent body scroll if sidebar open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  // Filtered Todos by activeTab
  const filteredTodos = getFilteredTodos(tasks, activeTab);

  // For inline overdue date edit
  const [overdueInlineEditId, setOverdueInlineEditId] = useState(null);
  const [overdueInlineEditDate, setOverdueInlineEditDate] = useState('');
  const overdueInlineInputRef = useRef();

  // When opening overdue inline edit, prefill with current task date
  useEffect(() => {
    if (overdueInlineEditId && overdueInlineInputRef.current) {
      overdueInlineInputRef.current.focus();
    }
  }, [overdueInlineEditId]);

  // Overdue date change/save logic
  const handleOverdueReschedule = async (task, newDate) => {
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
          dueDate: newDate ? newDate : null,
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
      />
      {/* Main Content Area */}
      <main
        className="
          flex-1 flex flex-col h-full overflow-hidden
          bg-white/50 backdrop-blur-xl
          shadow-2xl
          rounded-l-3xl md:rounded-l-none
          px-0 md:px-12 py-6
          transition-all duration-300
          ml-0 md:ml-0
          "
        style={{
          marginLeft: 'calc(min(60vw, 340px))', // hide beneath md breakpoint, slide out over main
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
          {/* Date Picker - Cách mới dùng showPicker() siêu nhạy */}
          <div className="relative flex items-center">
            <div 
              className={`
                flex items-center cursor-pointer px-3 py-2 bg-white/90 rounded-xl shadow-sm border border-transparent
                hover:bg-cyan-100 transition select-none
                ${inputDueDate ? "ring-2 ring-cyan-300" : ""}
              `}
              onClick={() => {
                // Bấm vào div thì kích hoạt input date
                const dateInput = document.getElementById('date-picker-input');
                if (dateInput) dateInput.showPicker(); 
              }}
            >
              <CalendarIcon size={21} color="#2dd4bf" />
              
              {/* Input Date thật (nhưng ẩn đi) */}
              <input
                id="date-picker-input"
                type="date"
                value={inputDueDate}
                min={getTodayISO()}
                onChange={e => setInputDueDate(e.target.value)}
                className="absolute opacity-0 w-0 h-0" // Ẩn hoàn toàn
              />

              {inputDueDate && (
                <span className="ml-2 text-xs text-cyan-700 font-semibold">{formatDueDate(inputDueDate)}</span>
              )}
              
              {inputDueDate && (
                <button
                  type="button"
                  className="ml-2 text-gray-400 hover:text-red-500 font-bold px-1"
                  onClick={(e) => {
                    e.stopPropagation(); // Tránh kích hoạt showPicker khi bấm xóa
                    setInputDueDate('');
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
              <ul className="divide-y divide-cyan-100">
                {filteredTodos
                  .sort((a, b) => {
                    // INBOX = sort by createdAt (desc), others: HIGH > MED > LOW then createdAt
                    if (activeTab === 'INBOX') {
                      return (new Date(b.createdAt || 0)).getTime() - (new Date(a.createdAt || 0)).getTime();
                    }
                    const order = { 'High': 0, 'Medium': 1, 'Low': 2 };
                    const prA = order[a.priority] ?? 99;
                    const prB = order[b.priority] ?? 99;
                    if (prA !== prB) return prA - prB;
                    return (new Date(b.createdAt || 0)).getTime() - (new Date(a.createdAt || 0)).getTime();
                  })
                  .map(task => {
                    const dueStatus = getDueStatus(task.dueDate);
                    const overdue = isDateOverdue(task.dueDate);
                    const dueToday = isDateToday(task.dueDate);

                    // UX: allow inline reschedule of overdue
                    const isOverdueInline = overdueInlineEditId === task._id;

                    return (
                      <li
                        key={task._id}
                        className={`
                          group flex items-center px-3 py-3.5 gap-4 rounded-2xl hover:bg-cyan-50/75 transition
                          ${task.completed ? 'opacity-60 line-through' : ''}
                          ${overdue ? "border-2 border-red-400 shadow-[0_0_0_2px_rgba(239,68,68,0.15)]" : dueToday ? "border-2 border-yellow-400 animate-pulse" : "border border-white/30"}
                        `}
                        style={{}}
                      >
                        <input
                          type="checkbox"
                          checked={!!task.completed}
                          onChange={() => handleToggleCompleted(task._id)}
                          className="accent-emerald-500 w-5 h-5 shrink-0 cursor-pointer"
                        />
                        {/* Priority dot+badge */}
                        <span className={`
                          flex items-center min-w-[72px] px-2 py-1.5 rounded-lg font-bold text-xs
                          text-center border border-white/20 shadow-sm select-none
                          gap-1.5
                          ${getPriorityColor(task.priority)}
                        `}>
                          <span
                            className={`
                              w-2.5 h-2.5 rounded-full inline-block ring-1 ring-white/90
                              ${task.priority === 'High' ? 'bg-red-400' : task.priority === 'Medium' ? 'bg-yellow-300' : 'bg-green-400'}
                            `}
                          />
                          {task.priority || 'Medium'}
                        </span>
                        <div className="flex-1 flex items-center min-w-0">
                          {editingId === task._id ? (
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
                              <select
                                value={editPriority}
                                onChange={e => setEditPriority(e.target.value)}
                                className="px-2 py-1 rounded-md border-none bg-white/80 text-gray-800 text-sm focus:ring-2 focus:ring-cyan-300 shadow-sm font-semibold"
                              >
                                {PRIORITY_OPTIONS.map(opt =>
                                  <option value={opt.value} key={opt.value}>{opt.label}</option>
                                )}
                              </select>
                              {/* Due date input (edit mode) - fixed with showPicker() */}
                              <div className="relative flex items-center ml-2">
                                <div className="relative">
                                  {/* Container Click Handler */}
                                  <div
                                    className={`
                                      flex items-center cursor-pointer px-2 py-1.5 bg-white/90 rounded-lg shadow-sm border border-transparent
                                      focus-within:ring-2 focus-within:ring-cyan-300
                                      ${editDueDate ? "ring-2 ring-cyan-300" : "hover:bg-cyan-200/70"}
                                      transition select-none
                                    `}
                                    style={{ height: '100%' }}
                                    onClick={() => {
                                      // Sử dụng ID động theo từng Task để mở đúng lịch
                                      const el = document.getElementById(`edit-date-${task._id}`);
                                      if (el && el.showPicker) el.showPicker();
                                    }}
                                  >
                                    <CalendarIcon size={18} color="#0891b2" />
                                    
                                    {/* Input ẩn hoàn toàn, có ID động */}
                                    <input
                                      id={`edit-date-${task._id}`}
                                      type="date"
                                      value={editDueDate}
                                      min={getTodayISO()}
                                      onChange={e => setEditDueDate(e.target.value)}
                                      className="absolute opacity-0 w-0 h-0" // Ẩn đi
                                      tabIndex={-1}
                                    />

                                    {editDueDate && (
                                      <span className="ml-2 text-xs text-cyan-800 font-semibold select-none">
                                        {formatDueDate(editDueDate)}
                                      </span>
                                    )}
                                    
                                    {editDueDate && (
                                      <button
                                        type="button"
                                        className="ml-1 text-gray-400 hover:text-red-400 focus:outline-none relative font-bold"
                                        aria-label="Clear Due Date"
                                        onClick={(e) => { 
                                          e.preventDefault(); 
                                          e.stopPropagation(); // Chặn sự kiện để không bật lịch lên khi xóa
                                          setEditDueDate(''); 
                                        }}
                                        style={{ background: 'none', border: 'none' }}
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleSaveEdit(task._id)}
                                className="ml-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded font-bold shadow transition"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="ml-2 bg-white/70 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded font-medium shadow transition"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <span
                              className={`
                                flex-1 text-base font-medium min-w-0 break-words pl-0 
                                select-text truncate
                                ${task.completed ? 'text-gray-400' : 'text-cyan-900'}
                              `}
                            >
                              {task.text}
                            </span>
                          )}
                        </div>
                        {/* DUE DATE display & Alerts, with inline edit for overdue */}
                        {(task.dueDate || dueToday || overdue) && (
                          <div className="flex flex-col items-start min-w-[73px] mx-2">
                            {task.dueDate && (
                              overdue && !isOverdueInline ? (
                                // Overdue date: show reschedulable label with date picker
                                <button
                                  className="flex items-center space-x-1 group/od-dt px-0.5 py-0.5 rounded focus:outline-none hover:bg-red-50 transition"
                                  aria-label="Reschedule Due Date"
                                  onClick={() => {
                                    setOverdueInlineEditId(task._id);
                                    setOverdueInlineEditDate(
                                      (task.dueDate || '').split('T')[0]
                                    );
                                  }}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                  }}
                                >
                                  <CalendarIcon size={15} color="#ef4444" />
                                  <span className="text-xs font-semibold tracking-tight text-red-500 underline underline-offset-2 select-none">
                                    {formatDueDate(task.dueDate)}
                                  </span>
                                </button>
                              ) : isOverdueInline ? (
                                // Inline date input for overdue
                                <form
                                  className="flex items-center gap-1"
                                  onSubmit={e => {
                                    e.preventDefault();
                                    if (overdueInlineEditDate) {
                                      handleOverdueReschedule(
                                        task,
                                        overdueInlineEditDate
                                      );
                                    }
                                  }}
                                >
                                  <input
                                    ref={overdueInlineInputRef}
                                    type="date"
                                    value={overdueInlineEditDate}
                                    min={getTodayISO()}
                                    onChange={e => setOverdueInlineEditDate(e.target.value)}
                                    className="px-1 py-0.5 rounded border border-red-300 bg-white/80 text-xs text-gray-700 font-medium"
                                    style={{ width: '6.6rem' }}
                                    autoFocus
                                    onBlur={() => setTimeout(() => setOverdueInlineEditId(null), 120)} // delay to allow button click
                                  />
                                  <button
                                    type="button"
                                    className="bg-green-500 hover:bg-green-600 text-white rounded px-2 py-0.5 text-xs font-semibold"
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() =>
                                      handleOverdueReschedule(task, overdueInlineEditDate)
                                    }
                                    tabIndex={0}
                                  >Save</button>
                                  <button
                                    type="button"
                                    className="bg-white/70 text-gray-500 rounded px-1.5 py-0.5 text-xs ml-1 font-medium border border-gray-300 hover:bg-gray-100"
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => setOverdueInlineEditId(null)}
                                    tabIndex={0}
                                  >Cancel</button>
                                </form>
                              ) : (
                                // Normal due date display
                                <span
                                  className={
                                    `flex items-center text-xs font-semibold tracking-tight gap-1
                                    ${overdue ? 'text-red-500' : dueToday ? 'text-yellow-600' : 'text-gray-400'}`
                                  }
                                >
                                  <CalendarIcon size={15} color={overdue ? "#ef4444" : dueToday ? "#eab308" : "#64748b"} />
                                  <span>{formatDueDate(task.dueDate)}</span>
                                </span>
                              )
                            )}
                            {overdue && (
                              <span className="text-xs text-red-600 font-bold select-none">Overdue</span>
                            )}
                            {dueToday && (
                              <span className="text-xs text-orange-500 font-bold select-none">Due today</span>
                            )}
                          </div>
                        )}

                        {/* Task Row Actions (Edit, Delete) */}
                        {editingId !== task._id && !isOverdueInline && (
                          <div className="flex items-center gap-2 ml-2 opacity-70 group-hover:opacity-100 transition">
                            <button
                              onClick={() => startEditTask(task)}
                              className="rounded-full p-1.5 hover:bg-cyan-100/60 transition"
                              aria-label="Edit"
                            >
                              {/* Pencil icon */}
                              <svg height="18" width="18" viewBox="0 0 20 20" fill="none" className="inline align-middle">
                                <path d="M14.85 2.85a1.207 1.207 0 0 1 1.7 1.7l-1 1-1.7-1.7 1-1zM3 13.75l8.73-8.73 1.7 1.7L4.7 15.4H3v-1.65z" fill="#06b6d4" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task._id)}
                              className="rounded-full p-1.5 hover:bg-red-100/70 transition text-red-500"
                              aria-label="Delete"
                            >
                              {/* Trash icon */}
                              <svg width={18} height={18} fill="none" viewBox="0 0 20 20">
                                <path d="M6 7v7m4-7v7m4-10v1m-8-1v1m4 8a1 1 0 001 1h2a1 1 0 001-1V7a1 1 0 00-1-1h-6a1 1 0 00-1 1v7a1 1 0 001 1h2a1 1 0 001-1z" stroke="#ef4444" strokeWidth="1.5"/>
                              </svg>
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
              </ul>
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
