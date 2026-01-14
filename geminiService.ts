
import { GoogleGenAI, GenerateContentResponse, Tool } from '@google/genai';
import { ChatMessage, SerializablePart } from './types';

// Fix: API key must be obtained exclusively from process.env.API_KEY
const getApiKey = (): string | undefined => {
  return process.env.API_KEY;
}

export const isAIAvailable = (): boolean => {
  const apiKey = getApiKey();
  // Assume AI is enabled unless explicitly disabled in settings
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
  
  return !!apiKey && isAiEnabled;
};

// Fix: Always use process.env.API_KEY directly in initialization
const getAiClient = (): GoogleGenAI => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error('API Key is missing. Please ensure process.env.API_KEY is configured.');
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to deep-clone objects without internal SDK prototypes/circularity
const safeClone = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(safeClone);
    
    const clone: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            // Skip functions and complicated internal symbols
            if (typeof val === 'function') continue;
            clone[key] = safeClone(val);
        }
    }
    return clone;
};

// Utility to convert SDK parts to plain serializable objects
export const sanitizeParts = (parts: any[]): SerializablePart[] => {
    if (!parts || !Array.isArray(parts)) return [];
    
    return parts.map(p => {
        const part: SerializablePart = {};
        if (p.text) part.text = p.text;
        if (p.inlineData) {
            part.inlineData = {
                mimeType: p.inlineData.mimeType,
                data: p.inlineData.data
            };
        }
        if (p.functionCall) {
            part.functionCall = {
                name: p.functionCall.name,
                args: safeClone(p.functionCall.args),
                id: p.functionCall.id
            };
        }
        if (p.functionResponse) {
            part.functionResponse = {
                name: p.functionResponse.name,
                response: safeClone(p.functionResponse.response),
                id: p.functionResponse.id
            };
        }
        return part;
    });
};

const generateContentWithRetry = async (
  ai: GoogleGenAI,
  params: any,
  maxRetries: number = 3
): Promise<GenerateContentResponse> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const response = await ai.models.generateContent(params);
      return response;
    } catch (error: any) {
      attempt++;
      const errorMessage = error.toString().toLowerCase();
      
      if (errorMessage.includes('400') || errorMessage.includes('key not valid')) {
          throw new Error("API Key Invalid (400). Please check your API configuration.");
      }

      const isRetryable = errorMessage.includes('503') || 
                          errorMessage.includes('500') || 
                          errorMessage.includes('unavailable') || 
                          errorMessage.includes('internal error');
      
      if (isRetryable && attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  throw new Error('Exceeded max retries for AI request.');
}

// General-purpose AI chat function
export const runAIChat = async (
  history: ChatMessage[],
  systemInstruction: string,
  tools: any[],
  toolImplementations: { [key:string]: (...args: any[]) => any },
  modelName: string = 'gemini-3-flash-preview'
): Promise<GenerateContentResponse> => {
  const ai = getAiClient();

  const initialParams = {
    model: modelName,
    contents: history.map(msg => ({ 
        role: msg.role, 
        parts: sanitizeParts(msg.parts)
    })),
    config: {
      systemInstruction,
      tools,
    },
  };

  const response = await generateContentWithRetry(ai, initialParams);

  if (response.functionCalls && response.functionCalls.length > 0) {
    const fc = response.functionCalls[0];
    const implementation = toolImplementations[fc.name];
    
    if (implementation) {
      const functionResult = implementation(fc.args);

      // Sanitize the function call data before adding to history
      const cleanFcArgs = safeClone(fc.args);
      
      const toolResponseHistory: ChatMessage[] = [
        ...history,
        { role: 'model', parts: [{ functionCall: { name: fc.name, args: cleanFcArgs, id: fc.id } }] },
        { role: 'user', parts: [{ functionResponse: { name: fc.name, response: functionResult, id: fc.id } }] }
      ];

      const secondParams = {
        model: modelName,
        contents: toolResponseHistory.map(msg => ({ 
            role: msg.role, 
            parts: sanitizeParts(msg.parts)
        })),
        config: { systemInstruction, tools },
      };

      const secondResponse = await generateContentWithRetry(ai, secondParams);
      return secondResponse;
    }
  }

  return response;
};
