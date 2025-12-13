import React, { useState, useEffect } from 'react';

const API_URL = 'https://my-to-do-listtt.onrender.com/api/todos';

function App() {
  const [input, setInput] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch todos on mount
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setTasks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Add new task via API
  const handleAddTask = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ text: trimmed })
      });
      if (res.ok) {
        const newTask = await res.json();
        setTasks(prev => [...prev, newTask]);
        setInput('');
      }
    } catch (e) {
      // handle error
    }
  };

  // Delete task via API
  const handleDeleteTask = async (_id) => {
    try {
      const res = await fetch(`${API_URL}/${_id}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks(tasks.filter(task => task._id !== _id));
      }
    } catch (e) {
      // handle error
    }
  };

  // Toggle completion via API
  const handleToggleCompleted = async (_id) => {
    try {
      const res = await fetch(`${API_URL}/${_id}`, { method: 'PUT' });
      if (res.ok) {
        const updated = await res.json();
        setTasks(tasks =>
          tasks.map(task =>
            task._id === _id ? { ...task, completed: updated.completed } : task
          )
        );
      }
    } catch (e) {
      // handle error
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400">
      <div className="bg-white/80 shadow-2xl rounded-3xl p-8 w-full max-w-md mx-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 drop-shadow">Todo App</h1>
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

export default App;
