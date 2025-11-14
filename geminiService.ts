import { GoogleGenAI, FunctionDeclaration, Part, GenerateContentResponse, Tool } from '@google/genai';
import { ChatMessage } from '../types';

// --- Security Note ---
// This file handles all interactions with the Google Gemini API.
// The API key is sourced from environment variables.
// In a production environment (like Vercel, Netlify, etc.), this file
// should be converted into a serverless function (API route) to ensure
// the API key is not exposed on the client-side browser.
// The frontend would then call this function instead of using this service directly.

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

export const isAIAvailable = (): boolean => {
  return !!ai;
};

// General-purpose AI chat function
export const runAIChat = async (
  history: ChatMessage[],
  systemInstruction: string,
  tools: Tool[],
  toolImplementations: { [key:string]: (...args: any[]) => any }
): Promise<GenerateContentResponse> => {
  if (!ai) {
    throw new Error('AI service is not available. API_KEY is missing.');
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: history.map(msg => ({ role: msg.role, parts: msg.parts })),
    config: {
      systemInstruction,
      tools,
    },
  });

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

      // Call the model again with the tool response
      const secondResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: toolResponseHistory.map(msg => ({ role: msg.role, parts: msg.parts })),
        config: { systemInstruction }, // Note: second call doesn't need tools
      });

      return secondResponse;
    }
  }

  return response;
};