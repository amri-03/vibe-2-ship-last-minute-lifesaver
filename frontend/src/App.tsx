import React, { useState, useEffect } from 'react';
import { 
  Bot, Sparkles, CheckSquare, Calendar, Target, FileText, 
  RefreshCcw, AlertTriangle, PlayCircle, MessageSquare, Clock, Info, HelpCircle,
  Sun, Moon, Shield, X, Menu, LayoutGrid, ChevronLeft, ChevronRight, User, Settings, LogOut, Loader2, Key
} from 'lucide-react';
import { Task, Habit, CalendarEvent, AiNudge, DraftAsset, ChatMessage } from './types';
import CalendarView from './components/CalendarView';
import TaskPanel from './components/TaskPanel';
import CrisisShieldPanel from './components/CrisisShieldPanel';
import ProactiveFeed from './components/ProactiveFeed';
import ChatDrawer from './components/ChatDrawer';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import GeminiKeyPromptModal from './components/GeminiKeyPromptModal';
import Logo from './components/Logo';
import { auth, onAuthStateChanged, signOut, googleAuthProvider, signInWithPopup } from './lib/firebase';
import { GoogleAuthProvider } from 'firebase/auth';

// Initial Seed Data to make the Cockpit look beautiful and complete immediately
const INITIAL_TASKS: Task[] = [
  {
    id: 't-1',
    title: 'CS 301 Midterm Revision',
    description: 'Prepare revision deck, formulas, and cheatsheets on Operating Systems.',
    dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0], // Tomorrow
    estimatedDuration: 120,
    priority: 'high',
    energyRequired: 'high',
    completed: false,
    category: 'Study',
    subtasks: [
      { id: 'st-1-1', title: 'Review virtual memory page replacements', completed: false },
      { id: 'st-1-2', title: 'Write down CPU scheduling algorithms cheat sheet', completed: false },
      { id: 'st-1-3', title: 'Run practice midterm questions', completed: false }
    ],
    color: '#ef4444'
  },
  {
    id: 't-2',
    title: 'Assemble Product Pitch Deck',
    description: 'Structure slides, outline user personas, and summarize the value statement.',
    dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0], // 3 days out
    estimatedDuration: 180,
    priority: 'high',
    energyRequired: 'high',
    completed: false,
    category: 'Work',
    subtasks: [
      { id: 'st-2-1', title: 'Outline core problem & AI solution slide', completed: false },
      { id: 'st-2-2', title: 'Draft marketing roadmap', completed: false }
    ],
    color: '#3b82f6'
  },
  {
    id: 't-3',
    title: 'Review Personal Budget',
    description: 'Verify subscription overheads and log outstanding bills.',
    dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    estimatedDuration: 45,
    priority: 'medium',
    energyRequired: 'low',
    completed: false,
    category: 'Administrative',
    subtasks: [],
    color: '#f59e0b'
  }
];

const INITIAL_HABITS: Habit[] = [
  {
    id: 'h-1',
    name: 'Morning Focus Meditation',
    frequency: 'daily',
    streak: 4,
    completedToday: false,
    history: []
  },
  {
    id: 'h-2',
    name: 'Review Technical Papers',
    frequency: 'daily',
    streak: 2,
    completedToday: true,
    history: [new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0]]
  }
];

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'e-1',
    title: '⚡ Routine: Morning Focus Meditation',
    start: `${new Date().toISOString().split('T')[0]}T08:00:00`,
    end: `${new Date().toISOString().split('T')[0]}T08:30:00`,
    color: '#10b981'
  }
];

