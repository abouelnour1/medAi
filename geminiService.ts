
import { GoogleGenAI, GenerateContentResponse, Tool } from '@google/genai';
import { ChatMessage, SerializablePart } from './types';

// Fix: API key must be obtained exclusively from process.env.API_KEY
const getApiKey = (): string | undefined => {
  return process.env.API_KEY;
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

// Fix: Always use process.env.API_KEY directly in initialization as per guidelines
const getAiClient = (): GoogleGenAI => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error('API Key is missing. Please ensure process.env.API_KEY is configured.');
    }
    if (apiKey.includes('PLACEHOLDER')) {
        throw new Error('Invalid API Key: You are using a PLACEHOLDER key.');
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
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
      // Fix: Call generateContent directly with parameters that include the model name
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

// Utility to convert SDK parts to plain serializable objects
export const sanitizeParts = (parts: any[]): SerializablePart[] => {
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
                args: p.functionCall.args ? JSON.parse(JSON.stringify(p.functionCall.args)) : {},
                id: p.functionCall.id
            };
        }
        if (p.functionResponse) {
            part.functionResponse = {
                name: p.functionResponse.name,
                response: p.functionResponse.response ? JSON.parse(JSON.stringify(p.functionResponse.response)) : {},
                id: p.functionResponse.id
            };
        }
        return part;
    });
};

// General-purpose AI chat function
export const runAIChat = async (
  history: ChatMessage[],
  systemInstruction: string,
  tools: Tool[],
  toolImplementations: { [key:string]: (...args: any[]) => any },
  modelName: string = 'gemini-3-flash-preview'
): Promise<GenerateContentResponse> => {
  const ai = getAiClient();

  const initialParams = {
    model: modelName,
    contents: history.map(msg => ({ 
        role: msg.role, 
        // Ensure inputs are also clean
        parts: msg.parts.map(p => {
            const clean: any = {};
            if (p.text) clean.text = p.text;
            if (p.inlineData) clean.inlineData = p.inlineData;
            if (p.functionCall) clean.functionCall = p.functionCall;
            if (p.functionResponse) clean.functionResponse = p.functionResponse;
            return clean;
        })
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

      const toolResponseHistory: ChatMessage[] = [
        ...history,
        { role: 'model', parts: [{ functionCall: { name: fc.name, args: fc.args, id: fc.id } }] },
        { role: 'user', parts: [{ functionResponse: { name: fc.name, response: functionResult, id: fc.id } }] }
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
