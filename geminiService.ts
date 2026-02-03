import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { ChatMessage, SerializablePart } from './types';

export const isAIAvailable = (): boolean => {
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

/**
 * وظيفة لتنظيف الأجزاء بشكل عميق وجعلها قابلة للتحويل لـ JSON بأمان.
 * تمنع خطأ "Converting circular structure to JSON" عبر إنشاء كائنات جديدة تماماً.
 */
export const sanitizeParts = (parts: any[]): SerializablePart[] => {
    if (!parts || !Array.isArray(parts)) return [];
    
    return parts.map(part => {
        const sanitized: SerializablePart = {};
        
        // التعامل مع النصوص (Text parts)
        if (part.text !== undefined && part.text !== null) {
            sanitized.text = String(part.text);
        }
        
        // التعامل مع التفكير (Thought parts)
        if (part.thought !== undefined && part.thought !== null) {
            sanitized.thought = String(part.thought);
        }
        
        // التعامل مع الصور (Inline data)
        if (part.inlineData) {
            sanitized.inlineData = {
                mimeType: String(part.inlineData.mimeType),
                data: String(part.inlineData.data)
            };
        }
        
        // التعامل مع استدعاءات الوظائف (Function Calls)
        // نقوم بعمل نسخة عميقة للأرقام والنصوص فقط لمنع المراجع الدائرية
        if (part.functionCall) {
            sanitized.functionCall = {
                name: String(part.functionCall.name),
                args: JSON.parse(JSON.stringify(part.functionCall.args || {})),
                id: part.functionCall.id ? String(part.functionCall.id) : undefined
            };
        }

        // التعامل مع ردود الوظائف (Function Responses)
        if (part.functionResponse) {
            sanitized.functionResponse = {
                name: String(part.functionResponse.name),
                response: JSON.parse(JSON.stringify(part.functionResponse.response || {})),
                id: part.functionResponse.id ? String(part.functionResponse.id) : undefined
            };
        }
        
        return sanitized;
    }).filter(p => Object.keys(p).length > 0);
};

export const runAIChat = async (
    history: ChatMessage[],
    systemInstruction: string,
    tools: any[] | null,
    toolImplementations: Record<string, Function>,
    modelName: string = 'gemini-3-flash-preview'
): Promise<GenerateContentResponse> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // تطهير التاريخ بالكامل قبل الإرسال لضمان عدم وجود مراجع دائرية من SDK
    const contents = history.map(msg => ({
        role: msg.role,
        parts: sanitizeParts(msg.parts)
    }));

    const config: any = {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        thinkingConfig: { thinkingBudget: 0 }
    };

    if (tools) config.tools = tools;

    let response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: config,
    });

    let iterations = 0;
    // حلقة معالجة استدعاء الوظائف (Function Calling Loop)
    while (response.functionCalls && response.functionCalls.length > 0 && iterations < 5) {
        iterations++;
        const functionResponses: any[] = [];
        
        for (const call of response.functionCalls) {
            const implementation = toolImplementations[call.name];
            if (implementation) {
                const result = await implementation(call.args);
                // تطهير النتيجة فوراً قبل إضافتها للمصفوفة
                functionResponses.push({
                    functionResponse: {
                        name: call.name,
                        response: JSON.parse(JSON.stringify(result || {})),
                        id: call.id
                    }
                });
            }
        }

        if (functionResponses.length > 0) {
            const modelTurnParts = response.candidates?.[0]?.content?.parts;
            if (modelTurnParts) {
                // إضافة رد الموديل المطهر ورد المستخدم المطهر (Function Responses)
                contents.push({ role: 'model', parts: sanitizeParts(modelTurnParts) });
                contents.push({ role: 'user', parts: functionResponses });
                
                response = await ai.models.generateContent({
                    model: modelName,
                    contents: contents,
                    config: config,
                });
            } else break;
        } else break;
    }

    return response;
};