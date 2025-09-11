import { ChatMessage, AIResponse } from "@/lib/types";
import functionCallingTools from "@/utils/functionCallingTools";

interface GeminiFunctionCallPart {
  functionCall?: {
    name: string;
    args?: Record<string, unknown>;
  };
  text?: string;
  inline_data?: { mimeType: string; data: string };
}

interface GeminiContent {
  parts?: GeminiFunctionCallPart[];
}

interface GeminiCandidate {
  content?: GeminiContent;
}

interface GeminiAPIResponse {
  candidates?: GeminiCandidate[];
}

// Convert messages to Gemini API format, embedding images as inline_data
async function convertMessagesToGeminiFormat(messages: ChatMessage[]) {
  const convertOne = async (msg: ChatMessage) => {
    const parts: GeminiFunctionCallPart[] = [];

    if (typeof msg.content === 'string') {
      parts.push({ text: msg.content });
    } else if (Array.isArray(msg.content)) {
      for (const raw of msg.content as Array<Record<string, unknown>>) {
        if (!raw || typeof raw !== 'object') continue;
        // OpenAI-style text part
        if (raw.type === 'text' && typeof raw.text === 'string') {
          parts.push({ text: raw.text });
          continue;
        }
        // OpenAI-style image_url part
        if (raw.type === 'image_url' && raw.image_url && typeof (raw.image_url as { url?: unknown }).url === 'string') {
          const url: string = (raw.image_url as { url: string }).url;
          try {
            const res = await fetch(url);
            const ct = res.headers.get('content-type') || '';
            const mime = selectSupportedImageMimeType(ct, url);
            const buf = await res.arrayBuffer();
            const b64 = Buffer.from(buf).toString('base64');
            parts.push({ inline_data: { mimeType: mime, data: b64 } });
          } catch {
            // Fallback: include as text reference if fetch fails
            parts.push({ text: `Image to analyze: ${url}` });
          }
          continue;
        }
        // Legacy custom 'image' with imageUrl
        if (raw.type === 'image' && typeof (raw as { imageUrl?: unknown }).imageUrl === 'string') {
          const url: string = (raw as { imageUrl: string }).imageUrl;
          try {
            const res = await fetch(url);
            const ct = res.headers.get('content-type') || '';
            const mime = selectSupportedImageMimeType(ct, url);
            const buf = await res.arrayBuffer();
            const b64 = Buffer.from(buf).toString('base64');
            parts.push({ inline_data: { mimeType: mime, data: b64 } });
          } catch {
            parts.push({ text: `Image to analyze: ${url}` });
          }
        }
      }
    } else {
      parts.push({ text: String(msg.content) });
    }

    return {
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts
    };
  };

  const out = [] as Array<{ role: string; parts: GeminiFunctionCallPart[] }>;
  for (const m of messages) {
    out.push(await convertOne(m));
  }
  // Ensure each message has at least one text part to avoid empty content
  for (const m of out) {
    if (!m.parts || m.parts.length === 0) m.parts = [{ text: '' }];
  }
  return out;
}

function guessMimeTypeFromUrl(url: string): string {
  const lower = url.split('?')[0].toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'application/octet-stream';
}

function selectSupportedImageMimeType(contentTypeHeader: string, url: string): string {
  const supported = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
  const header = (contentTypeHeader || '').toLowerCase().split(';')[0].trim();
  if (header && supported.has(header)) return header;
  const guessed = guessMimeTypeFromUrl(url);
  if (supported.has(guessed)) return guessed;
  // Cloudinary image URLs may have no extension; default to jpeg
  if (url.includes('/image/upload')) return 'image/jpeg';
  return 'image/jpeg';
}

