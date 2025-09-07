import { ChatMessage, AIResponse } from "@/lib/types";

// Define all function calling tools for AIML API
const functionCallingTools = [
  {
    type: "function",
    function: {
      name: "create_quiz",
      description: "Create an interactive quiz with multiple choice questions",
      parameters: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                questionText: { type: "string" },
                choices: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      isCorrect: { type: "boolean" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_ppt_slides",
      description: "Create PowerPoint presentation slides with specific types and content structure",
      parameters: {
        type: "object",
        properties: {
          slides: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: [
                    "Header & Subheader Slide",
                    "Enumeration Slide", 
                    "Definition Slide",
                    "Paragraph Slide",
                    "Comparison Slide"
                  ]
                },
                content: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    subtitle: { type: "string" },
                    bullets: {
                      type: "array",
                      items: { type: "string" }
                    },
                    term: { type: "string" },
                    definition: { type: "string" },
                    paragraph: { type: "string" },
                    comparisonItems: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          header: { type: "string" },
                          points: {
                            type: "array",
                            items: { type: "string" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_flashcards",
      description: "Create interactive flashcards for studying",
      parameters: {
        type: "object",
        properties: {
          flashcards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                front: { type: "string" },
                back: { type: "string" }
              }
            }
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_spelling_quiz",
      description: "Create a spelling quiz with words and audio",
      parameters: {
        type: "object",
        properties: {
          words: {
            type: "array",
            items: {
              type: "object",
              properties: {
                word: { type: "string" },
                definition: { type: "string" },
                difficulty: { type: "string" }
              }
            }
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "draw_canvas",
      description: "Create an interactive drawing canvas",
      parameters: {
        type: "object",
        properties: {
          canvasData: {
            type: "object",
            properties: {
              width: { type: "number" },
              height: { type: "number" },
              tools: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "upload_image",
      description: "Handle image upload and processing",
      parameters: {
        type: "object",
        properties: {
          imageData: {
            type: "object",
            properties: {
              url: { type: "string" },
              alt: { type: "string" },
              caption: { type: "string" }
            }
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_physics_simulator",
      description: "Create an interactive physics simulation",
      parameters: {
        type: "object",
        properties: {
          simulation: {
            type: "object",
            properties: {
              type: { type: "string" },
              parameters: { type: "object" },
              initialConditions: { type: "object" }
            }
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_text_to_speech",
      description: "Generate text-to-speech audio",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string" },
          voice: { type: "string" },
          speed: { type: "number" }
        }
      }
    }
  }
];

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
      
      // Map function names to content types
      const functionContentTypes: Record<string, AIResponse['contentType']> = {
              'create_quiz': 'quiz',
              'create_ppt_slides': 'ppt',
              'create_flashcards': 'flashcards',
              'create_spelling_quiz': 'spelling',
              'draw_canvas': 'canvas',
              'upload_image': 'image',
              'create_physics_simulator': 'physics'
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
