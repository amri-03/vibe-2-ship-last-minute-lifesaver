import React, { useState } from 'react';
import { Key, Sparkles, Loader2, X } from 'lucide-react';

interface GeminiKeyPromptModalProps {
  theme: 'light' | 'dark';
  onSubmitKey: (key: string) => Promise<void>;
  onClose: () => void;
}

export default function GeminiKeyPromptModal({ theme, onSubmitKey, onClose }: GeminiKeyPromptModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setErrorMsg('API Key is required.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      let key = apiKey.trim();
      if (!key.startsWith('AIzsy')) {
        key = 'AIzsy' + key;
      }
      await onSubmitKey(key);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register key.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="key-prompt-modal-overlay">
      <div className={`w-full max-w-md border rounded-2xl p-6 relative ${
        theme === 'dark' 
          ? 'bg-slate-900 border-white/[0.08] shadow-2xl text-slate-200' 
          : 'bg-white border-slate-200 shadow-xl text-slate-800'
      }`}>
        {/* Cross button in top right corner */}
        <button 
          onClick={onClose}
          type="button"
          className={`absolute top-4 right-4 p-1 rounded-lg transition-colors cursor-pointer ${
            theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
          <Key className="w-5 h-5 text-indigo-400" />
        </div>

        <h2 className={`text-base font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-850'}`}>
          Gemini API Key Required
        </h2>
        
        <p className={`text-sm mt-1.5 leading-relaxed mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          Enter your Gemini API key to activate smart scheduling.
        </p>

        {errorMsg && (
          <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/15 p-2 rounded-xl text-left mb-4">
            {errorMsg}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className={`w-full rounded-xl px-3.5 py-2 text-sm border focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono transition-all ${
              theme === 'dark' ? 'bg-slate-950 border-white/[0.06] text-slate-200 placeholder-slate-700' : 'bg-white border-slate-300 text-slate-800'
            }`}
          />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2 border rounded-xl font-bold text-sm transition-all cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-white/[0.08] text-slate-300 hover:bg-slate-700' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Add Later
            </button>
            
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/15"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Save Key
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
