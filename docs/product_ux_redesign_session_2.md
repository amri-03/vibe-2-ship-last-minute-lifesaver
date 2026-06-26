# Session 2 Product & UX Redesign

**Product:** Last-Minute Life Saver  
**Date:** June 26, 2026  
**Focus:** Product experience, information architecture, navigation, user journey, interaction flow, cognitive load, and usability  
**Scope boundary:** This document does not define implementation tasks, technical architecture, or code changes.

## 1. Product Lens

Last-Minute Life Saver should not feel like a dashboard for managing productivity data. It should feel like a calm decision system that helps a person recover momentum when time, attention, and deadlines are competing.

The practical product promise is:

> "I know what matters next, I understand why, and I have something ready so I can start now."

This is stronger than positioning the product as an AI calendar, task manager, chatbot, or habit tracker. Those are supporting capabilities. The core value is reducing the distance between obligation and action.

## 2. Current Experience Diagnosis

The current documentation contains useful product ingredients, but the overall experience is carrying too many competing concepts at the same level.

### 2.1 What Is Working

- The selected problem is clear and practical: passive reminders are not enough.
- The strongest product idea is proactive preparation: drafts, schedule proposals, and intervention cards.
- The "Chrono-Stage Cockpit" direction gives the product a distinctive identity.
- The active focus concept is more valuable than a generic task list.
- Calendar integration is a meaningful source of user context, not just a feature checkbox.

### 2.2 Primary UX Risks

#### Risk 1: The Product May Feel Like a Control Room Instead of a Companion

The current cockpit framing includes a chronicle, day dial, timeline spine, focus stage, intervention sheet, chat drawer, settings modal, debug panel, voice input, and authentication flow. This can make the user feel like they are operating a system rather than being helped by one.

For a user under deadline pressure, the interface should reduce decisions, not expose every possible system state.

#### Risk 2: AI Actions Are Not Yet Organized Around User Trust

The product proposes autonomous planning, drafting, nudging, and rescheduling. These are useful, but they need a trust model:

- What did the AI notice?
- What is it proposing?
- What will happen if I approve?
- Can I undo it?
- Why is this better than doing nothing?

Without that structure, proactive AI can feel unpredictable.

#### Risk 3: Navigation Is Currently Feature-Led

The current design separates areas by feature type: calendar/timeline, task card, intervention sheet, chat drawer, settings, debug. A practical user thinks in outcomes:

- What should I do now?
- What is coming up?
- What has the assistant prepared?
- What needs my approval?
- What can I ignore safely?

Navigation should follow those mental models.

#### Risk 4: First-Time Use Has Too Much Setup Before Value

Calendar connection, Gemini configuration, account setup, seeded demo data, and settings are all relevant, but the product should show value before asking for full trust. The first session should quickly demonstrate the assistant's decision-making with a lightweight sample or imported task.

#### Risk 5: Single-User vs Multi-User Product Shape Is Unresolved

The docs conflict between a single-user productivity cockpit and multi-user registration. From a real-world UX standpoint, the product should begin as a personal workspace. Multi-user account infrastructure should not appear in the product narrative unless there is a concrete collaborative use case.

Recommendation: keep the experience personal-first. Use "your workspace," "your calendar," "your focus plan," and "your approvals." Avoid designing for teams until the individual workflow is genuinely strong.

## 3. Recommended Product Simplification

### 3.1 Reframe The Product Around Three Surfaces

The product should have three primary surfaces, not many panels:

1. **Now**
   - The single best next action.
   - Shows the active task, available time, reason for priority, and prepared starter material.

2. **Next**
   - A short forward-looking plan.
   - Shows upcoming deadlines, proposed focus blocks, and tasks at risk.

3. **Prepared**
   - AI-generated drafts and plans awaiting review.
   - Shows what the assistant has already done and what needs user approval.

Everything else should be secondary: settings, calendar connection, account, debug tools, and raw logs.

### 3.2 Replace "Dashboard" Thinking With "Triage" Thinking

A dashboard displays many things. This product should triage.

The daily user should not scan a complex interface to infer priority. The product should make a defensible recommendation and let the user inspect the reasoning only when needed.

Recommended hierarchy:

1. Immediate recommended action.
2. Reason it matters.
3. Time available or time required.
4. Prepared asset or first step.
5. Alternative actions.
6. Wider schedule context.

## 4. Revised Information Architecture

### 4.1 Primary Navigation

Use three top-level destinations:

