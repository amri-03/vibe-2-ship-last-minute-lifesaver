import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

// The key must be 32 bytes (256 bits) for aes-256-gcm.
const getEncryptionKey = (): Buffer => {
  const keyStr = process.env.ENCRYPTION_KEY;
  if (!keyStr) {
    throw new Error('ENCRYPTION_KEY environment variable is missing.');
  }
  
  if (keyStr.length === 32) {
    return Buffer.from(keyStr, 'utf-8');
  } else if (keyStr.length === 64) {
    return Buffer.from(keyStr, 'hex');
  } else {
    // Fallback: hash the string to ensure 32 bytes length
    return crypto.createHash('sha256').update(String(keyStr)).digest();
  }
};

export const encrypt = (text: string): string => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  // Return payload format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

export const decrypt = (text: string): string => {
  const key = getEncryptionKey();
  const parts = text.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format.');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};
