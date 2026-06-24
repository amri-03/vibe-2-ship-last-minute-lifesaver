import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
  };
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token === 'dummy-token-for-dev') {
      req.user = { id: 1 };
      return next();
    }
  }

  res.status(401).json({ error: 'UNAUTHORIZED', message: 'Access token is missing or invalid' });
};
