# Supabase Database Integration & Setup Guide (Multi-User)

This document describes how to set up, secure, and verify the multi-user database schema for **The Last-Minute Life Saver** (Proactive AI Productivity Companion).

---

## 1. Initializing the Schema in Supabase

To initialize the database tables in Supabase:
1. Log in to the [Supabase Dashboard](https://supabase.com).
2. Select your project and navigate to the **SQL Editor** in the left sidebar.
3. Click **New Query**.
4. Paste the DDL script from [`backend/schema.sql`](file:///c:/Developer_Workspace/active_projects/AI-Projects/Vibe_2_Ship/backend/schema.sql).
5. Click **Run** (or press `Cmd + Enter` / `Ctrl + Enter`).
6. Confirm that the query executes successfully. This registers:
   * The `"uuid-ossp"` extension to provide standard UUID algorithms.
   * Four core tables (`profiles`, `tasks`, `focus_blocks`, `ai_interventions`) using UUID primary/foreign keys.
   * Reusable update triggers to maintain the `updated_at` timestamps.

---

## 2. Multi-User Database Model & Alignment

The database partitions workspace data per user:
* The `profiles` table uses `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
* Relational tables (`tasks`, `focus_blocks`, `ai_interventions`) use a `profile_id UUID NOT NULL` column referencing `profiles(id)`.
* Foreign-key constraints enforce `ON DELETE CASCADE` on `profile_id` across all child tables to prevent orphaned rows when a user deletes their account.
* The `ai_interventions.content_payload` column is defined as `JSONB` which natively supports the complex, nested JSON objects (including arrays like `proposedSlots` and strings like `body`/`message`) sent by the Gemini AI pipeline.

### Multi-User User Registration INSERT Template
When a new user registers via `POST /api/auth/register`, the backend hashes their password and encrypts their optional Gemini API key before executing the database insert:

```sql
-- Template for inserting a new user profile upon registration
INSERT INTO profiles (
    email, 
    password_hash, 
    gemini_api_key
) VALUES (
    'newuser@example.com', 
    '$2b$12$BcryptHashPlaceholderHere...', -- Hashed password
    '1234567890abcdef:EncryptedGeminiKey:AuthTagPlaceholder' -- Optional encrypted Gemini key
);
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
  try {
    if (!text) return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format stored in DB: iv:ciphertext:authTag
    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt credentials.');
  }
}

export function decrypt(encryptedText: string): string {
  try {
    if (!encryptedText) return encryptedText;
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }
    const [ivHex, encrypted, authTagHex] = parts;
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt credentials. Ensure the encryption key is valid.');
  }
}
```

---

## 4. Verification & Validation Steps

Verify the multi-user behavior, unique email constraints, and cascade delete propagation directly in the SQL Editor:

### Test 1: Verify Unique Email Constraint
Inserting a duplicate email address must fail:
```sql
-- 1. Insert first user
INSERT INTO profiles (email, password_hash) 
VALUES ('duplicate@example.com', 'hash_1');

-- 2. Attempt to insert second user with duplicate email (must fail)
INSERT INTO profiles (email, password_hash) 
VALUES ('duplicate@example.com', 'hash_2');
```

### Test 2: Verify Cascading Deletion on User Delete
Confirm that deleting a profile successfully cascade-deletes all associated tasks, focus blocks, and interventions, leaving no orphaned data:
```sql
-- 1. Create a user
INSERT INTO profiles (id, email, password_hash) 
VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'testuser@example.com', 'hash_placeholder');

-- 2. Insert a task linked to this user
INSERT INTO tasks (id, profile_id, title, estimated_duration_minutes, priority_severity, status)
VALUES ('9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Verify DB Integration', 30, 'medium', 'backlog');

-- 3. Insert an intervention linked to this user & task (verifies JSONB content payload compatibility)
INSERT INTO ai_interventions (id, profile_id, task_id, type, content_payload)
VALUES (
    '8b7c6d5e-4f3a-2b1c-0d9e-8f7a6b5c4d3e', 
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 
    '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d', 
    'draft_proposal', 
    '{"title": "Draft Outline", "body": "1. Task Intro", "format": "markdown"}'::jsonb
);

-- 4. Insert a focus block linked to this user & task
INSERT INTO focus_blocks (id, profile_id, task_id, title, start_time, end_time)
VALUES ('7c6d5e4f-3a2b-1c0d-9e8f-7a6b5c4d3e2f', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d', 'Verify Focus Block', NOW(), NOW() + INTERVAL '1 hour');

-- 5. Delete the profile
DELETE FROM profiles WHERE id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';

-- 6. Check results (each query should return 0 rows):
SELECT * FROM tasks WHERE profile_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
SELECT * FROM ai_interventions WHERE profile_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
SELECT * FROM focus_blocks WHERE profile_id = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
```

### Test 3: Verify Triggers
Updating a profile or task updates `updated_at` automatically:
```sql
SELECT updated_at FROM profiles WHERE email = 'duplicate@example.com';
UPDATE profiles SET google_user_email = 'duplicate@gmail.com' WHERE email = 'duplicate@example.com';
SELECT updated_at FROM profiles WHERE email = 'duplicate@example.com'; -- Should be updated to the current time
```
