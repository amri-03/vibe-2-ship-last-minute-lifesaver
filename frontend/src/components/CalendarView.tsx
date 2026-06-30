import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, AlertTriangle, 
  Plus, Trash2, ChevronDown, Search, HelpCircle, Settings, Check, Sparkles
} from 'lucide-react';
import { Task, CalendarEvent } from '../types';

interface CalendarViewProps {
  tasks: Task[];
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onRemoveEvent: (id: string) => void;
  onScheduleTask: (taskId: string, dateStr: string, timeStr: string, durationMin: number) => void;
  theme?: 'light' | 'dark';
  onSyncGoogleCalendar?: () => void;
  isSyncingCalendar?: boolean;
  calendarSyncError?: string | null;
  googleAccessToken?: string | null;
  isSyncCalendarDisabled?: boolean;
}

export default function CalendarView({
  tasks,
  events,
  onAddEvent,
  onRemoveEvent,
  onScheduleTask,
  theme = 'dark',
  onSyncGoogleCalendar,
  isSyncingCalendar = false,
  calendarSyncError = null,
  googleAccessToken = null,
  isSyncCalendarDisabled = false
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [showViewDropdown, setShowViewDropdown] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [selectedTaskToSchedule, setSelectedTaskToSchedule] = useState<string>('');
  const [scheduleDate, setScheduleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState<string>('09:00');
  const [scheduleDuration, setScheduleDuration] = useState<number>(60);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);

  // Generate days of the current week (Sunday to Saturday)
  const getDaysOfWeek = (date: Date) => {
    const days = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day; // Adjust to Sunday
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      days.push(new Date(startOfWeek));
      startOfWeek.setDate(startOfWeek.getDate() + 1);
    }
    return days;
  };

  // Generate 42 days grid for Monthly View (covering all rows of 6 weeks)
  const getDaysInMonthGrid = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeekOfFirst = firstDayOfMonth.getDay(); // 0 is Sunday, 6 is Saturday
    
    // Start date of grid is the Sunday of first week
    const gridStartDate = new Date(firstDayOfMonth);
    gridStartDate.setDate(firstDayOfMonth.getDate() - dayOfWeekOfFirst);
    
    const days = [];
    // 6 rows * 7 columns = 42 days grid
    const totalDaysInGrid = 42;
    for (let i = 0; i < totalDaysInGrid; i++) {
      days.push(new Date(gridStartDate));
      gridStartDate.setDate(gridStartDate.getDate() + 1);
    }
    return days;
  };

  const daysOfWeek = getDaysOfWeek(currentDate);
  const daysOfMonthGrid = getDaysInMonthGrid(currentDate);

  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayVal = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayVal}`;
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
  };

  const handlePrevClick = () => {
    if (viewMode === 'month') {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() - 1);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const handleNextClick = () => {
    if (viewMode === 'month') {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() + 1);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  const getEventsForDay = (day: Date) => {
    const dayStr = formatDateLocal(day);
    let dayEvents = events.filter(e => {
      const start = new Date(e.start);
      return formatDateLocal(start) === dayStr;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      dayEvents = dayEvents.filter(e => e.title.toLowerCase().includes(q));
    }

    return dayEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  };

  const formatMonthYearHeader = (date: Date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const handleManualScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskToSchedule) return;
    onScheduleTask(selectedTaskToSchedule, scheduleDate, scheduleTime, scheduleDuration);
    setShowScheduleModal(false);
    setSelectedTaskToSchedule('');
  };

  const unscheduledTasks = tasks.filter(t => !t.completed && !t.scheduledTime);

  return (
    <div className="w-full flex flex-col transition-all duration-300 relative" id="calendar-view-container">
      
      {/* Google Calendar Style Sub Header Controls */}
      <div className={`flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 pb-5 border-b ${
        theme === 'dark' ? 'border-white/[0.06]' : 'border-slate-150'
      }`}>
        
        {/* Left Side: Navigation (Today, arrows, Month Name) */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            onClick={handleTodayClick}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all cursor-pointer shadow-3xs ${
              theme === 'dark'
                ? 'bg-slate-800 hover:bg-slate-700 border-white/[0.08] text-white'
                : 'bg-white hover:bg-slate-50 border-slate-250 text-slate-700'
            }`}
          >
            Today
          </button>

          <div className="flex items-center">
            <button
              onClick={handlePrevClick}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                theme === 'dark' ? 'hover:bg-slate-800 text-slate-350' : 'hover:bg-slate-100 text-slate-600'
              }`}
              title={viewMode === 'month' ? "Previous Month" : "Previous Week"}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextClick}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                theme === 'dark' ? 'hover:bg-slate-800 text-slate-350' : 'hover:bg-slate-100 text-slate-600'
              }`}
              title={viewMode === 'month' ? "Next Month" : "Next Week"}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h3 className={`text-xl font-bold tracking-tight min-w-[150px] ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}>
            {formatMonthYearHeader(currentDate)}
          </h3>
        </div>

        {/* Right Side: Tools (Search, Sync, Mode Dropdown, Schedule) */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Integrated Mini-Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-2 rounded-lg text-xs border focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all w-40 sm:w-48 ${
                theme === 'dark' 
                  ? 'bg-slate-950 border-white/[0.06] text-slate-200' 
                  : 'bg-slate-50 border-slate-250 text-slate-800'
              }`}
            />
          </div>

          {/* Google Calendar Sync Button */}
          {onSyncGoogleCalendar && (
            <button
              onClick={onSyncGoogleCalendar}
              disabled={isSyncingCalendar || isSyncCalendarDisabled}
              title={isSyncCalendarDisabled ? "Google Calendar sync is disabled without a Google account" : undefined}
              className={`px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all border cursor-pointer ${
                isSyncCalendarDisabled
                  ? 'bg-slate-500/10 border-slate-500/15 text-slate-450 opacity-50 cursor-not-allowed'
                  : googleAccessToken
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/25 shadow-sm shadow-indigo-500/10'
              }`}
            >
              {isSyncingCalendar ? (
                <span className="w-3.5 h-3.5 border-2 border-t-transparent animate-spin rounded-full shrink-0" />
              ) : (
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C18.155 2.15 15.43 1 12.24 1 6.035 1 12.24s5.035 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.983 0-.742-.08-1.302-.175-1.714l-10.618-.498z"/>
                </svg>
              )}
              {isSyncingCalendar ? 'Syncing...' : googleAccessToken ? 'Google Synced' : 'Connect Google'}
            </button>
          )}

          {/* View Mode Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowViewDropdown(!showViewDropdown)}
              className={`px-3 py-2 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 border-white/[0.08] text-slate-200'
                  : 'bg-white hover:bg-slate-50 border-slate-250 text-slate-600'
              }`}
            >
              <span className="capitalize">{viewMode}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showViewDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowViewDropdown(false)} 
                />
                <div className={`absolute right-0 mt-1.5 w-32 border rounded-xl shadow-xl z-50 p-1.5 overflow-hidden transition-all ${
                  theme === 'dark' ? 'bg-slate-900 border-white/[0.08] text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  {['month', 'week'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setViewMode(mode as 'month' | 'week');
                        setShowViewDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${
                        viewMode === mode
                          ? (theme === 'dark' ? 'bg-indigo-600/15 text-indigo-400 font-black' : 'bg-indigo-50 text-indigo-600 font-black')
                          : (theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-655')
                      }`}
                    >
                      <span className="capitalize">{mode} view</span>
                      {viewMode === mode && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-all border border-indigo-500/30 shadow-[0_0_12px_rgba(79,70,229,0.3)] cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Schedule
          </button>
        </div>
      </div>
 
      {/* Unscheduled Deadline Alerts bar */}
      {unscheduledTasks.length > 0 && (
        <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
          <div className="flex items-center gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className={theme === 'dark' ? "text-amber-200" : "text-amber-800"}>
              You have <strong className={theme === 'dark' ? "font-semibold text-amber-300" : "font-semibold text-amber-900"}>{unscheduledTasks.length} unscheduled tasks</strong>. Double-click or click "Schedule" to book their blocks.
            </span>
          </div>
        </div>
      )}
 
      {/* Main Grid View */}
      <div className="overflow-x-auto">
        <div className={`min-w-[700px] border rounded-xl overflow-hidden shadow-lg ${
          theme === 'dark' ? 'border-white/[0.06] shadow-black/20' : 'border-slate-200 shadow-slate-100/50'
        }`}>
          
          {/* MONTH VIEW GRID */}
          {viewMode === 'month' && (
            <div>
              {/* Month Header Days of Week abbreviation */}
              <div className={`grid grid-cols-7 border-b text-xs font-bold py-2.5 text-center ${
                theme === 'dark' ? 'bg-slate-950/60 border-white/[0.06] text-slate-400' : 'bg-slate-100 border-slate-205 text-slate-600'
              }`}>
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((dayName, index) => (
                  <div key={index} className="uppercase tracking-wider text-[10px]">{dayName}</div>
                ))}
              </div>

              {/* 6 Rows * 7 Cols Monthly Grid cells */}
              <div className={`grid grid-cols-7 divide-x divide-y ${
                theme === 'dark' 
                  ? 'divide-white/[0.06] bg-slate-950/20' 
                  : 'divide-slate-200 bg-white'
              }`}>
                {daysOfMonthGrid.map((day, cellIdx) => {
                  const dayEvents = getEventsForDay(day);
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const dayNum = day.getDate();
                  
                  // Display short month name if it's the 1st of any month
                  const displayDayLabel = dayNum === 1 
                    ? `1 ${day.toLocaleDateString('default', { month: 'short' })}` 
                    : String(dayNum);

                  return (
                    <div 
                      key={cellIdx} 
                      className={`p-1.5 min-h-[105px] transition-all flex flex-col gap-1.5 ${
                        isCurrentMonth 
                          ? (theme === 'dark' ? 'text-slate-200 bg-slate-950/10' : 'text-slate-800 bg-white') 
                          : 'text-slate-400 dark:text-slate-600 opacity-45 bg-slate-500/[0.02]'
                      } ${
                        isToday 
                          ? (theme === 'dark' ? 'bg-indigo-500/[0.03]' : 'bg-indigo-50/30') 
                          : ''
                      } hover:bg-slate-500/[0.02]`}
                    >
                      {/* Day Label */}
                      <div className="flex justify-end p-0.5">
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center ${
                          isToday 
                            ? 'bg-indigo-600 text-white font-extrabold min-w-5 h-5 shadow-sm' 
                            : isCurrentMonth 
                              ? (theme === 'dark' ? 'text-slate-350' : 'text-slate-600')
                              : (theme === 'dark' ? 'text-slate-600' : 'text-slate-400')
                        }`}>
                          {displayDayLabel}
                        </span>
                      </div>

                      {/* Day Events stack (Max 3 to prevent layout breakage, plus dynamic '+X more' indicator) */}
                      <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map(event => {
                          const task = tasks.find(t => t.id === event.taskId);
                          const displayColor = event.color || task?.color || '#4f46e5';
                          const isCompleted = task?.completed || false;

                          return (
                            <div 
                              key={event.id}
                              style={{ 
                                backgroundColor: `${displayColor}18`, 
                                borderLeft: `3px solid ${displayColor}`,
                                color: theme === 'dark' ? '#f1f5f9' : '#1e293b'
                              }}
                              className="text-[10px] p-1.5 rounded-md flex flex-col justify-between group/event transition-all relative hover:scale-[1.01] cursor-pointer"
                            >
                              <div className="font-bold truncate max-w-[85%] pr-1">
                                {isCompleted ? <span className="line-through text-slate-400 font-normal">{event.title}</span> : event.title}
                              </div>
                              <div className="flex items-center justify-between text-[8px] text-slate-400 dark:text-slate-500 font-semibold font-mono mt-0.5">
                                <span>{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveEvent(event.id);
                                  }}
                                  className="opacity-0 group-hover/event:opacity-100 p-0.5 rounded text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                                  title="Remove Block"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {dayEvents.length > 3 && (
                          <div className={`text-[9px] font-black uppercase tracking-wider pl-1.5 ${
                            theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'
                          }`}>
                            + {dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW GRID */}
          {viewMode === 'week' && (
            <div>
              {/* Grid Header - 7 columns */}
              <div className={`grid grid-cols-7 border-b text-sm font-semibold py-3 text-center ${
                theme === 'dark' ? 'bg-slate-950/60 border-white/[0.06] text-slate-400' : 'bg-slate-100 border-slate-205 text-slate-600'
              }`}>
                {daysOfWeek.map((day, idx) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <div 
                      key={idx} 
                      className={`py-1 flex flex-col items-center justify-center ${isToday ? 'text-indigo-600 font-bold bg-indigo-500/10 rounded-md mx-1' : ''}`}
                    >
                      <span className="uppercase text-xs tracking-wider">{day.toLocaleDateString('default', { weekday: 'short' })}</span>
                      <span className="text-sm mt-0.5">{day.getDate()}</span>
                    </div>
                  );
                })}
              </div>

              {/* Grid Content - 7 columns */}
              <div className={`grid grid-cols-7 divide-x ${
                theme === 'dark' ? 'divide-white/[0.06] bg-slate-950/20' : 'divide-slate-200 bg-white'
              }`}>
                {daysOfWeek.map((day, dayIdx) => {
                  const dayEvents = getEventsForDay(day);
                  const isToday = day.toDateString() === new Date().toDateString();

                  return (
                    <div 
                      key={dayIdx} 
                      className={`p-2 min-h-[320px] transition-all flex flex-col gap-2 ${
                        theme === 'dark' 
                          ? 'hover:bg-white/[0.01]' 
                          : 'hover:bg-slate-50/70'
                      } ${isToday ? (theme === 'dark' ? 'bg-indigo-500/[0.02]' : 'bg-indigo-50/20') : ''}`}
                    >
                      {dayEvents.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 opacity-30">
                          <Clock className="w-4 h-4 text-slate-400 mb-1" />
                          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Free Day</span>
                        </div>
                      ) : (
                        dayEvents.map(event => {
                          const task = tasks.find(t => t.id === event.taskId);
                          const displayColor = event.color || task?.color || '#4f46e5';
                          const isCompleted = task?.completed || false;

                          return (
                            <div 
                              key={event.id}
                              style={{ 
                                backgroundColor: `${displayColor}18`, 
                                borderLeft: `4px solid ${displayColor}`,
                                color: theme === 'dark' ? '#f1f5f9' : '#1e293b'
                              }}
                              className="text-xs p-2.5 rounded-xl flex flex-col justify-between group/event transition-all hover:scale-[1.01] cursor-pointer"
                            >
                              <div className="font-semibold line-clamp-3 leading-snug">
                                {isCompleted ? <span className="line-through text-slate-400 font-normal">{event.title}</span> : event.title}
                              </div>
                              
                              {/* Time indicator & delete button */}
                              <div className={`flex items-center justify-between mt-2.5 pt-1.5 border-t ${
                                theme === 'dark' ? 'border-white/[0.04]' : 'border-slate-100'
                              }`}>
                                <span className="text-[10px] text-indigo-400 font-mono font-bold">
                                  {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onRemoveEvent(event.id)}
                                  className={`opacity-0 group-hover/event:opacity-100 p-0.5 rounded transition-all cursor-pointer ${
                                    theme === 'dark' ? 'text-slate-450 hover:text-red-400 hover:bg-slate-800' : 'text-slate-450 hover:text-red-500 hover:bg-slate-100'
                                  }`}
                                  title="Remove Block"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
 
      {/* Manual Schedule Block Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`border rounded-2xl w-full max-w-md p-6 shadow-2xl transition-all ${
            theme === 'dark' ? 'bg-slate-900 border-white/[0.06] shadow-black/85' : 'bg-white border-slate-200 shadow-slate-200/50'
          }`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              <CalendarIcon className="w-5 h-5 text-indigo-400" />
              Schedule Focus Block
            </h3>
            
            <form onSubmit={handleManualScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Select Pending Task
                </label>
                <select
                  required
                  value={selectedTaskToSchedule}
                  onChange={(e) => setSelectedTaskToSchedule(e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all ${
                    theme === 'dark' ? 'bg-slate-950 border-white/[0.06] text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="" className={theme === 'dark' ? "text-slate-500 bg-slate-900" : "text-slate-400 bg-white"}>-- Choose a task to block --</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id} className={theme === 'dark' ? "text-slate-200 bg-slate-900" : "text-slate-700 bg-white"}>
                      [{t.priority.toUpperCase()}] {t.title} ({t.estimatedDuration}m)
                    </option>
                  ))}
                </select>
              </div>
 
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-white/[0.06] text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all ${
                      theme === 'dark' ? 'bg-slate-950 border-white/[0.06] text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
              </div>
 
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="480"
                  required
                  value={scheduleDuration}
                  onChange={(e) => setScheduleDuration(Number(e.target.value))}
                  className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all ${
                    theme === 'dark' ? 'bg-slate-950 border-white/[0.06] text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>
 
              <div className={`flex gap-2 justify-end pt-2 border-t ${theme === 'dark' ? 'border-white/[0.04]' : 'border-slate-150'}`}>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className={`px-4 py-2 font-semibold text-sm rounded-lg border transition-colors cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/[0.06]' 
                      : 'bg-slate-250 hover:bg-slate-300 text-slate-700 border-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedTaskToSchedule}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:text-slate-500 text-white font-semibold text-sm rounded-lg transition-all shadow-[0_0_12px_rgba(79,70,229,0.25)] cursor-pointer"
                >
                  Book Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
