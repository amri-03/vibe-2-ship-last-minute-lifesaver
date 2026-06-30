import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users Table (Linked to Firebase UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Authentication UID
  email: text('email').notNull(),
  name: text('name'),
  geminiApiKey: text('gemini_api_key'), // Encrypted/prepended user-provided Gemini API key
  createdAt: timestamp('created_at').defaultNow(),
});

// Tasks Table
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(), // Using client-defined string IDs (e.g., t-1)
  userId: text('user_id').references(() => users.uid).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: text('due_date').notNull(), // Format: YYYY-MM-DD
  estimatedDuration: integer('estimated_duration').default(60),
  priority: text('priority').default('medium'), // high, medium, low
  energyRequired: text('energy_required').default('medium'),
  category: text('category').default('Study'),
  completed: boolean('completed').default(false).notNull(),
  scheduledTime: text('scheduled_time'), // ISO timestamp if scheduled
  color: text('color'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Subtasks Table
export const subtasks = pgTable('subtasks', {
  id: text('id').primaryKey(),
  taskId: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  completed: boolean('completed').default(false).notNull(),
});

// Calendar Events Table
export const calendarEvents = pgTable('calendar_events', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  taskId: text('task_id'), // Optional, if linked to a task
  title: text('title').notNull(),
  start: text('start').notNull(), // ISO timestamp
  end: text('end').notNull(), // ISO timestamp
  color: text('color'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Habits Table
export const habits = pgTable('habits', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  name: text('name').notNull(),
  frequency: text('frequency').default('daily').notNull(),
  streak: integer('streak').default(0).notNull(),
  completedToday: boolean('completed_today').default(false).notNull(),
  history: jsonb('history').default([]).notNull(), // Array of date strings: ['2026-06-28', '2026-06-29']
});

// Proactive Draft Assets Table
export const drafts = pgTable('drafts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  taskId: text('task_id'),
  taskTitle: text('task_title'),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull(),
});

// Smart Nudges Table
export const nudges = pgTable('nudges', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('alert').notNull(),
  taskId: text('task_id'),
  actionLabel: text('action_label'),
  actionPayload: jsonb('action_payload'), // Store key-value payload for automated actions
  createdAt: text('created_at').notNull(),
});

// Persistent Conversations Table
export const conversations = pgTable('conversations', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  sender: text('sender').notNull(), // 'user' or 'ai'
  text: text('text').notNull(),
  timestamp: text('timestamp').notNull(),
  suggestedActions: jsonb('suggested_actions'), // Optional inline action choices
});

// Relations Definitions
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  calendarEvents: many(calendarEvents),
  habits: many(habits),
  drafts: many(drafts),
  nudges: many(nudges),
  conversations: many(conversations),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  author: one(users, {
    fields: [tasks.userId],
    references: [users.uid],
  }),
  subtasks: many(subtasks),
}));

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, {
    fields: [subtasks.taskId],
    references: [tasks.id],
  }),
}));
