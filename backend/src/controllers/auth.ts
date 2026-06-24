import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabase } from '../services/supabase';
import { encrypt } from '../services/encryption';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_do_not_use';

export const setup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { masterPassword, geminiApiKey } = req.body;

    // 1. Check if profile exists
    const { data: existingProfile, error: selectError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', 1)
      .single();

    if (existingProfile) {
      res.status(400).json({
        error: 'SETUP_ALREADY_COMPLETED',
        message: 'Setup has already been run. The database is initialized.',
      });
      return;
    }

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 is no rows returned, which is expected on first setup
      console.error('Database error checking profile:', selectError);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Database error checking profile status.' });
      return;
    }

    // 2. Validate password length
    if (!masterPassword || masterPassword.length < 8) {
      res.status(400).json({
        error: 'VALIDATION_FAILED',
        message: 'Password must be at least 8 characters long.',
      });
      return;
    }

    // 3. Hash password
    const masterPasswordHash = await bcrypt.hash(masterPassword, 10);

    // 4. Encrypt Gemini API key if present
    let encryptedGeminiKey = null;
    if (geminiApiKey) {
      encryptedGeminiKey = encrypt(geminiApiKey);
    }

    // 5. Insert to profiles
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: 1,
        master_password_hash: masterPasswordHash,
        gemini_api_key: encryptedGeminiKey,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create profile.' });
      return;
    }

    // 6. Issue JWT
    const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '2h' });

    res.status(201).json({
      success: true,
      message: 'First-time setup completed successfully.',
      token,
      profile: {
        id: newProfile.id,
        googleUserEmail: newProfile.google_user_email,
        geminiApiKeyConfigured: !!newProfile.gemini_api_key,
        createdAt: newProfile.created_at,
      },
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error during setup.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { masterPassword } = req.body;

    // Fetch profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('master_password_hash')
      .eq('id', 1)
      .single();

    if (error || !profile) {
      res.status(400).json({
        error: 'SETUP_REQUIRED',
        message: 'The database has not been initialized. Run setup first.',
      });
      return;
    }

    // Compare password
    const isMatch = await bcrypt.compare(masterPassword, profile.master_password_hash);

    if (!isMatch) {
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'The master password provided is incorrect.',
      });
      return;
    }

    // Issue JWT
    const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '2h' });

    res.status(200).json({
      success: true,
      token,
      expiresInSeconds: 7200,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error during login.' });
  }
};

export const status = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let isAuthenticated = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        jwt.verify(token, JWT_SECRET);
        isAuthenticated = true;
      } catch (err) {
        isAuthenticated = false;
      }
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('google_oauth_access_token, gemini_api_key, google_user_email')
      .eq('id', 1)
      .single();

    if (error || !profile) {
      // PGRST116 indicates no profile found
      if (error && error.code === 'PGRST116') {
        res.status(200).json({
          setupCompleted: false,
          isAuthenticated: false,
          googleConnected: false,
          geminiConfigured: false,
          googleUserEmail: null,
        });
        return;
      }
      
      console.error('Database error checking status:', error);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Database error checking status.' });
      return;
    }

    res.status(200).json({
      setupCompleted: true,
      isAuthenticated,
      googleConnected: !!profile.google_oauth_access_token,
      geminiConfigured: !!profile.gemini_api_key,
      googleUserEmail: profile.google_user_email || null,
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error during status check.' });
  }
};

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

export const googleAuthRedirect = (req: Request, res: Response): void => {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'openid',
      'email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
  });

  res.redirect(url);
};

export const googleAuthCallback = async (req: Request, res: Response): Promise<void> => {
  const code = req.query.code as string;

  if (!code) {
    res.redirect('http://localhost:5173/settings?auth=error');
    return;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get email
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Access or Refresh Token is missing from Google response.');
    }

    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = encrypt(tokens.refresh_token);

    // Calculate expiration date
    const expiresAt = new Date();
    if (tokens.expiry_date) {
      expiresAt.setTime(tokens.expiry_date);
    } else {
      expiresAt.setSeconds(expiresAt.getSeconds() + 3600);
    }

    // Update database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        google_oauth_access_token: encryptedAccessToken,
        google_oauth_refresh_token: encryptedRefreshToken,
        google_oauth_expires_at: expiresAt.toISOString(),
        google_user_email: email,
      })
      .eq('id', 1);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    res.redirect('http://localhost:5173/?auth=google_success');
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect('http://localhost:5173/settings?auth=error');
  }
};