export async function getGeminiResponse(messages: ChatMessage[], model: string = 'gemini-2.0-flash'): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  try {
    const geminiMessages = await convertMessagesToGeminiFormat(messages);

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const lastUserText = (typeof lastUserMessage?.content === 'string' ? lastUserMessage?.content : '').toLowerCase();
    const wantsSlides = /\b(slide|slides|presentation|powerpoint|ppt)\b/.test(lastUserText);
    const wantsQuiz = /\b(quiz|mcq|multiple choice)\b/.test(lastUserText);
    const wantsFlashcards = /\b(flashcard|flash cards|cards)\b/.test(lastUserText);
    const wantsSpelling = /\b(spell|spelling)\b/.test(lastUserText);
    const wantsCanvas = /\b(draw|canvas|sketch)\b/.test(lastUserText);
  // const wantsImage = /\b(image|upload|picture|photo)\b/.test(lastUserText);
    const wantsPhysics = /\b(physics|simulate|simulation|objects|velocity|weight|position)\b/.test(lastUserText);
    const wantsTTS = /\b(tts|voice|speak|narration|read aloud|text to speech)\b/.test(lastUserText);

  const allFunctionNames = functionCallingTools.map(t => t.function.name);
  let allowedFunctionNames = allFunctionNames;
  // If the conversation includes an image payload, prefer direct analysis text over opening an image component.
  const hasImagePayload = messages.some(m => Array.isArray(m.content) && (m.content as Array<Record<string, unknown>>).some(p => p && typeof p === 'object' && (p.type === 'image' || p.type === 'image_url')));
  if (wantsSlides) allowedFunctionNames = ['create_ppt_slides'];
  else if (wantsQuiz) allowedFunctionNames = ['create_quiz'];
  else if (wantsFlashcards) allowedFunctionNames = ['create_flashcards'];
  else if (wantsSpelling) allowedFunctionNames = ['create_spelling_quiz'];
  else if (wantsCanvas) allowedFunctionNames = ['draw_canvas'];
  else if (wantsPhysics) allowedFunctionNames = ['run_physics_simulation'];
  else if (wantsTTS) allowedFunctionNames = ['generate_text_to_speech'];

  // Never allow image_upload tool when we already have an image to analyze.
  if (hasImagePayload) {
    allowedFunctionNames = allowedFunctionNames.filter(n => n !== 'image_upload');
    // Avoid drawing unless explicitly asked when analyzing images
    if (!wantsCanvas) {
      allowedFunctionNames = allowedFunctionNames.filter(n => n !== 'draw_canvas');
    }
  }

  const restrictFunctions = allowedFunctionNames.length !== allFunctionNames.length;
  const forceNoTools = hasImagePayload && !(wantsSlides || wantsQuiz || wantsFlashcards || wantsSpelling || wantsCanvas || wantsPhysics || wantsTTS);

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
  const geminiParams: Record<string, unknown> = {
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
          function_calling_config: forceNoTools
            ? { mode: "NONE" }
            : (restrictFunctions
                ? { mode: "ANY", allowed_function_names: allowedFunctionNames }
                : { mode: "AUTO" })
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error: ${response.status} - ${errorText}`);
      throw new Error(`Gemini API error: ${response.status}`);
    }

  const data: GeminiAPIResponse = await response.json();
    console.log('Gemini Response:', JSON.stringify(data, null, 2));
    
  const candidate = data.candidates?.[0];
  const content = candidate?.content;
    
    // Check if it's a function call
    // Search for the first function call across all parts
    const functionCallPart = content?.parts?.find((p) => p.functionCall);
    if (functionCallPart?.functionCall) {
      const functionCall = functionCallPart.functionCall;
      const functionName = functionCall.name;
      let functionArgs = functionCall.args as Record<string, unknown> | undefined;
      
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

          interface RawSlide { type?: string; content?: Record<string, unknown> }
          interface NormalizedSlide { type: string; content: Record<string, unknown> }
          const norm = (s: RawSlide): NormalizedSlide => {
            let t = s?.type as string | undefined;
            const c = (s?.content ?? {}) as Record<string, unknown>;
            const lower = typeof t === 'string' ? t.toLowerCase() : '';
            if (!t || !allowedTypes.has(t)) {
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
              const bullets = Array.isArray(c.bullets) && c.bullets.length >= 3 ? (c.bullets as string[]).slice(0, 5) : ['Point 1', 'Point 2', 'Point 3'];
              return { type: t, content: { title: (c.title as string) ?? 'Overview', bullets } };
            }
            if (t === 'Definition Slide') {
              return { type: t, content: { term: (c.term as string) ?? 'Term', definition: (c.definition as string) ?? 'Definition goes here.' } };
            }
            if (t === 'Comparison Slide') {
              const items = Array.isArray(c.comparisonItems) && c.comparisonItems.length >= 2 ? (c.comparisonItems as unknown[]).slice(0, 3) : [
                { header: 'A', points: ['Point'] },
                { header: 'B', points: ['Point'] }
              ];
              return { type: t, content: { title: (c.title as string) ?? 'Comparison', comparisonItems: items } };
            }
            // Paragraph default
            return { type: 'Paragraph Slide', content: { paragraph: (c.paragraph as string) ?? 'Summary goes here.' } };
          };

          functionArgs = { ...functionArgs, slides: Array.isArray((functionArgs as Record<string, unknown>)?.slides) ? ((functionArgs as Record<string, unknown>).slides as RawSlide[]).map(norm) : [] };
        }
        return {
          content: JSON.stringify(functionArgs),
          contentType
        };
      }
    }
    // Regular text response
    const textContent = content?.parts?.[0]?.text || '';
    return { content: textContent };
    
  } catch (error) {
    console.error('Error in getGeminiResponse:', error);
    throw error;
  }
}
