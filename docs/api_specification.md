# API Endpoint & Integration Specifications

**Phase 3: Integration & Backend Systems — Step B**
- **Document Status**: Proposal (Ready for Review)
- **Date**: June 24, 2026
- **Author**: Technical Architect Agent
- **Target Location**: [api_specification.md](file:///c:/Developer_Workspace/active_projects/AI-Projects/Vibe_2_Ship/docs/api_specification.md)
- **Database Schema Reference**: [schema.sql](file:///c:/Developer_Workspace/active_projects/AI-Projects/Vibe_2_Ship/backend/schema.sql)
- **Database Guide Reference**: [database_setup.md](file:///c:/Developer_Workspace/active_projects/AI-Projects/Vibe_2_Ship/docs/database_setup.md)

---

## 1. Authentication Routing System

The database enforces a single-user architecture using a table-level check constraint `sole_user_record (id = 1)`. The routes below manage first-time initialization, secure login, and session validation.

All protected endpoints require a short-lived local JWT passed via the `Authorization: Bearer <token>` header.

### 1.1 POST /api/auth/setup
- **Description**: First-time initialization of the system. Hashes the master password, encrypts optional initial credentials (e.g., Gemini API key), and inserts the sole profile record.
- **Access Control**: Public (but fails if a profile already exists).
- **Request Headers**:
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "masterPassword": "secure_master_password_123",
    "geminiApiKey": "AIzaSyYourGeminiApiKeyHere"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "First-time setup completed successfully.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZXhwIjoxNzg0NzY4OTAwfQ...",
    "profile": {
      "id": 1,
      "googleUserEmail": null,
      "geminiApiKeyConfigured": true,
      "createdAt": "2026-06-24T16:45:00.000Z"
    }
  }
  ```
- **Error Boundaries**:
  - **400 Bad Request (Setup Already Completed)**:
    ```json
    {
      "error": "SETUP_ALREADY_COMPLETED",
      "message": "Setup has already been run. The database is initialized."
    }
    ```
  - **400 Bad Request (Validation Failure)**:
    ```json
    {
      "error": "VALIDATION_FAILED",
      "message": "Password must be at least 8 characters long."
    }
    ```

### 1.2 POST /api/auth/login
- **Description**: Verifies the master password against the bcrypt hash in the database and generates a short-lived session token.
- **Access Control**: Public.
- **Request Headers**:
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "masterPassword": "secure_master_password_123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZXhwIjoxNzg0NzY4OTAwfQ...",
    "expiresInSeconds": 7200
  }
  ```
- **Error Boundaries**:
  - **401 Unauthorized (Incorrect Password)**:
    ```json
    {
      "error": "INVALID_CREDENTIALS",
      "message": "The master password provided is incorrect."
    }
    ```
  - **400 Bad Request (Setup Required)**:
    ```json
    {
      "error": "SETUP_REQUIRED",
      "message": "The database has not been initialized. Run setup first."
    }
    ```

### 1.3 GET /api/auth/status
- **Description**: Returns the system onboarding state and the active session status. Used by the frontend on mount to determine whether to show the Setup Screen, Login Screen, or the Dashboard.
- **Access Control**: Public (Accepts optional `Authorization` header to check session status).
- **Response (200 OK - Authenticated & Setup Complete)**:
  ```json
  {
    "setupCompleted": true,
    "isAuthenticated": true,
    "googleConnected": true,
    "geminiConfigured": true,
    "googleUserEmail": "user@example.com"
  }
  ```
- **Response (200 OK - Unauthenticated)**:
  ```json
  {
    "setupCompleted": true,
    "isAuthenticated": false,
    "googleConnected": false,
    "geminiConfigured": false,
    "googleUserEmail": null
  }
  ```
- **Response (200 OK - Brand New Project)**:
  ```json
  {
    "setupCompleted": false,
    "isAuthenticated": false,
    "googleConnected": false,
    "geminiConfigured": false,
    "googleUserEmail": null
  }
  ```

---

## 2. Google OAuth 2.0 Client Lifecycle

To schedule events, the backend integrates directly with the Google Calendar API. All sensitive access and refresh tokens are encrypted on the backend using **AES-256-GCM** prior to database storage in the `profiles` table.

```
                  +-----------------------------------+
                  |      GET /api/auth/google         |
                  +-----------------------------------+
                                    |
                                    v (Redirects User)
                  +-----------------------------------+
                  |      Google Consent Screen        |
                  +-----------------------------------+
                                    |
                                    v (Redirects back with Auth Code)
                  +-----------------------------------+
                  |   GET /api/auth/google/callback   |
                  +-----------------------------------+
                                    |
                                    +---> Exchanges Code for Tokens
                                    +---> Encrypts Tokens via AES-256-GCM
                                    +---> Upserts to Profile (ID = 1)
```

### 2.1 GET /api/auth/google
- **Description**: Builds the authorization URL and redirects the user browser to the Google OAuth 2.0 Consent Screen.
- **Access Control**: Private (Requires valid JWT).
- **Google OAuth Parameters Used**:
  - `client_id`: Read from environment variables.
  - `redirect_uri`: Configured callback endpoint.
  - `response_type`: `code`
  - `scope`: `openid email https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events`
  - `access_type`: `offline` (Enforces refresh token generation).
  - `prompt`: `consent` (Ensures refresh token is returned on re-authorization).
  - `state`: Cryptographically secure random CSRF token tied to the session.
- **Response**: `302 Found` (Redirect to Google OAuth Consent Page).

### 2.2 GET /api/auth/google/callback
- **Description**: Receives the authorization code from Google, exchanges it for tokens, decrypts/verifies them, retrieves the user's Google email, encrypts the tokens, and stores them in the database.
- **Access Control**: Public (Google redirect target).
- **Query Parameters**:
  - `code`: The authorization code string.
  - `state`: CSRF verification token.
- **Processing Logic**:
  1. Validates the `state` against the active session.
  2. Exchanges the `code` for credentials at Google's token endpoint (`https://oauth2.googleapis.com/token`).
  3. Decodes the ID token or queries Google userinfo to verify the user's primary email address.
  4. Encrypts the returned `access_token` and `refresh_token` using **AES-256-GCM** (see helper in `database_setup.md`).
  5. Calculates `google_oauth_expires_at` (Current Time + `expires_in` seconds).
  6. Updates the row where `id = 1` in `profiles`.
- **Response**: `302 Found` (Redirects user to the frontend dashboard, e.g., `/?auth=google_success` or `/settings?auth=error`).

### 2.3 Pre-Request Token Refresher Mechanism

Before making any Google Calendar API call, the backend must verify token validity. This is managed by a middleware or utility wrapper:

```typescript
async function getAuthenticatedOAuth2Client(): Promise<google.auth.OAuth2> {
  // 1. Fetch encrypted tokens and expiration from database
  const profile = await db.query("SELECT google_oauth_access_token, google_oauth_refresh_token, google_oauth_expires_at FROM profiles WHERE id = 1");
  if (!profile.google_oauth_refresh_token) {
    throw new GoogleAuthRequiredError("Google Calendar is not connected.");
  }

  // 2. Decrypt tokens using AES-256-GCM
  const accessToken = decrypt(profile.google_oauth_access_token);
  const refreshToken = decrypt(profile.google_oauth_refresh_token);
  const expiresAt = new Date(profile.google_oauth_expires_at);

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  // 3. Check expiration with a 5-minute buffer
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  if (expiresAt <= fiveMinutesFromNow) {
    try {
      // 4. Trigger token refresh request
      const { credentials } = await oauth2Client.refreshAccessToken();
      const newAccessToken = credentials.access_token;
      const newExpiresAt = new Date(credentials.expiry_date); // Google returns ms timestamp

      // 5. Encrypt new access token and update the database
      const encryptedAccessToken = encrypt(newAccessToken);
      await db.query(
        "UPDATE profiles SET google_oauth_access_token = $1, google_oauth_expires_at = $2 WHERE id = 1",
        [encryptedAccessToken, newExpiresAt]
      );
      
      oauth2Client.setCredentials({ access_token: newAccessToken, refresh_token: refreshToken });
    } catch (error) {
      // 6. Handle revocation / invalid credentials
      await db.query(
        "UPDATE profiles SET google_oauth_access_token = NULL, google_oauth_refresh_token = NULL, google_oauth_expires_at = NULL, google_user_email = NULL WHERE id = 1"
      );
      throw new GoogleAuthExpiredError("Google session expired. Please reconnect.");
    }
  }

  return oauth2Client;
}
```

> [!WARNING]
> If a token refresh fails, the client credentials are wiped from the database and a `401 Unauthorized` with error payload `GOOGLE_AUTH_REQUIRED` is returned to the client, triggering the frontend to display the Google Login redirect button.

---

## 3. Cockpit Data & Sync Pipelines

The Cockpit is the dashboard for managing tasks and focus blocks. Changes made to focus blocks are written through to the database and synchronized with Google Calendar.

### 3.1 Tasks API (`/api/tasks`)

CRUD operations to manage the core list of user tasks.

#### GET /api/tasks
- **Description**: Returns all tasks. Supports filtering and sorting.
- **Access Control**: Private (Requires valid JWT).
- **Query Parameters**:
  - `status`: Filter by status (`backlog`, `in_progress`, `completed`, `archived`).
  - `sortBy`: Sort by field (`due_at`, `priority_severity`, `created_at`).
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "title": "Finalize Submission Checklist",
      "description": "Cross-reference files for the final submission.",
      "estimated_duration_minutes": 45,
      "priority_severity": "high",
      "status": "in_progress",
      "due_at": "2026-06-25T18:00:00.000Z",
      "completed_at": null,
      "created_at": "2026-06-24T12:00:00.000Z",
      "updated_at": "2026-06-24T12:30:00.000Z"
    }
  ]
  ```

#### POST /api/tasks
- **Description**: Creates a new task.
- **Access Control**: Private.
- **Request Body**:
  ```json
  {
    "title": "Draft Presentation Slides",
    "description": "Prepare outline and template.",
    "estimated_duration_minutes": 90,
    "priority_severity": "medium",
    "due_at": "2026-06-26T12:00:00.000Z"
  }
  ```
- **Validation Rules**:
  - `title`: Must be a non-empty string.
  - `estimated_duration_minutes`: Must be an integer greater than `0`.
  - `priority_severity`: Must be one of `low`, `medium`, `high`, `critical`.
- **Response (201 Created)**:
  ```json
  {
    "id": "e4f8d9c0-9a3d-4c3e-8b1f-7a2e3d4c5b6a",
    "title": "Draft Presentation Slides",
    "description": "Prepare outline and template.",
    "estimated_duration_minutes": 90,
    "priority_severity": "medium",
    "status": "backlog",
    "due_at": "2026-06-26T12:00:00.000Z",
    "completed_at": null,
    "created_at": "2026-06-24T16:45:00.000Z",
    "updated_at": "2026-06-24T16:45:00.000Z"
  }
  ```
- **Error Boundaries**:
  - **400 Bad Request (Validation Error)**:
    ```json
    {
      "error": "VALIDATION_FAILED",
      "details": {
        "estimated_duration_minutes": "Duration must be positive.",
        "priority_severity": "Must be low, medium, high, or critical."
      }
    }
    ```

#### PATCH /api/tasks/:id
- **Description**: Partially updates a task. If the status is transitioned to `completed`, `completed_at` is set to `NOW()`. If reverted from `completed`, `completed_at` is set to `NULL`.
- **Access Control**: Private.
- **Request Body**:
  ```json
  {
    "status": "completed"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "id": "e4f8d9c0-9a3d-4c3e-8b1f-7a2e3d4c5b6a",
    "title": "Draft Presentation Slides",
    "description": "Prepare outline and template.",
    "estimated_duration_minutes": 90,
    "priority_severity": "medium",
    "status": "completed",
    "due_at": "2026-06-26T12:00:00.000Z",
    "completed_at": "2026-06-24T16:50:00.000Z",
    "created_at": "2026-06-24T16:45:00.000Z",
    "updated_at": "2026-06-24T16:50:00.000Z"
  }
  ```

---

### 3.2 Focus Blocks API (`/api/focus-blocks`)

Manages the hourly scheduling block timeline. Write operations automatically push updates to Google Calendar in a write-through pattern.

#### GET /api/focus-blocks
- **Description**: Returns all focus blocks within a specific time window.
- **Access Control**: Private.
- **Query Parameters**:
  - `start_time`: Filter from date-time (ISO 8601). Required.
  - `end_time`: Filter to date-time (ISO 8601). Required.
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "f5e9d8c7-2b3a-4d5e-9f8a-7b6c5d4e3f2a",
      "task_id": "e4f8d9c0-9a3d-4c3e-8b1f-7a2e3d4c5b6a",
      "google_event_id": "google_event_uuid_123",
      "title": "Focus Block: Draft Presentation Slides",
      "start_time": "2026-06-25T09:00:00.000Z",
      "end_time": "2026-06-25T10:30:00.000Z",
      "status": "scheduled",
      "rescheduled_from_event_id": null,
      "created_at": "2026-06-24T16:48:00.000Z",
      "updated_at": "2026-06-24T16:48:00.000Z"
    }
  ]
  ```

