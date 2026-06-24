import { google } from 'googleapis';
import { supabase } from './supabase';
import { encrypt, decrypt } from './encryption';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

export class GoogleAuthRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleAuthRequiredError';
  }
}

export class GoogleAuthExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleAuthExpiredError';
  }
}

export async function getAuthenticatedOAuth2Client() {
  // 1. Fetch encrypted tokens and expiration from database
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('google_oauth_access_token, google_oauth_refresh_token, google_oauth_expires_at')
    .eq('id', 1)
    .single();

  if (error || !profile || !profile.google_oauth_refresh_token || !profile.google_oauth_access_token) {
    throw new GoogleAuthRequiredError('Google Calendar is not connected.');
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
      if (!newAccessToken) {
          throw new Error("No access token returned from refresh.");
      }
      const newExpiresAt = new Date(credentials.expiry_date || Date.now() + 3600 * 1000); // Google returns ms timestamp

      // 5. Encrypt new access token and update the database
      const encryptedAccessToken = encrypt(newAccessToken);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          google_oauth_access_token: encryptedAccessToken,
          google_oauth_expires_at: newExpiresAt.toISOString()
        })
        .eq('id', 1);

      if (updateError) {
          console.error("Failed to update tokens in database:", updateError);
          throw updateError;
      }

      oauth2Client.setCredentials({ access_token: newAccessToken, refresh_token: refreshToken });
    } catch (error) {
      console.error("Token refresh failed:", error);
      // 6. Handle revocation / invalid credentials
      await supabase
        .from('profiles')
        .update({
          google_oauth_access_token: null,
          google_oauth_refresh_token: null,
          google_oauth_expires_at: null,
          google_user_email: null
        })
        .eq('id', 1);
        
      throw new GoogleAuthExpiredError('Google session expired. Please reconnect.');
    }
  }

  return oauth2Client;
}
