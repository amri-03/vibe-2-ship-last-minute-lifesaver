import { Request, Response } from 'express';
import { supabase } from '../services/supabase';

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, sortBy } = req.query;

    let query = supabase.from('tasks').select('*');

    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    if (sortBy === 'due_at') {
      query = query.order('due_at', { ascending: true, nullsFirst: false });
    } else if (sortBy === 'priority_severity') {
      query = query.order('priority_severity', { ascending: true });
    } else if (sortBy === 'created_at') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch tasks.' });
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('getTasks error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error.' });
  }
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, estimated_duration_minutes, priority_severity, due_at } = req.body;

    const details: Record<string, string> = {};
    if (!title || typeof title !== 'string' || title.trim() === '') {
      details.title = 'Title must be a non-empty string.';
    }
    if (!estimated_duration_minutes || typeof estimated_duration_minutes !== 'number' || estimated_duration_minutes <= 0) {
      details.estimated_duration_minutes = 'Duration must be positive.';
    }
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority_severity)) {
      details.priority_severity = 'Must be low, medium, high, or critical.';
    }

    if (Object.keys(details).length > 0) {
      res.status(400).json({ error: 'VALIDATION_FAILED', details });
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        estimated_duration_minutes,
        priority_severity,
        due_at,
        status: 'backlog',
        profile_id: 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create task.' });
      return;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('createTask error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error.' });
  }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.status !== undefined) {
      if (updates.status === 'completed') {
        updates.completed_at = new Date().toISOString();
      } else {
        updates.completed_at = null;
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update task.' });
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('updateTask error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error.' });
  }
};
