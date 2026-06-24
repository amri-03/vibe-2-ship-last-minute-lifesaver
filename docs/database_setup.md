# Supabase Database Integration & Setup Guide (Multi-User)

This document describes how to set up, secure, and verify the multi-user database schema for **The Last-Minute Life Saver** (Proactive AI Productivity Companion).

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

## 2. Multi-User Database Model

The database supports traditional multi-user registration and partitioning:
* The `profiles` table uses a UUID primary key (`id`), auto-generated using PostgreSQL's `gen_random_uuid()` function.
* The `email` field is strictly `UNIQUE` and `NOT NULL`, serving as the user identification for login purposes.
* All relational tables (`tasks`, `focus_blocks`, `ai_interventions`) partition data by referencing the user's profile UUID via the `profile_id` column.
* A `CASCADE DELETE` constraint is defined on all foreign keys referencing `profiles(id)`. Deleting a user profile will automatically delete all associated data (tasks, focus blocks, and AI interventions) for that user.

### Safe Upsert/Insert Pattern
When performing database seeding or setting up user profiles:

```sql
INSERT INTO profiles (email, password_hash, google_user_email)
VALUES ('user@example.com', '$2b$12$ExampleHash...', 'user@example.com')
ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash,
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

To ensure that the multi-user schema is working correctly:

### Test 1: Verify Unique Email Constraint
Attempt to insert two profiles with the same email. The second insert **must fail**:
```sql
-- 1. Insert first user
INSERT INTO profiles (email, password_hash) 
VALUES ('test@example.com', 'hash_1');

-- 2. Attempt to insert second user with duplicate email (should fail)
INSERT INTO profiles (email, password_hash) 
VALUES ('test@example.com', 'hash_2');
```

### Test 2: Verify Cascading Deletion on Profile Delete
Confirm that deleting a profile cascade-deletes all associated tasks, focus blocks, and interventions:
```sql
-- 1. Create a user
INSERT INTO profiles (id, email, password_hash) 
VALUES ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00', 'delete_test@example.com', 'mock_hash');

-- 2. Insert a task linked to this user
INSERT INTO tasks (id, profile_id, title, estimated_duration_minutes, priority_severity, status)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00', 'Test Task', 60, 'high', 'backlog');

-- 3. Insert an intervention linked to this user & task
INSERT INTO ai_interventions (id, profile_id, task_id, type, content_payload)
VALUES ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'draft_proposal', '{"draft": "draft contents"}');

-- 4. Insert a focus block linked to this user & task
INSERT INTO focus_blocks (id, profile_id, task_id, title, start_time, end_time)
VALUES ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Work Block', NOW(), NOW() + INTERVAL '1 hour');

-- 5. Delete the profile
DELETE FROM profiles WHERE id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00';

-- 6. Check results:
--   - tasks, ai_interventions, and focus_blocks rows should all be deleted automatically
SELECT * FROM tasks WHERE profile_id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00';          -- Returns 0 rows
SELECT * FROM ai_interventions WHERE profile_id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00';  -- Returns 0 rows
SELECT * FROM focus_blocks WHERE profile_id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00';      -- Returns 0 rows
```

### Test 3: Verify Triggers
Modify a profile or task and confirm that `updated_at` is automatically updated to the current time:
```sql
SELECT updated_at FROM profiles WHERE email = 'test@example.com';
UPDATE profiles SET google_user_email = 'updated_gmail@example.com' WHERE email = 'test@example.com';
SELECT updated_at FROM profiles WHERE email = 'test@example.com'; -- Should show the updated timestamp
```
