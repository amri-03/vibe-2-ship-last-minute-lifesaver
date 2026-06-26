# Master File Referencing & Agent Assignment Plan
**Status**: Active & Locked  
**System Rule**: One File, One Owner. No two agents may edit the same file in a single sprint.

---

## 1. File Ownership Matrix

To prevent code conflicts and overwrites during parallel development, files are strictly locked to their designated owner agents:

| Agent Name & Role | Primary File Ownership | Current Active Task |
| :--- | :--- | :--- |
| **Agent 1** (Master Developer) | `/` (Git Root, Build checks) | **Release Engineer**: Executes local compilations and final git commits once all files are verified. |
| **Agent 2** (QA Auditor) | `directives/task.md` | **QA Auditor**: Oversees runtime validation and audits compliance with the evaluation matrix. |
| **Agent 3** (Strategic Analyst) | `docs/phase_1_specification.md` | **Strategy Writer**: Updates the functional specification to outline multi-user security requirements and session parameters. |
| **Agent 4** (UX Designer) | `docs/visual_tokens_spec.md` | **Design System Writer**: Updates the visual tokens sheet with Lora/Jakarta typography and inputs focus states. |
| **Agent 5** (DB Architect) | `backend/schema.sql` | **DB Configurer**: Executes the multi-user SQL DDL script and validates cascading deletes in Supabase. |
| **Agent 6** (API Architect) | `docs/api_specification.md` | **API Spec Writer**: Refactors endpoint specifications to outline the new register and config routes. |
| **Agent 7** (Structure Developer) | `frontend/src/context/` | **Boilerplate Engineer**: Creates the directory structures and empty boilerplate skeletons for AuthContext.tsx. |
| **Agent 8** (Visual QA Agent) | `frontend/src/components/Timeline/` | **UI Artist**: Overhauls the Chronicle column, scales up the Day Dial clock SVG, and centers the vertical spine axis. |
| **Agent 9** (Backend Engineer) | `backend/src/controllers/auth.ts` | **Auth Developer**: Writes the backend login, register, and isolated demo database seeding controller logic. |
| **Agent 10** (Integration Agent) | `frontend/src/pages/Gateway.tsx` | **Gateway Developer**: Implements the dual-state login/register forms, stacked brand headers, and secure Axios triggers. |

---

## 2. Cross-Referencing Protocol

Agents must read dependent files to ensure integrations match, using these
updated rules:

1.  Frontend-to-Backend Contract:
      - Agent 10 (Frontend) must read docs/api_specification.md (written by
        Agent 6) before writing any Axios fetch bodies to ensure route names and
        JSON payloads match.
2.  Controller-to-Database Schema:
      - Agent 9 (Backend) must read backend/schema.sql (written by Agent 5)
        before writing the SQL insert and select queries in controllers/auth.ts
        to ensure table structures and UUID datatypes align.
3.  UI-to-Style Token Sheet (The New Visual Rule):
      - Agent 10 (Gateway Page) and Agent 8 (Chronicle Column) must read
        docs/visual_tokens_spec.md (updated by Agent 4) before setting any
        typography classes, border highlights, or form-input focus states to
        ensure strict Zen-Editorial compliance.
4.  Integration-to-Boilerplate Hook:
      - Agent 10 (Frontend) must read frontend/src/context/ (prepped by Agent 7)
        to inherit the base AuthContext variables and route wrappers before
        writing the Gateway forms.
5.  Controller-to-Requirements Spec:
      - Agent 9 (Backend) must read docs/phase_1_specification.md (updated by
        Agent 3) to ensure that password hashing rounds and session durations
        meet the project's security constraints.

---

## 3. Active Sprints & Hand-off Flow

The work is organized into four parallel pipelines, converging into a single
verified compilation:

[ PHASE A: Specifications & Skeletons (Parallel) ]
┌─────────────────────────┐     ┌─────────────────────────┐
│  Agent 3 (Strategy)     │ ──> │  Agent 6 (API Spec)     │ ──┐
│  Updates Phase 1 Spec   │     │  Refactors Endpoints    │   │
└─────────────────────────┘     └─────────────────────────┘   │
┌─────────────────────────┐     ┌─────────────────────────┐   │
│  Agent 4 (UX/Design)    │ ──> │  Agent 10 (Frontend)    │   │
│  Updates Visual Tokens  │     │  Reads Design Spec      │   │
└─────────────────────────┘     └─────────────────────────┘   │
┌─────────────────────────┐                                   │
│  Agent 5 (DB Schema)    │ ──────────────────────────────────┼──> [ PHASE B: Backend Dev ]
│  Runs SQL DDL Schema    │                                   │    Agent 9 (Backend)
└─────────────────────────┘                                   │    Codes Auth, config,
┌─────────────────────────┐                                   │    and seed controllers.
│  Agent 7 (Structure)    │ ──────────────────────────────────┘
│  Preps AuthContext      │
└─────────────────────────┘

                                                                   │
                                                                   ▼
                                                           [ PHASE C: Frontend Dev (Parallel) ]
                                                           ┌─────────────────────────┐
                                                           │  Agent 10 (Frontend)    │ ──┐
                                                           │  Codes Gateway UI Form  │   │
                                                           └─────────────────────────┘   │
                                                           ┌─────────────────────────┐   │
                                                           │  Agent 8 (Visual QA)    │ ──┼──> [ PHASE D: Audit & Release ]
                                                           │  Overhauls Cockpit UI   │   │    Agent 2 audits completeness
                                                           └─────────────────────────┘   │    Agent 1 runs build & local Git.
                                                                                         │
                                                                                         ▼
