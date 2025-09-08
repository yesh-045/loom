import { ChatMessage, AIResponse } from "@/lib/types";
import functionCallingTools from "@/utils/functionCallingTools";

// Convert messages to AIML API format
function convertMessagesToAIMLFormat(messages: ChatMessage[]) {
  return messages.map(msg => ({
    role: msg.role === 'system' ? 'system' : msg.role === 'user' ? 'user' : 'assistant',
    content: typeof msg.content === 'string' ? msg.content : 
      Array.isArray(msg.content) ? msg.content.map((c: { type: string; text?: string; image_url?: { url?: string } }) => {
        if (c.type === 'text') return c.text || '';
        if (c.type === 'image_url' && c.image_url) return `[Image: ${c.image_url.url || 'unknown'}]`;
        return '';
      }).join(' ') : String(msg.content)
  }));
}

export async function getAIMLResponse(messages: ChatMessage[]): Promise<AIResponse> {
  const apiKey = process.env.AIML_API_KEY;
  
  if (!apiKey) {
    throw new Error('AIML_API_KEY is not set in environment variables');
  }

  try {
    const aimlMessages = convertMessagesToAIMLFormat(messages);

    const response = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: aimlMessages,
        temperature: 1,
        max_tokens: 15010,
  tools: functionCallingTools,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AIML API error: ${response.status} - ${errorText}`);
      throw new Error(`AIML API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AIML Response:', JSON.stringify(data, null, 2));
    
    const message = data.choices?.[0]?.message;
    
    // Check if it's a function call
    if (message?.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      
      // Map function names to content types (aligned with shared tool names)
      const functionContentTypes: Record<string, AIResponse['contentType']> = {
        'create_quiz': 'quiz',
        'create_ppt_slides': 'ppt',
        'create_flashcards': 'flashcards',
        'create_spelling_quiz': 'spelling',
        'draw_canvas': 'canvas',
        'image_upload': 'image',
        'run_physics_simulation': 'physics',
        'generate_text_to_speech': 'speech-training',
      };
            
            const contentType = functionContentTypes[functionName];
            if (contentType) {
              return {
                content: JSON.stringify(functionArgs),
                contentType
              };
        }
    }
    
    // Regular text response
    const textContent = message?.content || '';
    return {
      content: textContent
    };
    
  } catch (error) {
    console.error('Error in getAIMLResponse:', error);
    throw error;
  }
}
