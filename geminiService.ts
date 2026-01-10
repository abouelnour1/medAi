<<<<<<< HEAD

import { GoogleGenAI, Part, GenerateContentResponse, Tool } from '@google/genai';
import { ChatMessage } from '../types';

// --- Security Note ---
// This file handles all interactions with the Google Gemini API.
// The API key is sourced from environment variables.
// In a production environment, this should be a backend proxy.
=======
import { GoogleGenAI, GenerateContentResponse, Tool } from '@google/genai';
import { ChatMessage } from './types';
>>>>>>> c0a8bee591a916f5a206218e52a238c533f3e924

const getApiKey = (): string | undefined => {
  // Vite (used for web/android builds) REQUIRES variables to start with VITE_ to be exposed to the client.
  
  // 1. Try Vite env (Standard for React/Vite apps)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      const viteKey = import.meta.env.VITE_API_KEY;
      if (viteKey && typeof viteKey === 'string' && viteKey.length > 0) {
          return viteKey.trim();
      }
  }

  // 2. Fallback: Check Process Environment (Legacy/Node/Vercel)
  if (typeof process !== 'undefined' && process.env) {
      if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY.trim();
      if (process.env.API_KEY) return process.env.API_KEY.trim();
  }

  return undefined;
}

export const isAIAvailable = (): boolean => {
<<<<<<< HEAD
  const apiKey = getApiKey();
  let isAiEnabled = true;
  try {
    const settingsString = localStorage.getItem('mock_app_settings');
    if (settingsString) {
      const settings = JSON.parse(settingsString);
      if (typeof settings.isAiEnabled === 'boolean') {
        isAiEnabled = settings.isAiEnabled;
      }
    }
  } catch (e) {
    console.error("Could not parse AI settings from localStorage", e);
  }
  
  // Simple check: if we have a key and it's not a placeholder, AI is available
  return !!apiKey && !apiKey.includes('PLACEHOLDER') && isAiEnabled;
=======
  return !!getApiKey();
>>>>>>> c0a8bee591a916f5a206218e52a238c533f3e924
};

const getAiClient = (): GoogleGenAI => {
    const apiKey = getApiKey();
<<<<<<< HEAD
    
    if (!apiKey) {
        console.error("API Key is completely missing.");
        throw new Error(
            'API Key is missing.\n' +
            '1. Open your .env.local file.\n' +
            '2. Ensure the variable is named exactly: VITE_API_KEY\n' +
            '3. Example: VITE_API_KEY=AIza...\n' +
            '4. Restart the app/server.'
        );
    }

    if (apiKey.includes('PLACEHOLDER')) {
        throw new Error('Invalid API Key: You are using a PLACEHOLDER key. Please edit your .env file and paste the real key from Google AI Studio (starting with AIza...).');
    }

=======
    if (!apiKey) throw new Error('API Key is missing.');
>>>>>>> c0a8bee591a916f5a206218e52a238c533f3e924
    return new GoogleGenAI({ apiKey });
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
<<<<<<< HEAD
      const errorMessage = error.toString().toLowerCase();
      
      // Check if it's an API Key error specifically
      if (errorMessage.includes('api key not valid') || errorMessage.includes('api_key_invalid') || errorMessage.includes('400')) {
          console.error("Critical API Key Error:", error);
          throw new Error("API Key Rejected by Google (400). Please check your .env.local file. Ensure the key is named 'VITE_API_KEY' and has no extra spaces.");
      }

      const isRetryable = errorMessage.includes('503') || 
                          errorMessage.includes('500') || 
                          errorMessage.includes('unavailable') || 
                          errorMessage.includes('internal error');
      
      if (isRetryable && attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.warn(`Attempt ${attempt} failed with a retryable error. Retrying in ${delay}ms...`, error);
        await sleep(delay);
      } else {
        console.error(`Attempt ${attempt} failed.`, error);
=======
      if (attempt < maxRetries) {
        await sleep(Math.pow(2, attempt - 1) * 1000);
      } else {
>>>>>>> c0a8bee591a916f5a206218e52a238c533f3e924
        throw error;
      }
    }
  }
<<<<<<< HEAD
  throw new Error('Exceeded max retries for AI request.');
}

// General-purpose AI chat function
=======
  throw new Error('Exceeded max retries');
}

>>>>>>> c0a8bee591a916f5a206218e52a238c533f3e924
export const runAIChat = async (
  history: ChatMessage[],
  systemInstruction: string,
  tools: Tool[],
  toolImplementations: { [key:string]: (...args: any[]) => any },
<<<<<<< HEAD
  modelName: string = 'gemini-2.5-flash'
): Promise<GenerateContentResponse> => {
  const ai = getAiClient();
=======
  modelName: string = 'gemini-3-flash-preview'
): Promise<GenerateContentResponse> => {
  const ai = getAiClient();
  const enhancedTools = [...(tools || []), { googleSearch: {} }];
>>>>>>> c0a8bee591a916f5a206218e52a238c533f3e924

  const initialParams = {
    model: modelName,
    contents: history.map(msg => ({ role: msg.role, parts: msg.parts })),
    config: {
      systemInstruction,
<<<<<<< HEAD
      tools,
=======
      tools: enhancedTools,
>>>>>>> c0a8bee591a916f5a206218e52a238c533f3e924
    },
  };

  const response = await generateContentWithRetry(ai, initialParams);

  if (response.functionCalls && response.functionCalls.length > 0) {
    const fc = response.functionCalls[0];
    const implementation = toolImplementations[fc.name];
    
    if (implementation) {
      const functionResult = implementation(fc.args);

      const toolResponseHistory: ChatMessage[] = [
        ...history,
        { role: 'model', parts: [{ functionCall: fc }] },
        { role: 'user', parts: [{ functionResponse: { name: fc.name, response: functionResult } }] }
      ];
<<<<<<< HEAD

      const secondParams = {
        model: modelName,
        contents: toolResponseHistory.map(msg => ({ role: msg.role, parts: msg.parts })),
        config: { systemInstruction, tools },
      };

      const secondResponse = await generateContentWithRetry(ai, secondParams);
      return secondResponse;
=======
      const secondParams = {
        model: modelName,
        contents: toolResponseHistory.map(msg => ({ role: msg.role, parts: msg.parts })),
        config: { systemInstruction, tools: enhancedTools },
      };
      return await generateContentWithRetry(ai, secondParams);
>>>>>>> c0a8bee591a916f5a206218e52a238c533f3e924
    }
  }

  return response;
};
