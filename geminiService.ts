
import { GoogleGenAI, Part, GenerateContentResponse, Tool } from '@google/genai';
import { ChatMessage } from './types';

const getApiKey = (): string | undefined => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
      const viteKey = import.meta.env.VITE_API_KEY;
      if (viteKey && typeof viteKey === 'string' && viteKey.length > 0) {
          return viteKey.trim();
      }
  }
  if (typeof process !== 'undefined' && process.env) {
      if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY.trim();
      if (process.env.API_KEY) return process.env.API_KEY.trim();
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
        throw new Error('API Key is missing. Please set VITE_API_KEY in your environment.');
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
          throw new Error("Critical API Key Error. Check your configuration.");
      }
      if (attempt < maxRetries) {
        await sleep(Math.pow(2, attempt - 1) * 1000);
      } else {
        throw error;
      }
    }
  }
  throw new Error('Exceeded max retries for AI request.');
}

export const runAIChat = async (
  history: ChatMessage[],
  systemInstruction: string,
  tools: Tool[],
  toolImplementations: { [key:string]: (...args: any[]) => any },
  modelName: string = 'gemini-3-flash-preview' // Updated to latest Gemini 3
): Promise<GenerateContentResponse> => {
  const ai = getAiClient();

  // Add Google Search grounding to make the assistant more aware of real-world Saudi pharmacy context
  const enhancedTools = [...(tools || []), { googleSearch: {} }];

  const initialParams = {
    model: modelName,
    contents: history.map(msg => ({ role: msg.role, parts: msg.parts })),
    config: {
      systemInstruction,
      tools: enhancedTools,
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
        config: { systemInstruction, tools: enhancedTools },
      };
      return await generateContentWithRetry(ai, secondParams);
    }
  }

  return response;
};
