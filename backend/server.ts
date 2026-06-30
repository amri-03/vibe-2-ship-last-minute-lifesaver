import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
// Removed vite import
import { requireAuth, AuthRequest } from "./src/middleware/auth";
import { adminAuth } from "./src/lib/firebase-admin";
import { getOrCreateUser, getUserProfile, updateUserProfile, saveUserData, loadUserData } from "./src/db/queries";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialized server-level Gemini client (default fallback)
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Dynamically fetch Gemini Client: user's custom API key or default fallback
async function getGeminiClientForUser(req: Request): Promise<GoogleGenAI> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      if (decoded && decoded.uid) {
        const profile = await getUserProfile(decoded.uid);
        if (profile && profile.geminiApiKey) {
          // Strip the "AIzsy" prefix which was prepended for extra safety
          let key = profile.geminiApiKey;
          if (key.startsWith("AIzsy")) {
            key = key.substring(5);
          }
          console.log(`Using custom user-provided Gemini API Key for UID: ${decoded.uid}`);
          return new GoogleGenAI({
            apiKey: key,
            httpOptions: {
              headers: {
                "User-Agent": "aistudio-build",
              },
            },
          });
        }
      }
    } catch (e) {
      console.warn("Could not retrieve custom user API key, falling back to system default:", e);
    }
  }
  return getGeminiClient();
}

// --- SECURE USER & DATA SYNC ENDPOINTS ---

