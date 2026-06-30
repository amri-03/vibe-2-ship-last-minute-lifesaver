import { db } from './index.ts';
import { users, tasks, subtasks, calendarEvents, habits, drafts, nudges, conversations } from './schema.ts';
import { eq, and } from 'drizzle-orm';

// Get or Create User profile
export async function getOrCreateUser(uid: string, email: string, name?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        name: name || email.split('@')[0],
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Failed to get or create user:", error);
    throw new Error("Failed to authenticate user profile in database.", { cause: error });
  }
}

// Get User Profile
export async function getUserProfile(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    throw new Error("Failed to fetch user profile.", { cause: error });
  }
}

// Update User Profile
export async function updateUserProfile(uid: string, updates: { name?: string; geminiApiKey?: string }) {
  try {
    const result = await db.update(users)
      .set(updates)
      .where(eq(users.uid, uid))
      .returning();
    return result[0];
  } catch (error) {
    console.error("Failed to update user profile:", error);
    throw new Error("Failed to update profile.", { cause: error });
  }
}

// Synchronize / Save All User Data
export async function saveUserData(uid: string, data: {
  tasks: any[];
  calendarEvents: any[];
  habits: any[];
  drafts: any[];
  nudges: any[];
  conversations: any[];
}) {
  try {
    // We execute inside a clean sequence to prevent orphaned records
    // 1. Delete existing records for this user
    await db.delete(calendarEvents).where(eq(calendarEvents.userId, uid));
    await db.delete(habits).where(eq(habits.userId, uid));
    await db.delete(drafts).where(eq(drafts.userId, uid));
    await db.delete(nudges).where(eq(nudges.userId, uid));
    await db.delete(conversations).where(eq(conversations.userId, uid));

    // Delete subtasks and tasks. Since subtasks are cascade-deleted on task delete, we delete tasks.
    // First, let's find all task IDs for this user
    const userTasks = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.userId, uid));
    const taskIds = userTasks.map(t => t.id);
    if (taskIds.length > 0) {
      await db.delete(subtasks).where(and(eq(subtasks.taskId, taskIds[0]))); // fallback safety, cascade is set
    }
    await db.delete(tasks).where(eq(tasks.userId, uid));

    // 2. Insert Tasks and their subtasks
    if (data.tasks && data.tasks.length > 0) {
      for (const t of data.tasks) {
        await db.insert(tasks).values({
          id: t.id,
          userId: uid,
          title: t.title,
          description: t.description || '',
          dueDate: t.dueDate,
          estimatedDuration: t.estimatedDuration || 60,
          priority: t.priority || 'medium',
          energyRequired: t.energyRequired || 'medium',
          category: t.category || 'Study',
          completed: !!t.completed,
          scheduledTime: t.scheduledTime || null,
          color: t.color || '#4f46e5',
        });

        // Insert subtasks
        if (t.subtasks && t.subtasks.length > 0) {
          for (const st of t.subtasks) {
            await db.insert(subtasks).values({
              id: st.id,
              taskId: t.id,
              title: st.title,
              completed: !!st.completed,
            });
          }
        }
      }
    }

    // 3. Insert Calendar Events
    if (data.calendarEvents && data.calendarEvents.length > 0) {
      for (const ev of data.calendarEvents) {
        await db.insert(calendarEvents).values({
          id: ev.id,
          userId: uid,
          taskId: ev.taskId || null,
          title: ev.title,
          start: ev.start,
          end: ev.end,
          color: ev.color || '#4f46e5',
        });
      }
    }

    // 4. Insert Habits
    if (data.habits && data.habits.length > 0) {
      for (const h of data.habits) {
        await db.insert(habits).values({
          id: h.id,
          userId: uid,
          name: h.name,
          frequency: h.frequency || 'daily',
          streak: h.streak || 0,
          completedToday: !!h.completedToday,
          history: h.history || [],
        });
      }
    }

    // 5. Insert Drafts
    if (data.drafts && data.drafts.length > 0) {
      for (const dr of data.drafts) {
        await db.insert(drafts).values({
          id: dr.id,
          userId: uid,
          taskId: dr.taskId || null,
          taskTitle: dr.taskTitle || '',
          title: dr.title,
          content: dr.content,
          createdAt: dr.createdAt,
        });
      }
    }

    // 6. Insert Nudges
    if (data.nudges && data.nudges.length > 0) {
      for (const nd of data.nudges) {
        await db.insert(nudges).values({
          id: nd.id,
          userId: uid,
          title: nd.title,
          message: nd.message,
          type: nd.type || 'alert',
          taskId: nd.taskId || null,
          actionLabel: nd.actionLabel || '',
          actionPayload: nd.actionPayload || {},
          createdAt: nd.createdAt || new Date().toISOString(),
        });
      }
    }

    // 7. Insert Conversations
    if (data.conversations && data.conversations.length > 0) {
      for (const chat of data.conversations) {
        await db.insert(conversations).values({
          id: chat.id,
          userId: uid,
          sender: chat.sender,
          text: chat.text,
          timestamp: chat.timestamp,
          suggestedActions: chat.suggestedActions || null,
        });
      }
    }

    return { status: 'success' };
  } catch (error) {
    console.error("Failed to sync user data:", error);
    throw new Error("Failed to synchronize active cockpit data.", { cause: error });
  }
}

