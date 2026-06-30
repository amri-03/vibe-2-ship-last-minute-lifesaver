import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, AlertTriangle, Play, ChevronRight, Wind, CheckCircle2, Zap } from 'lucide-react';
import { Task, CalendarEvent } from '../types';

interface CrisisShieldPanelProps {
  tasks: Task[];
  theme?: 'light' | 'dark';
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onDeployProtocol: (title: string, content: string) => void;
  onTriggerVoiceMessage: (phrase: string) => void;
}

export default function CrisisShieldPanel({
  tasks,
  theme = 'dark',
  onAddEvent,
  onDeployProtocol,
  onTriggerVoiceMessage
}: CrisisShieldPanelProps) {
  const [shieldMode, setShieldMode] = useState<'muted' | 'active' | 'red'>('active');
  const [activeCrisisCase, setActiveCrisisCase] = useState<string>('exam');
  const [isDeploying, setIsDeploying] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'hold-out'>('inhale');
  const [breathCount, setBreathCount] = useState(4);

  // Dynamic box styling based on theme
  const containerClass = theme === 'dark' 
    ? "bg-slate-900/60 backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 shadow-xl shadow-black/30" 
    : "bg-white border border-slate-200/80 rounded-2xl p-6 shadow-lg shadow-slate-100/60";

  const cardClass = theme === 'dark'
    ? "bg-slate-950/40 border border-white/[0.06]"
    : "bg-slate-50 border border-slate-150/80";

  const textPrimary = theme === 'dark' ? "text-white" : "text-slate-800";
  const textSecondary = theme === 'dark' ? "text-slate-400" : "text-slate-500";
  const textMuted = theme === 'dark' ? "text-slate-500" : "text-slate-400";

  // Calculate Threat score
  const highPriorityTasks = tasks.filter(t => t.priority === 'high' && !t.completed);
  const totalUrgentTasks = highPriorityTasks.length;
  const threatScore = Math.min(100, Math.max(10, totalUrgentTasks * 25));

  // Breathing box pacer loop
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathCount(prev => {
        if (prev <= 1) {
          setBreathPhase(current => {
            if (current === 'inhale') return 'hold';
            if (current === 'hold') return 'exhale';
            if (current === 'exhale') return 'hold-out';
            return 'inhale';
          });
          return 4; // 4 seconds per phase (box breathing)
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getBreathInstructions = () => {
    switch (breathPhase) {
      case 'inhale': return { text: "Inhale Slowly", color: "text-indigo-400" };
      case 'hold': return { text: "Hold Breath", color: "text-purple-400" };
      case 'exhale': return { text: "Exhale Fully", color: "text-emerald-400" };
      case 'hold-out': return { text: "Hold Empty", color: "text-amber-400" };
    }
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      let title = "";
      let content = "";
      let phrase = "";

      if (activeCrisisCase === 'exam') {
        title = "OS Exam Revision Crisis Sheet";
        content = `# Operating Systems Revision\n\n- **Page Fault**: Virtual page not in RAM. Triggers OS trap to fetch from swap.\n- **FIFO**: Belady's Anomaly (more frames can cause more faults).\n- **LRU**: Replaces oldest unused page. Clock approximation handles overhead.\n- **CPU Scheduling**: FCFS (Convoy effect), SJF (minimal average wait), RR (time sliced).\n- **Deadlock Conditions**: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait. Banker's Algorithm prevents them.`;
        phrase = "Deploy study sprint for Operating Systems";
      } else if (activeCrisisCase === 'pitch') {
        title = "Product Pitch Emergency Outline";
        content = `# Product Pitch Outline\n\n- **Problem**: Introduce pain point directly. Frame the cost of inaction.\n- **Solution**: Showcase mockup. Highlight "First 10 Seconds" value.\n- **Momentum**: Traction points, scale metrics, and future roadmap.`;
        phrase = "Generate notes for pitch deck";
      } else {
        title = "Outstanding Bills Emergency Timeline";
        content = `# Personal Finance Safety Sheet\n\n- **Audit**: Verify recurring billing under 15 minutes.\n- **Mitigate**: Pause active trials before transition triggers.\n- **Margin**: Log secondary accounts onto main credit line.`;
        phrase = "Organize high-risk financial obligations";
      }

      onDeployProtocol(title, content);

      // Book 2 urgent focus events into Calendar today
      const today = new Date().toISOString().split('T')[0];
      
      onAddEvent({
        title: `🔥 CRISIS SPRINT: ${title}`,
        start: `${today}T16:00:00`,
        end: `${today}T17:15:00`,
        color: '#f43f5e'
      });

      onAddEvent({
        title: `🧘 Crisis Recovery Pacing`,
        start: `${today}T17:15:00`,
        end: `${today}T17:30:00`,
        color: '#10b981'
      });

      onTriggerVoiceMessage(phrase);
      setIsDeploying(false);
    }, 1200);
  };

  return (
    <div className={containerClass} id="crisis-shield-panel">
      {/* Panel Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Shield className={`w-4 h-4 ${shieldMode === 'red' ? 'text-rose-400 animate-pulse' : 'text-indigo-400'}`} />
            <span className={textPrimary}>Crisis Mitigation Shield</span>
          </h2>
          <p className="text-[10px] mt-0.5 text-slate-400">
            Deploy survival protocol sprints.
          </p>
        </div>
      </div>

      {/* Dynamic Adrenaline/Threat score visualization */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] font-mono font-bold mb-1">
          <span className={textSecondary}>DEADLINE CRISIS LEVEL</span>
          <span className={threatScore >= 75 ? "text-rose-400 animate-pulse" : "text-indigo-400"}>
            {threatScore}% PRESSURE
          </span>
        </div>
        <div className={`w-full h-1.5 rounded-full overflow-hidden p-[1px] ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-200'}`}>
          <div 
            className={`h-full rounded-full transition-all duration-700 ${
              threatScore >= 75 
                ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' 
                : threatScore >= 50 
                ? 'bg-amber-400' 
                : 'bg-indigo-500'
            }`}
            style={{ width: `${threatScore}%` }}
          />
        </div>
      </div>

      {/* Mode selectors */}
      <div className="grid grid-cols-3 gap-2 mb-4" id="shield-mode-selectors">
        {[
          { id: 'muted', label: 'MUTED CALM', color: 'hover:text-slate-200 text-slate-400 border-white/[0.04]' },
          { id: 'active', label: 'ACTIVE PROTECTION', color: 'hover:text-indigo-200 text-indigo-400 border-indigo-500/20' },
          { id: 'red', label: 'CODE RED SPRINT', color: 'hover:text-rose-200 text-rose-400 border-rose-500/20' }
        ].map(mode => (
          <button
            key={mode.id}
            onClick={() => setShieldMode(mode.id as any)}
            className={`py-2 px-1 text-[9px] sm:text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
              shieldMode === mode.id
                ? mode.id === 'red'
                  ? 'bg-rose-500/15 border-rose-500 text-rose-300 font-extrabold shadow-[0_0_10px_rgba(239,68,68,0.25)]'
                  : mode.id === 'active'
                  ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 font-extrabold shadow-[0_0_10px_rgba(99,102,241,0.25)]'
                  : 'bg-slate-500/10 border-slate-400 text-slate-300'
                : `${theme === 'dark' ? 'bg-slate-950/20 border-white/[0.06]' : 'bg-slate-100 border-slate-200'} ${mode.color}`
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Emergency Scenario Selector */}
      <div className={`${cardClass} p-4 rounded-xl mb-4 space-y-3`}>
        <div>
          <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
            Emergency Scenario
          </label>
          <select
            value={activeCrisisCase}
            onChange={(e) => setActiveCrisisCase(e.target.value)}
            className={`w-full mt-1.5 px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold ${
              theme === 'dark' 
                ? 'bg-slate-900 border-white/[0.06] text-slate-200' 
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <option value="exam">📚 Midterm Exam due Tomorrow (OS)</option>
            <option value="pitch">💼 High-Stakes Client Product Pitch Deck</option>
            <option value="bills">🏠 Subscription Overhead / Financial Audit</option>
          </select>
        </div>

        <button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-lg tracking-wider border border-rose-500/30 shadow-[0_0_12px_rgba(239,68,68,0.3)] hover:shadow-[0_0_18px_rgba(239,68,68,0.5)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase"
          id="deploy-protocol-btn"
        >
          {isDeploying ? (
            <>
              <Zap className="w-4 h-4 animate-spin" />
              DEPLOYING SYSTEMS...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current animate-bounce" />
              Deploy Survival Protocol
            </>
          )}
        </button>
      </div>

      {/* Breathing Box Pacer (Visual/Interactive Rescue Loop) */}
      <div className={`${cardClass} p-3.5 rounded-xl flex items-center justify-between gap-3`}>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <Wind className="w-3 h-3 text-emerald-400 animate-pulse" />
            Vagus Nerve Rescue loop
          </span>
          <h4 className="text-xs font-bold text-slate-200 mt-1 flex items-center gap-1.5">
            <span className={getBreathInstructions().color}>
              {getBreathInstructions().text}
            </span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Calm adrenaline spikes to maintain focus.
          </p>
        </div>

        {/* Pulsing expander representing inhale/exhale cycles */}
        <div className="flex items-center justify-center shrink-0">
          <div className={`relative w-11 h-11 rounded-full bg-slate-950 flex items-center justify-center border border-white/[0.04]`}>
            {/* Pulsating ring */}
            <div 
              className={`absolute rounded-full border transition-all duration-1000 ${
                breathPhase === 'inhale' 
                  ? 'w-10 h-10 border-indigo-500/40 bg-indigo-500/10' 
                  : breathPhase === 'hold' 
                  ? 'w-10 h-10 border-purple-500/40 bg-purple-500/10 animate-pulse'
                  : breathPhase === 'exhale'
                  ? 'w-6 h-6 border-emerald-500/40 bg-emerald-500/5'
                  : 'w-6 h-6 border-amber-500/40 bg-amber-500/5'
              }`} 
            />
            <span className="text-xs font-mono font-bold text-slate-300 relative z-10">
              {breathCount}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
