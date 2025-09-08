import { NextRequest, NextResponse } from 'next/server';
import { ChatMessage, AIResponse } from "@/lib/types";
import { getGeminiResponse } from '@/utils/getGeminiResponse';
import { getAIMLResponse } from '@/utils/getAIMLResponse';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages: ChatMessage[] = body.messages;

    let response: AIResponse;
    
    try {
      // Try Gemini first with OpenAI-style function calling
      response = await getGeminiResponse(messages, 'gemini-2.0-flash-exp');
      
      // If Gemini returns a function call, return it directly
      if (response.contentType) {
        return NextResponse.json(response, { status: 200 });
      }
    } catch (error: unknown) {
      // If Gemini fails, fallback to AIML
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('Gemini failed, falling back to AIML...', errorMessage);
      
      try {
        response = await getAIMLResponse(messages);
        
        // If AIML returns a function call, return it directly
        if (response.contentType) {
          return NextResponse.json(response, { status: 200 });
        }
      } catch (aimlError: unknown) {
        const aimlErrorMessage = aimlError instanceof Error ? aimlError.message : 'Unknown error';
        console.log('AIML also failed:', aimlErrorMessage);
        
        // Final fallback - return a helpful message
        response = { 
          content: "⚠️ AI services are temporarily unavailable. Please check your API keys:\n\n• Gemini: Quota exceeded (50 requests/day limit)\n• AIML: Invalid API key (403 Forbidden)\n\nPlease update your API keys in the .env file and restart the server." 
        };
      }
    }

    // If no contentType, try to auto-detect component JSON in the text and set type accordingly
    let contentType = response.contentType;
    let content = response.content;

    if (!contentType && typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.slides)) {
            contentType = 'ppt';
          } else if (Array.isArray(parsed.questions)) {
            contentType = 'quiz';
          } else if (Array.isArray(parsed.flashcards)) {
            contentType = 'flashcards';
          } else if (Array.isArray(parsed.words) || Array.isArray(parsed.spellings)) {
            contentType = 'spelling';
          } else if (parsed && parsed.simulation) {
            contentType = 'physics';
          }
        }
      } catch { /* ignore JSON parse errors */ }
    }

    if (contentType) {
      return NextResponse.json({ content, contentType } as AIResponse, { status: 200 });
    }

    // Return regular text response
    return NextResponse.json({ content } as AIResponse, { status: 200 });
  } catch (error) {
    console.error("Error generating AI response:", error);
    return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 500 });
  }
}