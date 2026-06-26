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

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, geminiApiKey } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        error: 'VALIDATION_FAILED',
        message: 'A valid email is required.',
      });
      return;
    }

    if (!password || password.length < 8) {
      res.status(400).json({
        error: 'VALIDATION_FAILED',
        message: 'Password must be at least 8 characters long.',
      });
      return;
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      res.status(400).json({
        error: 'EMAIL_IN_USE',
        message: 'This email is already registered.',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let encryptedGeminiKey = null;
    if (geminiApiKey) {
      encryptedGeminiKey = encrypt(geminiApiKey);
    }

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        email,
        password_hash: passwordHash,
        gemini_api_key: encryptedGeminiKey,
        google_oauth_access_token: null,
        google_oauth_refresh_token: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create profile.' });
      return;
    }

    const token = jwt.sign({ id: newProfile.id }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      success: true,
      message: 'Registration completed successfully.',
      token,
      profile: {
        id: newProfile.id,
        email: newProfile.email,
        googleUserEmail: newProfile.google_user_email,
        geminiApiKeyConfigured: !!newProfile.gemini_api_key,
        createdAt: newProfile.created_at,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error during registration.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, password_hash')
      .eq('email', email)
      .single();

    if (error || !profile) {
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, profile.password_hash);

    if (!isMatch) {
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
      return;
    }

    const token = jwt.sign({ id: profile.id }, JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({
      success: true,
      token,
      expiresInSeconds: 86400,
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
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        isAuthenticated = true;
        userId = decoded.id;
      } catch (err) {
        isAuthenticated = false;
      }
    }

    if (!isAuthenticated || !userId) {
      res.status(200).json({
        setupCompleted: true,
        isAuthenticated: false,
        googleConnected: false,
        geminiConfigured: false,
        googleUserEmail: null,
      });
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('google_oauth_access_token, gemini_api_key, google_user_email')
      .eq('id', userId)
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
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    res.redirect('http://localhost:5173/?auth_error=unauthorized');
    return;
  }

  let userId: string | null = null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    userId = decoded.id;
  } catch (error) {
    res.redirect('http://localhost:5173/?auth_error=unauthorized');
    return;
  }

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    state: userId,
    scope: [
      'openid',
      'email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
  });

  res.status(200).json({ success: true, url });
};

export const googleAuthCallback = async (req: Request, res: Response): Promise<void> => {
  const code = req.query.code as string;
  const state = req.query.state as string;

  if (!code || !state) {
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
      .eq('id', state);

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

export const updateConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { geminiApiKey } = req.body;
    const updates: any = {};
    
    if (geminiApiKey !== undefined) {
      if (geminiApiKey) {
        updates.gemini_api_key = encrypt(geminiApiKey);
      } else {
        updates.gemini_api_key = null;
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'VALIDATION_FAILED', message: 'No valid configuration fields provided.' });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Unauthorized' });
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Configuration updated successfully.' });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update configuration.' });
  }
};

