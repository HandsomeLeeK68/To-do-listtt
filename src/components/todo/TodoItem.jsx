import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import CalendarIcon from '../common/CalendarIcon';
import { PRIORITY_OPTIONS } from '../../constants';
import { formatDueDate, isDateToday, isDateOverdue } from '../../utils/dateUtils';
import { getPriorityColor, getPriorityBorder } from '../../utils/styleUtils';

export default function TodoItem({
  task,
  index,
  isEditing,
  editState,
  setEditState,
  actions,
  isDragDisabled
}) {
  const { text, priority, dueDate, completed, _id } = task;
  const { editValue, editPriority, editDueDate } = editState;
  // actions chứa các hàm xử lý từ cha truyền xuống
  const { saveEdit, cancelEdit, startEdit, deleteTask, toggleCompleted } = actions;

  const isOverdue = isDateOverdue(dueDate);
  const isDueToday = isDateToday(dueDate);
  
  let borderClass = "";
  if (isOverdue) {
    borderClass = "border-2 border-red-500 shadow-sm";
  } else if (isDueToday) {
    borderClass = `border-2 animate-pulse ${getPriorityBorder(priority)}`;
  } else {
    borderClass = "border border-white/30";
  }

  return (
    <Draggable draggableId={_id} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <li
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            group flex items-center px-3 py-3.5 gap-4 rounded-2xl
            hover:bg-blue-50/85 transition 
            ${completed ? 'opacity-60 line-through' : ''} 
            ${borderClass}
            ${snapshot.isDragging ? "z-10 bg-blue-100/80 shadow-lg scale-105" : ""}
          `}
          style={{ ...provided.draggableProps.style }}
        >
          {/* Drag Handle */}
          {!isEditing && !isDragDisabled ? (
            <span className="cursor-grab pr-1 flex items-center select-none opacity-60 hover:opacity-100 transition">
               <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="5.5" cy="6" r="1.2" fill="#94a3b8"/><circle cx="5.5" cy="10" r="1.2" fill="#94a3b8"/><circle cx="5.5" cy="14" r="1.2" fill="#94a3b8"/>
                <circle cx="9.5" cy="6" r="1.2" fill="#94a3b8"/><circle cx="9.5" cy="10" r="1.2" fill="#94a3b8"/><circle cx="9.5" cy="14" r="1.2" fill="#94a3b8"/>
              </svg>
            </span>
          ) : <span className="pr-1" />}

          {/* Checkbox */}
          <input type="checkbox" checked={!!completed} onChange={() => toggleCompleted(_id)} className="accent-emerald-500 w-5 h-5 shrink-0 cursor-pointer" />

          {/* Priority Badge */}
          <span className={`flex items-center min-w-[72px] px-2 py-1.5 rounded-lg font-bold text-xs text-center select-none gap-1.5 ${getPriorityColor(priority)}`}>
            <span className={`w-2.5 h-2.5 rounded-full inline-block ring-1 ring-white/90 ${priority === 'High' ? 'bg-red-400' : priority === 'Medium' ? 'bg-amber-300' : 'bg-emerald-400'}`} />
            {priority || 'Medium'}
          </span>

          {/* Content / Edit Form */}
          <div className="flex-1 flex items-center min-w-0">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={editValue}
                  onChange={e => setEditState(prev => ({...prev, editValue: e.target.value}))}
                  className="flex-1 text-base rounded-md px-2 py-1 mr-2 focus:ring-2 focus:ring-cyan-200 bg-white/70 outline-none text-slate-700 shadow"
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveEdit(_id);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  autoFocus
                />
                <select value={editPriority} onChange={e => setEditState(prev => ({...prev, editPriority: e.target.value}))} className="px-2 py-1 rounded-md border-none bg-white/80 text-slate-800 text-sm focus:ring-2 focus:ring-cyan-300 shadow-sm font-semibold">
                  {PRIORITY_OPTIONS.map(opt => <option value={opt.value} key={opt.value}>{opt.label}</option>)}
                </select>
                <div className="relative flex items-center ml-2">
                  <div className="relative flex items-center cursor-pointer px-2 py-1.5 bg-white/90 rounded-lg shadow-sm border border-transparent focus-within:ring-2 focus-within:ring-cyan-300">
                    <CalendarIcon size={18} color="#0891b2" />
                    <input
                      type="datetime-local"
                      value={editDueDate}
                      onChange={e => setEditState(prev => ({...prev, editDueDate: e.target.value}))} 
                      className="ml-2 bg-transparent text-xs text-cyan-800 font-semibold outline-none"
                      style={{maxWidth: '130px'}}
                    />
                  </div>
                </div>
                <button onClick={() => saveEdit(_id)} className="ml-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded font-bold shadow transition">Save</button>
                <button onClick={cancelEdit} className="ml-2 bg-white/70 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded font-medium shadow transition">Cancel</button>
              </>
            ) : (
              <span className={`flex-1 text-base font-medium min-w-0 break-words pl-0 select-text truncate ${completed ? 'text-gray-400' : 'text-slate-700'}`}>
                {text}
              </span>
            )}
          </div>

          {/* Info Badge (Date/Overdue) */}
          {!isEditing && (dueDate || isDueToday || isOverdue) && (
            <div className="flex flex-col items-start min-w-[73px] mx-2">
              {isDueToday && <span className="text-xs text-orange-500 font-bold select-none">Due today</span>}
              {isOverdue && <span className="text-xs text-red-600 font-bold select-none">Overdue</span>}
              {!isOverdue && !isDueToday && dueDate && (
                <span className="flex items-center text-xs font-semibold text-gray-400 gap-1">
                  <CalendarIcon size={15} color="#64748b" />
                  <span>{formatDueDate(dueDate)}</span>
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {!isEditing && !isDragDisabled && (
            <div className="flex items-center gap-2 ml-2 opacity-70 group-hover:opacity-100 transition">
              <button onClick={() => startEdit(task)} className="rounded-full p-1.5 hover:bg-cyan-100/60 transition" aria-label="Edit">
                <svg height="18" width="18" viewBox="0 0 20 20" fill="none"><path d="M14.85 2.85a1.207 1.207 0 0 1 1.7 1.7l-1 1-1.7-1.7 1-1zM3 13.75l8.73-8.73 1.7 1.7L4.7 15.4H3v-1.65z" fill="#06b6d4" /></svg>
              </button>
              <button onClick={() => deleteTask(_id)} className="rounded-full p-1.5 hover:bg-red-100/70 transition text-red-500" aria-label="Delete">
                <svg width={18} height={18} fill="none" viewBox="0 0 20 20"><path d="M6 7v7m4-7v7m4-10v1m-8-1v1m4 8a1 1 0 001 1h2a1 1 0 001-1V7a1 1 0 00-1-1h-6a1 1 0 00-1 1v7a1 1 0 001 1h2a1 1 0 001-1z" stroke="#ef4444" strokeWidth="1.5"/></svg>
              </button>
            </div>
          )}
        </li>
      )}
    </Draggable>
  );
}