#### POST /api/focus-blocks
- **Description**: Creates a focus block. Instantly executes a call to create a matching event in Google Calendar, stores the returned Google Event ID, and saves the block.
- **Access Control**: Private.
- **Request Body**:
  ```json
  {
    "task_id": "e4f8d9c0-9a3d-4c3e-8b1f-7a2e3d4c5b6a",
    "title": "Focus Block: Draft Presentation Slides",
    "start_time": "2026-06-25T09:00:00.000Z",
    "end_time": "2026-06-25T10:30:00.000Z"
  }
  ```
- **Validation Rules**:
  - `start_time` and `end_time` must be valid dates.
  - `end_time` must be chronologically after `start_time`.
- **Write-Through Process**:
  1. Retrieve Google Calendar OAuth client (triggering a refresh token request if necessary).
  2. Create event on user's primary calendar with title, start, and end times.
  3. Extract Google Event ID.
  4. Write the focus block to the database (saving the Google Event ID).
- **Response (201 Created)**:
  ```json
  {
    "id": "f5e9d8c7-2b3a-4d5e-9f8a-7b6c5d4e3f2a",
    "task_id": "e4f8d9c0-9a3d-4c3e-8b1f-7a2e3d4c5b6a",
    "google_event_id": "gcal_event_id_abc123",
    "title": "Focus Block: Draft Presentation Slides",
    "start_time": "2026-06-25T09:00:00.000Z",
    "end_time": "2026-06-25T10:30:00.000Z",
    "status": "scheduled",
    "rescheduled_from_event_id": null
  }
  ```

