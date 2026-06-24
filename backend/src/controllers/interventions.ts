import { Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { generateInterventions as geminiGenerate } from '../services/gemini';
import { getAuthenticatedOAuth2Client } from '../services/googleCalendar';
import { google } from 'googleapis';

export const generateInterventions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .neq('status', 'completed');
      
    if (taskError) throw taskError;

    const { data: missedBlocks, error: blockError } = await supabase
      .from('focus_blocks')
      .select('*')
      .eq('status', 'missed');
      
    if (blockError) throw blockError;

    const contextData = {
      tasks: tasks || [],
      missedBlocks: missedBlocks || [],
      currentTime: new Date().toISOString()
    };

    if ((!tasks || tasks.length === 0) && (!missedBlocks || missedBlocks.length === 0)) {
       res.status(200).json({ success: true, interventionsGenerated: [] });
       return;
    }

    const interventions = await geminiGenerate(contextData);

    const generatedIds: any[] = [];
    for (const inter of interventions) {
      const { data, error } = await supabase
        .from('ai_interventions')
        .insert({
          task_id: inter.taskId,
          type: inter.type,
          status: 'pending',
          trigger_reason: inter.triggerReason,
          content_payload: inter.contentPayload,
          profile_id: 1
        })
        .select()
        .single();
        
      if (!error && data) {
         generatedIds.push(data);
      } else {
         console.error('Failed to insert intervention:', error);
      }
    }

    res.status(201).json({ success: true, interventionsGenerated: generatedIds });
  } catch (error) {
    console.error('generateInterventions error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to generate interventions.' });
  }
};

export const updateInterventionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, snoozed_until } = req.body;

    const { data: intervention, error: fetchError } = await supabase
      .from('ai_interventions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !intervention) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Intervention not found.' });
      return;
    }

    // Prepare update payload
    const updatePayload: any = { status };
    if (status === 'snoozed') {
       updatePayload.snoozed_until = snoozed_until || new Date(Date.now() + 30 * 60000).toISOString();
    } else {
       updatePayload.snoozed_until = null;
    }

    // State Transition Matrix
    if (status === 'accepted') {
      const type = intervention.type;
      const payload = intervention.content_payload;
      const taskId = intervention.task_id;

      if (type === 'draft_proposal') {
        const { data: task } = await supabase.from('tasks').select('description').eq('id', taskId).single();
        const existingDesc = task?.description || '';
        const newDesc = `${existingDesc}\n\n## AI Generated Draft\n\n${payload.body || payload.title}`;
        await supabase.from('tasks').update({ description: newDesc, status: 'in_progress' }).eq('id', taskId);
      } 
      else if (type === 'scheduling_proposal') {
        const slots = payload.proposedSlots || [];
        const auth = await getAuthenticatedOAuth2Client();
        const calendar = google.calendar({ version: 'v3', auth });

        for (const slot of slots) {
          const eventResult = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
              summary: `Focus Block: ${payload.title}`,
              start: { dateTime: slot.startTime },
              end: { dateTime: slot.endTime },
            },
          });

          await supabase.from('focus_blocks').insert({
            task_id: taskId,
            title: `Focus Block: ${payload.title}`,
            start_time: slot.startTime,
            end_time: slot.endTime,
            google_event_id: eventResult.data.id,
            status: 'scheduled',
            profile_id: 1
          });
        }
        await supabase.from('tasks').update({ status: 'in_progress' }).eq('id', taskId);
      }
      else if (type === 'procrastination_nudge') {
        const auth = await getAuthenticatedOAuth2Client();
        const calendar = google.calendar({ version: 'v3', auth });

        const start = new Date();
        const end = new Date(start.getTime() + 45 * 60000);

        const eventResult = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: `Focus Block: Action Now`,
            start: { dateTime: start.toISOString() },
            end: { dateTime: end.toISOString() },
          },
        });

        await supabase.from('focus_blocks').insert({
          task_id: taskId,
          title: `Focus Block: Action Now`,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          google_event_id: eventResult.data.id,
          status: 'scheduled',
          profile_id: 1
        });
        await supabase.from('tasks').update({ status: 'in_progress' }).eq('id', taskId);
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('ai_interventions')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    res.status(200).json(updated);
  } catch (error) {
    console.error('updateInterventionStatus error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update intervention.' });
  }
};