| Destination | User Question | Primary Content |
| :--- | :--- | :--- |
| Now | "What should I do right now?" | Active focus recommendation, prepared start, timer/session controls |
| Plan | "What is my realistic schedule?" | Timeline, focus blocks, deadlines, rescheduling suggestions |
| Prepared | "What has AI made for me?" | Drafts, outlines, emails, plans, approval cards |

### 4.2 Secondary Navigation

Secondary controls should live in predictable utility areas:

| Area | Purpose |
| :--- | :--- |
| Settings | Calendar connection, AI key/status, notification preferences |
| Review activity | Recent accepted/dismissed AI actions |
| Demo/dev tools | Hidden or visually separated from the real user experience |
| Help/empty-state guidance | Contextual, only when the user has no data or is blocked |

### 4.3 Naming Recommendations

Avoid internal or theatrical names in primary navigation unless they improve comprehension.

Recommended product vocabulary:

- "Now" instead of "Focus Stage"
- "Plan" instead of "Chronicle"
- "Prepared" instead of "Intervention Feed"
- "Suggestion" instead of "AI Intervention"
- "Start session" instead of "Execute"
- "Approve" only when approving causes a real change
- "Save to calendar" instead of "Accept scheduling proposal"
- "Use draft" instead of "Accept outline"

The product can still preserve personality visually, but core labels should be plain.

## 5. Revised User Journey

### 5.1 First-Time User Journey

Goal: help the user understand the product before demanding setup effort.

1. User lands on a focused welcome screen.
2. Product asks for one task or offers sample data.
3. User enters a real obligation in plain language.
4. Product returns a simple recommendation:
   - priority
   - estimated effort
   - suggested focus window
   - prepared first step
5. User is invited to connect calendar only when scheduling becomes useful.
6. User sees the Now screen with one recommended action.

Principle: earn permission progressively.

### 5.2 Daily User Journey

Goal: let the user regain orientation in under 30 seconds.

1. User opens the app.
2. The Now screen states the recommended action.
3. The user sees why it matters and what is ready.
4. The user chooses:
   - Start session
   - Use prepared draft
   - Move to later
   - Show alternatives
5. The app updates the plan and keeps the wider timeline available but not dominant.

Principle: every daily session begins with a decision, not a dashboard scan.

### 5.3 Practical Professional Journey

Goal: support confidence, control, and low embarrassment risk.

1. User reviews AI-prepared material before using it.
2. The product clearly separates draft content from committed calendar changes.
3. Calendar writes require explicit confirmation.
4. Suggestions include short reasoning, not opaque confidence scores.
5. Dismissed suggestions stay out of the way but remain recoverable.

Principle: professionals need speed, but not at the cost of control.

## 6. Core Interaction Model

### 6.1 The Suggestion Card Pattern

All proactive AI behavior should use a consistent card structure:

```text
+--------------------------------------------------+
| Suggested next move                              |
|                                                  |
| Finish the project outline before 4:30 PM        |
|                                                  |
| Why this matters                                 |
| Due tomorrow. Estimated 90 minutes. You have     |
| one clear block before your evening commitment.  |
|                                                  |
| Prepared                                         |
| Starter outline is ready.                        |
|                                                  |
| [Start session] [Use draft] [Move] [Dismiss]     |
+--------------------------------------------------+
```

This pattern should be reused for schedule proposals, drafts, nudges, and missed-block recovery. Consistency matters more than novelty.

### 6.2 Action Confidence Levels

The product should distinguish between low-risk and high-risk actions.

| Action Type | UX Treatment |
| :--- | :--- |
| Generate draft | Can happen proactively; user reviews before use |
| Recommend priority | Can happen automatically; explanation available |
| Create calendar block | Requires confirmation |
| Move existing calendar event | Requires strong confirmation and preview |
| Mark task complete | User-controlled |
| Delete data | Explicit confirmation and recovery path where possible |

### 6.3 AI Reasoning Display

Do not show long AI explanations by default. Show compact reasoning:

```text
Why now
Due in 18 hours
Needs about 75 minutes
You have a clear block at 3:00 PM
No draft exists yet
```

Provide "show details" only for users who want more.

## 7. Low-Fidelity Conceptual Layouts

### 7.1 Recommended Desktop Layout

