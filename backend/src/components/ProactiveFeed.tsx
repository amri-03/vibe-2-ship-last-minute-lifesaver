import React, { useState } from 'react';
import { 
  BellRing, Sparkles, AlertCircle, PlayCircle, FileText, CheckCircle2, 
  RefreshCcw, ArrowRight, X, Copy, Check, Download, Info
} from 'lucide-react';
import { AiNudge, DraftAsset, Task } from '../types';

interface ProactiveFeedProps {
  nudges: AiNudge[];
  drafts: DraftAsset[];
  tasks: Task[];
  onRefreshNudges: () => void;
  isNudgesLoading: boolean;
  onExecuteNudgeAction: (actionType: string, payload: any) => Promise<void>;
  isActionLoading: boolean;
  onDeleteDraft: (id: string) => void;
  theme?: 'light' | 'dark';
}

export default function ProactiveFeed({
  nudges,
  drafts,
  tasks,
  onRefreshNudges,
  isNudgesLoading,
  onExecuteNudgeAction,
  isActionLoading,
  onDeleteDraft,
  theme = 'dark'
}: ProactiveFeedProps) {
  const [selectedDraft, setSelectedDraft] = useState<DraftAsset | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = (draft: DraftAsset) => {
    const element = document.createElement("a");
    const file = new Blob([draft.content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${draft.title.toLowerCase().replace(/\s+/g, '_')}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Simple Markdown to HTML parser to avoid React 19 dependency clashes
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-bold text-indigo-400 mt-4 mb-2">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-base font-bold text-indigo-400 mt-5 mb-2">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className={`text-lg font-bold mt-6 mb-3 border-b pb-1.5 ${theme === 'dark' ? 'text-slate-100 border-white/[0.06]' : 'text-slate-800 border-slate-200'}`}>{line.replace('# ', '')}</h2>;
      }
      // Lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} className={`text-sm ml-4 list-disc my-1.5 leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            {parseInlineMarkdown(line.trim().substring(2))}
          </li>
        );
      }
      // Numbers
      if (/^\d+\.\s/.test(line.trim())) {
        const textPart = line.trim().replace(/^\d+\.\s/, '');
        return (
          <li key={idx} className={`text-sm ml-4 list-decimal my-1.5 leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            {parseInlineMarkdown(textPart)}
          </li>
        );
      }
      // Code Blocks
      if (line.trim().startsWith('```')) {
        return null; // Skip code fence render, we wrap code content
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-2.5" />;
      }
      // Standard paragraph
      return (
        <p key={idx} className={`text-sm my-2 leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          {parseInlineMarkdown(line)}
        </p>
      );
    });
  };

  const parseInlineMarkdown = (text: string) => {
    // Basic bold processing **text** -> strong
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} className={`font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-850'}`}>{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className={`backdrop-blur-md border rounded-2xl p-6 transition-all duration-300 relative ${
      theme === 'dark' 
        ? 'bg-slate-900/60 border-white/[0.06] shadow-xl shadow-black/30' 
        : 'bg-white border-slate-200 shadow-md shadow-slate-100/50'
    }`} id="proactive-feed-container">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            <BellRing className="w-5 h-5 text-rose-400 animate-pulse" />
            AI Proactive Nudges & Assets
          </h2>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-555'}`}>
            Alerts analyzing deadlines and quick draft templates.
          </p>
        </div>

        <button
          onClick={onRefreshNudges}
          disabled={isNudgesLoading}
          className={`p-1.5 rounded-lg border transition-all disabled:opacity-50 cursor-pointer ${
            theme === 'dark' 
              ? 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border-white/[0.06]' 
              : 'bg-slate-50 hover:bg-slate-150 text-slate-550 hover:text-slate-900 border-slate-200'
          }`}
          title="Analyze Deadlines"
        >
          <RefreshCcw className={`w-4 h-4 ${isNudgesLoading ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Proactive Alerts */}
        <div className="space-y-4">
          <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Actionable Recommendations
          </h3>

          {nudges.length === 0 ? (
            <div className={`text-center py-12 border border-dashed rounded-xl ${
              theme === 'dark' ? 'border-white/[0.06] bg-slate-950/20 text-slate-500' : 'border-slate-200 bg-slate-50/50 text-slate-400'
            }`}>
              <BellRing className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
              <p className="text-sm">No notifications. Click the refresh icon above to let the AI scan your task deadlines.</p>
            </div>
          ) : (
            nudges.map(nudge => {
              const task = tasks.find(t => t.id === nudge.taskId);
              
              return (
                <div 
                  key={nudge.id}
                  className={`border rounded-xl p-4 transition-all relative ${
                    nudge.type === 'alert' 
                      ? (theme === 'dark' 
                          ? 'bg-rose-950/20 border-rose-500/20 shadow-[0_0_15px_rgba(239,68,68,0.03)]' 
                          : 'bg-rose-50/70 border-rose-200 shadow-xs') 
                      : nudge.type === 'draft'
                      ? (theme === 'dark' 
                          ? 'bg-indigo-950/20 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.03)]'
                          : 'bg-indigo-50/70 border-indigo-200 shadow-xs')
                      : (theme === 'dark' 
                          ? 'bg-slate-950/40 border-white/[0.06] shadow-md' 
                          : 'bg-white border-slate-200 shadow-xs')
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {nudge.type === 'alert' ? (
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                      ) : (
                        <PlayCircle className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-bold flex items-center gap-1.5 ${
                        theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                      }`}>
                        {nudge.title}
                      </h4>
                      <p className={`text-xs mt-1 leading-relaxed ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                        {nudge.message}
                      </p>

                      {/* Quick action executor */}
                      {nudge.actionLabel && (
                        <button
                          onClick={() => onExecuteNudgeAction(nudge.actionPayload.actionType, nudge.actionPayload)}
                          disabled={isActionLoading}
                          className={`mt-3 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1 transition-all border cursor-pointer ${
                            nudge.type === 'alert'
                              ? 'bg-rose-600 hover:bg-rose-500 border-rose-500/30 text-white shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                              : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500/30 text-white shadow-[0_0_12px_rgba(79,70,229,0.2)]'
                          }`}
                        >
                          {isActionLoading ? (
                            <>
                              <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Executing...
                            </>
                          ) : (
                            <>
                              {nudge.actionLabel}
                              <ArrowRight className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Generated Documents / Assets */}
        <div className="space-y-4">
          <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            AI Generated Assets ({drafts.length})
          </h3>

          {drafts.length === 0 ? (
            <div className={`text-center py-12 border border-dashed rounded-xl ${
              theme === 'dark' ? 'border-white/[0.06] bg-slate-950/20 text-slate-500' : 'border-slate-200 bg-slate-50/50 text-slate-455'
            }`}>
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
              <p className="text-sm font-semibold">No assets generated yet.</p>
              <p className="text-xs mt-1">Click "Generate Draft" on outline/cheat-sheet recommendations or talk with the agent in the chat to auto-generate materials.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {drafts.map(draft => (
                <div 
                  key={draft.id}
                  className={`border rounded-xl p-3.5 flex items-center justify-between gap-4 transition-all cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-slate-950/40 border-white/[0.06] hover:bg-white/[0.02]' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50 shadow-3xs shadow-slate-100/50'
                  }`}
                  onClick={() => setSelectedDraft(draft)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg border border-indigo-200">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-sm font-semibold truncate ${
                        theme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                      }`}>{draft.title}</h4>
                      <p className="text-xs text-slate-450 truncate mt-0.5 font-medium">Asset for: {draft.taskTitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleCopy(draft.content)}
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        theme === 'dark' ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-150'
                      }`}
                      title="Copy Content"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteDraft(draft.id)}
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        theme === 'dark' ? 'text-slate-500 hover:text-red-400 hover:bg-slate-800' : 'text-slate-400 hover:text-red-500 hover:bg-slate-150'
                      }`}
                      title="Delete Asset"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Draft Document Modal Viewer */}
      {selectedDraft && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden ${
            theme === 'dark' ? 'bg-slate-900 border-white/[0.06] shadow-black/80' : 'bg-white border-slate-250 shadow-slate-200/50'
          }`}>
            
            {/* Modal Header */}
            <div className={`p-5 border-b flex justify-between items-center ${
              theme === 'dark' ? 'border-white/[0.06] bg-slate-950/60' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="min-w-0">
                <span className="text-xs font-bold text-indigo-500 bg-indigo-500/10 border border-indigo-300 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                  Autonomous Asset Draft
                </span>
                <h3 className={`text-base font-bold mt-1.5 truncate ${theme === 'dark' ? 'text-white' : 'text-slate-850'}`}>{selectedDraft.title}</h3>
                <p className="text-xs text-slate-450 truncate mt-0.5 font-medium">Linked to task: {selectedDraft.taskTitle}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(selectedDraft.content)}
                  className={`px-3 py-1.5 border text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-md cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-slate-950 hover:bg-slate-850 border-white/[0.06] text-slate-300 hover:text-white' 
                      : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      Copy Markdown
                    </>
                  )}
                </button>
                <button
                  onClick={() => downloadTxt(selectedDraft)}
                  className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white border-white/[0.06]' 
                      : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300'
                  }`}
                  title="Download .md File"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedDraft(null)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    theme === 'dark' ? 'hover:bg-slate-800 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable Markdown view */}
            <div className={`p-6 overflow-y-auto flex-1 ${
              theme === 'dark' ? 'bg-slate-950/40' : 'bg-slate-50/50'
            }`}>
              <div className={`max-w-none ${theme === 'dark' ? 'prose prose-invert text-slate-300' : 'prose text-slate-700'}`}>
                {renderMarkdown(selectedDraft.content)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex items-center gap-2 text-xs text-slate-450 ${
              theme === 'dark' ? 'border-white/[0.06] bg-slate-950/60' : 'border-slate-200 bg-slate-50'
            }`}>
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Generated by the AI companion. Review before use.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