export default function App() {
  // Auth & Profile state
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('saver_guest_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; hasApiKey: boolean } | null>(() => {
    try {
      const saved = localStorage.getItem('saver_guest_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasKey = !!localStorage.getItem('saver_guest_gemini_key');
        return { name: parsed.displayName, email: parsed.email, hasApiKey: hasKey };
      }
    } catch {}
    return null;
  });

  // Active view routing: 'dashboard' | 'calendar'
  const [activeView, setActiveView] = useState<'dashboard' | 'calendar'>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [hasAcknowledgedAlert, setHasAcknowledgedAlert] = useState<boolean>(() => {
    return localStorage.getItem('saver_offline_alert_acknowledged') === 'true';
  });

  // Core state loaded from DB/localStorage
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('saver_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('saver_habits');
    return saved ? JSON.parse(saved) : [];
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('saver_events');
    return saved ? JSON.parse(saved) : [];
  });

  const [drafts, setDrafts] = useState<DraftAsset[]>(() => {
    const saved = localStorage.getItem('saver_drafts');
    return saved ? JSON.parse(saved) : [];
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('saver_chat');
    return saved ? JSON.parse(saved) : [];
  });

  const [nudges, setNudges] = useState<AiNudge[]>(() => {
    const saved = localStorage.getItem('saver_nudges');
    return saved ? JSON.parse(saved) : [];
  });

  // UI state
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isNudgesLoading, setIsNudgesLoading] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [agentStatus, setAgentStatus] = useState<'standby' | 'thinking' | 'executing'>('standby');
  const [aiEngine, setAiEngine] = useState<'gemini' | 'local_heuristic'>('gemini');

  // Google Calendar Integration State
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const isGoogleUser = !!(
    currentUser && (
      (currentUser as any).isGoogle ||
      (currentUser as any).providerData?.some((p: any) => p.providerId === 'google.com') ||
      !!googleAccessToken
    )
  );
  const [isSyncingCalendar, setIsSyncingCalendar] = useState<boolean>(false);
  const [calendarSyncError, setCalendarSyncError] = useState<string | null>(null);
  const [showKeyPrompt, setShowKeyPrompt] = useState<boolean>(false);
  const [dismissedKeyAlert, setDismissedKeyAlert] = useState<boolean>(() => {
    return sessionStorage.getItem('saver_dismissed_key_alert') === 'true';
  });

  const handleSyncGoogleCalendar = async () => {
    setIsSyncingCalendar(true);
    setCalendarSyncError(null);
    let token = googleAccessToken;

    try {
      if (!token) {
        // Trigger login popup to retrieve Google Calendar access token
        const result = await signInWithPopup(auth, googleAuthProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        token = credential?.accessToken || null;
        if (token) {
          setGoogleAccessToken(token);
        } else {
          throw new Error("Could not retrieve Google Calendar access token from sign-in.");
        }
      }

      // Fetch events (last 7 days through next 30 days)
      const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setGoogleAccessToken(null);
          throw new Error("Google access token expired. Please click Connect again to re-authenticate.");
        }
        throw new Error(`Failed to fetch calendar events from Google: ${response.statusText}`);
      }

      const data = await response.json();
      const items = data.items || [];
      
      const fetchedEvents: CalendarEvent[] = items.map((item: any) => {
        const startStr = item.start?.dateTime || item.start?.date || new Date().toISOString();
        const endStr = item.end?.dateTime || item.end?.date || new Date().toISOString();
        
        return {
          id: `gcal-${item.id}`,
          title: `📅 ${item.summary || 'Google Calendar Event'}`,
          start: startStr,
          end: endStr,
          color: '#3b82f6',
          isGoogleEvent: true
        };
      });

      const nonGoogleEvents = calendarEvents.filter(e => !e.id.startsWith('gcal-'));
      const mergedEvents = [...nonGoogleEvents, ...fetchedEvents];
      
      setCalendarEvents(mergedEvents);
      localStorage.setItem('saver_events', JSON.stringify(mergedEvents));

      // Scan for tight deadlines in Google Calendar
      const deadlineKeywords = ['due', 'deadline', 'midterm', 'exam', 'test', 'assignment', 'submission', 'project', 'quiz', 'presentation'];
      const foundDeadlines = fetchedEvents.filter(e => {
        const lowerTitle = e.title.toLowerCase();
        return deadlineKeywords.some(keyword => lowerTitle.includes(keyword));
      });

      if (foundDeadlines.length > 0) {
        const newNudges = [...nudges];
        foundDeadlines.forEach((dl) => {
          const alreadyNudged = nudges.some(n => n.id === `n-gcal-dl-${dl.id}`);
          if (!alreadyNudged) {
            newNudges.unshift({
              id: `n-gcal-dl-${dl.id}`,
              title: `⚠️ Calendar Deadline Alert: ${dl.title}`,
              message: `Intelligent Deadline Scan: You have a scheduled calendar milestone on ${new Date(dl.start).toLocaleDateString()} at ${new Date(dl.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. Make sure your productivity calendar is clear!`,
              type: 'alert',
              createdAt: new Date().toISOString(),
              actionLabel: 'View Productivity Calendar',
              actionPayload: {
                actionType: 'viewCalendar'
              }
            });
          }
        });
        setNudges(newNudges);
        localStorage.setItem('saver_nudges', JSON.stringify(newNudges));
      }

      const chatUpdate: ChatMessage = {
        id: `chat-sys-gcal-${Date.now()}`,
        sender: 'ai',
        text: `📅 Google Calendar Connected successfully! I've fetched ${fetchedEvents.length} events and verified any upcoming deadlines or exams. Your productivity schedule has been updated!`,
        timestamp: new Date().toLocaleTimeString()
      };
      setChatHistory(prev => [...prev, chatUpdate]);

    } catch (err: any) {
      console.error("Google Calendar Sync error:", err);
      setCalendarSyncError(err.message || "Failed to synchronize Google Calendar.");
    } finally {
      setIsSyncingCalendar(false);
    }
  };
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('isSidebarCollapsed') === 'true';
  });

  // Sync state with database helper
  const syncStateWithDatabase = async (
    tasksToSync = tasks,
    eventsToSync = calendarEvents,
    habitsToSync = habits,
    draftsToSync = drafts,
    nudgesToSync = nudges,
    chatToSync = chatHistory
  ) => {
    if (!auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      await fetch('/api/sync-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tasks: tasksToSync,
          calendarEvents: eventsToSync,
          habits: habitsToSync,
          drafts: draftsToSync,
          nudges: nudgesToSync,
          conversations: chatToSync
        })
      });
    } catch (err) {
      console.error("Failed to backup cockpit state to Cloud SQL:", err);
    }
  };

  // Auth subscriber to fetch profile and synced cockpit states from PostgreSQL
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setAuthLoading(true);
        try {
          const token = await user.getIdToken();
          
          // Get user database profile details
          const profileRes = await fetch('/api/user-profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            setUserProfile(profile);
            if (!profile.hasApiKey && !sessionStorage.getItem('saver_prompted_key_session')) {
              sessionStorage.setItem('saver_prompted_key_session', 'true');
            }
          }

          // Get database synchronized states
          const dataRes = await fetch('/api/sync-data', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (dataRes.ok) {
            const data = await dataRes.json();
            if (data && (data.tasks?.length > 0 || data.calendarEvents?.length > 0)) {
              setTasks(data.tasks);
              setCalendarEvents(data.calendarEvents);
              setHabits(data.habits);
              setDrafts(data.drafts);
              setNudges(data.nudges);
              setChatHistory(data.conversations);
            } else {
              // Populate and back up fresh initial seed data to Cloud SQL PostgreSQL
              await fetch('/api/sync-data', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  tasks: INITIAL_TASKS,
                  calendarEvents: INITIAL_EVENTS,
                  habits: INITIAL_HABITS,
                  drafts: [],
                  nudges: [],
                  conversations: []
                })
              });
            }
          }
        } catch (err) {
          console.error("Auth Postgres synchronization failure:", err);
        } finally {
          setAuthLoading(false);
        }
      } else {
        // Fall back to local guest user if available
        const savedGuest = localStorage.getItem('saver_guest_user');
        if (savedGuest) {
          try {
            const parsed = JSON.parse(savedGuest);
            setCurrentUser(parsed);
            setUserProfile({
              name: parsed.displayName,
              email: parsed.email,
              hasApiKey: !!localStorage.getItem('saver_guest_gemini_key')
            });
          } catch {
            setCurrentUser(null);
            setUserProfile(null);
          }
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Update profile handler
  const handleUpdateProfile = async (updates: { name?: string; geminiApiKey?: string }) => {
    if (currentUser?.isOfflineMode || !auth.currentUser) {
      // Offline local update
      const saved = localStorage.getItem('saver_guest_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (updates.name !== undefined) {
            parsed.displayName = updates.name;
            localStorage.setItem('saver_guest_user', JSON.stringify(parsed));
          }
          if (updates.geminiApiKey !== undefined) {
            localStorage.setItem('saver_guest_gemini_key', updates.geminiApiKey);
          }
          setUserProfile({
            name: parsed.displayName,
            email: parsed.email,
            hasApiKey: !!localStorage.getItem('saver_guest_gemini_key') || !!updates.geminiApiKey
          });
        } catch (e) {
          console.error(e);
        }
      }
      return;
    }
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error("Failed to save profile settings");
      const updatedProfile = await response.json();
      setUserProfile(updatedProfile);
    } catch (err) {
      console.error("Error saving settings profile:", err);
      throw err;
    }
  };

  // Guest login handler
  const handleGuestLogin = (customUser?: { displayName: string; email: string; isGoogle?: boolean }) => {
    const guestUser = {
      uid: 'guest-' + (customUser ? customUser.email.replace(/[^a-zA-Z0-9]/g, '') : '123'),
      displayName: customUser?.displayName || 'Demo Space Cadet',
      email: customUser?.email || 'demo@lifesaver.app',
      isOfflineMode: true,
      isGoogle: customUser?.isGoogle || customUser?.email.endsWith('@gmail.com') || customUser?.email.endsWith('@google.com') || false
    };
    localStorage.setItem('saver_guest_user', JSON.stringify(guestUser));
    setCurrentUser(guestUser);
    
    const hasKey = !!localStorage.getItem('saver_guest_gemini_key');
    setUserProfile({
      name: guestUser.displayName,
      email: guestUser.email,
      hasApiKey: hasKey
    });
    
    if (!hasKey && !sessionStorage.getItem('saver_prompted_key_session')) {
      sessionStorage.setItem('saver_prompted_key_session', 'true');
    }
    setActiveView('dashboard');
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      localStorage.removeItem('saver_guest_user');
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setHasAcknowledgedAlert(false);
      setIsSettingsOpen(false);
      setActiveView('dashboard');
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  // Reset all data handler to start fresh on a new slate
  const handleResetAllData = () => {
    setTasks([]);
    setHabits([]);
    setCalendarEvents([]);
    setNudges([]);
    setDrafts([]);
    setChatHistory([]);
    
    localStorage.removeItem('saver_tasks');
    localStorage.removeItem('saver_habits');
    localStorage.removeItem('saver_events');
    localStorage.removeItem('saver_nudges');
    localStorage.removeItem('saver_drafts');
    localStorage.removeItem('saver_chat');
    
    // If user is logged in, optionally update backend DB
    if (currentUser && !currentUser.isOfflineMode) {
      auth.currentUser?.getIdToken().then(token => {
        fetch('/api/sync-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            tasks: [],
            calendarEvents: [],
            habits: [],
            drafts: [],
            nudges: [],
            conversations: []
          })
        }).catch(err => console.error("Database clear sync failed:", err));
      });
    }
    
    setIsSettingsOpen(false);
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('isSidebarCollapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Save states to local state & database synchronization
  useEffect(() => {
    localStorage.setItem('saver_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('saver_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('saver_events', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem('saver_drafts', JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    localStorage.setItem('saver_chat', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem('saver_nudges', JSON.stringify(nudges));
  }, [nudges]);

  // Unified fetch helper with Auth headers for Gemini endpoints
  const getAuthHeaders = async () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // 1. Task Operations
  const handleAddTask = async (rawTask: Omit<Task, 'id' | 'completed' | 'subtasks'>) => {
    const colors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newTask: Task = {
      ...rawTask,
      id: `t-${Date.now()}`,
      completed: false,
      subtasks: [],
      color: rawTask.priority === 'high' ? '#ef4444' : randomColor
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    await syncStateWithDatabase(updated);
  };

  const handleToggleTask = async (taskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        return { 
          ...t, 
          completed: nextCompleted,
          subtasks: t.subtasks.map(st => ({ ...st, completed: nextCompleted }))
        };
      }
      return t;
    });
    setTasks(updated);
    await syncStateWithDatabase(updated);
  };

  const handleDeleteTask = async (taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    const updatedEvents = calendarEvents.filter(e => e.taskId !== taskId);
    setTasks(updatedTasks);
    setCalendarEvents(updatedEvents);
    await syncStateWithDatabase(updatedTasks, updatedEvents);
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextSubtasks = t.subtasks.map(st => 
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        const allCompleted = nextSubtasks.every(st => st.completed);
        return { 
          ...t, 
          subtasks: nextSubtasks,
          completed: nextSubtasks.length > 0 ? allCompleted : t.completed
        };
      }
      return t;
    });
    setTasks(updated);
    await syncStateWithDatabase(updated);
  };

  // 2. Calendar Event Operations
  const handleAddEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: `e-${Date.now()}`
    };
    const updated = [...calendarEvents, newEvent];
    setCalendarEvents(updated);
    await syncStateWithDatabase(undefined, updated);
  };

  const handleRemoveEvent = async (id: string) => {
    const updated = calendarEvents.filter(e => e.id !== id);
    setCalendarEvents(updated);
    await syncStateWithDatabase(undefined, updated);
  };

  const handleScheduleTask = async (taskId: string, date: string, time: string, durationMinutes: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Create Event
    const startTimeStr = `${date}T${time}:00`;
    const startDate = new Date(startTimeStr);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
    const endTimeStr = endDate.toISOString().replace(/\.\d+Z$/, '').substring(0, 19);

    const newEvent: CalendarEvent = {
      id: `e-${Date.now()}`,
      taskId,
      title: `⚡ Focus Slot: ${task.title}`,
      start: startTimeStr,
      end: endTimeStr,
      color: task.color || '#4f46e5'
    };

    // Update task
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, scheduledTime: startTimeStr } : t
    );

    const updatedEvents = [...calendarEvents, newEvent];

    setTasks(updatedTasks);
    setCalendarEvents(updatedEvents);
    await syncStateWithDatabase(updatedTasks, updatedEvents);

    // Speak success in chat
    const chatUpdate: ChatMessage = {
      id: `chat-sys-${Date.now()}`,
      sender: 'ai',
      text: `🗓️ focus block auto-booked! I have scheduled "${task.title}" for ${date} at ${time}. Focus intensely!`,
      timestamp: new Date().toLocaleTimeString()
    };
    const updatedHistory = [...chatHistory, chatUpdate];
    setChatHistory(updatedHistory);
    await syncStateWithDatabase(updatedTasks, updatedEvents, undefined, undefined, undefined, updatedHistory);
  };

  // Quick book event from task panel directly
  const handleQuickBook = async (taskId: string) => {
    const today = new Date().toISOString().split('T')[0];
    handleScheduleTask(taskId, today, '14:00', 90);
  };

  // 3. AI Copilot Integration Services
  const handleAiPrioritize = async () => {
    setIsAiLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/prioritize', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tasks,
          currentTime: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error("Prioritization service failed");
      const result = await response.json();
      if (result.engine) {
        setAiEngine(result.engine);
      }

      if (result.tasks) {
        setTasks(result.tasks);
      }

      // Add advice inside companion chat history
      if (result.adviceSummary) {
        const chatUpdate: ChatMessage = {
          id: `chat-ai-prioritize-${Date.now()}`,
          sender: 'ai',
          text: `🚨 OPTIMIZED SEQUENCE GENERATED!\n\n${result.adviceSummary}\n\n💡 Focus Strategy:\n${result.focusTips || ''}`,
          timestamp: new Date().toLocaleTimeString()
        };
        const updatedHistory = [...chatHistory, chatUpdate];
        setChatHistory(updatedHistory);
        await syncStateWithDatabase(result.tasks, undefined, undefined, undefined, undefined, updatedHistory);
      }
    } catch (err) {
      console.error(err);
      setAiEngine('local_heuristic');
    } finally {
      setIsAiLoading(false);
    }
  };

  // 4b. Chat Companion Message Send
  const handleSendMessage = async (text: string, isVoice: boolean = false) => {
    const userMsg: ChatMessage = {
      id: `chat-user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString()
    };

    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setAgentStatus('thinking');
    await syncStateWithDatabase(undefined, undefined, undefined, undefined, undefined, updatedHistory);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text,
          chatHistory: updatedHistory,
          tasks,
          calendarEvents,
          habits,
          currentTime: new Date().toISOString(),
          isVoice
        })
      });

      if (!response.ok) throw new Error("Chat assistant failed");
      const result = await response.json();
      if (result.engine) {
        setAiEngine(result.engine);
      }

      const aiMsg: ChatMessage = {
        id: `chat-ai-${Date.now()}`,
        sender: 'ai',
        text: result.text,
        timestamp: new Date().toLocaleTimeString(),
        suggestedActions: result.suggestedActions
      };

      const finalHistory = [...updatedHistory, aiMsg];
      setChatHistory(finalHistory);
      await syncStateWithDatabase(undefined, undefined, undefined, undefined, undefined, finalHistory);
    } catch (err) {
      console.error(err);
      setAiEngine('local_heuristic');
      const errMsg: ChatMessage = {
        id: `chat-ai-err-${Date.now()}`,
        sender: 'ai',
        text: "Apologies, the companion loop encountered an error. Please check your Gemini API key in Settings.",
        timestamp: new Date().toLocaleTimeString()
      };
      const finalHistory = [...updatedHistory, errMsg];
      setChatHistory(finalHistory);
      await syncStateWithDatabase(undefined, undefined, undefined, undefined, undefined, finalHistory);
    } finally {
      setAgentStatus('standby');
    }
  };

  // 4c. Autonomous Asset Drafting Execution
  const handleExecuteDraftAsset = async (payload: { taskId: string; taskTitle: string; title: string; contentInstruction: string }) => {
    setAgentStatus('executing');
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/autonomous-execute', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Asset drafting failed");
      const result = await response.json();
      if (result.engine) {
        setAiEngine(result.engine);
      }

      const newDraft: DraftAsset = {
        id: `d-${Date.now()}`,
        taskId: payload.taskId,
        taskTitle: payload.taskTitle,
        title: result.title || payload.title,
        content: result.content,
        createdAt: new Date().toLocaleDateString()
      };

      const updatedDrafts = [newDraft, ...drafts];
      setDrafts(updatedDrafts);

      // Speak back success in chat
      const chatUpdate: ChatMessage = {
        id: `chat-sys-${Date.now()}`,
        sender: 'ai',
        text: `📝 Autonomous Execution Complete! I have successfully drafted "${newDraft.title}" for you. You can read, review, and export it inside the Proactive Assets panel!`,
        timestamp: new Date().toLocaleTimeString()
      };
      const finalHistory = [...chatHistory, chatUpdate];
      setChatHistory(finalHistory);
      await syncStateWithDatabase(undefined, undefined, undefined, updatedDrafts, undefined, finalHistory);
    } catch (err) {
      console.error(err);
      setAiEngine('local_heuristic');
    } finally {
      setAgentStatus('standby');
    }
  };

  // 4d. Proactive Smart Nudge Scan
  const handleGenerateNudges = async () => {
    setIsNudgesLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/generate-nudges', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tasks, calendarEvents, habits, currentTime: new Date().toISOString() })
      });

      if (!response.ok) throw new Error("Failed to scan nudges");
      const result = await response.json();
      if (result.engine) {
        setAiEngine(result.engine);
      }

      if (result.nudges) {
        setNudges(result.nudges);
        await syncStateWithDatabase(undefined, undefined, undefined, undefined, result.nudges);
      }
    } catch (err) {
      console.error(err);
      setAiEngine('local_heuristic');
    } finally {
      setIsNudgesLoading(false);
    }
  };

  // 4e. Handle dynamic triggers inside recommendations/logs
  const handleExecuteAction = async (action: string, payload: any) => {
    setIsActionLoading(true);
    try {
      if (action === 'autoSchedule') {
        const targetTaskId = payload.taskId;
        const dateStr = payload.start ? payload.start.split('T')[0] : new Date().toISOString().split('T')[0];
        const timeStr = payload.start ? payload.start.split('T')[1].substring(0, 5) : '14:00';
        const task = tasks.find(t => t.id === targetTaskId);
        const duration = task ? task.estimatedDuration : 60;
        
        await handleScheduleTask(targetTaskId, dateStr, timeStr, duration);
        
        // Remove completed nudge
        const updatedNudges = nudges.filter(n => n.taskId !== targetTaskId);
        setNudges(updatedNudges);
        await syncStateWithDatabase(undefined, undefined, undefined, undefined, updatedNudges);
      } 
      else if (action === 'generateDraft') {
        await handleExecuteDraftAsset({
          taskId: payload.taskId,
          taskTitle: payload.taskTitle || "Target Task",
          title: payload.title || "Study Sheet Outline",
          contentInstruction: payload.contentInstruction || "Draft outline"
        });
        
        // Remove specific nudge
        const updatedNudges = nudges.filter(n => n.id !== payload.id);
        setNudges(updatedNudges);
        await syncStateWithDatabase(undefined, undefined, undefined, undefined, updatedNudges);
      }
      else if (action === 'createSubtasks') {
        const updatedTasks = tasks.map(t => {
          if (t.id === payload.taskId) {
            const extraSubs = payload.subtasks.map((st: string, sIdx: number) => ({
              id: `st-dynamic-${Date.now()}-${sIdx}`,
              title: st,
              completed: false
            }));
            return { ...t, subtasks: [...t.subtasks, ...extraSubs] };
          }
          return t;
        });
        setTasks(updatedTasks);
        await syncStateWithDatabase(updatedTasks);
      }
      else if (action === 'createTask') {
        await handleAddTask({
          title: payload.title,
          description: payload.description || "Urgent scheduled task",
          dueDate: payload.dueDate || new Date().toISOString().split('T')[0],
          estimatedDuration: payload.estimatedDuration || 60,
          priority: payload.priority || 'high',
          energyRequired: 'medium',
          category: 'Study'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    await syncStateWithDatabase(undefined, undefined, undefined, updated);
  };

  const handleVoiceCommandSimulation = (phrase: string) => {
    setIsChatOpen(true);
    handleSendMessage(phrase); // NO Spoken prefix - extremely minimal & clean!
  };


  // --- AUTH ROUTING SWITCH ---

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712] text-slate-350" id="global-loading-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-400">Synchronizing Secure Cockpit...</p>
        </div>
      </div>
    );
  }

  // Render Login view if user is unauthenticated
  if (!currentUser) {
    return <LoginView theme={theme} onAuthSuccess={() => setActiveView('dashboard')} onGuestLogin={handleGuestLogin} />;
  }


  return (
    <div className={`min-h-screen md:h-screen font-sans flex flex-col md:flex-row relative overflow-x-hidden md:overflow-hidden transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#030712] text-slate-200' : 'bg-slate-50/75 text-slate-800'
    }`} id="app-root-container">
      {/* Visual background gradient accents */}
      <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-all ${
        theme === 'dark' ? 'bg-indigo-600/10' : 'bg-indigo-600/5'
      }`} />
      <div className={`absolute bottom-10 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-all ${
        theme === 'dark' ? 'bg-rose-500/5' : 'bg-rose-500/5'
      }`} />
      <div className={`absolute top-1/3 right-10 w-96 h-96 rounded-full blur-[100px] pointer-events-none transition-all ${
        theme === 'dark' ? 'bg-purple-600/5' : 'bg-purple-600/3'
      }`} />

      {/* Stable Desktop Sidebar Layout Placeholder to keep main workspace size perfectly static */}
      <div className={`hidden md:block shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`} id="sidebar-layout-spacer" />

      {/* Persistent Left Sidebar Navigation for Desktop */}
      <aside className={`hidden md:flex flex-col border-r fixed top-0 left-0 h-screen justify-between shrink-0 transition-all duration-300 z-35 backdrop-blur-md ${
        isSidebarCollapsed ? 'w-20 p-4 items-center' : 'w-64 p-6 shadow-2xl'
      } ${
        theme === 'dark' 
          ? 'border-white/[0.06] bg-[#030712]/95 shadow-r shadow-black/30' 
          : 'border-slate-200 bg-white shadow-lg shadow-slate-200/50'
      }`} id="desktop-sidebar">

        <div className="space-y-8 w-full animate-fade-in">
          {/* Logo & Title */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all shrink-0 p-1 ${
                theme === 'dark'
                  ? 'bg-indigo-600 border-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.25)]'
                  : 'bg-indigo-600 border-indigo-500 shadow-md shadow-indigo-600/15'
              }`}
            >
              {/* Custom branding logo from Logo.tsx */}
              <Logo className="w-full h-full text-white" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <h1 className={`text-sm font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  Life Saver
                </h1>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-widest block leading-none">
                    ACTIVE SHIELD
                  </span>
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest block font-mono leading-none mt-0.5 ${
                    aiEngine === 'gemini' ? 'text-indigo-500' : 'text-amber-500'
                  }`}>
                    {aiEngine === 'gemini' ? '● Gemini Cloud' : '● Local Backup'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Menu (Dashboard, Calendar) */}
          <nav className={`space-y-3 ${isSidebarCollapsed ? 'w-full flex flex-col items-center' : ''}`}>
            <button
              onClick={() => {
                setActiveView('dashboard');
                setIsMobileSidebarOpen(false);
              }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold transition-all border cursor-pointer ${
                isSidebarCollapsed ? 'w-10 h-10 p-0 justify-center' : 'w-full'
              } ${
                activeView === 'dashboard'
                  ? 'bg-indigo-600 border-indigo-500/30 text-white shadow-md'
                  : theme === 'dark'
                    ? 'bg-transparent border-transparent text-slate-300 hover:text-white hover:bg-slate-900/50'
                    : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={isSidebarCollapsed ? "Dashboard" : undefined}
            >
              <LayoutGrid className="w-4.5 h-4.5 shrink-0" />
              {!isSidebarCollapsed && <span className="text-sm font-bold">Dashboard</span>}
            </button>

            <button
              onClick={() => {
                setActiveView('calendar');
                setIsMobileSidebarOpen(false);
              }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold transition-all border cursor-pointer ${
                isSidebarCollapsed ? 'w-10 h-10 p-0 justify-center' : 'w-full'
              } ${
                activeView === 'calendar'
                  ? 'bg-indigo-600 border-indigo-500/30 text-white shadow-md'
                  : theme === 'dark'
                    ? 'bg-transparent border-transparent text-slate-300 hover:text-white hover:bg-slate-900/50'
                    : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={isSidebarCollapsed ? "Calendar" : undefined}
            >
              <div className="relative flex items-center">
                <Calendar className="w-4.5 h-4.5 shrink-0" />
                {isSidebarCollapsed && calendarEvents.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-500 text-white text-[9px] rounded-full flex items-center justify-center font-black">
                    {calendarEvents.length}
                  </span>
                )}
              </div>
              {!isSidebarCollapsed && (
                <>
                  <span className="text-sm font-bold">Calendar</span>
                  {calendarEvents.length > 0 && (
                    <span className="ml-auto px-2 py-0.5 bg-indigo-500/25 text-indigo-400 text-xs rounded-full font-bold border border-indigo-500/20">
                      {calendarEvents.length}
                    </span>
                  )}
                </>
              )}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer with exclusive DP Toggle Action */}
        <div className={`space-y-4 pt-4 w-full ${
          isSidebarCollapsed 
            ? 'flex flex-col items-center' 
            : 'border-t border-slate-200 dark:border-white/[0.04]'
        }`}>
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between w-full gap-2 px-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="w-9 h-9 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-sm font-black text-indigo-400 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white hover:scale-105 transition-all cursor-pointer shrink-0"
                  title="Click DP to collapse sidebar"
                >
                  {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                </button>
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    {userProfile?.name || 'Active User'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {userProfile?.email}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setIsSettingsOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                className={`p-1.5 rounded-lg border cursor-pointer transition-all hover:scale-105 shrink-0 ${
                  isSettingsOpen
                    ? 'bg-indigo-600 border-indigo-500/30 text-white shadow-md'
                    : theme === 'dark'
                      ? 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/50'
                      : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="w-9 h-9 rounded-full bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center text-sm font-black text-indigo-400 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white hover:scale-105 transition-all cursor-pointer shadow-[0_0_10px_rgba(79,70,229,0.15)]"
              title="Click DP to expand sidebar"
            >
              {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
            </button>
          )}
        </div>
      </aside>

      {/* Sliding Mobile Navigation Menu (Drawer) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-45 md:hidden" id="mobile-sidebar-overlay">
          <div onClick={() => setIsMobileSidebarOpen(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity" />
          <div className={`absolute top-0 left-0 w-64 h-full p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 ${
            theme === 'dark' ? 'bg-[#0a0f1d] border-r border-white/[0.06]' : 'bg-white border-r border-slate-200'
          }`} id="mobile-sidebar-panel">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center p-1 border border-indigo-500/10">
                    <Logo className="w-full h-full text-white" />
                  </div>
                  <span className={`text-base font-black ${theme === 'dark' ? 'text-white' : 'text-slate-850'}`}>Life Saver</span>
                </div>
                <button onClick={() => setIsMobileSidebarOpen(false)} className={`p-1 rounded-md ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => {
                    setActiveView('dashboard');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-bold border transition-colors cursor-pointer ${
                    activeView === 'dashboard' ? 'bg-indigo-600 border-indigo-500/30 text-white' : theme === 'dark' ? 'bg-transparent border-transparent text-slate-300' : 'bg-transparent border-transparent text-slate-655'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    setActiveView('calendar');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-bold border transition-colors cursor-pointer ${
                    activeView === 'calendar' ? 'bg-indigo-600 border-indigo-500/30 text-white' : theme === 'dark' ? 'bg-transparent border-transparent text-slate-300' : 'bg-transparent border-transparent text-slate-655'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Calendar</span>
                </button>
              </nav>
            </div>
            
            <div className="pt-4 border-t border-slate-200 dark:border-white/[0.04] space-y-3">
              <div className="flex items-center justify-between w-full gap-2 px-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400 shrink-0">
                    {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-slate-800">{userProfile?.name || 'Active User'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{userProfile?.email}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`p-1.5 rounded-lg border cursor-pointer transition-all hover:scale-105 shrink-0 ${
                    isSettingsOpen
                      ? 'bg-indigo-600 border-indigo-500/30 text-white shadow-md'
                      : 'bg-transparent border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full py-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/15 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content viewport wrapper */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-hidden">
        
        {/* Sleek top navbar when collapsed or on mobile */}
        <header className={`w-full h-16 border-b flex items-center justify-between px-6 sticky top-0 z-30 backdrop-blur-md transition-colors shrink-0 ${
          theme === 'dark' 
            ? 'bg-[#030712]/75 border-white/[0.04]' 
            : 'bg-white/75 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className={`md:hidden p-2 rounded-lg border cursor-pointer transition-colors ${
                theme === 'dark' ? 'bg-slate-900 border-white/[0.06] text-slate-300' : 'bg-white border-slate-200 text-slate-655'
              }`}
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Logo shown if collapsed or mobile (only text, no icon as requested to avoid duplicate logos) */}
            {(isSidebarCollapsed || typeof window !== 'undefined' && window.innerWidth < 768) && (
              <div className="flex items-center gap-2">
                <span className={`text-base font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-850'}`}>
                  Life Saver
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Embedded AI Companion Trigger Button - Sleek embedded top right layout */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md hover:shadow-indigo-600/20 hover:scale-105 transition-all border border-indigo-500/30 cursor-pointer flex items-center justify-center gap-1.5 px-3 py-1.5"
              title="AI Companion"
              id="header-companion-button"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs font-bold">AI Companion</span>
            </button>
          </div>
        </header>

        {/* Dynamic Main Workspace Content */}
        <div className="flex-1 flex flex-row min-w-0 overflow-hidden relative">
          <main className="flex-1 overflow-y-auto w-full p-4 md:p-6 space-y-6 z-10 transition-all duration-300" id="main-scrollable-workspace">
          
          {activeView === 'dashboard' && (
            <div className="max-w-7xl mx-auto w-full space-y-6">
              {/* Gemini API Key Dashboard Alert Banner */}
              {!userProfile?.hasApiKey && !dismissedKeyAlert && (
                <div className={`border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md transition-all relative overflow-hidden ${
                  theme === 'dark' 
                    ? 'bg-amber-500/[0.04] border-amber-500/20 text-amber-200' 
                    : 'bg-amber-50/50 border-amber-200 text-amber-900'
                }`} id="dashboard-gemini-key-alert">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                  
                  <div className="flex gap-3.5 items-start">
                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl mt-0.5 shrink-0">
                      <Key className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm">Gemini API Key Required for AI Features</h4>
                      <p className={`text-xs leading-relaxed max-w-2xl ${theme === 'dark' ? 'text-amber-300/80' : 'text-amber-850/80'}`}>
                        Unlock automatic schedule slot optimization, smart priority categorization, and interactive Voice Companion features by adding your Gemini API key.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0 z-10">
                    <button
                      type="button"
                      onClick={() => {
                        setDismissedKeyAlert(true);
                        sessionStorage.setItem('saver_dismissed_key_alert', 'true');
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        theme === 'dark' 
                          ? 'bg-slate-800 border-white/[0.08] text-slate-300 hover:bg-slate-700' 
                          : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Add Later
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowKeyPrompt(true)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/15 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Enter Key
                    </button>
                  </div>
                </div>
              )}

              {/* Intro banner */}
              <div className={`border rounded-2xl p-4 flex items-center gap-3 text-sm shadow-sm transition-all ${
                theme === 'dark' 
                  ? 'bg-indigo-950/15 border-indigo-500/15 text-indigo-200' 
                  : 'bg-indigo-50 border-indigo-150 text-indigo-850'
              }`}>
                <Info className={`w-4 h-4 shrink-0 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <span>
                  <strong>Evaluation Tip:</strong> Interact with the <strong>AI Companion</strong> to auto-schedule focus times, ask questions, or generate study sheets!
                </span>
              </div>

              {/* Top Split: Proactive Alert Feed */}
              <div className="grid grid-cols-1 gap-6">
                <ProactiveFeed 
                  nudges={nudges}
                  drafts={drafts}
                  tasks={tasks}
                  theme={theme}
                  onRefreshNudges={handleGenerateNudges}
                  isNudgesLoading={isNudgesLoading}
                  onExecuteNudgeAction={handleExecuteAction}
                  isActionLoading={isActionLoading}
                  onDeleteDraft={handleDeleteDraft}
                />
              </div>

              {/* Bottom Split: Free Workspace (Task board and Crisis Shield Side-by-Side!) */}
              <div className={`grid grid-cols-1 gap-6 ${
                isChatOpen ? 'xl:grid-cols-2' : 'lg:grid-cols-2'
              }`} id="active-workspace-grid">
                <TaskPanel 
                  theme={theme}
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onToggleSubtask={handleToggleSubtask}
                  onAiPrioritize={handleAiPrioritize}
                  isAiLoading={isAiLoading}
                  onQuickBook={handleQuickBook}
                />
                
                <CrisisShieldPanel 
                  tasks={tasks}
                  theme={theme}
                  onAddEvent={handleAddEvent}
                  onDeployProtocol={(title, content) => {
                    const newDraft: DraftAsset = {
                      id: `d-${Date.now()}`,
                      taskId: 't-1',
                      taskTitle: 'Emergency Mitigation Shield',
                      title: title,
                      content: content,
                      createdAt: new Date().toLocaleDateString()
                    };
                    setDrafts(prev => [newDraft, ...prev]);
                    
                    // Speak back in chat history
                    const chatUpdate: ChatMessage = {
                      id: `chat-sys-${Date.now()}`,
                      sender: 'ai',
                      text: `🛡️ SURVIVAL PROTOCOL ACTIVATED! I have drafted "${title}" and booked focus blocks in your Calendar. Let's attack these deadlines!`,
                      timestamp: new Date().toLocaleTimeString()
                    };
                    const finalHistory = [...chatHistory, chatUpdate];
                    setChatHistory(finalHistory);
                    syncStateWithDatabase(undefined, undefined, undefined, [newDraft, ...drafts], undefined, finalHistory);
                  }}
                  onTriggerVoiceMessage={(phrase) => {
                    handleSendMessage(phrase);
                  }}
                />
              </div>
            </div>
          )}

          {activeView === 'calendar' && (
            <div className="w-full flex-1 flex flex-col" id="embedded-calendar-container">
              <CalendarView 
                theme={theme}
                tasks={tasks}
                events={calendarEvents}
                onAddEvent={handleAddEvent}
                onRemoveEvent={handleRemoveEvent}
                onScheduleTask={handleScheduleTask}
                onSyncGoogleCalendar={handleSyncGoogleCalendar}
                isSyncingCalendar={isSyncingCalendar}
                calendarSyncError={calendarSyncError}
                googleAccessToken={googleAccessToken}
                isSyncCalendarDisabled={!isGoogleUser}
              />
            </div>
          )}

          {isSettingsOpen && (
            <SettingsView 
              theme={theme}
              setTheme={setTheme}
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
              onLogout={handleLogout}
              onClose={() => setIsSettingsOpen(false)}
              onResetAllData={handleResetAllData}
            />
          )}

        </main>

        {/* Spacer to push content dynamically on large screens when AI Companion is open */}
        <div className={`hidden md:block shrink-0 transition-all duration-300 ${
          isChatOpen ? 'w-full sm:w-[420px]' : 'w-0'
        }`} id="chat-sidebar-spacer" />

        {/* Slide-out AI Companion Conversation Panel */}
        <ChatDrawer 
          theme={theme}
          chatHistory={chatHistory}
          onSendMessage={handleSendMessage}
          isChatLoading={agentStatus === 'thinking'}
          agentStatus={agentStatus}
          onExecuteAction={handleExecuteAction}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          aiEngine={aiEngine}
        />
        </div>


      </div>

      {/* Alert for Non-Google Users */}
      {!isGoogleUser && !hasAcknowledgedAlert && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="offline-alert-modal">
          <div className={`w-full max-w-md border rounded-2xl p-6 relative transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-slate-900 border-white/[0.08] text-slate-200 shadow-2xl shadow-black/80' 
              : 'bg-white border-slate-200 text-slate-800 shadow-xl'
          }`} id="offline-alert-container">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className={`text-lg font-black mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                Local Session Alert
              </h2>
              
              <div className={`text-sm md:text-base space-y-3 mb-6 text-left w-full p-4 rounded-xl border ${
                theme === 'dark' 
                  ? 'bg-slate-950/40 border-white/[0.04] text-slate-300' 
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <p className="font-bold">
                  Hello {userProfile?.name || 'User'},
                </p>
                <p className="leading-relaxed">
                  You are currently logged in with a local offline account.
                </p>
                <p className="leading-relaxed text-xs">
                  Please note that <strong>Google Calendar Synchronization</strong> is only available when signed in with a Google account. You can still manage your local tasks and view your bento-style schedule offline.
                </p>
              </div>

              <button
                onClick={() => {
                  localStorage.setItem('saver_offline_alert_acknowledged', 'true');
                  setHasAcknowledgedAlert(true);
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-600/15 cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {showKeyPrompt && (
        <GeminiKeyPromptModal 
          theme={theme}
          onClose={() => setShowKeyPrompt(false)}
          onSubmitKey={async (key) => {
            if (currentUser?.isOfflineMode || !auth.currentUser) {
              // Save locally for guest/offline user
              localStorage.setItem('saver_guest_gemini_key', key);
              if (userProfile) {
                setUserProfile({ ...userProfile, hasApiKey: true });
              }
            } else {
              await handleUpdateProfile({ geminiApiKey: key });
            }
            setShowKeyPrompt(false);
          }}
        />
      )}
    </div>
  );
}
