import React, { useState, useEffect, useRef, useCallback } from 'react'; // <--- 1. Thêm useCallback
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';

// Import Components đã tách
import CalendarIcon from '../components/common/CalendarIcon';
import Sidebar from '../components/layout/Sidebar';
import ProfileModal from '../components/profile/ProfileModal';
import TodoInput from '../components/todo/TodoInput';
import TodoItem from '../components/todo/TodoItem';
import { useTodos } from '../hooks/useTodos';

import { API_PROFILE_URL, API_ME_URL } from '../constants';
import { getNowDatetimeLocal, isDateToday, isDateUpcoming, isDateOverdue } from '../utils/dateUtils';

import {
  getPriorityColor,
  getPriorityBorder
} from '../utils/styleUtils';

// Helper local
function getFilteredTodos(tasks, activeTab) {
  if (activeTab === 'TODAY') return tasks.filter(task => !!task.dueDate && isDateToday(task.dueDate));
  if (activeTab === 'UPCOMING') return tasks.filter(task => !!task.dueDate && isDateUpcoming(task.dueDate));
  if (activeTab === 'IMPORTANT') return tasks.filter(task => task.priority === 'High');
  if (activeTab === 'OVERDUE') {
    const overdueTasks = tasks.filter(task => !!task.dueDate && isDateOverdue(task.dueDate));
    const priorityMap = { High: 3, Medium: 2, Low: 1 };
    return overdueTasks.sort((a, b) => {
      const priorityA = priorityMap[a.priority] || 0;
      const priorityB = priorityMap[b.priority] || 0;
      return priorityB - priorityA; // Descending order: High > Medium > Low
    });
  }
  return tasks;
}

function getTabTitle(tab) {
  switch (tab) {
    case "TODAY": return "Today";
    case "UPCOMING": return "Upcoming";
    case "IMPORTANT": return "Important";
    case "OVERDUE": return "Overdue";
    default: return "Inbox";
  }
}