```text
+--------------------------------------------------------------------------------+
| Life Saver                                      Plan health   Settings   Account |
+--------------------------------------------------------------------------------+
|                                                                                |
|  NOW                                                                           |
|  +--------------------------------------------------------+  +----------------+ |
|  | Recommended next move                                 |  | Today          | |
|  |                                                        |  |                | |
|  | Write the first version of the client proposal         |  | 10:00 Meeting  | |
|  | Due tomorrow. 90 min estimated. Draft prepared.        |  | 12:30 Lunch    | |
|  |                                                        |  | 15:00 Focus    | |
|  | [Start session] [Use draft] [Move to later]            |  | 18:00 Errand   | |
|  +--------------------------------------------------------+  +----------------+ |
|                                                                                |
|  PREPARED FOR YOU                                                              |
|  +----------------------+ +----------------------+ +-------------------------+ |
|  | Proposal outline     | | Email reply draft    | | Reschedule suggestion   | |
|  | Ready to review      | | Ready to edit        | | Needs approval          | |
|  +----------------------+ +----------------------+ +-------------------------+ |
|                                                                                |
+--------------------------------------------------------------------------------+
```

### 7.2 Recommended Mobile Layout

```text
+----------------------------------+
| Life Saver            Settings   |
+----------------------------------+
| NOW                              |
|                                  |
| Write the client proposal        |
| Due tomorrow                     |
| Draft prepared                   |
|                                  |
| [Start session]                  |
| [Use draft]                      |
| [Move]                           |
|                                  |
| Why now                          |
| Due in 18 hours                  |
| 90 min estimated                 |
| Clear block at 3:00 PM           |
|                                  |
| Prepared                         |
| - Proposal outline               |
| - Follow-up email                |
+----------------------------------+
| Now        Plan       Prepared   |
+----------------------------------+
```

### 7.3 Prepared Review Flow

```text
+--------------------------------------------------+
| Proposal outline                                  |
| Created for: Client proposal                      |
|                                                  |
| [Draft content preview]                           |
|                                                  |
| What do you want to do?                           |
| [Use in task] [Edit] [Regenerate] [Discard]       |
+--------------------------------------------------+
```

Prepared content should never feel like it has been silently committed. It is material waiting for the user's judgment.

## 8. Cognitive Load Recommendations

### 8.1 Reduce Simultaneous Objects

Avoid showing all of these at once:

- full task list
- full calendar
- chat panel
- AI cards
- debug logs
- settings status
- voice controls
- habit tracker

Recommended default: one main recommendation, one compact day context, and a short prepared list.

### 8.2 Collapse Advanced Tools

Debug console, API logs, sync diagnostics, and seeded data controls should be visually outside the normal product experience. They are useful for testing but harmful if they become part of the everyday mental model.

### 8.3 Make Empty States Actionable

Examples:

- No tasks: "Add one deadline to build your first plan."
- Calendar not connected: "Connect calendar to find focus time. You can still plan manually."
- No prepared drafts: "Drafts appear when a task needs a starting point."
- AI unavailable: "Planning is paused. Your tasks and calendar still work."

## 9. Accessibility And Confidence

### 9.1 Accessibility Principles

- Do not rely on color alone for priority.
- Use readable contrast, especially for glass-style surfaces.
- Keep button labels explicit.
- Support keyboard navigation for cards, modals, and bottom navigation.
- Avoid motion that blocks task completion.
- Respect reduced motion preferences.
- Keep mobile touch targets large and stable.

### 9.2 Confidence Principles

The user should always know:

- what is recommended
- why it is recommended
- what action will happen next
- whether the action affects their calendar or only the app
- how to reverse or dismiss the suggestion

## 10. Product Decisions Recommended

### Decision 1: Make "Now" The Home Screen

The app should open on the best next action, not a general dashboard.

### Decision 2: Treat AI As Preparation, Not Automation First

The assistant earns trust by preparing useful starts. Higher-autonomy actions should remain approval-based.

### Decision 3: Keep The Product Personal-First

Resolve the current documentation drift by designing for one person's productivity loop before adding multi-user account concepts.

### Decision 4: Use Plain Navigation Labels

Keep expressive product language in visuals and microcopy. Use practical labels for controls and navigation.

### Decision 5: Standardize Proactive Suggestions

Every proactive feature should appear through the same suggestion-card grammar: recommendation, reason, prepared asset, action choices.

## 11. What To Remove Or Deprioritize From The Core Experience

These ideas may still exist, but should not be core to the first product experience:

- Always-visible chat drawer
- Day dial as the dominant navigation device
- Habit tracking as a primary feature
- Voice input as a headline capability
- Debug console in the main header for normal users
- Raw AI logs in the primary UI
- Multi-user registration language
- Complex glassmorphism that reduces contrast or readability

The product becomes stronger if these are treated as optional layers rather than central surfaces.

## 12. North Star Experience

A successful version of Last-Minute Life Saver should make a user feel:

- oriented within seconds
- confident about the next action
- supported by prepared material
- in control of calendar changes
- less punished for procrastinating
- able to recover momentum without reorganizing their whole life

The product should not try to make productivity feel magical. It should make it feel recoverable.

