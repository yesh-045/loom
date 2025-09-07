// Gemini message types to replace OpenAI types
export interface GeminiMessageParam {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: 'text' | 'image' | 'image_url'; text?: string; image_url?: { url: string } }>;
}

export interface GeminiToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface GeminiToolProperty {
  type?: string;
  description?: string;
  enum?: string[];
  items?: GeminiToolProperty;
  properties?: Record<string, GeminiToolProperty>;
  oneOf?: GeminiToolProperty[];
  required?: string[];
  additionalProperties?: boolean;
  minItems?: number;
  maxItems?: number;
  const?: string;
  maxLength?: number;
  minLength?: number;
  minimum?: number;
  maximum?: number;
}

export interface GeminiTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, GeminiToolProperty>;
      required?: string[];
      additionalProperties?: boolean;
    };
  };
}
