import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../services/supabase';
import { encrypt } from '../services/encryption';
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