#### PATCH /api/focus-blocks/:id
- **Description**: Updates focus block times, status, or title. Propagates changes to Google Calendar immediately.
- **Access Control**: Private.
- **Request Body**:
  ```json
  {
    "start_time": "2026-06-25T10:00:00.000Z",
    "end_time": "2026-06-25T11:30:00.000Z",
    "status": "completed"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "id": "f5e9d8c7-2b3a-4d5e-9f8a-7b6c5d4e3f2a",
    "google_event_id": "gcal_event_id_abc123",
    "start_time": "2026-06-25T10:00:00.000Z",
    "end_time": "2026-06-25T11:30:00.000Z",
    "status": "completed"
  }
  ```

---

### 3.3 The Calendar Synchronization Loop

The synchronization loop keeps the local database and Google Calendar in sync. It is triggered via a cron job on the server (e.g., every 15 minutes) or manually via:

#### POST /api/focus-blocks/sync
- **Description**: Triggers the two-way calendar synchronization.
- **Access Control**: Private.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "pulledEventsCount": 14,
    "updatedLocalBlocksCount": 2,
    "pushedBlocksCount": 1,
    "missedBlocksCount": 1
  }
  ```

#### Synchronization Process Flow

```
                      +-----------------------------------+
                      |      Fetch Google Calendar        |
                      |  Events (e.g. now - 1d to +7d)    |
                      +-----------------------------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
       (Event has Local Link?)                        (Event has NO Local Link?)
                 |                                             |
     +-----------+-----------+                      +----------v----------+
     |                       |                      | Ignore Event        |
     v                       v                      | (User is busy       |
(Moved on GCal?)     (Deleted on GCal?)             | during this slot)   |
     |                       |                      +---------------------+
     v                       v
