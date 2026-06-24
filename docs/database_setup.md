# Supabase Database Integration & Setup Guide

This document describes how to set up, secure, and verify the database schema for **The Last-Minute Life Saver** (Proactive AI Productivity Companion).

---

## 1. Initializing the Schema in Supabase

To apply the schema to your Supabase project:
1. Log in to the [Supabase Dashboard](https://supabase.com).
2. Select your project and navigate to the **SQL Editor** in the left sidebar.
3. Click **New Query**.
4. Copy the entire contents of [`backend/schema.sql`](file:///c:/Developer_Workspace/active_projects/AI-Projects/Vibe_2_Ship/backend/schema.sql) and paste them into the editor.
5. Click **Run** (or press `Cmd + Enter` / `Ctrl + Enter`).
6. Confirm that the query executes successfully and that four tables (`profiles`, `tasks`, `focus_blocks`, `ai_interventions`) are visible under the `public` schema.

---

## 2. Single-User Database Enforcement

To fit the hackathon requirements for a **Single-User MVP**, the database is structurally restricted to holding exactly one profile:
* The `profiles` table has a primary key `id` with a default value of `1`.
* A table-level constraint `CONSTRAINT sole_user_record CHECK (id = 1)` is configured.
* Attempting to insert a second user row will fail with a check constraint violation.

### Example Safe Insert (Upsert) Pattern
When performing database seeding or setting up the user profile, use `ON CONFLICT` to avoid duplicate primary key violations:

```sql
INSERT INTO profiles (id, master_password_hash, google_user_email)
VALUES (1, '$2b$12$ExampleHash...', 'user@example.com')
ON CONFLICT (id) DO UPDATE 
SET master_password_hash = EXCLUDED.master_password_hash,
    google_user_email = EXCLUDED.google_user_email,
    updated_at = NOW();
```

---

## 3. Application-Level Token Encryption

Sensitive credentials stored in the `profiles` table (OAuth access/refresh tokens and the Gemini API key) must be encrypted at the application level before database writes.

### Encryption Standard: AES-256-GCM
We utilize Node's built-in `crypto` module to perform authenticated encryption.

#### Encryption Script Example (Node.js)
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 32 bytes (256 bits)
const IV_LENGTH = 12; // For GCM

export function encrypt(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format stored in DB: iv:ciphertext:authTag
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  const [ivHex, encrypted, authTagHex] = encryptedText.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

---

## 4. Verification & Validation Steps

To ensure that the schema is working correctly:

### Test 1: Verify Single User Constraint
Attempt to insert a row with `id = 2`. It **must fail**:
```sql
-- This query should FAIL with a check constraint error:
INSERT INTO profiles (id, master_password_hash) 
VALUES (2, 'some_hash');
```

### Test 2: Verify Cascading Deletion
Check if deleting a task deletes its corresponding `ai_interventions` but leaves the scheduled `focus_blocks` intact (with `task_id` set to `NULL`):
```sql
-- 1. Insert a mock profile
INSERT INTO profiles (id, master_password_hash) VALUES (1, 'mock_hash') ON CONFLICT (id) DO NOTHING;

-- 2. Insert a task
INSERT INTO tasks (id, title, estimated_duration_minutes, priority_severity, status)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Test Task', 60, 'high', 'backlog');

-- 3. Insert an intervention linked to that task
INSERT INTO ai_interventions (id, task_id, type, content_payload)
VALUES ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'draft_proposal', '{"draft": "draft contents"}');

-- 4. Insert a focus block linked to that task
INSERT INTO focus_blocks (id, task_id, title, start_time, end_time)
VALUES ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Work Block', NOW(), NOW() + INTERVAL '1 hour');

-- 5. Delete the task
DELETE FROM tasks WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- 6. Check results:
--   - ai_interventions row should be GONE (cascaded delete)
--   - focus_blocks row should have task_id = NULL (set null)
SELECT * FROM ai_interventions WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'; -- Returns 0 rows
SELECT * FROM focus_blocks WHERE id = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';       -- Returns 1 row (task_id will be NULL)
```

### Test 3: Verify Triggers
Modify a task title and confirm that `updated_at` is automatically updated to the current time:
```sql
SELECT updated_at FROM tasks WHERE id = '...';
UPDATE tasks SET title = 'Updated Title' WHERE id = '...';
SELECT updated_at FROM tasks WHERE id = '...'; -- Should show the updated timestamp
```