export const seedDemoData = async (req: Request, res: Response): Promise<void> => {
  try {
    const demoEmail = 'demo@lifesaver.com';
    const demoPassword = 'password123';

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', demoEmail)
      .maybeSingle();

    let demoProfileId = existingProfile?.id;

    if (demoProfileId) {
      // Cascading deletes will handle tasks, focus_blocks, ai_interventions if we delete the profile
      await supabase.from('profiles').delete().eq('id', demoProfileId);
    }

    const passwordHash = await bcrypt.hash(demoPassword, 12);

    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        email: demoEmail,
        password_hash: passwordHash,
        google_oauth_access_token: null,
        google_oauth_refresh_token: null,
        google_oauth_expires_at: null,
        google_user_email: null,
        gemini_api_key: null
      })
      .select('id')
      .single();

    if (profileError || !newProfile) throw profileError;
    demoProfileId = newProfile.id;

    const taskId1 = crypto.randomUUID();
    const taskId2 = crypto.randomUUID();
    const taskId3 = crypto.randomUUID();
    const taskId4 = crypto.randomUUID();
    const taskId5 = crypto.randomUUID();

    const now = new Date();

    const tasksToInsert = [
      {
        id: taskId1,
        profile_id: demoProfileId,
        title: 'Prepare Board Presentation Slides',
        description: 'Prepare Q2 progress report, system architecture slides, and product milestones for the upcoming executive review.',
        estimated_duration_minutes: 90,
        priority_severity: 'critical',
        status: 'in_progress',
        due_at: new Date(now.getTime() + 4 * 3600000).toISOString()
      },
      {
        id: taskId2,
        profile_id: demoProfileId,
        title: 'Review Auth Middleware PR',
        description: 'Verify bcrypt implementation, check token expiration, and validate CSRF token rotation helpers.',
        estimated_duration_minutes: 40,
        priority_severity: 'high',
        status: 'backlog',
        due_at: new Date(now.getTime() + 10 * 3600000).toISOString()
      },
      {
        id: taskId3,
        profile_id: demoProfileId,
        title: 'Draft Standup Notes',
        description: 'Draft recap of sprint accomplishments, current roadblocks, and tomorrow\'s task prioritization.',
        estimated_duration_minutes: 15,
        priority_severity: 'medium',
        status: 'backlog',
        due_at: new Date(now.getTime() + 24 * 3600000).toISOString()
      },
      {
        id: taskId4,
        profile_id: demoProfileId,
        title: 'Update Figma Design System',
        description: 'Align tailwind brand color tokens, configure Outfit/Plus Jakarta Sans type hierarchies, and build card component assets.',
        estimated_duration_minutes: 60,
        priority_severity: 'medium',
        status: 'completed',
        completed_at: new Date(now.getTime() - 5 * 3600000).toISOString()
      },
      {
        id: taskId5,
        profile_id: demoProfileId,
        title: 'Fix Docker container timezone configuration',
        description: 'Ensure backend server logging output timezone matches the localized user timezone settings.',
        estimated_duration_minutes: 25,
        priority_severity: 'low',
        status: 'backlog'
      }
    ];

    const { error: tasksError } = await supabase.from('tasks').insert(tasksToInsert);
    if (tasksError) throw tasksError;

    const focusBlocksToInsert = [
      {
        profile_id: demoProfileId,
        task_id: taskId2,
        title: 'Focus Block: Review Auth Middleware PR',
        start_time: new Date(now.getTime() - 4 * 3600000).toISOString(),
        end_time: new Date(now.getTime() - 3.25 * 3600000).toISOString(),
        status: 'completed',
        google_event_id: 'gcal_seed_1'
      },
      {
        profile_id: demoProfileId,
        task_id: taskId3,
        title: 'Focus Block: Draft Standup Notes',
        start_time: new Date(now.getTime() - 2.5 * 3600000).toISOString(),
        end_time: new Date(now.getTime() - 2 * 3600000).toISOString(),
        status: 'missed',
        google_event_id: 'gcal_seed_2'
      },
      {
        profile_id: demoProfileId,
        task_id: taskId1,
        title: 'Focus Block: Prepare Board Presentation Slides',
        start_time: new Date(now.getTime() - 15 * 60000).toISOString(),
        end_time: new Date(now.getTime() + 45 * 60000).toISOString(),
        status: 'active',
        google_event_id: 'gcal_seed_3'
      },
      {
        profile_id: demoProfileId,
        task_id: taskId1,
        title: 'Focus Block: Prepare Board Presentation Slides',
        start_time: new Date(now.getTime() + 3 * 3600000).toISOString(),
        end_time: new Date(now.getTime() + 4 * 3600000).toISOString(),
        status: 'scheduled',
        google_event_id: 'gcal_seed_4'
      },
      {
        profile_id: demoProfileId,
        task_id: taskId4,
        title: 'Focus Block: Figma Style Guide',
        start_time: new Date(now.getTime() + 24 * 3600000).toISOString(),
        end_time: new Date(now.getTime() + 25 * 3600000).toISOString(),
        status: 'scheduled',
        google_event_id: 'gcal_seed_5'
      }
    ];

    const { error: blocksError } = await supabase.from('focus_blocks').insert(focusBlocksToInsert);
    if (blocksError) throw blocksError;

    const interventionsToInsert = [
      {
        profile_id: demoProfileId,
        task_id: taskId1,
        type: 'draft_proposal',
        status: 'pending',
        trigger_reason: 'Impending deadline for critical task: Prepare Board Presentation Slides (due in 4 hours)',
        content_payload: {
          title: 'AI Draft Outline: Board Presentation',
          body: `### Executive Board Presentation Outline\n\n1. **Q2 Summary & Key Achievements**\n2. **System Architecture Refresh**\n3. **Risk Management & Mitigations**`,
          format: 'markdown'
        }
      },
      {
        profile_id: demoProfileId,
        task_id: taskId3,
        type: 'scheduling_proposal',
        status: 'pending',
        trigger_reason: 'Missed focus block: Draft Standup Notes',
        content_payload: {
          title: 'AI Proposed Rescheduling Slots',
          message: 'I detected you missed your scheduled focus block for standup notes. I scanned your calendar allocations and identified the following open slots:',
          proposedSlots: [
            {
              startTime: new Date(now.getTime() + 1.5 * 3600000).toISOString(),
              endTime: new Date(now.getTime() + 2 * 3600000).toISOString()
            },
            {
              startTime: new Date(now.getTime() + 5.5 * 3600000).toISOString(),
              endTime: new Date(now.getTime() + 6 * 3600000).toISOString()
            }
          ]
        }
      }
    ];

    const { error: interventionsError } = await supabase.from('ai_interventions').insert(interventionsToInsert);
    if (interventionsError) throw interventionsError;

    const token = jwt.sign({ id: demoProfileId }, JWT_SECRET, { expiresIn: '24h' });

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

