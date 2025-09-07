import { ChatMessage, AIResponse } from "@/lib/types";

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

// Convert messages to Gemini API format
function convertMessagesToGeminiFormat(messages: ChatMessage[]) {
  return messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{
      text: typeof msg.content === 'string' ? msg.content : 
        Array.isArray(msg.content) ? msg.content.map(c => {
          if (c.type === 'text') return (c ).text || '';
          if (c.type === 'image') return `[Image: ${(c ).imageUrl || 'unknown'}]`;
          return '';
        }).join(' ') : String(msg.content)
    }]
  }));
}

export async function getGeminiResponse(messages: ChatMessage[], model: string = 'gemini-2.0-flash'): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  try {
    const geminiMessages = convertMessagesToGeminiFormat(messages);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: geminiMessages,
        tools: [{
          function_declarations: functionCallingTools.map(tool => ({
            name: tool.function.name,
            description: tool.function.description,
            parameters: tool.function.parameters
          }))
        }],
        tool_config: {
          function_calling_config: {
            mode: "AUTO"
          }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error: ${response.status} - ${errorText}`);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini Response:', JSON.stringify(data, null, 2));
    
    const candidate = data.candidates?.[0];
    const content = candidate?.content;
    
    // Check if it's a function call
    if (content?.parts?.[0]?.functionCall) {
      const functionCall = content.parts[0].functionCall;
      const functionName = functionCall.name;
      const functionArgs = functionCall.args;
      
      // Map function names to content types (use AIResponse['contentType'] so the values match the declared union type)
      const functionContentTypes: Record<string, AIResponse['contentType']> = {
        'create_quiz': 'quiz',
        'create_ppt_slides': 'ppt',
        'create_flashcards': 'flashcards',
        'create_spelling_quiz': 'spelling',
        'draw_canvas': 'canvas',
        'upload_image': 'image',
        'create_physics_simulator': 'physics',
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
    const textContent = content?.parts?.[0]?.text || '';
    return {
      content: textContent
    };
    
  } catch (error) {
    console.error('Error in getGeminiResponse:', error);
    throw error;
  }
}
