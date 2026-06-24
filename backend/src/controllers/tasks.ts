import { Request, Response } from 'express';

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ message: 'getTasks controller placeholder' });
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ message: 'createTask controller placeholder' });
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ message: 'updateTask controller placeholder' });
};
