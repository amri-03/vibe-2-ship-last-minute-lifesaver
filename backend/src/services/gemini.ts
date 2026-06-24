import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';
import { supabase } from './supabase';
import { decrypt } from './encryption';

export async function generateInterventions(contextData: any) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('gemini_api_key')
    .eq('id', 1)
    .single();

  if (error || !profile || !profile.gemini_api_key) {
    throw new Error('Gemini API key is not configured.');
  }

  const apiKey = decrypt(profile.gemini_api_key);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const schema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      interventions: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            taskId: { type: SchemaType.STRING, description: "Associated Task UUID" },
            type: { 
              type: SchemaType.STRING, 
              format: "enum",
              enum: ["draft_proposal", "scheduling_proposal", "procrastination_nudge"] 
            },
            triggerReason: { type: SchemaType.STRING, description: "Why this card was generated" },
            contentPayload: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING },
                body: { type: SchemaType.STRING },
                format: { type: SchemaType.STRING, format: "enum", enum: ["markdown", "text", "json"] },
                proposedSlots: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      startTime: { type: SchemaType.STRING, description: "ISO 8601 Timestamp" },
                      endTime: { type: SchemaType.STRING, description: "ISO 8601 Timestamp" }
                    },
                    required: ["startTime", "endTime"]
                  }
                },
                message: { type: SchemaType.STRING, description: "Short nudge text for procrastination cards" }
              },
              required: ["title"]
            }
          },
          required: ["taskId", "type", "triggerReason", "contentPayload"]
        }
      }
    },
    required: ["interventions"]
  };

  const systemInstruction = `
You are a proactive productivity assistant. Analyze the user's tasks and calendar context.
Generate helpful interventions if there are upcoming deadlines, missed focus blocks, or unstarted tasks.
Only output valid JSON matching the schema.
Context:
${JSON.stringify(contextData, null, 2)}
`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: systemInstruction }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  const responseText = result.response.text();
  return JSON.parse(responseText).interventions || [];
}
