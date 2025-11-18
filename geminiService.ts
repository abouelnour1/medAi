import { GoogleGenAI, Part, GenerateContentResponse, Tool } from '@google/genai';
import { ChatMessage } from '../types';

// --- Security Note ---
// This file handles all interactions with the Google Gemini API.
// The API key is sourced from environment variables.
// In a production environment (like Vercel, Netlify, etc.), this file
// should be converted into a serverless function (API route) to ensure
// the API key is not exposed on the client-side browser.
// The frontend would then call this function instead of using this service directly.

const getApiKey = (): string | undefined => {
  // FIX: Adhere to the guideline of using process.env.API_KEY for the Gemini API key.
  return process.env.API_KEY;
}

export const isAIAvailable = (): boolean => {
  const apiKey = getApiKey();
  let isAiEnabled = true; // Default to true if setting is not found
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
  return !!apiKey && isAiEnabled;
};

const getAiClient = (): GoogleGenAI => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('AI service is not available. API_KEY is missing.');
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
      // Check for common retryable HTTP status codes or messages
      const isRetryable = errorMessage.includes('503') || 
                          errorMessage.includes('500') || 
                          errorMessage.includes('unavailable') || 
                          errorMessage.includes('internal error');
      
      if (isRetryable && attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.warn(`Attempt ${attempt} failed with a retryable error. Retrying in ${delay}ms...`, error);
        await sleep(delay);
      } else {
        console.error(`Attempt ${attempt} failed with a non-retryable error or max retries reached.`, error);
        throw error;
      }
    }
  }
  // This should be unreachable if the loop logic is correct.
  throw new Error('Exceeded max retries for AI request.');
}


// General-purpose AI chat function
export const runAIChat = async (
  history: ChatMessage[],
  systemInstruction: string,
  tools: Tool[],
  toolImplementations: { [key:string]: (...args: any[]) => any },
  modelName: string = 'gemini-2.5-pro'
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

      // Call the model again with the tool response
      const secondResponse = await generateContentWithRetry(ai, secondParams);
      return secondResponse;
    }
  }

  return response;
};