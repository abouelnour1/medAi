
import { GoogleGenAI, Part, GenerateContentResponse, Tool } from '@google/genai';
import { ChatMessage } from './types';

const getApiKey = (): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
      if (process.env.API_KEY) return process.env.API_KEY.trim();
  }
  return undefined;
}

export const isAIAvailable = (): boolean => {
  const apiKey = getApiKey();
  return !!apiKey && apiKey !== 'undefined' && apiKey !== '';
};

const getAiClient = (): GoogleGenAI => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API Key is missing');
    return new GoogleGenAI({ apiKey });
}

export const runAIChat = async (
  history: ChatMessage[],
  systemInstruction: string,
  tools: Tool[] = [],
  toolImplementations: { [key:string]: (...args: any[]) => any } = {},
  modelName: string = 'gemini-3-flash-preview'
): Promise<GenerateContentResponse> => {
  const ai = getAiClient();
  const initialParams = {
    model: modelName,
    contents: history.map(msg => ({ role: msg.role, parts: msg.parts })),
    config: { systemInstruction, tools },
  };

  const response = await ai.models.generateContent(initialParams);

  if (response.functionCalls && response.functionCalls.length > 0) {
    const fc = response.functionCalls[0];
    const implementation = toolImplementations[fc.name];
    if (implementation) {
      const functionResult = implementation(fc.args);
      const toolResponseHistory: ChatMessage[] = [
        ...history,
        { role: 'model', parts: [{ functionCall: fc }] },
        { role: 'user', parts: [{ functionResponse: { name: fc.name, response: functionResult, id: fc.id } }] }
      ];
      return await ai.models.generateContent({
        model: modelName,
        contents: toolResponseHistory.map(msg => ({ role: msg.role, parts: msg.parts })),
        config: { systemInstruction, tools },
      });
    }
  }
  return response;
};

/**
 * دالة متخصصة للبحث عن توفر الأدوية في كافة الصيدليات السعودية عبر الإنترنت
 */
export const searchPharmacyAvailability = async (medicineName: string): Promise<{ text: string, links: { title: string, url: string }[] }> => {
    if (!isAIAvailable()) throw new Error('API Key is missing');
    const ai = getAiClient();
    
    const prompt = `ابحث بدقة عن توفر دواء "${medicineName}" في كافة الصيدليات السعودية الكبرى (مثل النهدي، الدواء، ليمون، المتحدة، وايتس، كنوز، أورانج، وغيرها).
    أجب باختصار شديد جداً عما إذا كان متوفراً أم لا وأين. 
    مهم جداً: لا تضع روابط المواقع داخل النص الذي تكتبه، سأقوم أنا باستخراج الروابط من مراجع البحث وعرضها بشكل منفصل.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });

    const links: { title: string, url: string }[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
            if (chunk.web && chunk.web.uri) {
                // تنظيف العنوان لإظهار اسم الصيدلية فقط إن أمكن
                let title = chunk.web.title || 'رابط الصيدلية';
                if (title.includes('|')) title = title.split('|')[0].trim();
                if (title.includes('-')) title = title.split('-')[0].trim();
                
                // منع التكرار
                if (!links.find(l => l.url === chunk.web.uri)) {
                    links.push({ title: title, url: chunk.web.uri });
                }
            }
        });
    }

    return {
        text: response.text || '',
        links: links
    };
};
