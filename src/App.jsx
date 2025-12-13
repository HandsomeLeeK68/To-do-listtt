import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';

const API_URL = 'https://my-to-do-listtt.onrender.com/api/todos';

// --- Protected Route ---
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

// Priority utilities
const PRIORITY_OPTIONS = [
  { label: "High", value: "High", color: "bg-red-500 text-white" },
  { label: "Medium", value: "Medium", color: "bg-yellow-400 text-gray-900" },
  { label: "Low", value: "Low", color: "bg-green-500 text-white" },
];
function getPriorityColor(priority) {
  const found = PRIORITY_OPTIONS.find(opt => opt.value === priority);
  return found ? found.color : "bg-gray-300 text-gray-600";
}

// --- Login Component ---
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400">
      <form
        onSubmit={handleSubmit}
        className="bg-white/80 shadow-2xl rounded-3xl p-8 w-full max-w-md mx-4"
      >
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 drop-shadow">
          Login
        </h1>
        {error && (
          <div className="text-red-500 text-center mb-4">{error}</div>
        )}
        <div className="mb-4">
          <input
            type="text"
            autoFocus
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 shadow focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white transition"
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
            className="w-full px-4 py-2 rounded-lg border border-gray-300 shadow focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white transition"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-400 text-white px-5 py-2 rounded-lg font-semibold shadow hover:from-purple-600 hover:to-red-500 transition"
        >
          Login
        </button>
        <div className="text-center mt-4 text-gray-600">
          Don't have an account?{' '}
          <a
            className="text-purple-600 underline hover:text-purple-800"
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

// --- Register Component ---
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400">
      <form
        onSubmit={handleSubmit}
        className="bg-white/80 shadow-2xl rounded-3xl p-8 w-full max-w-md mx-4"
      >
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 drop-shadow">
          Register
        </h1>
        {error && (
          <div className="text-red-500 text-center mb-4">{error}</div>
        )}
        {success && (
          <div className="text-green-600 text-center mb-4">{success}</div>
        )}
        <div className="mb-4">
          <input
            type="text"
            autoFocus
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 shadow focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white transition"
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
            className="w-full px-4 py-2 rounded-lg border border-gray-300 shadow focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white transition"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-400 text-white px-5 py-2 rounded-lg font-semibold shadow hover:from-purple-600 hover:to-red-500 transition"
        >
          Register
        </button>
        <div className="text-center mt-4 text-gray-600">
          Already have an account?{' '}
          <a
            className="text-purple-600 underline hover:text-purple-800"
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

