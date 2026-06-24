import { Request, Response } from 'express';

export const setup = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ message: 'setup controller placeholder' });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ message: 'login controller placeholder' });
};

export const getStatus = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ message: 'getStatus controller placeholder' });
};

export const redirectToGoogle = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ message: 'redirectToGoogle controller placeholder' });
};

export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ message: 'googleCallback controller placeholder' });
};
