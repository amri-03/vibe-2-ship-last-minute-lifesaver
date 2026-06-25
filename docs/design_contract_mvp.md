# Design Contract: 2-Page MVP Architecture
**Product**: The Last-Minute Life Saver (Proactive AI Companion)  
**Layout System**: Warm Minimalist (Generous padding, sparse borders, light structural clarity)

This design contract details the structural layout, responsive grids, and visual states for the 2-Page Minimum Viable Product (MVP) architecture. It is built upon the approved **Organic Chrono-Stage** hybrid layout.

---

## PAGE 1: THE GATEWAY / SETUP SCREEN

The Gateway screen serves as the single entry point, facilitating secure user authentication and onboarding. It has been redesigned from a single-user credentials locker to a traditional multi-user authentication model featuring a toggled layout.

### 1.1 Brand Typography & Header Styling
*   **Top Eyebrow**: `LAST-MINUTE` (font-jakarta, `text-sm`, `tracking-widest`, `uppercase`, light font weight).
*   **Hero Brand Title**: `Life Saver` (font-lora, `text-4xl`, medium weight).
*   **De-cluttered Subtitle**: `Proactive AI Productivity Companion` (font-jakarta, `text-charcoal`, single line).

### 1.2 Layout A: Sign In State
This state is active by default. It displays the credentials input blocks for returning users.

```
                      . . . . . . . . . . . . . . . . . . . . .
                      .              LAST-MINUTE              .
                      .              LIFE SAVER               .
                      .   Proactive AI Productivity Companion .
                      . . . . . . . . . . . . . . . . . . . . .

                      
      [ Username/Email  ]  . . . . . . . . . . . . . . . . . . . . .
                           
      [ Password        ]  . . . . . . . . . . . . . . . . . . . . .
                           (Auto-cleared on mount & transition)

                           [ Sign In ]

                      -----------------------------------------
                             New here? Create an account
```

### 1.3 Layout B: Registration State
Triggered by clicking the transition toggle link. It displays fields to register a new account on the Supabase backend.

```
                      . . . . . . . . . . . . . . . . . . . . .
                      .              LAST-MINUTE              .
                      .              LIFE SAVER               .
                      .   Proactive AI Productivity Companion .
                      . . . . . . . . . . . . . . . . . . . . .

                      
      [ Username/Email  ]  . . . . . . . . . . . . . . . . . . . . .
                           
      [ Password        ]  . . . . . . . . . . . . . . . . . . . . .
                           (Auto-cleared on mount & transition)

      [ Confirm Password]  . . . . . . . . . . . . . . . . . . . . .
                           (Auto-cleared on mount & transition)

                           [ Create Account ]

                      -----------------------------------------
                           Already have an account? Sign in
```

### 1.4 Password Hygiene & State Rules
> [!IMPORTANT]
> To ensure local session security and prevent browser caching of stale values, the password and confirm password text states MUST be explicitly wiped empty (`""`) when:
> 1. The Gateway component mounts.
> 2. The user switches between "Sign In" and "Registration" states.

### 1.5 Layout Rules (Page 1)
*   **Viewport Alignment**: Absolute vertical and horizontal centering.
*   **Width Constraint**: Maximum width of `480px` for the card container to prevent wide stretching on desktop viewports.
*   **Aesthetics**: Glassmorphism card backdrops (soft backdrop-blur, semi-transparent white/dark borders, thin borders).
*   **Margins**: `48px` padding inside the card; elements are separated by `24px` margins.

---

## PAGE 2: THE CHRONO-STAGE COCKPIT (MAIN DASHBOARD)

The cockpit is the primary workspace. It splits the viewport into a 30% Left Chronicle (for temporal context) and a 70% Right Focus Stage (for active execution and AI support).

### 2.1 Structural Grid Layout

```
+---------------------------------------------------------------------------------+
| [logo] Life Saver                                      [Debug] [Settings] [Lock] |
+---------------------------------------------------------------------------------+
|                                       |                                         |
|  THE CHRONICLE (30%)                  |  THE FOCUS STAGE (70%)                  |
|                                       |                                         |
|  [ Day Dial ]                         |  . . . . . . . . . . . . . . . . . . .  |
|      12                               |  .                                   .  |
|    . - .                              |  .         ACTIVE FOCUS CARD         .  |
|   /  *  \  <- Pulse (Current time)    |  .                                   .  |
|   \     /                             |  .    "Write Project Specification"  .  |
|    ' - '                              |  .    Est: 1.5h | Priority: High     .  |
|      6                                |  .                                   .  |
|                                       |  .    [ Start Session ]  [ Snooze ]  .  |
|  [ Timeline Spine ]                   |  .                                   .  |
|   |                                   |  . . . . . . . . . . . . . . . . . . .  |
|   o- 09:00 Daily Standup              |                                         |
|   |                                   |  =====================================  |
|   *-[AI Intervention]                 |  ^ AI INTERVENTION SHEET (Slide-up)    |
|   |  "Propose Focus Block?"           |  |                                     |
|   |                                   |  | "Here is a starter outline I've     |
|   o- 12:00 Lunch                      |  | drafted for your project spec."    |
|   |                                   |  | [ Accept outline ] [ Edit Outline ] |
|                                       |  =====================================  |
+---------------------------------------------------------------------------------+
```

### 2.2 Layout & Grid Specifications
*   **Grid Division**: A single, clean responsive flex layout. On desktop (`>= 1024px`), it uses a `30vw` left column and `70vw` right column. On mobile/tablet (`< 1024px`), it stacks vertically, hiding the Day Dial and collapsing the Timeline Spine into a horizontal timeline bar.
*   **The Chronicle Column (30% Left)**:
    *   **Day Dial**: Centered horizontally at the top of the column. A circular radial meter depicting the day's progression with light arc segments representing focus blocks (filled) and free periods (empty).
    *   **Timeline Spine**: A vertical line showing scheduled slots and inline AI Intervention nudges. 
*   **The Focus Stage Column (70% Right)**:
    *   **Active Focus Card**: A large, clean card taking up the center of the right canvas. This shows the immediate active priority.
    *   **Slide-up AI Intervention Sheet**: A drawer that slides up from the bottom of the Focus Stage when an AI recommendation or draft is active (e.g., email drafts, outline drafts, rescheduling requests).

---

## 2.3 OVERLAYS AND EXTENSIONS

These components exist off-canvas or as overlays and are triggered by utility icons in the header bar.

### A. Settings Modal (Overlay)
*   **Trigger**: Clicking `[Settings]` in the top header.
*   **Behavior**: Centered glassmorphic modal with a dark backdrop overlay (`backdrop-filter: blur(8px)`).
*   **Fields**:
    *   Update Gemini API Key.
    *   Disconnect Google Account (Revoke access token).
    *   Configure background sync interval (e.g., 5 mins, 15 mins).
    *   Reset Master Password.

### B. Developer / Judge Debug Console (Slide-out panel)
*   **Trigger**: Clicking `[Debug]` in the top header.
*   **Behavior**: Slides out from the right viewport border, overlaying 25% of the screen.
*   **Features**:
    *   **[ Seed Demo Data ]**: Direct action to trigger a backend seed script. It populates Supabase with a mock user workspace containing pre-filled calendar blocks, past achievements, and simulated tasks.
    *   **OAuth Diagnostics**: Displays active token expiration counters, scopes granted, and Supabase connection statuses.
    *   **API Response Logger**: A small terminal block showing the raw JSON return from the latest Gemini API request.
