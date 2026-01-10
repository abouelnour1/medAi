
import { GoogleGenAI, Part, GenerateContentResponse, Tool } from '@google/genai';
import { ChatMessage } from './types';

// --- Security Note ---
// This file handles all interactions with the Google Gemini API.
// The API key is obtained exclusively from process.env.API_KEY.

const getApiKey = (): string | undefined => {
  // Try to get from process.env (Standard requirement)
  if (typeof process !== 'undefined' && process.env.API_KEY) {
      return process.env.API_KEY.trim();
  }
  
  // Fallback for Vite-based environments
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY.trim();
  }

  return undefined;
}

export const isAIAvailable = (): boolean => {
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
  
  return !!apiKey && !apiKey.includes('PLACEHOLDER') && isAiEnabled;
};

const getAiClient = (): GoogleGenAI => {
    const apiKey = getApiKey();
    
    if (!apiKey) {
        throw new Error('API Key is missing. Please ensure process.env.API_KEY is configured.');
    }

    if (apiKey.includes('PLACEHOLDER')) {
        throw new Error('Invalid API Key: You are using a PLACEHOLDER key.');
    }

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
  tools: Tool[],
  toolImplementations: { [key:string]: (...args: any[]) => any },
  modelName: string = 'gemini-3-flash-preview' // Updated to latest stable preview
): Promise<GenerateContentResponse> => {
  const ai = getAiClient();

  const initialParams = {
    model: modelName,
    contents: history.map(msg => ({ role: msg.role, parts: msg.parts })),
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

      const toolResponseHistory: ChatMessage[] = [
        ...history,
        { role: 'model', parts: [{ functionCall: fc }] },
        { role: 'user', parts: [{ functionResponse: { name: fc.name, response: functionResult } }] }
      ];

      const secondParams = {
        model: modelName,
        contents: toolResponseHistory.map(msg => ({ role: msg.role, parts: msg.parts })),
        config: { systemInstruction, tools },
      };

      const secondResponse = await generateContentWithRetry(ai, secondParams);
      return secondResponse;
    }
  }

  return response;
};