Update Database       Mark status as
Start / End           'cancelled'
```

#### Sync & State Audits:
1. **Pull Google Calendar Events**:
   - Query Google Calendar API for events in a sliding window (`[NOW - 1 day, NOW + 7 days]`).
2. **Reconcile Updates (Google -> Database)**:
   - For each event with an ID matching a local `google_event_id`:
     - Compare `start_time`, `end_time`, and `title`. If changed in Google Calendar, update the database record.
     - If the event is marked `cancelled` or is missing from the Google Calendar payload, update the local database `status = 'cancelled'`.
3. **Reconcile Updates (Database -> Google)**:
   - For any local focus blocks without a `google_event_id` (created via AI acceptances or local additions):
     - Insert a new Google Calendar event, capture the returned ID, and update `google_event_id` in the database.
4. **State Transition Audits**:
   - The sync loop executes a query to transition expired focus blocks to `missed`:
     ```sql
     UPDATE focus_blocks
     SET status = 'missed'
     WHERE end_time < NOW() 
       AND status IN ('scheduled', 'active')
       AND (task_id IS NULL OR task_id IN (SELECT id FROM tasks WHERE status != 'completed'));
     ```
   - For every block marked `missed`, the backend publishes a background job to request rescheduling from the Gemini AI Pipeline.

---

## 4. The Gemini AI Proactive Pipeline

The cognitive core of the system is the proactive pipeline. It automatically runs when deadlines approach or focus blocks are missed, creating action cards for the user dashboard.

### 4.1 POST /api/interventions/generate
- **Description**: Triggers a background audit of tasks and schedules, sends the context to Gemini, and generates proactive intervention cards using structured JSON output.
- **Access Control**: Private (also triggered by cron scheduler).
- **Request Body**:
  ```json
  {
    "forceTrigger": false
  }
  ```

#### Pipeline Execution Steps:
1. **Fetch Context**:
   - Retrieve the profile (`id = 1`) and decrypt `gemini_api_key`.
   - Query all pending/backlog tasks.
   - Query the next 48 hours of calendar allocations (focus blocks and general busy blocks).
   - Identify impending deadlines (due in < 24 hours) and recently missed focus blocks.
2. **Construct Prompt & Invoke Gemini API**:
   - The system initiates a call using Google's SDK with Structured Outputs enabled (`responseMimeType: "application/json"`) and the JSON schema defined below.
3. **Receive and Save Cards**:
   - Validate that the output matches the required database schema types.
   - Insert new cards into the `ai_interventions` table with status `'pending'`.
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "interventionsGenerated": [
      {
        "id": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
        "task_id": "e4f8d9c0-9a3d-4c3e-8b1f-7a2e3d4c5b6a",
        "type": "draft_proposal",
        "status": "pending",
        "trigger_reason": "Task 'Draft Presentation Slides' is due in 24 hours.",
        "content_payload": {
          "title": "AI Draft Outlines",
          "body": "### Slide 1: Introduction\n- Overview of the system architecture...",
          "format": "markdown"
        }
      }
    ]
  }
  ```

