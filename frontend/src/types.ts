export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export type PriorityLevel = 'high' | 'medium' | 'low';
export type EnergyLevel = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD or ISO
  estimatedDuration: number; // in minutes
  priority: PriorityLevel;
  energyRequired: EnergyLevel;
  completed: boolean;
  category: string;
  subtasks: SubTask[];
  scheduledTime?: string; // ISO String (start)
  color?: string;
  isAiPrioritized?: boolean;
}

export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  completedToday: boolean;
  history: string[]; // dates of completion (YYYY-MM-DD)
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO string
  end: string; // ISO string
  taskId?: string;
  color?: string;
}

export interface AiNudge {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'tip' | 'action' | 'draft';
  taskId?: string;
  createdAt: string;
  actionLabel?: string;
  actionPayload?: any; // metadata for execution
}

export interface DraftAsset {
  id: string;
  taskId: string;
  taskTitle: string;
  title: string;
  content: string; // Markdown content
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestedActions?: {
    label: string;
    action: string;
    payload?: any;
  }[];
}
