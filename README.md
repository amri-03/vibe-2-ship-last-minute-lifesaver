# Last-Minute Life Saver: Proactive AI Productivity Companion

An active, intelligent productivity companion built to move beyond passive notifications and help users plan, prioritize, and complete tasks before deadlines. Designed with a clean, distraction-free **Zen-Editorial / Tactile Paper** aesthetic and a secure **Multi-User SaaS Architecture**.

---

## 🚀 Key Features

*   **The Cockpit Dashboard**: A zero-scroll, high-legibility interface that puts your schedule and the next most critical task in absolute focus.
*   **The Day Dial**: An interactive, SVG-rendered visual spine displaying scheduled blocks and the current timeline dial.
*   **Proactive AI Interventions**: Powered by Google Gemini to analyze user state and surface:
    *   *Draft Proposals*: Pre-packaged outline templates and drafts associated with task goals.
    *   *Scheduling Proposals*: Optimal calendar slots for focus blocks with one-click write-through to Google Calendar.
    *   *Procrastination Nudges*: Spawning immediate, calendar-synced active focus blocks when cognitive resistance or inertia is identified.
*   **Secure Multi-User Database**: Partitioned Supabase schema utilizing UUID primary keys, cascaded relationships, and symmetric encryption (AES-256-GCM) at rest for sensitive user credentials/Gemini keys.

---

## 📁 Repository Structure

```text
Vibe_2_Ship/
├── backend/               # Express / TypeScript / Node.js Server
│   ├── src/
│   │   ├── controllers/   # Auth, tasks, focus blocks, and intervention APIs
│   │   ├── middleware/    # JWT auth and global error handling
│   │   ├── routes/        # Router mappings
│   │   └── services/      # Google Calendar OAuth, Supabase client, & Gemini pipeline
│   ├── schema.sql         # Supabase DDL SQL Schema (partitioned tables & cascade deletes)
│   └── package.json
├── frontend/              # React / Vite / TypeScript Client
│   ├── src/
│   │   ├── components/    # Day Dial, Task Lists, and UI Elements
│   │   ├── context/       # Auth state wrappers and navigation routing
│   │   └── pages/         # Gateway (Onboarding/Login/Register) and Dashboard views
│   └── package.json
├── directives/            # System directives & guidelines
│   ├── MINDSET_DIRECTIVE.md # SaaS Product-Mindset Constraint
│   └── FILE_REFERENCING_PLAN.md # 10-Agent Ownership Matrix
└── .gitignore
```

---

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), TypeScript, Tailwind CSS, Lucide Icons, Axios.
*   **Backend**: Node.js, Express, TypeScript, Nodemon, JWT, Bcrypt.
*   **AI & APIs**: Google Gemini API (via Google AI Studio SDK), Google Calendar API (OAuth 2.0 client lifecycle + offline refresh token rotation).
*   **Database**: Supabase (PostgreSQL) with AES-256-GCM symmetric encryption for credential storage.

---

## ⚙️ Quick Start

### 1. Prerequisites
Ensure you have Node.js (v18+) and npm installed.

### 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` folder based on `.resources/.env` and supply:
   ```env
   PORT=3000
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   ENCRYPTION_KEY=your_32_byte_hex_encryption_key
   JWT_SECRET=your_jwt_signing_secret
   ```
4. Run the database migrations using `backend/schema.sql` in your Supabase SQL Editor.
5. Start the backend developer server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Supply a `firebase-applet-config.json` configuration file in the `frontend/` directory (template details in `.resources/`).
4. Start the frontend developer server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`.