#### Gemini Output JSON Schema Definition:

The Gemini API is instructed to return a structured JSON response conforming to:

```json
{
  "type": "object",
  "properties": {
    "interventions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "taskId": { "type": "string", "description": "Associated Task UUID" },
          "type": { 
            "type": "string", 
            "enum": ["draft_proposal", "scheduling_proposal", "procrastination_nudge"] 
          },
          "triggerReason": { "type": "string", "description": "Why this card was generated" },
          "contentPayload": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "body": { "type": "string" },
              "format": { "type": "string", "enum": ["markdown", "text", "json"] },
              "proposedSlots": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "startTime": { "type": "string", "description": "ISO 8601 Timestamp" },
                    "endTime": { "type": "string", "description": "ISO 8601 Timestamp" }
                  },
                  "required": ["startTime", "endTime"]
                }
              },
              "message": { "type": "string", "description": "Short nudge text for procrastination cards" }
            },
            "required": ["title"]
          }
        },
        "required": ["taskId", "type", "triggerReason", "contentPayload"]
      }
    }
  },
  "required": ["interventions"]
}
```

---

### 4.2 PATCH /api/interventions/:id/status

Updates the state of an intervention card in the proactive feed. Fulfilling or accepting a card triggers state transitions in tasks and focus blocks.

