import React, { useState } from 'react';
import { 
  Plus, CheckSquare, Square, Trash2, Calendar, Sparkles, ChevronDown, ChevronUp, AlertCircle, 
  Hourglass, Flame, Tag, CheckSquare2
} from 'lucide-react';
import { Task, PriorityLevel, EnergyLevel } from '../types';

interface TaskPanelProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'subtasks'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAiPrioritize: () => Promise<void>;
  isAiLoading: boolean;
  onQuickBook: (taskId: string) => void;
  theme?: 'light' | 'dark';
}

export default function TaskPanel({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onToggleSubtask,
  onAiPrioritize,
  isAiLoading,
  onQuickBook,
  theme = 'dark'
}: TaskPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimatedDuration, setEstimatedDuration] = useState(60);
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [energyRequired, setEnergyRequired] = useState<EnergyLevel>('medium');
  const [category, setCategory] = useState('Study');

  // Filter tab state
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      description: description.trim(),
      dueDate,
      estimatedDuration,
      priority,
      energyRequired,
      category,
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setEstimatedDuration(60);
    setPriority('medium');
    setEnergyRequired('medium');
    setCategory('Study');
    setShowAddForm(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'pending') return !task.completed;
    if (activeTab === 'completed') return task.completed;
    return true;
  });

  // Sort: High priority first, then due date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className={`backdrop-blur-md border rounded-2xl p-6 transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-slate-900/60 border-white/[0.06] shadow-xl shadow-black/30 text-slate-200' 
        : 'bg-white border-slate-200 shadow-md shadow-slate-100/50 text-slate-800'
    }`} id="task-panel-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            <CheckSquare2 className="w-5 h-5 text-indigo-400" />
            Active Tasks
          </h2>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Sort deadlines dynamically. Let AI restructure them for active execution.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl flex items-center gap-1.5 transition-all border border-indigo-500/30 shadow-[0_0_12px_rgba(79,70,229,0.3)] hover:shadow-[0_0_15px_rgba(79,70,229,0.4)] cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Visual Productivity Progress Bar */}
      <div className={`mb-6 border rounded-xl p-4 shadow-3xs transition-all ${
        theme === 'dark' ? 'bg-slate-950/40 border-white/[0.06]' : 'bg-slate-50 border-slate-200'
      }`} id="task-progress-container">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Daily Task Productivity</span>
          </div>
          <span className="text-sm font-mono font-bold text-emerald-500">
            {completedTasks}/{totalTasks} Tasks ({completionPercentage}%)
          </span>
        </div>
        <div className={`w-full rounded-full h-2 overflow-hidden border p-[1px] transition-all ${
          theme === 'dark' ? 'bg-slate-800 border-white/[0.04]' : 'bg-slate-200 border-slate-300'
        }`}>
          <div 
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        {totalTasks > 0 ? (
          <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {completionPercentage === 100 
              ? "🎉 Perfect score! All tasks completed. You're an absolute legend today!" 
              : completionPercentage >= 75 
              ? "Amazing work! You are in the flow zone. Finish strong!" 
              : completionPercentage >= 50 
              ? "Halfway there! Keep up the great momentum." 
              : completionPercentage > 0 
              ? "Good start! Keep ticking off those deadlines." 
              : "Ready to conquer the day? Complete a task to start the progress bar!"}
          </p>
        ) : (
          <p className="text-xs text-slate-400 mt-2">
            No tasks found. Add a task to start tracking your productivity!
          </p>
        )}
      </div>

      {/* AI Supercharge Trigger bar */}
      <div className={`mb-6 border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm transition-all ${
        theme === 'dark' ? 'bg-indigo-950/40 border-indigo-500/20 shadow-black/20' : 'bg-indigo-50/50 border-indigo-150'
      }`}>
        <div>
          <h3 className={`text-sm font-bold flex items-center gap-1 ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-800'}`}>
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            AI DEEP PLANNER ENGINE
          </h3>
          <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-650'}`}>
            Auto-assess workload risk, balance priorities, and auto-generate granular subtask cards.
          </p>
        </div>
        <button
          onClick={onAiPrioritize}
          disabled={isAiLoading || tasks.length === 0}
          className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-1.5 border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isAiLoading ? (
            <>
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Prioritizing State...
            </> 
          ) : (
            <>
              ⚡Auto-Prioritize
            </>
          )}
        </button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className={`border rounded-xl p-5 mb-6 space-y-4 animate-slide-down shadow-lg transition-all ${
          theme === 'dark' 
            ? 'bg-slate-950/60 border-white/[0.06] shadow-black/40' 
            : 'bg-slate-100 border-slate-300 shadow-slate-100'
        }`}>
          <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Create New Deadline</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Task Title</label>
              <input
                type="text"
                required
                placeholder="e.g., CS 301 Midterm Cheat Sheet"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-900 border-white/[0.06] text-slate-200 placeholder-slate-500' 
                    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-900 border-white/[0.06] text-slate-200' 
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="Study" className={theme === 'dark' ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>📚 Study / Revision</option>
                <option value="Work" className={theme === 'dark' ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>💼 Work / Projects</option>
                <option value="Personal" className={theme === 'dark' ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>🏠 Personal</option>
                <option value="Administrative" className={theme === 'dark' ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>📁 Administrative / Bills</option>
                <option value="Health" className={theme === 'dark' ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>💪 Health & Sports</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Description / Instruction Prompt</label>
            <textarea
              placeholder="Give extra details. The AI can use this to generate outlines, flashcards, or drafts for you!"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-900 border-white/[0.06] text-slate-200 placeholder-slate-500' 
                  : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-900 border-white/[0.06] text-slate-200' 
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Duration (mins)</label>
              <input
                type="number"
                required
                min="10"
                max="480"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-900 border-white/[0.06] text-slate-200' 
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-900 border-white/[0.06] text-slate-200' 
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="high" className={theme === 'dark' ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>🔥 High</option>
                <option value="medium" className={theme === 'dark' ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>⚡ Medium</option>
                <option value="low" className={theme === 'dark' ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>🌱 Low</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Energy Cost</label>
              <select
                value={energyRequired}
                onChange={(e) => setEnergyRequired(e.target.value as EnergyLevel)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-900 border-white/[0.06] text-slate-200' 
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="high" className={theme === 'dark' ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>🔴 High Energy</option>
                <option value="medium" className={theme === 'dark' ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>🟡 Medium Energy</option>
                <option value="low" className={theme === 'dark' ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}>🔵 Low Energy</option>
              </select>
            </div>
          </div>

          <div className={`flex justify-end gap-2 pt-2 border-t ${theme === 'dark' ? 'border-white/[0.04]' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg border cursor-pointer transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/[0.06]'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg border border-indigo-500/30 shadow-[0_0_12px_rgba(79,70,229,0.3)] cursor-pointer"
            >
              Submit Deadline
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className={`flex border-b mb-4 text-sm font-semibold transition-all duration-300 ${
        theme === 'dark' ? 'border-white/[0.06]' : 'border-slate-200'
      }`}>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-2.5 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'pending' 
              ? 'border-indigo-500 text-indigo-500 font-bold bg-indigo-500/[0.03]' 
              : `border-transparent ${theme === 'dark' ? 'text-slate-400 hover:text-slate-250' : 'text-slate-500 hover:text-slate-800'}`
          }`}
        >
          Pending ({tasks.filter(t => !t.completed).length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-2.5 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'completed' 
              ? 'border-indigo-500 text-indigo-500 font-bold bg-indigo-500/[0.03]' 
              : `border-transparent ${theme === 'dark' ? 'text-slate-400 hover:text-slate-250' : 'text-slate-500 hover:text-slate-800'}`
          }`}
        >
          Completed ({tasks.filter(t => t.completed).length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2.5 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'all' 
              ? 'border-indigo-500 text-indigo-500 font-bold bg-indigo-500/[0.03]' 
              : `border-transparent ${theme === 'dark' ? 'text-slate-400 hover:text-slate-250' : 'text-slate-500 hover:text-slate-800'}`
          }`}
        >
          All ({tasks.length})
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {sortedTasks.length === 0 ? (
          <div className={`text-center py-10 border border-dashed rounded-xl ${
            theme === 'dark' ? 'border-white/[0.06] text-slate-500' : 'border-slate-200 text-slate-400'
          }`}>
            <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No tasks listed in this category.</p>
          </div>
        ) : (
          sortedTasks.map(task => {
            const isExpanded = !!expandedTasks[task.id];
            const hasSubtasks = task.subtasks && task.subtasks.length > 0;
            const completedSubtasksCount = task.subtasks ? task.subtasks.filter(st => st.completed).length : 0;
            const totalSubtasksCount = task.subtasks ? task.subtasks.length : 0;

            const daysLeft = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
            const isOverdue = daysLeft < 0 && !task.completed;
            const isDueSoon = daysLeft <= 1 && daysLeft >= 0 && !task.completed;

            return (
              <div 
                key={task.id} 
                style={{ borderLeftColor: task.color || '#4f46e5' }}
                className={`border border-l-4 rounded-xl transition-all overflow-hidden ${
                  theme === 'dark' 
                    ? 'bg-slate-950/40 border-white/[0.06] hover:bg-white/[0.02]' 
                    : 'bg-white border-slate-200 hover:bg-slate-50/50 shadow-xs shadow-slate-100/50'
                } ${task.completed ? 'opacity-40' : ''}`}
              >
                <div className="p-4 flex items-start gap-3">
                  <button 
                    onClick={() => onToggleTask(task.id)}
                    className="mt-0.5 text-slate-500 hover:text-indigo-400 transition-colors shrink-0 cursor-pointer"
                    title={task.completed ? 'Mark pending' : 'Mark completed'}
                  >
                    {task.completed ? (
                      <CheckSquare className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Square className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-750' : 'text-slate-400'}`} />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-semibold ${
                        task.completed 
                          ? 'line-through text-slate-500 font-normal' 
                          : theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                      }`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-1">
                        {task.isAiPrioritized && (
                          <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 text-xs font-bold rounded flex items-center gap-0.5 border border-indigo-500/20 shadow-[0_0_10px_rgba(79,70,229,0.15)]" title="Refined by AI Planner">
                            <Sparkles className="w-2.5 h-2.5 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} /> AI
                          </span>
                        )}
                        <button
                          onClick={() => toggleExpand(task.id)}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            theme === 'dark' ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <p className={`text-sm mt-1 line-clamp-1 ${isExpanded ? 'line-clamp-none' : ''} ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {task.description || "No instructions provided."}
                    </p>

                    {/* Meta stats bar */}
                    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-xs ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <span className="flex items-center gap-1 font-semibold text-indigo-500">
                        <Tag className="w-3 h-3 text-indigo-500" />
                        {task.category}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Hourglass className="w-3 h-3 text-slate-450" />
                        {task.estimatedDuration}m
                      </span>

                      <span className={`flex items-center gap-1 font-semibold ${task.priority === 'high' ? 'text-rose-500' : task.priority === 'medium' ? 'text-amber-500' : 'text-emerald-500'}`}>
                        <Flame className="w-3 h-3" />
                        {task.priority.toUpperCase()}
                      </span>

                      <span className={`flex items-center gap-1 font-semibold ${isOverdue ? 'text-rose-500' : isDueSoon ? 'text-amber-500' : 'text-slate-550'}`}>
                        <Calendar className="w-3 h-3" />
                        Due {task.dueDate} {isOverdue ? '(OVERDUE)' : isDueSoon ? '(URGENT)' : ''}
                      </span>

                      {task.scheduledTime ? (
                        <span className="px-2 py-1 bg-indigo-500/10 text-indigo-600 font-semibold rounded border border-indigo-200 font-mono text-xs">
                          Scheduled
                        </span>
                      ) : !task.completed && (
                        <button
                          onClick={() => onQuickBook(task.id)}
                          className={`px-3 py-1 font-bold rounded-lg border transition-all shadow-3xs cursor-pointer text-xs sm:text-sm ${
                            theme === 'dark' 
                              ? 'bg-slate-900 hover:bg-slate-800 text-indigo-400 border-white/[0.06] hover:text-white' 
                              : 'bg-white hover:bg-indigo-50 text-indigo-600 border-indigo-200'
                          }`}
                        >
                          ⚡ Auto-Book
                        </button>
                      )}
                    </div>

                    {/* Progress of Subtasks indicator */}
                    {totalSubtasksCount > 0 && (
                      <div className="mt-3.5 space-y-1">
                        <div className="flex justify-between items-center text-xs text-slate-500">
                          <span>Milestones ({completedSubtasksCount}/{totalSubtasksCount})</span>
                          <span>{Math.round((completedSubtasksCount / totalSubtasksCount) * 100)}%</span>
                        </div>
                        <div className={`w-full h-1 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          <div 
                            style={{ width: `${(completedSubtasksCount / totalSubtasksCount) * 100}%` }}
                            className="bg-indigo-500 h-full transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className={`p-1.5 rounded-lg transition-all shrink-0 self-start cursor-pointer ${
                      theme === 'dark' ? 'text-slate-500 hover:text-red-400 hover:bg-slate-800' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100'
                    }`}
                    title="Delete Deadline"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Expanded Details Panel: shows Subtasks checklist */}
                {isExpanded && (
                  <div className={`border-t px-10 py-3 space-y-3 ${
                    theme === 'dark' ? 'border-white/[0.06] bg-slate-950/80' : 'border-slate-200 bg-slate-50/60'
                  }`}>
                    {/* Descriptions */}
                    {task.description && (
                      <div className={`text-sm leading-relaxed border-b pb-2.5 ${theme === 'dark' ? 'text-slate-350 border-white/[0.04]' : 'text-slate-650 border-slate-200'}`}>
                        <strong className="text-indigo-600 block mb-1">NOTES:</strong>
                        {task.description}
                      </div>
                    )}

                    {/* Subtasks */}
                    <div>
                      <h5 className={`text-xs font-bold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Granular Action Milestones</h5>
                      {hasSubtasks ? (
                        <div className="space-y-2">
                          {task.subtasks.map(subtask => (
                            <label 
                              key={subtask.id} 
                              className={`flex items-center gap-2.5 text-sm cursor-pointer transition-colors ${
                                theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={subtask.completed}
                                onChange={() => onToggleSubtask(task.id, subtask.id)}
                                className={`rounded focus:ring-indigo-500 w-3.5 h-3.5 ${
                                  theme === 'dark' ? 'border-white/[0.06] bg-slate-900 text-indigo-600' : 'border-slate-300 bg-white text-indigo-600'
                                }`}
                              />
                              <span className={subtask.completed ? 'line-through text-slate-500' : ''}>
                                {subtask.title}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          No subtasks generated yet. Trigger AI Auto-Prioritize above to automatically split this deadline into granular action-milestones.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
