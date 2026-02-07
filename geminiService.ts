
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { ChatMessage, SerializablePart } from './types';

export const isAIAvailable = (): boolean => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === '' || apiKey === 'undefined') return false;
  return true;
};

/**
 * Robustly deep cleans an object to ensure it is a plain, serializable object 
 * without circular references or complex class instances (like Firestore internals).
 */
const deepClean = (obj: any, seen = new WeakSet()): any => {
    // Handle primitives
    if (obj === null || typeof obj !== 'object') {
        if (typeof obj === 'function' || typeof obj === 'symbol') return undefined;
        return obj;
    }
    
    // Prevent Circular References
    if (seen.has(obj)) {
        return '[Circular]';
    }
    seen.add(obj);

    // Handle Arrays
    if (Array.isArray(obj)) {
        return obj.map(item => deepClean(item, seen)).filter(i => i !== undefined);
    }

    // Handle Objects
    const cleaned: any = {};
    
    // Check if it's a special object that should be converted to string
    // e.g. Date, RegExp, or Firebase references
    const toStringValue = Object.prototype.toString.call(obj);
    if (toStringValue !== '[object Object]') {
        if (typeof obj.toString === 'function' && obj.toString !== Object.prototype.toString) {
            try {
                const s = obj.toString();
                if (s !== '[object Object]') return s;
            } catch (e) {
                return `[Complex ${toStringValue}]`;
            }
        }
    }

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            
            // Skip functions and symbols
            if (typeof val === 'function' || typeof val === 'symbol') continue;
            
            const cleanedVal = deepClean(val, seen);
            if (cleanedVal !== undefined) {
                cleaned[key] = cleanedVal;
            }
        }
    }
    
    return cleaned;
};

// Defensive function to ensure message parts are safe for the GenAI SDK
export const sanitizeParts = (parts: any[]): any[] => {
    if (!parts || !Array.isArray(parts)) return [];
    
    return parts.map(part => {
        const sanitized: any = {};
        
        // Use a WeakSet for deepClean to handle recursion locally within each part if needed
        const seen = new WeakSet();

        // 1. Text Parts
        if (part.text !== undefined && part.text !== null) {
            sanitized.text = String(part.text);
        }
        
        // 2. Inline Data (Image) Parts
        if (part.inlineData) {
            sanitized.inlineData = {
                mimeType: String(part.inlineData.mimeType || ''),
                data: String(part.inlineData.data || '')
            };
        }
        
        // 3. Function Call Parts (Model turn)
        if (part.functionCall) {
            sanitized.functionCall = {
                name: String(part.functionCall.name),
                args: deepClean(part.functionCall.args || {}, seen),
                id: part.functionCall.id ? String(part.functionCall.id) : undefined
            };
        }

        // 4. Function Response Parts (User turn)
        if (part.functionResponse) {
            sanitized.functionResponse = {
                name: String(part.functionResponse.name),
                response: deepClean(part.functionResponse.response || {}, seen),
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
    
    // Ensure history is clean before building contents
    const contents: any[] = history.map(msg => ({
        role: msg.role,
        parts: sanitizeParts(msg.parts)
    }));

    const config: any = {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
    };

    if (tools) config.tools = tools;

    let response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: config,
    });

    let iterations = 0;
    while (response.functionCalls && response.functionCalls.length > 0 && iterations < 5) {
        iterations++;
        const functionResponses: any[] = [];
        
        for (const call of response.functionCalls) {
            const implementation = toolImplementations[call.name];
            if (implementation) {
                const result = await implementation(call.args);
                functionResponses.push({
                    functionResponse: {
                        name: call.name,
                        response: deepClean(result || {}),
                        id: call.id
                    }
                });
            }
        }

        if (functionResponses.length > 0) {
            const modelTurnParts = response.candidates?.[0]?.content?.parts;
            if (modelTurnParts) {
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
