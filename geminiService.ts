
import { GoogleGenAI, GenerateContentResponse, Tool, Part } from '@google/genai';
import { ChatMessage } from './types';

export const isAIAvailable = (): boolean => {
  return !!process.env.API_KEY;
};

const getAiClient = () => {
  if (!process.env.API_KEY) throw new Error('API_KEY is missing');
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const runAIChat = async (
  history: ChatMessage[],
  systemInstruction: string,
  tools: Tool[] = [],
  toolImplementations: { [key: string]: Function } = {},
  modelName: string = 'gemini-3-flash-preview'
): Promise<GenerateContentResponse> => {
  const ai = getAiClient();
  
  const response = await ai.models.generateContent({
    model: modelName,
    contents: history.map(msg => ({ role: msg.role, parts: msg.parts })),
    config: {
      systemInstruction,
      tools,
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
      return await ai.models.generateContent({
        model: modelName,
        contents: newHistory.map(msg => ({ role: (msg as any).role, parts: (msg as any).parts })),
        config: { systemInstruction, tools }
      });
    }
  }

  return response;
};
