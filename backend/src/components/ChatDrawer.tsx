import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, User, Sparkles, Send, X, Volume2, ArrowRight, Calendar, CheckSquare, FileText
} from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatDrawerProps {
  chatHistory: ChatMessage[];
  onSendMessage: (text: string, isVoice?: boolean) => Promise<void>;
  isChatLoading: boolean;
  agentStatus: 'standby' | 'thinking' | 'executing';
  onExecuteAction: (action: string, payload: any) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  aiEngine?: 'gemini' | 'local_heuristic';
}

export default function ChatDrawer({
  chatHistory,
  onSendMessage,
  isChatLoading,
  agentStatus,
  onExecuteAction,
  isOpen,
  onClose,
  theme = 'dark',
  aiEngine = 'gemini'
}: ChatDrawerProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [chatHistory, agentStatus, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isChatLoading) return;
    
    // Typing text directly uses standard chat mode
    onSendMessage(inputText.trim(), false);
    setInputText('');
  };

  return (
    <div className={`fixed top-16 right-0 bottom-0 h-[calc(100vh-64px)] w-full sm:w-[420px] backdrop-blur-md border-l shadow-2xl flex flex-col z-40 transition-all duration-300 shrink-0 ${
      isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
    } ${
      theme === 'dark' 
        ? 'bg-[#0a0f1d]/95 border-white/[0.06]' 
        : 'bg-white/95 border-slate-200'
    }`} id="ai-companion-drawer">
      {/* Header */}
      <div className={`p-5 border-b flex justify-between items-center ${
        theme === 'dark' ? 'border-white/[0.06] bg-slate-950/60' : 'border-slate-200 bg-slate-50'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${
              theme === 'dark' ? 'border-slate-900' : 'border-white'
            } ${
              agentStatus === 'thinking' 
                ? 'bg-yellow-500 animate-pulse' 
                : agentStatus === 'executing'
                ? 'bg-emerald-500 animate-bounce'
                : 'bg-indigo-500'
            }`} />
          </div>
          <div>
            <h3 className={`text-sm font-black flex items-center gap-1.5 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              Companion Core
              <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-extrabold rounded border border-indigo-500/20 font-mono">
                ONLINE
              </span>
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-xs uppercase tracking-wider font-extrabold font-mono ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {agentStatus}
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 font-mono ${
                aiEngine === 'gemini'
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                <Sparkles className="w-2.5 h-2.5 shrink-0" />
                {aiEngine === 'gemini' 
                  ? 'Gemini 3.5 Flash (Text)' 
                  : 'Heuristics'}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            theme === 'dark' ? 'hover:bg-slate-800 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Conversation Thread */}
      <div className={`flex-1 overflow-y-auto p-5 space-y-4 ${
        theme === 'dark' ? 'bg-slate-950/10' : 'bg-slate-50/50'
      }`}>
        {chatHistory.length === 0 ? (
          <div className="text-center py-16 text-slate-400 max-w-xs mx-auto">
            <Bot className="w-10 h-10 mx-auto mb-3 opacity-30 text-indigo-500" />
            <h4 className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Life Saver Agent</h4>
            <p className={`text-xs mt-1.5 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-550'}`}>
              I am your proactive productivity partner. Let me know if you need to schedule blocks, draft study aids, or generate checklists. Ask me questions, or let me help you plan your tasks and schedule!
            </p>
          </div>
        ) : (
          chatHistory.map(message => {
            const isAi = message.sender === 'ai';
            return (
              <div 
                key={message.id}
                className={`flex gap-3 max-w-[85%] ${isAi ? 'self-start mr-auto' : 'self-end ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`p-1.5 h-8 w-8 rounded-lg shrink-0 flex items-center justify-center border ${
                  isAi 
                    ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400' 
                    : theme === 'dark' 
                      ? 'bg-slate-850 border-white/[0.04] text-slate-300' 
                      : 'bg-slate-100 border-slate-200 text-slate-650'
                }`}>
                  {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className="space-y-2 max-w-full">
                  <div className={`p-3 rounded-xl text-sm leading-relaxed break-words border ${
                    isAi 
                      ? theme === 'dark' 
                        ? 'bg-slate-900 border-white/[0.05] text-slate-200 shadow-md shadow-black/10' 
                        : 'bg-white border-slate-200 text-slate-750 shadow-xs'
                      : 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/10 border-indigo-500/30'
                  }`}>
                    {message.text}
                  </div>

                  {/* Dynamic Action Proposals */}
                  {isAi && message.suggestedActions && message.suggestedActions.length > 0 && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider block">Proposed Action:</span>
                      {message.suggestedActions.map((actionOpt, actIdx) => (
                        <button
                          key={actIdx}
                          onClick={() => onExecuteAction(actionOpt.action, actionOpt.payload)}
                          className={`w-full text-left py-1.5 px-2.5 rounded-lg border text-xs font-extrabold transition-all flex items-center justify-between group cursor-pointer ${
                            theme === 'dark'
                              ? 'bg-slate-900 hover:bg-indigo-950/20 border-white/[0.05] hover:border-indigo-500/30 text-indigo-400'
                              : 'bg-white hover:bg-indigo-50 border-slate-200 text-indigo-600'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            {actionOpt.action === 'autoSchedule' && <Calendar className="w-3.5 h-3.5 shrink-0" />}
                            {actionOpt.action === 'createSubtasks' && <CheckSquare className="w-3.5 h-3.5 shrink-0" />}
                            {actionOpt.action === 'generateDraft' && <FileText className="w-3.5 h-3.5 shrink-0" />}
                            <span className="truncate">{actionOpt.label}</span>
                          </span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing thinking state representation */}
        {agentStatus === 'thinking' && (
          <div className="flex gap-3 max-w-[85%] animate-pulse">
            <div className="p-1.5 h-8 w-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className={`p-3.5 border rounded-xl flex items-center gap-1.5 shadow-md ${
              theme === 'dark' ? 'bg-slate-900 border-white/[0.04]' : 'bg-white border-slate-200'
            }`}>
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className={`p-4 border-t flex items-center gap-2 ${
        theme === 'dark' ? 'border-white/[0.06] bg-slate-950/60' : 'border-slate-200 bg-slate-50'
      }`}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isChatLoading}
          placeholder="Ask recommendations or instruct companion..."
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-all ${
            theme === 'dark' 
              ? 'bg-slate-900 border-white/[0.06] text-slate-200' 
              : 'bg-white border-slate-300 text-slate-850'
          }`}
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isChatLoading}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:text-slate-400 text-white rounded-xl transition-all shadow-md border border-indigo-500/30 shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
