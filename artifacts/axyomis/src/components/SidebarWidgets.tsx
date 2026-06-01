import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock, Play, Square, BarChart } from 'lucide-react';

// Dark liquid-glass sidebar with calendar, stopwatch, timer, notepad, todo, news & stocks toggles
export const SidebarWidgets: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [open, setOpen] = useState<string | null>(null);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [stopwatchElapsed, setStopwatchElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(150);
  const [showNews, setShowNews] = useState(() => localStorage.getItem('widgets_showNews') === 'true');
  const [showStocks, setShowStocks] = useState(() => localStorage.getItem('widgets_showStocks') === 'true');

  // Notepad
  const [notes, setNotes] = useState(() => localStorage.getItem('widgets_notes') || '');

  // Todo list
  const [todos, setTodos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('widgets_todos') || '[]'); } catch { return []; }
  });
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
      if (isStopwatchRunning) setStopwatchElapsed((s) => s + 1);
      if (isTimerRunning) setTimerRemaining((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isStopwatchRunning, isTimerRunning]);

  useEffect(() => { if (timerRemaining === 0) setIsTimerRunning(false); }, [timerRemaining]);

  useEffect(() => { localStorage.setItem('widgets_showNews', String(showNews)); }, [showNews]);
  useEffect(() => { localStorage.setItem('widgets_showStocks', String(showStocks)); }, [showStocks]);
  useEffect(() => { localStorage.setItem('widgets_notes', notes); }, [notes]);
  useEffect(() => { localStorage.setItem('widgets_todos', JSON.stringify(todos)); }, [todos]);

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const item = { id: Date.now(), text: newTodo.trim(), done: false, createdAt: Date.now() };
    setTodos((t: any[]) => [item, ...t]);
    setNewTodo('');
  };

  const toggleTodo = (id: number) => {
    setTodos((t: any[]) => t.map((x: any) => x.id === id ? { ...x, done: !x.done } : x));
  };

  // Basic month grid calendar
  const renderMonthGrid = () => {
    const first = new Date(time.getFullYear(), time.getMonth(), 1);
    const last = new Date(time.getFullYear(), time.getMonth() + 1, 0);
    const days: number[] = [];
    const startDay = first.getDay();
    for (let i = 0; i < startDay; i++) days.push(0);
    for (let d = 1; d <= last.getDate(); d++) days.push(d);
    return (
      <div className="grid grid-cols-7 gap-1 text-[12px]">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-slate-400 text-center">{d}</div>
        ))}
        {days.map((d, idx) => (
          <div key={idx} className={`h-8 flex items-center justify-center rounded ${d === time.getDate() ? 'bg-white text-black font-bold' : d === 0 ? '' : 'bg-white/3 text-white'}`}>
            {d || ''}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed right-4 top-1/4 z-[1050] flex flex-col gap-3 items-end">
      <div className="w-52 p-3 bg-black/90 backdrop-blur-md border border-white/6 rounded-3xl text-white text-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{time.toLocaleDateString()}</div>
            <div className="font-mono text-lg font-semibold mt-1">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div className="flex flex-col items-end">
            <button onClick={() => setOpen(open === 'calendar' ? null : 'calendar')} className="text-[10px] uppercase tracking-wider text-slate-300">Calendar</button>
            <div className="text-[10px] text-slate-500 mt-1">{time.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 items-end">
        <button onClick={() => setOpen(open === 'stopwatch' ? null : 'stopwatch')} className="p-2 bg-black/80 border border-white/6 rounded-lg text-white flex items-center gap-2">
          <Play className="w-4 h-4" />
          Stopwatch
        </button>
        <button onClick={() => setOpen(open === 'timer' ? null : 'timer')} className="p-2 bg-black/80 border border-white/6 rounded-lg text-white flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Timer
        </button>
        <button onClick={() => setOpen(open === 'notepad' ? null : 'notepad')} className="p-2 bg-black/80 border border-white/6 rounded-lg text-white flex items-center gap-2">
          <Square className="w-4 h-4" />
          Notepad
        </button>
        <button onClick={() => setOpen(open === 'todo' ? null : 'todo')} className="p-2 bg-black/80 border border-white/6 rounded-lg text-white flex items-center gap-2">
          <BarChart className="w-4 h-4" />
          Tasks
        </button>
        <button onClick={() => setShowNews(s => !s)} className={`p-2 rounded-lg ${showNews ? 'bg-white text-black' : 'bg-black/60 text-white'}`}>News</button>
        <button onClick={() => setShowStocks(s => !s)} className={`p-2 rounded-lg ${showStocks ? 'bg-white text-black' : 'bg-black/60 text-white'}`}>Stocks</button>
      </div>

      {open === 'calendar' && (
        <div className="mt-2 w-72 p-3 bg-black/95 border border-white/6 rounded-2xl text-white text-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold">{time.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
            <div className="text-slate-400 text-xs">Today: {time.toLocaleDateString()}</div>
          </div>
          {renderMonthGrid()}
        </div>
      )}

      {open === 'stopwatch' && (
        <div className="mt-2 w-64 p-3 bg-black/95 border border-white/6 rounded-2xl text-white text-sm">
          <div className="flex items-center justify-between">
            <div className="font-bold">Stopwatch</div>
            <div className="text-slate-400 text-xs">Live</div>
          </div>
          <div className="mt-3 text-3xl font-mono tracking-tight flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${isStopwatchRunning ? 'bg-cyan-400 animate-pulse' : 'bg-white/10'}`} />
            <div>{String(Math.floor(stopwatchElapsed / 60)).padStart(2, '0')}:{String(stopwatchElapsed % 60).padStart(2, '0')}</div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setIsStopwatchRunning(true)} className="flex-1 px-3 py-2 bg-white/6 rounded">Start</button>
            <button onClick={() => setIsStopwatchRunning(false)} className="flex-1 px-3 py-2 bg-white/6 rounded">Pause</button>
            <button onClick={() => { setStopwatchElapsed(0); setIsStopwatchRunning(false); }} className="flex-1 px-3 py-2 bg-white/6 rounded">Reset</button>
          </div>
        </div>
      )}

      {open === 'timer' && (
        <div className="mt-2 w-64 p-3 bg-black/95 border border-white/6 rounded-2xl text-white text-sm">
          <div className="flex items-center justify-between">
            <div className="font-bold">Timer</div>
            <div className="text-slate-400 text-xs">Countdown</div>
          </div>
          <div className="mt-3 text-3xl font-mono tracking-tight">{String(Math.floor(timerRemaining / 60)).padStart(2, '0')}:{String(timerRemaining % 60).padStart(2, '0')}</div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setIsTimerRunning(true)} className="flex-1 px-3 py-2 bg-white/6 rounded">Start</button>
            <button onClick={() => setIsTimerRunning(false)} className="flex-1 px-3 py-2 bg-white/6 rounded">Pause</button>
            <button onClick={() => { setTimerRemaining(150); setIsTimerRunning(false); }} className="flex-1 px-3 py-2 bg-white/6 rounded">Reset</button>
          </div>
        </div>
      )}

      {open === 'notepad' && (
        <div className="mt-2 w-80 p-3 bg-black/95 border border-white/6 rounded-2xl text-white text-sm">
          <div className="font-bold mb-2">Notepad</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Jot notes here..." className="w-full h-32 bg-transparent resize-none outline-none text-sm p-2 border border-white/5 rounded" />
          <div className="mt-2 flex gap-2">
            <button onClick={() => navigator.clipboard?.writeText(notes)} className="px-3 py-1 bg-white/6 rounded">Copy</button>
            <button onClick={() => setNotes('')} className="px-3 py-1 bg-white/6 rounded">Clear</button>
          </div>
        </div>
      )}

      {open === 'todo' && (
        <div className="mt-2 w-80 p-3 bg-black/95 border border-white/6 rounded-2xl text-white text-sm">
          <div className="font-bold mb-2">Study To‑Do</div>
          <div className="flex gap-2 mb-2">
            <input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} placeholder="Add task" className="flex-1 bg-transparent p-2 border border-white/6 rounded outline-none" />
            <button onClick={addTodo} className="px-3 py-1 bg-white/6 rounded">Add</button>
          </div>
          <div className="space-y-2 max-h-40 overflow-auto">
            {todos.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between gap-2 p-2 bg-white/4 rounded">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t.id)} />
                  <div className={`${t.done ? 'line-through text-slate-400' : ''}`}>{t.text}</div>
                </div>
                <div className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showNews && (
        <div className="mt-2 w-80 p-3 bg-black/95 border border-white/6 rounded-2xl text-white text-sm">
          <div className="font-bold mb-2">Headlines (auto-refresh 5m)</div>
          <ul className="text-slate-300 text-sm list-disc pl-4 max-h-48 overflow-auto">
            <li>Live: Top global news item placeholder.</li>
            <li>Live: National headline placeholder.</li>
            <li>Live: Education update placeholder.</li>
            <li>Live: Science research highlight.</li>
            <li>Live: Technology trend snapshot.</li>
          </ul>
        </div>
      )}

      {showStocks && (
        <div className="mt-2 w-80 p-3 bg-black/95 border border-white/6 rounded-2xl text-white text-sm">
          <div className="font-bold mb-2">Market Snapshot</div>
          <div className="text-slate-300 text-sm">AAPL: +1.2% · TSLA: -0.6% · NIFTY: +0.8%</div>
          <div className="mt-2 h-16 bg-white/3 rounded" />
        </div>
      )}
    </div>
  );
};

export default SidebarWidgets;
