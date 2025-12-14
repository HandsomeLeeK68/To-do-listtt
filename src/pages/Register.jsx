import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ListTodo, 
  BrainCircuit, 
  Grip, 
  CalendarClock, 
  Sparkles,
  UserPlus
} from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
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
        setSuccess('Registration successful! Redirecting...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed');
    }
  };

  const features = [
    { icon: BrainCircuit, text: "Smart Task Management", color: "text-purple-400" },
    { icon: Grip, text: "Drag & Drop Organization", color: "text-blue-400" },
    { icon: CalendarClock, text: "Priority & Due Date Tracking", color: "text-orange-400" },
    { icon: Sparkles, text: "Beautiful & Responsive Interface", color: "text-pink-400" }
  ];

  return (
    <div className="flex min-h-screen w-full">
      {/* Nửa bên trái: Giới thiệu (Giống hệt Login) */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex-col justify-center items-center text-white p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl"></div>

        <div className="z-10 flex flex-col items-center text-center space-y-8 max-w-lg">
          <div className="flex flex-col items-center">
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 shadow-xl mb-4">
              <ListTodo size={64} className="text-cyan-400" />
            </div>
            <h1 className="text-5xl font-black tracking-tight drop-shadow-lg bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              My Todo App
            </h1>
            <p className="text-blue-200 mt-2 text-lg font-medium">
              Manage your tasks efficiently and elegantly.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 w-full shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-left border-b border-white/10 pb-2">Main Features</h3>
            <ul className="space-y-4 text-left">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-center space-x-3 text-blue-100 group">
                  <div className={`p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition border border-white/5 ${feature.color}`}>
                    <feature.icon size={20} />
                  </div>
                  <span className="font-medium">{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto pt-8 opacity-80">
            <p className="text-sm font-light tracking-wider uppercase text-slate-400">Developed by</p>
            <p className="text-lg font-bold text-white mt-1">Lê Nghĩa Hiệp</p>
          </div>
        </div>
      </div>

      {/* Nửa bên phải: Form Register */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-[#f8fafc] relative">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-50/50 via-transparent to-blue-50/50"></div>

        <form
          onSubmit={handleSubmit}
          className="relative bg-white/80 border border-white shadow-2xl rounded-3xl p-10 w-full max-w-md transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] backdrop-blur-xl"
        >
          <div className="text-center mb-8">
            <div className="inline-block p-3 rounded-full bg-cyan-50 text-cyan-600 mb-4">
              <UserPlus size={32} />
            </div>
            <h2 className="text-3xl font-bold text-slate-800">Create Account</h2>
            <p className="text-slate-500 mt-2">Get started with your free account.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-sm py-3 px-4 rounded-xl mb-6 border border-red-100 font-medium text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 text-sm py-3 px-4 rounded-xl mb-6 border border-green-200 font-medium text-center">
              {success}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Username</label>
              <input
                type="text"
                autoFocus
                placeholder="Choose a username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 bg-white text-slate-800 placeholder-slate-400 font-medium outline-none transition-all shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Password</label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 bg-white text-slate-800 placeholder-slate-400 font-medium outline-none transition-all shadow-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-8 bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
          >
            Sign Up
          </button>

          <div className="text-center mt-8 pt-6 border-t border-slate-100">
            <span className="text-slate-500 text-sm">Already have an account? </span>
            <a
              className="text-cyan-600 font-bold hover:text-cyan-700 cursor-pointer transition-colors text-sm hover:underline"
              href="/login"
              onClick={e => {
                e.preventDefault();
                navigate('/login');
              }}
            >
              Login here
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}