export default function Home() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { width, height } = useWindowSize();

  // --- 2. Tạo hàm logout ổn định với useCallback ---
  const handleLogoutAuth = useCallback(() => {
    localStorage.removeItem('token');
    navigate('/login');
  }, [navigate]);

  // --- 3. Truyền hàm đã memoize vào hook ---
  const { tasks, loading, addTask, deleteTask, updateTask, reorderTasks } = useTodos(token, handleLogoutAuth);

  // State Input
  const [input, setInput] = useState('');
  const [inputPriority, setInputPriority] = useState('Medium');
  const [inputDueDate, setInputDueDate] = useState(getNowDatetimeLocal());

  // State Edit
  const [editingId, setEditingId] = useState(null);
  const [editState, setEditState] = useState({ editValue: '', editPriority: 'Medium', editDueDate: '' });

  // State UI
  const [activeTab, setActiveTab] = useState('INBOX');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const timerRef = useRef(null);

  // State Profile
  const [userProfile, setUserProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileDraft, setProfileDraft] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  // --- Handlers ---
  const onAddTask = async () => {
    const success = await addTask(input.trim(), inputPriority, inputDueDate);
    if (success) {
      setInput('');
      setInputPriority('Medium');
      setInputDueDate(getNowDatetimeLocal());
    }
  };

  const onToggleCompleted = (id) => {
    const task = tasks.find(t => t._id === id);
    if (task) updateTask(id, { completed: !task.completed });
  };

  // Edit Handlers
  const startEditTask = (task) => {
    setEditingId(task._id);
    let dStr = '';
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      if (!isNaN(d.getTime())) {
        const pad = n => String(n).padStart(2, '0');
        dStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    }
    setEditState({
      editValue: task.text,
      editPriority: task.priority || 'Medium',
      editDueDate: dStr
    });
  };

  const handleSaveEdit = async (id) => {
    if (!editState.editValue.trim()) return;
    const success = await updateTask(id, {
      text: editState.editValue.trim(),
      priority: editState.editPriority,
      dueDate: editState.editDueDate || getNowDatetimeLocal()
    });
    if (success) setEditingId(null);
  };

  // Drag & Drop
  const handleOnDragEnd = (result) => {
    if (!result.destination) return;
    if (activeTab !== "INBOX") return;
    const fromIdx = result.source.index;
    const toIdx = result.destination.index;
    if (fromIdx === toIdx) return;

    const newTasks = Array.from(tasks);
    const [removed] = newTasks.splice(fromIdx, 1);
    newTasks.splice(toIdx, 0, removed);
    
    reorderTasks(newTasks);
  };

  // --- Effects (Profile, Celebration...) ---
  useEffect(() => {
    if (!token) return;
    fetch(API_ME_URL, { headers: { Authorization: 'Bearer ' + token } })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setUserProfile(data); })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (showProfileModal && userProfile) {
      setProfileDraft({ ...userProfile, birthday: userProfile.birthday ? userProfile.birthday.slice(0, 10) : "" });
    }
    setProfileError('');
  }, [showProfileModal, userProfile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await fetch(API_PROFILE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ ...profileDraft, birthday: profileDraft.birthday || null })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Saved!");
        setShowProfileModal(false);
        setUserProfile(data);
      } else {
        setProfileError(data.error || "Failed");
      }
    } catch { setProfileError("Network error"); }
    setProfileSaving(false);
  };

  const completedCount = tasks.filter(task => task.completed).length;
  const pct = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  useEffect(() => {
    if (pct === 100 && tasks.length > 0) {
      setShowCelebration(true);
      timerRef.current = setTimeout(() => setShowCelebration(false), 4000);
    } else {
      setShowCelebration(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [pct, tasks.length]);

  useEffect(() => { document.body.style.overflow = sidebarOpen ? "hidden" : ""; }, [sidebarOpen]);

  const filteredTodos = getFilteredTodos(tasks, activeTab);

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex relative overflow-hidden">
      {/* Overlay effects */}
      {pct === 100 && tasks.length > 0 && <Confetti width={width} height={height} numberOfPieces={700} gravity={0.22} recycle={false} style={{ zIndex: 40 }} />}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        
      {showCelebration && (
        <div className="font-extrabold text-6xl drop-shadow-2xl animate-bounce flex items-center gap-3">
          {/* Chỉ áp dụng màu gradient cho chữ */}
          <span className="bg-gradient-to-r from-orange-400 via-yellow-300 to-red-500 bg-clip-text text-transparent">
            Congratulations!
          </span>
          {/* Icon giữ nguyên màu gốc */}
          <span>🎉</span>
        </div>
      )}
      </div>

      <ProfileModal
        show={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={profileDraft}
        onChange={setProfileDraft}
        onSave={handleSaveProfile}
        saving={profileSaving}
        error={profileError}
      />

      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute top-5 left-5 z-50 md:hidden rounded-full p-2 bg-white/70">
        <svg width="26" height="26" fill="none" stroke="#0e7490" strokeWidth="2.5"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogoutAuth}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        userProfile={userProfile}
        onAvatarClick={() => setShowProfileModal(true)}
      />

      {/* CẬP NHẬT GIAO DIỆN HOME:
         1. rounded-none: Để bỏ bo góc, lấp đầy khe hở màu đen.
         2. border-l border-white/10: Thêm đường viền mờ để ngăn cách rõ ràng Sidebar và Main, tránh bị "trắng trơn".
         3. bg-white/95: Giữ nền sáng nhưng vẫn đồng bộ.
      */}
      <main className="flex-1 w-full flex flex-col h-full overflow-hidden bg-white/95 backdrop-blur-lg shadow-2xl rounded-none border-l border-white/20 md:px-12 py-6">
        <span className={`block md:hidden ${sidebarOpen ? 'h-8' : 'h-0'}`} />
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-black text-slate-900">{getTabTitle(activeTab)}</h1>
            <span className="text-xs font-bold text-slate-700">{tasks.length === 0 ? "0%" : `${pct}%`}</span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <TodoInput
          input={input} setInput={setInput}
          priority={inputPriority} setPriority={setInputPriority}
          dueDate={inputDueDate} setDueDate={setInputDueDate}
          onAdd={onAddTask}
        />

        <div className="flex-1 overflow-y-auto hide-scrollbar py-2">
          {loading ? (
            <p className="text-center mt-10 animate-pulse text-cyan-600">Loading...</p>
          ) : filteredTodos.length === 0 ? (
            <p className="text-center mt-10 text-slate-500">No tasks here yet.</p>
          ) : (
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <Droppable droppableId="tasksList">
                {(provided) => (
                  <ul className="divide-y divide-blue-100" {...provided.droppableProps} ref={provided.innerRef}>
                    {filteredTodos.map((task, index) => (
                      <TodoItem
                        key={task._id}
                        index={index}
                        task={task}
                        isEditing={editingId === task._id}
                        editState={editState}
                        setEditState={setEditState}
                        isDragDisabled={activeTab !== 'INBOX' || editingId !== null}
                        actions={{
                          toggleCompleted: onToggleCompleted,
                          deleteTask,
                          startEdit: startEditTask,
                          cancelEdit: () => setEditingId(null),
                          saveEdit: handleSaveEdit
                        }}
                      />
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </main>
    </div>
  );
}