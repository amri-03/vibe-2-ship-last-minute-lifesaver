import React, { useState } from 'react';
import { 
  auth, 
  googleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from '../lib/firebase';
import { updateProfile } from 'firebase/auth';
import { Bot, LogIn, UserPlus, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import Logo from './Logo';

interface LoginViewProps {
  theme: 'light' | 'dark';
  onAuthSuccess: () => void;
  onGuestLogin?: (customUser?: { displayName: string; email: string }) => void;
}

export default function LoginView({ theme, onAuthSuccess, onGuestLogin }: LoginViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [localInfoMsg, setLocalInfoMsg] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setLocalInfoMsg('');

    const emailClean = email.trim().toLowerCase();

    if (isSignUp) {
      if (!emailClean || !password || !name) {
        setErrorMsg('All fields are required.');
        setIsLoading(false);
        return;
      }
    } else {
      if (!emailClean || !password) {
        setErrorMsg('Email and password are required.');
        setIsLoading(false);
        return;
      }
    }

    // Retrieve registered users from localStorage
    let registeredUsers: any[] = [];
    try {
      const savedUsers = localStorage.getItem('saver_registered_users');
      if (savedUsers) {
        registeredUsers = JSON.parse(savedUsers);
      }
    } catch (err) {
      console.error("Failed to load registered users:", err);
    }

    // Simulate database lookup latency for realistic feel (800ms)
    setTimeout(() => {
      if (isSignUp) {
        // Check if account already exists
        const userExists = registeredUsers.some(u => u.email === emailClean);
        if (userExists) {
          setErrorMsg('Account already exists!');
          setIsLoading(false);
          return;
        }

        // Register new user
        const newUser = {
          name: name.trim(),
          email: emailClean,
          password: password
        };
        registeredUsers.push(newUser);
        localStorage.setItem('saver_registered_users', JSON.stringify(registeredUsers));

        setLocalInfoMsg('🎉 Account registered successfully!');
        
        setTimeout(() => {
          if (onGuestLogin) {
            onGuestLogin({
              displayName: newUser.name,
              email: newUser.email,
              isGoogle: newUser.email.endsWith('@gmail.com') || newUser.email.endsWith('@google.com')
            } as any);
          } else {
            onAuthSuccess();
          }
          setIsLoading(false);
        }, 800);
      } else {
        // Sign In
        const user = registeredUsers.find(u => u.email === emailClean);
        if (!user || user.password !== password) {
          setErrorMsg('Invalid email or password.');
          setIsLoading(false);
          return;
        }

        setLocalInfoMsg('⚡ Signed in successfully!');
        
        setTimeout(() => {
          if (onGuestLogin) {
            onGuestLogin({
              displayName: user.name,
              email: user.email,
              isGoogle: user.email.endsWith('@gmail.com') || user.email.endsWith('@google.com')
            } as any);
          } else {
            onAuthSuccess();
          }
          setIsLoading(false);
        }, 800);
      }
    }, 800);
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setLocalInfoMsg('');

    // Simulate Google Sign-In redirect/popup loading (1.2s)
    setLocalInfoMsg('ℹ️ Simulating Google Sign-In...');
    
    setTimeout(() => {
      setLocalInfoMsg('⚡ Google Sign-In successful (Local Demo Mode)!');
      
      setTimeout(() => {
        if (onGuestLogin) {
          onGuestLogin({
            displayName: 'Google Space Cadet',
            email: 'google-cadet@lifesaver.app',
            isGoogle: true
          } as any);
        } else {
          onAuthSuccess();
        }
        setIsLoading(false);
      }, 800);
    }, 1200);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-[#030712] text-slate-200' 
        : 'bg-slate-50 text-slate-800'
    }`} id="auth-portal-wrapper">
      
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className={`w-full max-w-md backdrop-blur-md border rounded-2xl p-8 relative z-10 transition-all ${
        theme === 'dark' 
          ? 'bg-slate-900/40 border-white/[0.06] shadow-2xl shadow-black/40' 
          : 'bg-white border-slate-200 shadow-xl shadow-slate-100/50'
      }`}>
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 border border-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-650/20 mb-3 shrink-0 p-2">
            <Logo className="w-full h-full text-white" />
          </div>
          <h1 className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-850'}`}>
            Life Saver
          </h1>
          <p className={`text-sm mt-1 max-w-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Intelligent scheduling and study guides.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 dark:border-white/[0.06] mb-6">
          <button
            onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
            className={`flex-1 pb-2.5 text-sm font-bold transition-all border-b-2 cursor-pointer ${
              !isSignUp 
                ? 'border-indigo-500 text-indigo-400 font-extrabold' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
            className={`flex-1 pb-2.5 text-sm font-bold transition-all border-b-2 cursor-pointer ${
              isSignUp 
                ? 'border-indigo-500 text-indigo-400 font-extrabold' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-sm mb-5">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Local Offline Info Message */}
        {localInfoMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-400 text-sm mb-5">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-400 animate-pulse" />
            <span>{localInfoMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className={`w-full rounded-xl px-3.5 py-2 text-sm border focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all ${
                  theme === 'dark' ? 'bg-slate-950 border-white/[0.06] text-slate-200' : 'bg-white border-slate-350 text-slate-800'
                }`}
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className={`w-full rounded-xl px-3.5 py-2 text-sm border focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all ${
                theme === 'dark' ? 'bg-slate-950 border-white/[0.06] text-slate-200' : 'bg-white border-slate-355 text-slate-800'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full rounded-xl px-3.5 py-2 text-sm border focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all ${
                theme === 'dark' ? 'bg-slate-950 border-white/[0.06] text-slate-200' : 'bg-white border-slate-355 text-slate-800'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-650/15 cursor-pointer mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                Complete Sign Up
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Secure Sign In
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-slate-200 dark:border-white/[0.06]" />
          <span className="text-xs text-slate-500 font-bold uppercase px-3">or continue with</span>
          <div className="flex-1 border-t border-slate-200 dark:border-white/[0.06]" />
        </div>

        {/* Google Authentication Button */}
        <button
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className={`w-full py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold cursor-pointer transition-all ${
            theme === 'dark' 
              ? 'bg-slate-950 border-white/[0.06] hover:bg-slate-900 text-slate-200' 
              : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <svg className="w-4 h-4 mr-1 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#ea4335"
              d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.94 1 12 1 7.35 1 3.4 3.65 1.52 7.5l3.84 2.98c.9-2.7 3.41-4.44 6.64-4.44z"
            />
            <path
              fill="#4285f4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.75-4.87 3.75-8.48z"
            />
            <path
              fill="#fbbc05"
              d="M5.36 14.52A7.12 7.12 0 014.9 12c0-.88.15-1.73.43-2.52L1.52 6.5A11.94 11.94 0 000 12c0 2.05.52 4 1.52 5.5l3.84-2.98z"
            />
            <path
              fill="#34a853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-4.3 1.09-3.23 0-5.74-1.74-6.64-4.44L1.52 16.8C3.4 20.35 7.35 23 12 23z"
            />
          </svg>
          Sign In with Google
        </button>

        {/* Guest Bypass Mode Button */}
        {onGuestLogin && (
          <button
            onClick={onGuestLogin}
            className={`w-full mt-3 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold cursor-pointer transition-all ${
              theme === 'dark' 
                ? 'bg-gradient-to-r from-indigo-950 to-slate-900 border-indigo-500/30 hover:border-indigo-500 text-indigo-350 hover:text-indigo-200 shadow-md shadow-indigo-950/10' 
                : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700 shadow-sm'
            }`}
          >
            <Sparkles className="w-4 h-4 animate-pulse text-indigo-400" />
            Continue as Guest (Demo Dashboard)
          </button>
        )}

      </div>
    </div>
  );
}
