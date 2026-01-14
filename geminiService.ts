
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { ChatMessage, SerializablePart } from './types';

export const isAIAvailable = (): boolean => {
  // التحقق مما إذا كان المفتاح موجوداً في كود المتصفح بعد الحقن من Vite
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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const safeClone = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(safeClone);
    const clone: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            if (typeof val === 'function') continue;
            clone[key] = safeClone(val);
        }
    }
    return clone;
};

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

export const runAIChat = async (
  history: ChatMessage[],
  systemInstruction: string,
  tools: any[],
  toolImplementations: { [key:string]: (...args: any[]) => any },
  modelName: string = 'gemini-3-flash-preview'
): Promise<GenerateContentResponse> => {
  // استخدام التهيئة المباشرة المطلوبة في التعليمات
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const initialParams = {
    model: modelName,
    contents: history.map(msg => ({ 
        role: msg.role, 
        parts: sanitizeParts(msg.parts)
    })),
    config: { systemInstruction, tools },
  };

  try {
    const response = await ai.models.generateContent(initialParams);
    
    if (response.functionCalls && response.functionCalls.length > 0) {
      const fc = response.functionCalls[0];
      const implementation = toolImplementations[fc.name];
      if (implementation) {
        const functionResult = implementation(fc.args);
        const toolResponseHistory: ChatMessage[] = [
          ...history,
          { role: 'model', parts: [{ functionCall: { name: fc.name, args: safeClone(fc.args), id: fc.id } }] },
          { role: 'user', parts: [{ functionResponse: { name: fc.name, response: functionResult, id: fc.id } }] }
        ];
        
        return await ai.models.generateContent({
          model: modelName,
          contents: toolResponseHistory.map(msg => ({ role: msg.role, parts: sanitizeParts(msg.parts) })),
          config: { systemInstruction, tools },
        });
      }
    }
    return response;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
