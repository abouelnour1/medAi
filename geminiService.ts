import { GoogleGenAI, GenerateContentResponse, Tool } from '@google/genai';
import { ChatMessage } from './types';

const getApiKey = (): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
      if (process.env.VITE_API_KEY) return process.env.VITE_API_KEY.trim();
      if (process.env.API_KEY) return process.env.API_KEY.trim();
  }
  return undefined;
}

export const isAIAvailable = (): boolean => {
  return !!getApiKey();
};

const getAiClient = (): GoogleGenAI => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API Key is missing.');
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
      if (attempt < maxRetries) {
        await sleep(Math.pow(2, attempt - 1) * 1000);
      } else {
        throw error;
      }
    }
  }
  throw new Error('Exceeded max retries');
}

export const runAIChat = async (
  history: ChatMessage[],
  systemInstruction: string,
  tools: Tool[],
  toolImplementations: { [key:string]: (...args: any[]) => any },
  modelName: string = 'gemini-3-flash-preview'
): Promise<GenerateContentResponse> => {
  const ai = getAiClient();
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
