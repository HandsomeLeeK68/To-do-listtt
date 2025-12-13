import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';

const API_URL = 'http://localhost:5001/api/todos';

// --- Protected Route ---
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
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
      const res = await fetch('http://localhost:5001/login', {
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
      const res = await fetch('http://localhost:5001/register', {
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

// --- Main Todos Page ---
function TodoAppMain() {
  const [input, setInput] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
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
        body: JSON.stringify({ text: trimmed }),
      });
      if (res.ok) {
        const newTask = await res.json();
        setTasks(prev => [...prev, newTask]);
        setInput('');
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (e) {
      // handle error
    }
  };

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

  const handleToggleCompleted = async (_id) => {
    try {
      const res = await fetch(`${API_URL}/${_id}`, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token,
        },
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
    } catch (e) {
      // handle error
    }
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
          <button
            onClick={handleAddTask}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-400 text-white px-5 py-2 rounded-lg font-semibold shadow hover:from-purple-600 hover:to-red-500 transition"
          >
            Add
          </button>
        </div>
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li
              key={task._id}
              className="flex items-center bg-white/80 rounded-lg px-4 py-2 shadow group transition"
            >
              <input
                type="checkbox"
                checked={!!task.completed}
                onChange={() => handleToggleCompleted(task._id)}
                className="accent-purple-500 w-5 h-5 mr-3"
              />
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
                onClick={() => handleDeleteTask(task._id)}
                className="ml-4 bg-gradient-to-r from-rose-500 to-red-400 text-white px-3 py-1 rounded-full shadow hover:from-rose-600 hover:to-red-500 transition opacity-80 hover:opacity-100"
                aria-label="Delete"
              >
                Delete
              </button>
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