// Load Full User Cockpit Data
export async function loadUserData(uid: string) {
  try {
    // Parallel queries for fast performance
    const [dbTasks, dbEvents, dbHabits, dbDrafts, dbNudges, dbChats] = await Promise.all([
      db.select().from(tasks).where(eq(tasks.userId, uid)),
      db.select().from(calendarEvents).where(eq(calendarEvents.userId, uid)),
      db.select().from(habits).where(eq(habits.userId, uid)),
      db.select().from(drafts).where(eq(drafts.userId, uid)),
      db.select().from(nudges).where(eq(nudges.userId, uid)),
      db.select().from(conversations).where(eq(conversations.userId, uid)),
    ]);

    // Fetch subtasks for each task
    const tasksWithSubtasks = [];
    for (const t of dbTasks) {
      const dbSubtasks = await db.select().from(subtasks).where(eq(subtasks.taskId, t.id));
      tasksWithSubtasks.push({
        ...t,
        subtasks: dbSubtasks.map(st => ({
          id: st.id,
          title: st.title,
          completed: st.completed,
        })),
      });
    }

    return {
      tasks: tasksWithSubtasks,
      calendarEvents: dbEvents.map(e => ({
        id: e.id,
        taskId: e.taskId || undefined,
        title: e.title,
        start: e.start,
        end: e.end,
        color: e.color || undefined,
      })),
      habits: dbHabits.map(h => ({
        id: h.id,
        name: h.name,
        frequency: h.frequency as 'daily' | 'weekly',
        streak: h.streak,
        completedToday: h.completedToday,
        history: h.history as string[],
      })),
      drafts: dbDrafts.map(d => ({
        id: d.id,
        taskId: d.taskId || undefined,
        taskTitle: d.taskTitle || undefined,
        title: d.title,
        content: d.content,
        createdAt: d.createdAt,
      })),
      nudges: dbNudges.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type as 'alert' | 'tip' | 'action' | 'draft',
        taskId: n.taskId || undefined,
        actionLabel: n.actionLabel || undefined,
        actionPayload: n.actionPayload,
        createdAt: n.createdAt,
      })),
      conversations: dbChats.map(c => ({
        id: c.id,
        sender: c.sender as 'user' | 'ai',
        text: c.text,
        timestamp: c.timestamp,
        suggestedActions: c.suggestedActions || undefined,
      })),
    };
  } catch (error) {
    console.error("Failed to load user data:", error);
    throw new Error("Failed to fetch saved cockpit database records.", { cause: error });
  }
}
