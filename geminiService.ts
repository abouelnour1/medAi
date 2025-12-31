
import { GoogleGenAI, GenerateContentResponse, Part } from '@google/genai';
import { ChatMessage } from './types';

/**
 * دالة للتحقق من توفر الذكاء الاصطناعي
 */
export const isAIAvailable = (): boolean => {
  try {
    // نتحقق أولاً من وجود process و env
    const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : null;
    return !!apiKey && apiKey !== 'undefined' && apiKey !== '';
  } catch (e) {
    return false;
  }
};

/**
 * دالة موحدة لتشغيل محادثات الذكاء الاصطناعي
 * تدعم استدعاء الدوال (Function Calling) والبحث عبر جوجل (Google Search Grounding)
 */
export const runAIChat = async (
  history: ChatMessage[],
  systemInstruction: string,
  tools: any[] = [],
  toolImplementations: { [key: string]: Function } = {},
  modelName: string = 'gemini-3-flash-preview'
): Promise<GenerateContentResponse> => {
  if (!isAIAvailable()) {
    throw new Error('API_KEY is missing or invalid. Please check your environment variables.');
  }

  try {
    // إنشاء نسخة جديدة في كل مرة لضمان استخدام المفتاح الأحدث
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    // تحويل التاريخ لصيغة مقبولة من الموديل
    const formattedContents = history.map(msg => ({
      role: msg.role,
      parts: msg.parts.map(p => {
        const cleanPart: any = {};
        if ('text' in p) cleanPart.text = p.text;
        if ('inlineData' in p) cleanPart.inlineData = p.inlineData;
        if ('functionCall' in p) cleanPart.functionCall = p.functionCall;
        if ('functionResponse' in p) cleanPart.functionResponse = p.functionResponse;
        return cleanPart;
      })
    }));

    const response = await ai.models.generateContent({
      model: modelName,
      contents: formattedContents,
      config: {
        systemInstruction,
        tools,
        temperature: 0.7,
      },
    });

    // معالجة استدعاء الدوال التلقائي (Automatic Function Call Handling)
    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionResponses = [];

      for (const fc of response.functionCalls) {
        const impl = toolImplementations[fc.name];
        if (impl) {
          const result = await impl(fc.args);
          functionResponses.push({
            role: 'model',
            parts: [{ functionCall: fc }]
          });
          functionResponses.push({
            role: 'user',
            parts: [{ functionResponse: { name: fc.name, response: result, id: fc.id } }]
          });
        }
      }

      if (functionResponses.length > 0) {
          // دمج النتائج في المحادثة الحالية
        const newHistory = [...history, ...functionResponses as any];
        return await runAIChat(newHistory, systemInstruction, tools, toolImplementations, modelName);
      }
    }

    return response;
  } catch (error: any) {
    console.error("Gemini AI Execution Error:", error);
    throw error;
  }
};