// --- Main Todos Page with Priority & Edit ---
function TodoAppMain() {
  const [input, setInput] = useState('');
  const [inputPriority, setInputPriority] = useState('Medium');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
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

  // Compose tasks sorted by priority
  const sortedTasks = [...tasks].sort((a, b) => {
    const order = { 'High': 0, 'Medium': 1, 'Low': 2 };
    return order[a.priority || 'Medium'] - order[b.priority || 'Medium'];
  });

  // Add Task
  const handleAddTask = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ text: trimmed, priority: inputPriority }),
      });
      if (res.ok) {
        const newTask = await res.json();
        setTasks(prev => [...prev, newTask]);
        setInput('');
        setInputPriority('Medium');
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (e) {
      // handle error
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
    } catch (e) {
      // handle error
    }
  };

  // Toggle Complete
  const handleToggleCompleted = async (_id) => {
    const task = tasks.find(t => t._id === _id);
    if (!task) return;
    try {
      // Include all fields to support updating priority later if desired
      const res = await fetch(`${API_URL}/${_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          completed: !task.completed,
          text: task.text,
          priority: task.priority
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
    } catch (e) {}
  };

  // Start editing (text & priority)
  const startEditTask = task => {
    setEditingId(task._id);
    setEditValue(task.text);
    setEditPriority(task.priority || "Medium");
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
    setEditPriority('Medium');
  };

  // Save edit (update text and optionally priority)
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
          completed: original.completed,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(tasks =>
          tasks.map(task =>
            task._id === _id
              ? { ...task, text: updated.text, priority: updated.priority }
              : task
          )
        );
        setEditingId(null);
        setEditValue('');
        setEditPriority('Medium');
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (e) {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400">
      <div className="bg-white/80 shadow-2xl rounded-3xl p-8 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 drop-shadow">Todo App</h1>
          <button
            onClick={handleLogout}
            className="text-sm bg-red-200 text-red-800 font-semibold rounded px-3 py-1 ml-2 hover:bg-red-400 hover:text-white transition"
          >
            Logout
          </button>
        </div>
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter a task"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 shadow focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white transition"
            onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); }}
          />
          <select
            value={inputPriority}
            onChange={e => setInputPriority(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 shadow focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-sm transition"
            aria-label="Choose priority"
          >
            {PRIORITY_OPTIONS.map(opt =>
              <option value={opt.value} key={opt.value}>{opt.label}</option>
            )}
          </select>
          <button
            onClick={handleAddTask}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-400 text-white px-5 py-2 rounded-lg font-semibold shadow hover:from-purple-600 hover:to-red-500 transition"
          >
            Add
          </button>
        </div>
        <ul className="space-y-3">
          {sortedTasks.map((task) => (
            <li
              key={task._id}
              className={`flex items-center bg-white/80 rounded-lg px-4 py-2 shadow group transition`}
            >
              <input
                type="checkbox"
                checked={!!task.completed}
                onChange={() => handleToggleCompleted(task._id)}
                className="accent-purple-500 w-5 h-5 mr-3"
              />
              {/* Priority Badge */}
              <span className={`text-xs font-semibold px-2 py-1 rounded-full mr-3 ${getPriorityColor(task.priority)}`}>
                {task.priority || 'Medium'}
              </span>
              {/* Editable text/priority or display */}
              {editingId === task._id ? (
                <>
                  <input
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="flex-1 text-lg border border-gray-300 rounded-md px-2 py-1 mr-2 focus:ring-2 focus:ring-purple-400"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveEdit(task._id);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    autoFocus
                  />
                  <select
                    value={editPriority}
                    onChange={e => setEditPriority(e.target.value)}
                    className="mr-2 px-2 py-1 rounded-lg border border-gray-300 text-sm"
                  >
                    {PRIORITY_OPTIONS.map(opt =>
                      <option value={opt.value} key={opt.value}>{opt.label}</option>
                    )}
                  </select>
                  <button
                    onClick={() => handleSaveEdit(task._id)}
                    className="bg-green-500 text-white px-3 py-1 rounded shadow mr-1 hover:bg-green-600 font-semibold"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-300 text-gray-600 px-2 py-1 rounded shadow hover:bg-gray-400 ml-1"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span
                    className={`flex-1 text-lg ${
                      task.completed
                        ? 'line-through text-gray-400'
                        : 'text-gray-800'
                    }`}
                  >
                    {task.text}
                  </span>
                  <button
                    onClick={() => startEditTask(task)}
                    className="ml-2 p-1 rounded-full hover:bg-purple-100 transition"
                    aria-label="Edit"
                    title="Edit"
                  >
                    {/* Pencil icon */}
                    <svg height="18" width="18" viewBox="0 0 20 20" fill="none" className="inline align-middle">
                      <path d="M14.85 2.85a1.207 1.207 0 0 1 1.7 1.7l-1 1-1.7-1.7 1-1zM3 13.75l8.73-8.73 1.7 1.7L4.7 15.4H3v-1.65z" fill="#9333ea" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="ml-2 bg-gradient-to-r from-rose-500 to-red-400 text-white px-3 py-1 rounded-full shadow hover:from-rose-600 hover:to-red-500 transition opacity-80 hover:opacity-100"
                    aria-label="Delete"
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
        {loading ? (
          <p className="text-center text-gray-400 mt-6">Loading...</p>
        ) : tasks.length === 0 && (
          <p className="text-center text-gray-400 mt-6">No tasks yet. Add one above!</p>
        )}
      </div>
    </div>
  );
}

// --- App Component with Routing ---
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <TodoAppMain />
            </ProtectedRoute>
          }
        />
        {/* Catch-all to / for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
