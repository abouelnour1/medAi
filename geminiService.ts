
import { GoogleGenAI, GenerateContentResponse, Tool } from '@google/genai';
import { ChatMessage } from './types';

export const isAIAvailable = (): boolean => {
  // استخدام مباشر لمغير البيئة كما هو مطلوب
  const apiKey = process.env.API_KEY;
  return !!apiKey && apiKey !== 'undefined' && apiKey !== '';
};

export const runAIChat = async (
  history: ChatMessage[],
  systemInstruction: string,
  tools: any[] = [],
  toolImplementations: { [key: string]: Function } = {},
  modelName: string = 'gemini-3-flash-preview'
): Promise<GenerateContentResponse> => {
  try {
    // التزام كامل بطريقة التعريف المطلوبة
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: history.map(msg => ({ 
        role: msg.role, 
        parts: msg.parts.map(p => {
          const cleanPart: any = {};
          if ('text' in p) cleanPart.text = p.text;
          if ('inlineData' in p) cleanPart.inlineData = p.inlineData;
          if ('functionCall' in p) cleanPart.functionCall = p.functionCall;
          if ('functionResponse' in p) cleanPart.functionResponse = p.functionResponse;
          return cleanPart;
        }) 
      })),
      config: {
        systemInstruction,
        tools,
        temperature: 0.7,
      },
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const fc = response.functionCalls[0];
      const impl = toolImplementations[fc.name];
      if (impl) {
        const result = impl(fc.args);
        const newHistory = [
          ...history,
          { role: 'model', parts: [{ functionCall: fc }] },
          { role: 'user', parts: [{ functionResponse: { name: fc.name, response: result } }] }
        ];
        return await runAIChat(newHistory as any, systemInstruction, tools, toolImplementations, modelName);
      }
    }

    return response;
  } catch (error: any) {
    console.error("AI execution failed:", error);
    throw error;
  }
};
