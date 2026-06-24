import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_do_not_use';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      req.user = { id: decoded.id };
      return next();
    } catch (error) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Access token is invalid or expired' });
      return;
    }
  }

  res.status(401).json({ error: 'UNAUTHORIZED', message: 'Access token is missing' });
};