// Register User Profile
app.post("/api/register-user", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || "";
    const name = req.body.name || req.user!.name || "";
    
    const profile = await getOrCreateUser(uid, email, name);
    res.json({
      uid: profile.uid,
      email: profile.email,
      name: profile.name,
      hasApiKey: !!profile.geminiApiKey,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get User Profile details
app.get("/api/user-profile", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const profile = await getUserProfile(uid);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json({
      uid: profile.uid,
      email: profile.email,
      name: profile.name,
      hasApiKey: !!profile.geminiApiKey,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update User Profile details (or register Gemini key with prefix "AIzsy")
app.post("/api/user-profile", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const { name, geminiApiKey } = req.body;
    
    const updates: { name?: string; geminiApiKey?: string } = {};
    if (name !== undefined) updates.name = name;
    if (geminiApiKey !== undefined) {
      // Ensure key starts with safety prefix "AIzsy"
      let keyToSave = geminiApiKey.trim();
      if (keyToSave && !keyToSave.startsWith("AIzsy")) {
        keyToSave = "AIzsy" + keyToSave;
      }
      updates.geminiApiKey = keyToSave;
    }
    
    const profile = await updateUserProfile(uid, updates);
    res.json({
      uid: profile.uid,
      email: profile.email,
      name: profile.name,
      hasApiKey: !!profile.geminiApiKey,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Synchronize all state
app.post("/api/sync-data", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const { tasks, calendarEvents, habits, drafts, nudges, conversations } = req.body;
    
    await saveUserData(uid, {
      tasks: tasks || [],
      calendarEvents: calendarEvents || [],
      habits: habits || [],
      drafts: drafts || [],
      nudges: nudges || [],
      conversations: conversations || [],
    });
    
    res.json({ status: "ok" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve full synced state
app.get("/api/sync-data", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const data = await loadUserData(uid);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// --- SMART LOCAL FALLBACKS (In case of depleted Gemini API credits or missing keys) ---

function fallbackPrioritize(tasks: any[], currentTime: string) {
  const updatedTasks = tasks.map((task: any, idx: number) => {
    const subtasks = task.subtasks && task.subtasks.length > 0 ? task.subtasks : [
      { id: `${task.id || idx}-sub-1`, title: "Review instructions and key criteria", completed: false },
      { id: `${task.id || idx}-sub-2`, title: "Execute drafting and initial compilation", completed: false },
      { id: `${task.id || idx}-sub-3`, title: "Final editing, proofreading, and checks", completed: false }
    ];
    
    let color = task.color;
    if (!color) {
      if (task.priority === "high") color = "#ef4444";
      else if (task.priority === "medium") color = "#f59e0b";
      else color = "#10b981";
    }

    return {
      id: task.id || `task-${idx}-${Date.now()}`,
      title: task.title || "Untitled Task",
      description: task.description || "",
      dueDate: task.dueDate || new Date().toISOString(),
      estimatedDuration: task.estimatedDuration || 60,
      priority: task.priority || "medium",
      energyRequired: task.energyRequired || "medium",
      completed: !!task.completed,
      category: task.category || "General",
      color,
      subtasks
    };
  });

  // Sort tasks: high priority first
  updatedTasks.sort((a, b) => {
    const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
    return (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
  });

  return {
    tasks: updatedTasks,
    adviceSummary: "⚠️ Note: Running in Smart Local Backup Mode.\n\nI have structured your tasks based on immediate urgency. High priority tasks are moved to the top, and subtasks have been generated to help you complete them step-by-step.",
    focusTips: "Break down your work into 25-minute Pomodoro sprints. Tackle the high-energy tasks first while your mind is fresh."
  };
}

function fallbackChat(message: string, tasks: any[], currentTime: string) {
  const msgLower = (message || "").toLowerCase();
  let text = "I am here to help you stay on track! (Note: Running in Smart Local Backup Mode)";
  const suggestedActions: any[] = [];

  const urgentTask = tasks && tasks.find(t => t.priority === "high" && !t.completed);
  const anyTask = tasks && tasks.find(t => !t.completed);

  if (msgLower.includes("schedule") || msgLower.includes("calendar") || msgLower.includes("time")) {
    if (urgentTask) {
      text = `Let's make sure we schedule time for "${urgentTask.title}" right away! I recommend blocking out some time today.`;
      suggestedActions.push({
        label: `Auto-schedule "${urgentTask.title}"`,
        action: "autoSchedule",
        payload: {
          taskId: urgentTask.id,
          title: urgentTask.title,
          start: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 90 * 60 * 1000).toISOString()
        }
      });
    } else if (anyTask) {
      text = `Let's get "${anyTask.title}" onto your calendar. I've prepared a suggested focus slot.`;
      suggestedActions.push({
        label: `Auto-schedule "${anyTask.title}"`,
        action: "autoSchedule",
        payload: {
          taskId: anyTask.id,
          title: anyTask.title,
          start: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 120 * 60 * 1000).toISOString()
        }
      });
    } else {
      text = "All your tasks look scheduled, but let me know if you want me to calendar any specific task!";
    }
  } else if (msgLower.includes("draft") || msgLower.includes("cheat") || msgLower.includes("write") || msgLower.includes("outline") || msgLower.includes("summary")) {
    const targetTask = urgentTask || anyTask;
    if (targetTask) {
      text = `I can help you draft some study materials or a cheat sheet for "${targetTask.title}" so you can get started quickly.`;
      suggestedActions.push({
        label: `Generate Draft for "${targetTask.title}"`,
        action: "generateDraft",
        payload: {
          taskId: targetTask.id,
          taskTitle: targetTask.title,
          title: `Study Guide: ${targetTask.title}`,
          contentInstruction: "Draft a comprehensive quick-reference study guide with key formulas, core concepts, and review questions."
        }
      });
    } else {
      text = "I'd love to help you draft some materials. Try adding an urgent task first!";
    }
  } else if (msgLower.includes("subtask") || msgLower.includes("break") || msgLower.includes("divide")) {
    const targetTask = urgentTask || anyTask;
    if (targetTask) {
      text = `Let's break "${targetTask.title}" down into smaller, actionable steps so it feels less overwhelming.`;
      suggestedActions.push({
        label: `Generate Subtasks for "${targetTask.title}"`,
        action: "createSubtasks",
        payload: {
          taskId: targetTask.id,
          subtasks: [
            "Gather essential notes and references",
            "Draft the primary section outline",
            "Formulate the core arguments/formulas",
            "Perform a rigorous final review and proofread"
          ]
        }
      });
    } else {
      text = "Please add a task first so I can help break it down for you!";
    }
  } else {
    if (urgentTask) {
      text = `Hi there! I noticed "${urgentTask.title}" is urgent and due soon. Shall we generate a cheat sheet or draft a quick outline to tackle it?`;
      suggestedActions.push({
        label: `Generate Cheat Sheet: ${urgentTask.title}`,
        action: "generateDraft",
        payload: {
          taskId: urgentTask.id,
          taskTitle: urgentTask.title,
          title: `Cheat Sheet: ${urgentTask.title}`,
          contentInstruction: "Generate a dense, actionable cheat sheet with key concepts, definitions, and active recall cues."
        }
      });
    } else if (anyTask) {
      text = `Hello! How can I assist you with your tasks today? I can break down "${anyTask.title}" or draft study resources for you.`;
    } else {
      text = "Welcome to Last-Minute Life Saver! Add some urgent tasks below, and I'll proactively help you schedule them, generate cheat sheets, and prevent any deadline panic.";
    }
  }

  return {
    text,
    suggestedActions
  };
}

function fallbackAutonomousExecute(taskId: string, taskTitle: string, title: string, contentInstruction: string) {
  const documentTitle = title || `Study Guide & Cheat Sheet: ${taskTitle}`;
  
  const markdownContent = `# ${documentTitle}
*Autonomous Asset drafted under Smart Local Backup Mode.*

## 📋 Task Context & Overview
- **Associated Task:** ${taskTitle}
- **Objective:** Complete core milestones with maximum efficiency and zero procrastination.
- **Goal:** ${contentInstruction || "Fulfill all academic or professional requirements step-by-step."}

---

## ⚡ Core Concepts & Definitions
1. **The 80/20 Rule (Pareto Principle):** Focus on the 20% of work that yields 80% of the results. Eliminate secondary distractions immediately.
2. **First-Principles Thinking:** Break the topic down into its fundamental truths and reason up from there, rather than reasoning by analogy.
3. **Active Recall:** Instead of passively re-reading, close this document and force your brain to retrieve key information.

---

## 📝 Comprehensive Action Plan
1. **Milestone 1 - Gather & Assess (15 mins):**
   - Collect all rubrics, notes, lectures, and files.
   - Do not spend more than 15 minutes organizing—start doing!
2. **Milestone 2 - Build the Outline (30 mins):**
   - Establish the backbone structure of your solution or essay.
   - Write out section headers first to map the cognitive flow.
3. **Milestone 3 - Focus Sprint (45 mins):**
   - Work in blocks of high-intensity focus.
   - Turn off your phone and all browser notifications.

---

## 💡 Quick-Reference Advice
- **Drafting Hack:** Write without editing. Turn off your inner critic during the first pass; you can polish it during the final 10% review.
- **Common Pitfall:** Getting bogged down in visual formatting or minor details before the core substance is complete. Focus on functionality first.

---
*Created by the Last-Minute Life Saver Companion Core. Stay focused and push through!*`;

  return {
    title: documentTitle,
    content: markdownContent
  };
}

function fallbackGenerateNudges(tasks: any[], calendarEvents: any[], habits: any[], currentTime: string) {
  const nudges: any[] = [];
  
  const urgentTasks = tasks ? tasks.filter(t => t.priority === "high" && !t.completed) : [];
  const mediumTasks = tasks ? tasks.filter(t => t.priority === "medium" && !t.completed) : [];
  
  if (urgentTasks.length > 0) {
    const mainUrgent = urgentTasks[0];
    nudges.push({
      id: "nudge-urgent-deadline",
      title: "⚠️ High-Priority Deadline Risk",
      message: `"${mainUrgent.title}" is flagged as urgent but has no active calendar time block. Let's schedule it now to guarantee completion.`,
      type: "alert",
      taskId: mainUrgent.id,
      actionLabel: "Auto-Schedule Now",
      actionPayload: {
        actionType: "autoSchedule",
        taskId: mainUrgent.id,
        taskTitle: mainUrgent.title,
        title: mainUrgent.title,
        suggestedStart: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }
    });

    nudges.push({
      id: "nudge-urgent-draft",
      title: "📝 Ready-to-Use Resource Draft",
      message: `Proactive outline prepared for "${mainUrgent.title}". I can draft a detailed study plan or code cheat-sheet to save you time.`,
      type: "draft",
      taskId: mainUrgent.id,
      actionLabel: "Generate Draft",
      actionPayload: {
        actionType: "generateDraft",
        taskId: mainUrgent.id,
        taskTitle: mainUrgent.title,
        title: `Cheat Sheet: ${mainUrgent.title}`,
        contentInstruction: "Draft a comprehensive cheat sheet and concept reference guide for this task."
      }
    });
  } else if (mediumTasks.length > 0) {
    const mainMed = mediumTasks[0];
    nudges.push({
      id: "nudge-med-breakdown",
      title: "💡 Structured Task Breakdown",
      message: `"${mainMed.title}" is a medium priority task. Breaking it into quick subtasks will make starting much easier!`,
      type: "tip",
      taskId: mainMed.id,
      actionLabel: "Generate Subtasks",
      actionPayload: {
        actionType: "createSubtasks",
        taskId: mainMed.id,
        taskTitle: mainMed.title,
        title: "Break Down Task",
        contentInstruction: "Create a list of 4 simple, low-energy subtasks to build positive momentum."
      }
    });
  } else {
    nudges.push({
      id: "nudge-general-habit",
      title: "🔋 Energy Optimization Tip",
      message: "Keep momentum high! Try utilizing 25-minute Pomodoro intervals punctuated by 5-minute cognitive breaks.",
      type: "tip",
      actionLabel: "Take a 5-Min Break",
      actionPayload: {
        actionType: "takeBreak"
      }
    });
  }

  return {
    nudges
  };
}

// --- HELPER TO CLEANLY PARSE GEMINI API ERRORS ---
function cleanErrorMessage(error: any): string {
  if (!error) return "Unknown error";
  const rawMsg = error.message || String(error);
  try {
    if (rawMsg.includes("{") && rawMsg.includes("}")) {
      const startIdx = rawMsg.indexOf("{");
      const endIdx = rawMsg.lastIndexOf("}") + 1;
      const jsonPart = rawMsg.substring(startIdx, endIdx);
      const parsed = JSON.parse(jsonPart);
      if (parsed.error && parsed.error.message) {
        return parsed.error.message;
      }
    }
  } catch (e) {
    // Ignore and fallback to raw
  }
  return rawMsg;
}

// 1. Prioritize Tasks Endpoint
app.post("/api/prioritize", async (req: Request, res: Response) => {
  const { tasks, currentTime } = req.body;
  try {
    if (!tasks || !Array.isArray(tasks)) {
      res.status(400).json({ error: "Missing or invalid tasks array" });
      return;
    }

    const ai = await getGeminiClientForUser(req);

    const prompt = `You are the core intelligence of the "Last-Minute Life Saver" productivity companion.
Your job is to analyze the user's tasks and return a prioritized, highly optimized plan.
Current time: ${currentTime || new Date().toISOString()}

User's raw tasks list:
${JSON.stringify(tasks, null, 2)}

Analyze each task's priority, difficulty, estimated duration, and due date. 
Provide:
1. An updated array of tasks with:
   - "priority" adjusted (high/medium/low) based on urgency and risk.
   - A list of actionable subtasks (break down complex tasks into manageable chunks of 30-45 mins).
   - "estimatedDuration" refined if the user's raw estimate seems unrealistic.
   - A descriptive "color" code matching the task urgency/category (e.g., #ef4444 for urgent high, #3b82f6 for study, etc.).
2. A high-level, human-readable priority advice summary justifying the choices.
3. Recommended focus time slots or general planning flow.

You must respond in strict JSON matching the requested schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              description: "The list of updated tasks with prioritization and subtasks",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  dueDate: { type: Type.STRING },
                  estimatedDuration: { type: Type.INTEGER },
                  priority: { type: Type.STRING, enum: ["high", "medium", "low"] },
                  energyRequired: { type: Type.STRING, enum: ["high", "medium", "low"] },
                  completed: { type: Type.BOOLEAN },
                  category: { type: Type.STRING },
                  color: { type: Type.STRING },
                  subtasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        completed: { type: Type.BOOLEAN }
                      },
                      required: ["id", "title", "completed"]
                    }
                  }
                },
                required: ["id", "title", "description", "dueDate", "estimatedDuration", "priority", "energyRequired", "completed", "category", "subtasks", "color"]
              }
            },
            adviceSummary: {
              type: Type.STRING,
              description: "A friendly, urgent yet supportive human justification of the new sequence"
            },
            focusTips: {
              type: Type.STRING,
              description: "Actionable tips on when to focus on these tasks based on urgency and energy levels"
            }
          },
          required: ["tasks", "adviceSummary", "focusTips"]
        }
      }
    });

    const resultText = response.text?.trim() || "{}";
    const parsed = JSON.parse(resultText);
    res.json({ ...parsed, engine: "gemini" });
  } catch (error: any) {
    const cleanMsg = cleanErrorMessage(error);
    console.warn("Notice: Prioritization failed (seamlessly falling back to local heuristic mode). Reason:", cleanMsg);
    const fallback = fallbackPrioritize(tasks, currentTime);
    res.json({ ...fallback, engine: "local_heuristic" });
  }
});

// 2. Chat Endpoint with Dynamic Action Proposal
app.post("/api/chat", async (req: Request, res: Response) => {
  const { message, chatHistory, tasks, calendarEvents, habits, currentTime, isVoice } = req.body;
  try {
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const ai = await getGeminiClientForUser(req);
    const modelToUse = isVoice ? "gemini-3.1-flash-live-preview" : "gemini-3.5-flash";

    const prompt = `You are the "Last-Minute Life Saver" productivity companion, a highly proactive, clever, and supportive productivity assistant.
Your goal is to save users (cramming students, swamped entrepreneurs, busy parents) from missing deadlines by shifting them from passive reminders to active completion.
You are extremely encouraging, slightly humorous, but laser-focused on actionable tasks.

Current Time: ${currentTime || new Date().toISOString()}

Current User State:
- Tasks: ${JSON.stringify(tasks || [])}
- Pre-scheduled Calendar Events: ${JSON.stringify(calendarEvents || [])}
- Goals/Habits: ${JSON.stringify(habits || [])}

User message: "${message}"

Respond with:
1. A conversational, supportive response text. Keep it brief, dynamic, and focused on solutions.
2. An optional array of "suggestedActions" that the user can execute directly in the app.
Allowed action types are:
  - "autoSchedule": Schedule a specific task onto the calendar. The payload MUST include "taskId", "title", "start" (ISO time slot, e.g., "2026-06-28T16:00:00-07:00"), and "end" (ISO time slot, e.g., "2026-06-28T17:30:00-07:00").
  - "createSubtasks": Add new subtasks to an existing task. Payload includes "taskId" and "subtasks" (array of strings).
  - "generateDraft": Generate draft material (study summary, check list, outline, message draft) for a task. Payload includes "taskId", "taskTitle", "title" (asset title), and "contentInstruction" (how to write it).
  - "createTask": Create a brand new urgent task. Payload includes "title", "dueDate", "estimatedDuration", "priority".

Structure your response as strict JSON with "text" and "suggestedActions". Only suggest actions that are highly relevant to the user's inquiry. If the user asks about scheduling, offer an "autoSchedule" action. If they ask about exam prep or writing, offer "generateDraft".`;

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            suggestedActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING, description: "Action button text, e.g., 'Auto-schedule Study Session'" },
                  action: { type: Type.STRING, description: "Action type: autoSchedule | createSubtasks | generateDraft | createTask" },
                  payload: {
                    type: Type.OBJECT,
                    description: "Details needed to carry out this action. Be complete!"
                  }
                },
                required: ["label", "action", "payload"]
              }
            }
          },
          required: ["text"]
        }
      }
    });

    const resultText = response.text?.trim() || "{}";
    const parsed = JSON.parse(resultText);
    res.json({ ...parsed, engine: "gemini" });
  } catch (error: any) {
    const cleanMsg = cleanErrorMessage(error);
    console.warn("Notice: Chat failed (seamlessly falling back to local heuristic mode). Reason:", cleanMsg);
    const fallback = fallbackChat(message, tasks, currentTime);
    res.json({ ...fallback, engine: "local_heuristic" });
  }
});

// 3. Autonomous Asset Drafting Endpoint
app.post("/api/autonomous-execute", async (req: Request, res: Response) => {
  const { taskId, taskTitle, title, contentInstruction } = req.body;
  try {
    if (!taskId || !taskTitle) {
      res.status(400).json({ error: "Missing taskId or taskTitle" });
      return;
    }

    const ai = await getGeminiClientForUser(req);

    const prompt = `You are the "Last-Minute Life Saver" productivity companion.
The user needs active execution help with the task: "${taskTitle}".
Specifically, they want you to generate a draft / asset: "${title || "Task Companion Draft"}".
Instruction guidelines: ${contentInstruction || "Create a comprehensive, high-quality, practical asset to help them complete this task."}

Write a structured, beautiful markdown document that provides real, valuable support.
It must NOT be placeholder text. Write actual, comprehensive content!
For exams: write cheat sheets, core formulas, key concept cards.
For writing tasks: write full outlines, key argument drafts, introductory paragraphs.
For administrative or professional tasks: write full drafts of emails, scripts, project checklists, or slide-by-slide plans.

Output a strict JSON response containing the markdown text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING, description: "Structured markdown content of the asset" }
          },
          required: ["title", "content"]
        }
      }
    });

    const resultText = response.text?.trim() || "{}";
    const parsed = JSON.parse(resultText);
    res.json({ ...parsed, engine: "gemini" });
  } catch (error: any) {
    const cleanMsg = cleanErrorMessage(error);
    console.warn("Notice: Asset drafting failed (seamlessly falling back to local heuristic mode). Reason:", cleanMsg);
    const fallback = fallbackAutonomousExecute(taskId, taskTitle, title, contentInstruction);
    res.json({ ...fallback, engine: "local_heuristic" });
  }
});

// 4. Proactive Smart Nudge Generation Endpoint
app.post("/api/generate-nudges", async (req: Request, res: Response) => {
  const { tasks, calendarEvents, habits, currentTime } = req.body;
  try {
    const ai = await getGeminiClientForUser(req);

    const prompt = `You are the "Last-Minute Life Saver" companion. Analyze the current state and generate active "proactive nudges" for the user.
Current Time: ${currentTime || new Date().toISOString()}

State:
- Tasks: ${JSON.stringify(tasks || [])}
- Calendar: ${JSON.stringify(calendarEvents || [])}
- Habits: ${JSON.stringify(habits || [])}

Generate 2 to 3 contextual, high-impact alerts or suggestions. Each suggestion must be styled to nudge the user to action.
Types of alerts:
- "alert": Serious danger of missing a deadline (e.g., CS assignment is due tomorrow, takes 3 hours, and is unscheduled).
- "tip": Actionable habit or focus advice (e.g., "Take a 5-min walk now because your scheduled blocks are back-to-back").
- "action": Direct quick win (e.g., "Complete task 'Call Mom' which takes only 15 mins to clear your morning").
- "draft": Ready-made help proposal (e.g., "I can write a study summary outline for your CS exam. Click below to draft.").

Include specific metadata in "actionPayload" for each action so the frontend can execute it with one click.
For "alert/action", the "actionPayload" can specify an "autoSchedule" action.
For "draft", the "actionPayload" can specify a "generateDraft" payload.

Structure your response as strict JSON matching the schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nudges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING, description: "Short urgent title, e.g., '⚠️ Midnight Deadline Risk'" },
                  message: { type: Type.STRING, description: "Context-aware explanation with numbers or reasons" },
                  type: { type: Type.STRING, enum: ["alert", "tip", "action", "draft"] },
                  taskId: { type: Type.STRING, description: "Optional relevant taskId" },
                  actionLabel: { type: Type.STRING, description: "Button text, e.g., 'Auto-Schedule Now' or 'Generate Draft'" },
                  actionPayload: {
                    type: Type.OBJECT,
                    properties: {
                      actionType: { type: Type.STRING, enum: ["autoSchedule", "generateDraft", "completeTask", "takeBreak"] },
                      taskId: { type: Type.STRING },
                      taskTitle: { type: Type.STRING },
                      title: { type: Type.STRING },
                      contentInstruction: { type: Type.STRING },
                      suggestedStart: { type: Type.STRING, description: "ISO String" }
                    },
                    required: ["actionType"]
                  }
                },
                required: ["id", "title", "message", "type", "actionLabel", "actionPayload"]
              }
            }
          },
          required: ["nudges"]
        }
      }
    });

    const resultText = response.text?.trim() || "{}";
    const parsed = JSON.parse(resultText);
    res.json({ ...parsed, engine: "gemini" });
  } catch (error: any) {
    const cleanMsg = cleanErrorMessage(error);
    console.warn("Notice: Nudge generation failed (seamlessly falling back to local heuristic mode). Reason:", cleanMsg);
    const fallback = fallbackGenerateNudges(tasks, calendarEvents, habits, currentTime);
    res.json({ ...fallback, engine: "local_heuristic" });
  }
});

// Start Backend API Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Last-Minute Life Saver backend server running on port ${PORT}`);
});
