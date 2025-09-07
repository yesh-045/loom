export interface GeminiMessageParam {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: 'text' | 'image_url', text?: string, image_url?: { url: string } }>;
}

export interface GeminiTool {
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, {
        type: string;
        description?: string;
      }>;
      required?: string[];
    };
  };
}
