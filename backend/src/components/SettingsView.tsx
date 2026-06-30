import React, { useState } from 'react';
import { User, Key, LogOut, CheckCircle, ShieldAlert, Loader2, X, Trash2 } from 'lucide-react';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
  userProfile: { name: string; email: string; hasApiKey: boolean } | null;
  onUpdateProfile: (updates: { name?: string; geminiApiKey?: string }) => Promise<void>;
  onLogout: () => void;
  onClose: () => void;
  onResetAllData?: () => void;
}

export default function SettingsView({
  theme,
  setTheme,
  userProfile,
  onUpdateProfile,
  onLogout,
  onClose,
  onResetAllData
}: SettingsViewProps) {
  const [displayName, setDisplayName] = useState(userProfile?.name || '');
  const [geminiKey, setGeminiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const isChanged = displayName.trim() !== (userProfile?.name || '') || geminiKey.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isChanged) return;

    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const updates: { name?: string; geminiApiKey?: string } = {};
      if (displayName.trim() !== (userProfile?.name || '')) {
        updates.name = displayName.trim();
      }
      if (geminiKey.trim()) {
        let key = geminiKey.trim();
        if (!key.startsWith('AIzsy')) {
          key = 'AIzsy' + key;
        }
        updates.geminiApiKey = key;
      }

      await onUpdateProfile(updates);
      setSuccessMsg('Settings updated successfully!');
      setGeminiKey(''); // Clear sensitive key field after save
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="settings-modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className={`w-full max-w-md border rounded-2xl p-6 relative transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-slate-900 border-white/[0.08] shadow-2xl text-slate-200' 
          : 'bg-white border-slate-200 shadow-xl text-slate-800'
      }`} id="settings-view-container">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          type="button"
          className={`absolute top-4 right-4 p-1 rounded-lg transition-colors cursor-pointer ${
            theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
          aria-label="Close settings"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="border-b border-slate-200 dark:border-white/[0.06] pb-4 mb-5">
          <h2 className={`text-lg font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            <User className="w-4.5 h-4.5 text-indigo-400" />
            Settings
          </h2>
          <p className={`text-sm mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Manage your account profile details and AI configurations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Success/Error Banners */}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-sm">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Account Section */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">Email Address</label>
                <input
                  type="text"
                  disabled
                  value={userProfile?.email || ''}
                  className={`w-full rounded-xl px-3 py-2 text-sm border cursor-not-allowed opacity-60 ${
                    theme === 'dark' ? 'bg-slate-950 border-white/[0.06] text-slate-450' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className={`w-full rounded-xl px-3 py-2 text-sm border focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all ${
                    theme === 'dark' ? 'bg-slate-950 border-white/[0.06] text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* API Key Section */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-white/[0.04]">
            <div className="flex justify-between items-center">
              <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                Gemini API Key
              </label>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                userProfile?.hasApiKey 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {userProfile?.hasApiKey ? 'Configured' : 'Not Configured'}
              </span>
            </div>

            <input
              type="password"
              placeholder={userProfile?.hasApiKey ? '••••••••••••••••••••••••••••••••' : 'AIzaSy...'}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className={`w-full rounded-xl px-3 py-2 text-sm border focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono transition-all ${
                theme === 'dark' ? 'bg-slate-950 border-white/[0.06] text-slate-200 placeholder-slate-600' : 'bg-white border-slate-300 text-slate-800'
              }`}
            />
          </div>

          {/* Submit & Logout Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/[0.04]">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onLogout}
                className={`px-3 py-2 text-sm font-bold rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
                  theme === 'dark' 
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                    : 'bg-rose-50 border-rose-250 text-rose-600 hover:bg-rose-100'
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>

              {onResetAllData && (
                <>
                  {!isConfirmingReset ? (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingReset(true)}
                      className={`px-3 py-2 text-sm font-bold rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
                        theme === 'dark' 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20' 
                          : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                      }`}
                      title="Clear all tasks, events and start with a fresh slate"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Start Fresh
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={onResetAllData}
                        className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-all animate-fade-in"
                      >
                        Confirm Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingReset(false)}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                          theme === 'dark'
                            ? 'border-white/[0.08] text-slate-300 hover:bg-white/5'
                            : 'border-slate-250 text-slate-650 hover:bg-slate-50'
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {isChanged && (
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/15 cursor-pointer animate-fade-in"
              >
                {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                Save Configurations
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
