import React from 'react';
import CalendarIcon from '../common/CalendarIcon';
import { PRIORITY_OPTIONS } from '../../constants';
import { getNowDatetimeLocal, getTodayThresholdDatetimeLocal, formatDueDate } from '../../utils/dateUtils';

export default function TodoInput({
  input, setInput,
  priority, setPriority,
  dueDate, setDueDate,
  onAdd
}) {
  return (
    <div className="flex flex-row gap-2 mb-7 mt-3 items-stretch">
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Add a task"
        className="flex-1 px-4 py-2 rounded-xl border-none focus:border-transparent shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-white/70 text-slate-700 placeholder-gray-400 font-semibold backdrop-blur transition"
        onKeyDown={e => { if (e.key === 'Enter') onAdd(); }}
        autoFocus
      />
      <select
        value={priority}
        onChange={e => setPriority(e.target.value)}
        className="px-4 py-2 rounded-xl border-none focus:border-transparent bg-white/90 text-slate-800 font-semibold shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
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
            ${dueDate ? "ring-2 ring-cyan-300" : ""}
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
            value={dueDate}
            min={getTodayThresholdDatetimeLocal()}
            onChange={e => setDueDate(e.target.value)}
            className="absolute opacity-0 w-0 h-0"
          />
          {dueDate && (
            <span className="ml-2 text-xs text-slate-700 font-semibold">
              {formatDueDate(dueDate)}
            </span>
          )}
          {dueDate && (
            <button
              type="button"
              className="ml-2 text-gray-400 hover:text-red-500 font-bold px-1"
              onClick={e => {
                e.stopPropagation();
                setDueDate(getNowDatetimeLocal());
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>
      <button
        onClick={onAdd}
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
  );
}