import { ChatMessage, AIResponse } from "@/lib/types";
import functionCallingTools from "@/utils/functionCallingTools";

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

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const lastUserText = (typeof lastUserMessage?.content === 'string' ? lastUserMessage?.content : '').toLowerCase();
    const wantsSlides = /\b(slide|slides|presentation|powerpoint|ppt)\b/.test(lastUserText);
    const wantsQuiz = /\b(quiz|mcq|multiple choice)\b/.test(lastUserText);
    const wantsFlashcards = /\b(flashcard|flash cards|cards)\b/.test(lastUserText);
    const wantsSpelling = /\b(spell|spelling)\b/.test(lastUserText);
    const wantsCanvas = /\b(draw|canvas|sketch)\b/.test(lastUserText);
    const wantsImage = /\b(image|upload|picture|photo)\b/.test(lastUserText);
    const wantsPhysics = /\b(physics|simulate|simulation|objects|velocity|weight|position)\b/.test(lastUserText);
    const wantsTTS = /\b(tts|voice|speak|narration|read aloud|text to speech)\b/.test(lastUserText);

  const allFunctionNames = functionCallingTools.map(t => t.function.name);
  let allowedFunctionNames = allFunctionNames;
  if (wantsSlides) allowedFunctionNames = ['create_ppt_slides'];
  else if (wantsQuiz) allowedFunctionNames = ['create_quiz'];
  else if (wantsFlashcards) allowedFunctionNames = ['create_flashcards'];
  else if (wantsSpelling) allowedFunctionNames = ['create_spelling_quiz'];
  else if (wantsCanvas) allowedFunctionNames = ['draw_canvas'];
  else if (wantsImage) allowedFunctionNames = ['image_upload'];
  else if (wantsPhysics) allowedFunctionNames = ['run_physics_simulation'];
  else if (wantsTTS) allowedFunctionNames = ['generate_text_to_speech'];

  const restrictFunctions = allowedFunctionNames.length !== allFunctionNames.length;

    const systemInstruction = (
      "You are a function-calling assistant. Prefer calling a tool instead of replying with plain text when a matching tool exists.\n\n" +
      "Available tools and when to use them:\n" +
      "- create_quiz: when asked to generate a multiple-choice quiz; args: { questions: [ { questionText, choices: [ { text, isCorrect } x4 ] } ... ] }\n" +
      "- create_ppt_slides: when asked to create slides/presentation; args: { slides: [ { type, content } xN ] }\n" +
      "  Allowed slide types (exact strings): 'Header & Subheader Slide', 'Enumeration Slide', 'Definition Slide', 'Paragraph Slide', 'Comparison Slide'.\n" +
      "  Content fields by type:\n" +
      "   • Header & Subheader Slide: { title, subtitle }\n" +
      "   • Enumeration Slide: { title, bullets: string[3-5] }\n" +
      "   • Definition Slide: { term, definition }\n" +
      "   • Paragraph Slide: { paragraph }\n" +
      "   • Comparison Slide: { title, comparisonItems: [{ header, points: string[1-3] }] }\n" +
      "  Never use custom slide types like 'title_slide', 'content_slide', or 'image_slide'. Do not leave content empty.\n" +
      "- create_flashcards: when asked for flashcards; args: { flashcards: [ { term, definition } ... ] }\n" +
      "- create_spelling_quiz: when asked for spelling practice; args: { spellings: [ { word, definition, examples: [..] } ... ] }\n" +
      "- draw_canvas: when asked to draw or sketch concepts on a canvas; args: {}\n" +
      "- image_upload: when asked to upload/provide an image; args: {}\n" +
      "- run_physics_simulation: when asked for a physics simulator; args: { objects: [ { weight, velocity: {x,y}, position: {x,y} } ... ] }\n" +
      "- generate_text_to_speech: when asked to generate narration or speech; args: { text, voice, purpose }\n\n" +
      "Rules:\n" +
      "1) If the user asks for slides or a presentation, ALWAYS call create_ppt_slides and produce exactly the requested number of slides.\n" +
      "2) Use only the allowed slide types and include the required content fields for each type.\n" +
      "3) When a tool applies, respond by calling the tool with JSON args only. No commentary inside args.\n" +
      "4) Keep strings concise and factual.\n"
    );

    // Gemini-safe parameter schemas (avoid unsupported keywords like oneOf/const/additionalProperties)
    const geminiParams: Record<string, any> = {
      create_quiz: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                questionText: { type: 'string' },
                choices: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      text: { type: 'string' },
                      isCorrect: { type: 'boolean' }
                    },
                    required: ['text', 'isCorrect']
                  }
                }
              },
              required: ['questionText', 'choices']
            }
          }
        },
        required: ['questions']
      },
      create_ppt_slides: {
        type: 'object',
        properties: {
          slides: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: [
                    'Header & Subheader Slide',
                    'Enumeration Slide',
                    'Definition Slide',
                    'Paragraph Slide',
                    'Comparison Slide'
                  ]
                },
                content: {
                  type: 'object',
                  properties: {
                    // Header & Subheader
                    title: { type: 'string' },
                    subtitle: { type: 'string' },
                    // Enumeration
                    bullets: {
                      type: 'array',
                      items: { type: 'string' },
                      minItems: 3,
                      maxItems: 5
                    },
                    // Definition
                    term: { type: 'string' },
                    definition: { type: 'string' },
                    // Paragraph
                    paragraph: { type: 'string' },
                    // Comparison
                    comparisonItems: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          header: { type: 'string' },
                          points: {
                            type: 'array',
                            items: { type: 'string' },
                            minItems: 1,
                            maxItems: 3
                          }
                        },
                        required: ['header', 'points']
                      },
                      minItems: 2
                    }
                  }
                }
              },
              required: ['type', 'content']
            },
            minItems: 1
          }
        },
        required: ['slides']
      },
      create_flashcards: {
        type: 'object',
        properties: {
          flashcards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                term: { type: 'string' },
                definition: { type: 'string' }
              },
              required: ['term', 'definition']
            }
          }
        },
        required: ['flashcards']
      },
      create_spelling_quiz: {
        type: 'object',
        properties: {
          spellings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                word: { type: 'string' },
                definition: { type: 'string' },
                examples: {
                  type: 'array',
                  items: { type: 'string' }
                }
              },
              required: ['word', 'definition', 'examples']
            }
          }
        },
        required: ['spellings']
      },
      draw_canvas: { type: 'object' },
      image_upload: { type: 'object' },
      run_physics_simulation: {
        type: 'object',
        properties: {
          objects: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                weight: { type: 'number' },
                velocity: {
                  type: 'object',
                  properties: { x: { type: 'number' }, y: { type: 'number' } },
                  required: ['x', 'y']
                },
                position: {
                  type: 'object',
                  properties: { x: { type: 'number' }, y: { type: 'number' } },
                  required: ['x', 'y']
                }
              },
              required: ['weight', 'velocity', 'position']
            }
          }
        },
        required: ['objects']
      },
      generate_text_to_speech: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          voice: { type: 'string' },
          purpose: { type: 'string' }
        },
        required: ['text', 'purpose']
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: { role: 'system', parts: [{ text: systemInstruction }] },
        contents: geminiMessages,
        tools: [{
          function_declarations: functionCallingTools.map(tool => ({
            name: tool.function.name,
            description: tool.function.description,
            parameters: geminiParams[tool.function.name] ?? { type: 'object' }
          }))
        }],
        tool_config: {
          function_calling_config: restrictFunctions
            ? { mode: "ANY", allowed_function_names: allowedFunctionNames }
            : { mode: "AUTO" }
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
    // Search for the first function call across all parts
    const functionCallPart = content?.parts?.find((p: any) => p.functionCall);
    if (functionCallPart?.functionCall) {
      const functionCall = functionCallPart.functionCall;
      const functionName = functionCall.name;
      let functionArgs = functionCall.args;
      
      // Map function names to content types (aligned with function-calling-tools definitions)
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
        // Normalize PPT slides to allowed types with non-empty content
        if (functionName === 'create_ppt_slides' && functionArgs && Array.isArray(functionArgs.slides)) {
          const allowedTypes = new Set([
            'Header & Subheader Slide',
            'Enumeration Slide',
            'Definition Slide',
            'Paragraph Slide',
            'Comparison Slide'
          ]);

          const norm = (s: any): any => {
            let t = s?.type;
            const c = s?.content ?? {};
            const lower = typeof t === 'string' ? t.toLowerCase() : '';
            if (!allowedTypes.has(t)) {
              if (lower.includes('title')) t = 'Header & Subheader Slide';
              else if (lower.includes('content') || lower.includes('text') || lower.includes('paragraph')) t = 'Paragraph Slide';
              else if (lower.includes('image')) t = 'Header & Subheader Slide';
              else t = 'Paragraph Slide';
            }
            // Ensure required content fields per type
            if (t === 'Header & Subheader Slide') {
              return { type: t, content: { title: c.title ?? 'Presentation', subtitle: c.subtitle ?? 'Generated slide' } };
            }
            if (t === 'Enumeration Slide') {
              const bullets = Array.isArray(c.bullets) && c.bullets.length >= 3 ? c.bullets.slice(0, 5) : ['Point 1', 'Point 2', 'Point 3'];
              return { type: t, content: { title: c.title ?? 'Overview', bullets } };
            }
            if (t === 'Definition Slide') {
              return { type: t, content: { term: c.term ?? 'Term', definition: c.definition ?? 'Definition goes here.' } };
            }
            if (t === 'Comparison Slide') {
              const items = Array.isArray(c.comparisonItems) && c.comparisonItems.length >= 2 ? c.comparisonItems.slice(0, 3) : [
                { header: 'A', points: ['Point'] },
                { header: 'B', points: ['Point'] }
              ];
              return { type: t, content: { title: c.title ?? 'Comparison', comparisonItems: items } };
            }
            // Paragraph default
            return { type: 'Paragraph Slide', content: { paragraph: c.paragraph ?? 'Summary goes here.' } };
          };

          functionArgs = { ...functionArgs, slides: functionArgs.slides.map(norm) };
        }
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