#### PATCH /api/interventions/:id/status
- **Description**: Updates the status of an intervention (Accept, Snooze, Dismiss).
- **Access Control**: Private.
- **Request Body (Accepting)**:
  ```json
  {
    "status": "accepted"
  }
  ```
- **Request Body (Snoozing)**:
  ```json
  {
    "status": "snoozed",
    "snoozed_until": "2026-06-24T18:00:00.000Z"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "id": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
    "status": "accepted",
    "updated_at": "2026-06-24T17:00:00.000Z"
  }
  ```

#### State Transition Logic Matrix

When the client patches an intervention status, the server executes specific transaction actions based on the intervention type:

| Card Type | Status = `'accepted'` Behavior | Status = `'snoozed'` Behavior | Status = `'dismissed'` Behavior |
| :--- | :--- | :--- | :--- |
| **`draft_proposal`** | 1. Appends generated draft body (with markdown formatting) to the associated Task `description` in the database.<br>2. Transitions the task status to `'in_progress'`. | Updates `status = 'snoozed'` and sets `snoozed_until`. | Sets `status = 'dismissed'`. Hides card from active feed. |
| **`scheduling_proposal`** | 1. Iterates over `proposedSlots` in payload.<br>2. Inserts new `focus_blocks` rows with status `'scheduled'`.<br>3. Pushes the new blocks to Google Calendar via write-through API.<br>4. Saves returned Google event IDs.<br>5. Transitions the associated Task status to `'in_progress'`. | Updates `status = 'snoozed'` and sets `snoozed_until`. | Sets `status = 'dismissed'`. Hides card from active feed. |
| **`procrastination_nudge`** | 1. Spawns an immediate active focus block starting `NOW` for 45 minutes.<br>2. Pushes event to Google Calendar.<br>3. Transitions the associated Task status to `'in_progress'`. | Updates `status = 'snoozed'` and sets `snoozed_until`. (Default +30 mins). | Sets `status = 'dismissed'`. Hides card from active feed. |

#### Self-Healing Snooze Cron:
A background cron job runs every 5 minutes to evaluate snoozed interventions. If the current time exceeds `snoozed_until`, the system transitions the status back to `'pending'` so it resurfaces in the active dashboard feed:
```sql
UPDATE ai_interventions
SET status = 'pending', snoozed_until = NULL
WHERE status = 'snoozed' AND snoozed_until <= NOW();
```
