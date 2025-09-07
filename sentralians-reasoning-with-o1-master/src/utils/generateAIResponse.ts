/* eslint-disable @typescript-eslint/no-explicit-any */
import { getGeminiResponse } from "./getGeminiResponse";
import selectAIModel from "./selectAIModel";
import { ChatMessage, AIResponse } from "@/lib/types";

export default async function generateAIResponse(messageInput: ChatMessage[]): Promise<AIResponse> {
  // Get model but we only use Gemini now
  selectAIModel(messageInput);

  try {
    const response = await getGeminiResponse(messageInput, 'gemini-2.0-flash-exp');
    const content = typeof response === "string" ? response : response.content;
    return {
      content,
      contentType: undefined // Gemini handles function calling, so contentType is determined later
    };
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw new Error("Failed to generate AI response");
  }
}