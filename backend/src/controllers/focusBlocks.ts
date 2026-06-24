import { Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { getAuthenticatedOAuth2Client } from '../services/googleCalendar';
import { google } from 'googleapis';

export const getFocusBlocks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_time, end_time } = req.query;

    if (!start_time || !end_time) {
      res.status(400).json({ error: 'VALIDATION_FAILED', message: 'start_time and end_time are required.' });
      return;
    }

    const { data, error } = await supabase
      .from('focus_blocks')
      .select('*')
      .gte('start_time', start_time)
      .lte('end_time', end_time);

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('getFocusBlocks error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch focus blocks.' });
  }
};

export const createFocusBlock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { task_id, title, start_time, end_time } = req.body;

    // Google Calendar Sync
    const auth = await getAuthenticatedOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth });

    const eventResult = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: title,
        start: { dateTime: start_time },
        end: { dateTime: end_time },
      },
    });

    const google_event_id = eventResult.data.id;

    // Database Insert
    const { data, error } = await supabase
      .from('focus_blocks')
      .insert({
        task_id,
        title,
        start_time,
        end_time,
        google_event_id,
        status: 'scheduled',
        profile_id: 1,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('createFocusBlock error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create focus block.' });
  }
};

export const updateFocusBlock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data: existing, error: fetchError } = await supabase
      .from('focus_blocks')
      .select('google_event_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
       res.status(404).json({ error: 'NOT_FOUND', message: 'Focus block not found.' });
       return;
    }

    if (existing.google_event_id) {
      const auth = await getAuthenticatedOAuth2Client();
      const calendar = google.calendar({ version: 'v3', auth });

      const patchBody: any = {};
      if (updates.title) patchBody.summary = updates.title;
      if (updates.start_time) patchBody.start = { dateTime: updates.start_time };
      if (updates.end_time) patchBody.end = { dateTime: updates.end_time };

      if (Object.keys(patchBody).length > 0) {
        await calendar.events.patch({
          calendarId: 'primary',
          eventId: existing.google_event_id,
          requestBody: patchBody,
        });
      }
    }

    const { data, error } = await supabase
      .from('focus_blocks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('updateFocusBlock error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update focus block.' });
  }
};

export const deleteFocusBlock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabase
      .from('focus_blocks')
      .select('google_event_id')
      .eq('id', id)
      .single();

    if (!fetchError && existing && existing.google_event_id) {
      const auth = await getAuthenticatedOAuth2Client();
      const calendar = google.calendar({ version: 'v3', auth });
      try {
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: existing.google_event_id,
        });
      } catch (err: any) {
        if (err.code !== 404 && err.code !== 410) {
          console.error('Google Calendar deletion error:', err);
        }
      }
    }

    const { error } = await supabase.from('focus_blocks').delete().eq('id', id);
    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('deleteFocusBlock error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to delete focus block.' });
  }
};

export const syncCalendar = async (req: Request, res: Response): Promise<void> => {
  try {
    const auth = await getAuthenticatedOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth });

    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 1);
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 7);

    const eventsResult = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
    });

    const googleEvents = eventsResult.data.items || [];
    const googleEventsMap = new Map(googleEvents.map(e => [e.id, e]));

    const { data: localBlocks, error: fetchLocalError } = await supabase
      .from('focus_blocks')
      .select('*')
      .gte('start_time', timeMin.toISOString())
      .lte('end_time', timeMax.toISOString());

    if (fetchLocalError) throw fetchLocalError;

    let pulledEventsCount = googleEvents.length;
    let updatedLocalBlocksCount = 0;
    let pushedBlocksCount = 0;
    let missedBlocksCount = 0;

    // 1. Google -> Database Reconcile
    for (const block of localBlocks) {
      if (block.google_event_id) {
        const gEvent = googleEventsMap.get(block.google_event_id);
        if (!gEvent || gEvent.status === 'cancelled') {
          if (block.status !== 'cancelled') {
             await supabase.from('focus_blocks').update({ status: 'cancelled' }).eq('id', block.id);
             updatedLocalBlocksCount++;
          }
        } else {
           const gStart = gEvent.start?.dateTime || gEvent.start?.date;
           const gEnd = gEvent.end?.dateTime || gEvent.end?.date;
           const gTitle = gEvent.summary;

           const needsUpdate = 
             (gStart && new Date(gStart).getTime() !== new Date(block.start_time).getTime()) ||
             (gEnd && new Date(gEnd).getTime() !== new Date(block.end_time).getTime()) ||
             (gTitle && gTitle !== block.title);

           if (needsUpdate) {
             await supabase.from('focus_blocks').update({
               start_time: gStart ? new Date(gStart).toISOString() : block.start_time,
               end_time: gEnd ? new Date(gEnd).toISOString() : block.end_time,
               title: gTitle || block.title,
             }).eq('id', block.id);
             updatedLocalBlocksCount++;
           }
        }
      }
    }

    // 2. Database -> Google Reconcile (Blocks without google_event_id)
    const blocksWithoutGoogleId = (localBlocks || []).filter((b: any) => !b.google_event_id && b.status !== 'cancelled');
    for (const block of blocksWithoutGoogleId) {
      const eventResult = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: block.title,
          start: { dateTime: block.start_time },
          end: { dateTime: block.end_time },
        },
      });
      await supabase.from('focus_blocks').update({ google_event_id: eventResult.data.id }).eq('id', block.id);
      pushedBlocksCount++;
    }

    // 3. Expired State Audit (Transition to missed)
    const now = new Date().toISOString();
    const { data: expiredBlocks } = await supabase
      .from('focus_blocks')
      .select('id, task_id')
      .lt('end_time', now)
      .in('status', ['scheduled', 'active']);

    if (expiredBlocks && expiredBlocks.length > 0) {
      const taskIds = expiredBlocks.map((b: any) => b.task_id).filter(Boolean) as string[];
      let uncompletedTaskIds = new Set<string>();
      if (taskIds.length > 0) {
         const { data: uncompletedTasks } = await supabase
           .from('tasks')
           .select('id')
           .in('id', taskIds)
           .neq('status', 'completed');
           
         uncompletedTasks?.forEach((t: any) => uncompletedTaskIds.add(t.id));
      }

      const blocksToMiss = expiredBlocks.filter((b: any) => !b.task_id || uncompletedTaskIds.has(b.task_id));
      if (blocksToMiss.length > 0) {
         const blockIdsToMiss = blocksToMiss.map((b: any) => b.id);
         await supabase.from('focus_blocks').update({ status: 'missed' }).in('id', blockIdsToMiss);
         missedBlocksCount += blocksToMiss.length;
      }
    }

    // 4. Snooze Self-Heal Audit
    const { data: snoozedInterventions } = await supabase
      .from('ai_interventions')
      .select('id')
      .eq('status', 'snoozed')
      .lte('snoozed_until', now);
      
    if (snoozedInterventions && snoozedInterventions.length > 0) {
      const snoozedIds = snoozedInterventions.map((i: any) => i.id);
      await supabase
        .from('ai_interventions')
        .update({ status: 'pending', snoozed_until: null })
        .in('id', snoozedIds);
    }

    res.status(200).json({
      success: true,
      pulledEventsCount,
      updatedLocalBlocksCount,
      pushedBlocksCount,
      missedBlocksCount,
    });
  } catch (error) {
    console.error('syncCalendar error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to sync calendar.' });
  }
};