export const seedDemoData = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Clear database tables under profile_id = 1
    await supabase.from('ai_interventions').delete().eq('profile_id', 1);
    await supabase.from('focus_blocks').delete().eq('profile_id', 1);
    await supabase.from('tasks').delete().eq('profile_id', 1);

    // Check if profile exists, keep existing gemini_api_key if present
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('gemini_api_key')
      .eq('id', 1)
      .maybeSingle();

    const geminiKey = existingProfile?.gemini_api_key || null;
    const passwordHash = await bcrypt.hash('password123', 10);

    // Re-create profile ID = 1
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: 1,
        master_password_hash: passwordHash,
        google_oauth_access_token: null,
        google_oauth_refresh_token: null,
        google_oauth_expires_at: null,
        google_user_email: null,
        gemini_api_key: geminiKey
      });

    if (profileError) throw profileError;

    // 2. Seed 5 realistic tasks
    const taskId1 = crypto.randomUUID();
    const taskId2 = crypto.randomUUID();
    const taskId3 = crypto.randomUUID();
    const taskId4 = crypto.randomUUID();
    const taskId5 = crypto.randomUUID();

    const now = new Date();

    const tasksToInsert = [
      {
        id: taskId1,
        profile_id: 1,
        title: 'Prepare Board Presentation Slides',
        description: 'Prepare Q2 progress report, system architecture slides, and product milestones for the upcoming executive review.',
        estimated_duration_minutes: 90,
        priority_severity: 'critical',
        status: 'in_progress',
        due_at: new Date(now.getTime() + 4 * 3600000).toISOString() // due in 4 hours
      },
      {
        id: taskId2,
        profile_id: 1,
        title: 'Review Auth Middleware PR',
        description: 'Verify bcrypt implementation, check token expiration, and validate CSRF token rotation helpers.',
        estimated_duration_minutes: 40,
        priority_severity: 'high',
        status: 'backlog',
        due_at: new Date(now.getTime() + 10 * 3600000).toISOString() // due in 10 hours
      },
      {
        id: taskId3,
        profile_id: 1,
        title: 'Draft Standup Notes',
        description: 'Draft recap of sprint accomplishments, current roadblocks, and tomorrow\'s task prioritization.',
        estimated_duration_minutes: 15,
        priority_severity: 'medium',
        status: 'backlog',
        due_at: new Date(now.getTime() + 24 * 3600000).toISOString() // due in 24 hours
      },
      {
        id: taskId4,
        profile_id: 1,
        title: 'Update Figma Design System',
        description: 'Align tailwind brand color tokens, configure Outfit/Plus Jakarta Sans type hierarchies, and build card component assets.',
        estimated_duration_minutes: 60,
        priority_severity: 'medium',
        status: 'completed',
        completed_at: new Date(now.getTime() - 5 * 3600000).toISOString() // completed 5 hours ago
      },
      {
        id: taskId5,
        profile_id: 1,
        title: 'Fix Docker container timezone configuration',
        description: 'Ensure backend server logging output timezone matches the localized user timezone settings.',
        estimated_duration_minutes: 25,
        priority_severity: 'low',
        status: 'backlog'
      }
    ];

    const { error: tasksError } = await supabase.from('tasks').insert(tasksToInsert);
    if (tasksError) throw tasksError;

    // 3. Seed 5 focus blocks
    const focusBlocksToInsert = [
      {
        profile_id: 1,
        task_id: taskId2,
        title: 'Focus Block: Review Auth Middleware PR',
        start_time: new Date(now.getTime() - 4 * 3600000).toISOString(), // 4 hours ago
        end_time: new Date(now.getTime() - 3.25 * 3600000).toISOString(), // 3.25 hours ago (45 mins block)
        status: 'completed',
        google_event_id: 'gcal_seed_1'
      },
      {
        profile_id: 1,
        task_id: taskId3,
        title: 'Focus Block: Draft Standup Notes',
        start_time: new Date(now.getTime() - 2.5 * 3600000).toISOString(), // 2.5 hours ago
        end_time: new Date(now.getTime() - 2 * 3600000).toISOString(), // 2 hours ago (30 mins block)
        status: 'missed',
        google_event_id: 'gcal_seed_2'
      },
      {
        profile_id: 1,
        task_id: taskId1,
        title: 'Focus Block: Prepare Board Presentation Slides',
        start_time: new Date(now.getTime() - 15 * 60000).toISOString(), // 15 mins ago
        end_time: new Date(now.getTime() + 45 * 60000).toISOString(), // 45 mins from now
        status: 'active',
        google_event_id: 'gcal_seed_3'
      },
      {
        profile_id: 1,
        task_id: taskId1,
        title: 'Focus Block: Prepare Board Presentation Slides',
        start_time: new Date(now.getTime() + 3 * 3600000).toISOString(), // 3 hours from now
        end_time: new Date(now.getTime() + 4 * 3600000).toISOString(), // 4 hours from now
        status: 'scheduled',
        google_event_id: 'gcal_seed_4'
      },
      {
        profile_id: 1,
        task_id: taskId4,
        title: 'Focus Block: Figma Style Guide',
        start_time: new Date(now.getTime() + 24 * 3600000).toISOString(), // 24 hours from now
        end_time: new Date(now.getTime() + 25 * 3600000).toISOString(), // 25 hours from now
        status: 'scheduled',
        google_event_id: 'gcal_seed_5'
      }
    ];

    const { error: blocksError } = await supabase.from('focus_blocks').insert(focusBlocksToInsert);
    if (blocksError) throw blocksError;

    // 4. Seed 2 pending AI interventions
    const interventionsToInsert = [
      {
        profile_id: 1,
        task_id: taskId1,
        type: 'draft_proposal',
        status: 'pending',
        trigger_reason: 'Impending deadline for critical task: Prepare Board Presentation Slides (due in 4 hours)',
        content_payload: {
          title: 'AI Draft Outline: Board Presentation',
          body: `### Executive Board Presentation Outline

1. **Q2 Summary & Key Achievements**
   - Finished Core Frontend React Component verify loops.
   - Handled full authentication middleware setup checks.
   - Synchronized timeline events with 100% write-through accuracy.

2. **System Architecture Refresh**
   - Implemented database-side Check Constraints.
   - Seamless token validation using pre-request Google OAuth handlers.

3. **Risk Management & Mitigations**
   - Real-time rescheduling intervention cards powered by Gemini.
   - Automated self-healing Cron loops for snoozed proposals.`,
          format: 'markdown'
        }
      },
      {
        profile_id: 1,
        task_id: taskId3,
        type: 'scheduling_proposal',
        status: 'pending',
        trigger_reason: 'Missed focus block: Draft Standup Notes',
        content_payload: {
          title: 'AI Proposed Rescheduling Slots',
          message: 'I detected you missed your scheduled focus block for standup notes. I scanned your calendar allocations and identified the following open slots:',
          proposedSlots: [
            {
              startTime: new Date(now.getTime() + 1.5 * 3600000).toISOString(), // in 1.5 hours
              endTime: new Date(now.getTime() + 2 * 3600000).toISOString()
            },
            {
              startTime: new Date(now.getTime() + 5.5 * 3600000).toISOString(), // in 5.5 hours
              endTime: new Date(now.getTime() + 6 * 3600000).toISOString()
            }
          ]
        }
      }
    ];

    const { error: interventionsError } = await supabase.from('ai_interventions').insert(interventionsToInsert);
    if (interventionsError) throw interventionsError;

    // 5. Issue JWT
    const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '2h' });

    res.status(201).json({
      success: true,
      token,
      message: 'Demo dataset successfully seeded!'
    });
  } catch (error) {
    console.error('Seed demo data error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to seed demo data.' });
  }
};

