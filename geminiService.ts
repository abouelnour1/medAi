
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { ChatMessage, SerializablePart } from './types';

export const isAIAvailable = (): boolean => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === '' || apiKey === 'undefined') return false;

  let isAiEnabled = true;
  try {
    const settingsString = localStorage.getItem('mock_app_settings');
    if (settingsString) {
      const settings = JSON.parse(settingsString);
      if (typeof settings.isAiEnabled === 'boolean') {
        isAiEnabled = settings.isAiEnabled;
      }
    }
  } catch (e) {}
  
  return isAiEnabled;
};

/**
 * Deep clones an object while stripping functions and ensuring only plain values remain.
 * Prevents circular structure errors when serializing to JSON.
 */
const safeClone = (obj: any, seen = new WeakSet()): any => {
    if (obj === null || typeof obj !== 'object') return obj;
    
    // Handle circular references
    if (seen.has(obj)) return '[Circular]';
    seen.add(obj);

    if (Array.isArray(obj)) {
        return obj.map(item => safeClone(item, seen));
    }
    
    const clone: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            // Skip functions and internal private symbols (starting with _)
            if (typeof val === 'function' || key.startsWith('_')) continue;
            clone[key] = safeClone(val, seen);
        }
    }
    return clone;
};

/**
 * Ensures AI response parts are clean, plain objects safe for state and storage.
 */
export const sanitizeParts = (parts: any[]): SerializablePart[] => {
    if (!parts || !Array.isArray(parts)) return [];
    return parts.map(p => {
        const part: SerializablePart = {};
        if (p.text) part.text = String(p.text);
        if (p.thought) part.thought = String(p.thought);
        
        if (p.inlineData) {
            part.inlineData = {
                mimeType: String(p.inlineData.mimeType),
                data: String(p.inlineData.data)
            };
        }
        
        if (p.functionCall) {
            part.functionCall = {
                name: String(p.functionCall.name),
                args: safeClone(p.functionCall.args),
                id: p.functionCall.id ? String(p.functionCall.id) : undefined
            };
        }
        
        if (p.functionResponse) {
            part.functionResponse = {
                name: String(p.functionResponse.name),
                response: safeClone(p.functionResponse.response),
                id: p.functionResponse.id ? String(p.functionResponse.id) : undefined
            };
        }
        
        return part;
    });
};

export const runAIChat = async (
  history: ChatMessage[],
  systemInstruction: string,
  tools: any[],
  toolImplementations: { [key:string]: (...args: any[]) => any },
  modelName: string = 'gemini-3-flash-preview'
): Promise<GenerateContentResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const initialParams = {
    model: modelName,
    contents: history.map(msg => ({ 
        role: msg.role, 
        parts: sanitizeParts(msg.parts)
    })),
    config: { 
        systemInstruction, 
        tools,
        // CRITICAL: Disable thinking budget when using tools for fast lookup and to avoid "missing thought signature" errors
        thinkingConfig: { thinkingBudget: 0 }
    },
  };

  try {
    const response = await ai.models.generateContent(initialParams);
    
    if (response.functionCalls && response.functionCalls.length > 0) {
      const fc = response.functionCalls[0];
      const implementation = toolImplementations[fc.name];
      if (implementation) {
        const functionResult = implementation(fc.args);
        // We must preserve the exact response from model turn including thought parts if present
        const modelTurnParts = sanitizeParts(response.candidates?.[0]?.content?.parts || []);
        
        const toolResponseHistory: ChatMessage[] = [
          ...history,
          { role: 'model', parts: modelTurnParts },
          { role: 'user', parts: [{ functionResponse: { name: fc.name, response: functionResult, id: fc.id } }] }
        ];
        
        return await ai.models.generateContent({
          model: modelName,
          contents: toolResponseHistory.map(msg => ({ role: msg.role, parts: sanitizeParts(msg.parts) })),
          config: { 
              systemInstruction, 
              tools,
              thinkingConfig: { thinkingBudget: 0 }
          },
        });
      }
    }
    return response;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
