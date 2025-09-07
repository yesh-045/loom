import { GeminiTool } from "@/lib/geminiTypes";

interface FunctionCallResponse {
  name: string;
  args: Record<string, unknown>;
}

// Parse function calls from Gemini's response
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extractFunctionCall(text: string): FunctionCallResponse | null {
  // Look for patterns like "create_ppt_slides({...})" or "generate_text_to_speech({...})"
  const functionMatch = text.match(/(\w+)\s*\(([\s\S]*)\)/);
  if (!functionMatch) return null;

  const functionName = functionMatch[1];
  const argsString = functionMatch[2];

  try {
    // Parse the arguments string into an object
    let args = argsString;
    if (argsString.startsWith('{') && argsString.endsWith('}')) {
      args = argsString;
    } else {
      args = `{${argsString}}`;
    }
    return {
      name: functionName,
      args: JSON.parse(args)
    };
  } catch (error) {
    console.error('Error parsing function arguments:', error);
    return null;
  }
}

// Format tools for Gemini's context
export function formatToolsForGemini(tools: GeminiTool[]): string {
  return `You have access to these functions. When using them, respond ONLY with the function call in this exact format:
  functionName({
    "param1": "value1",
    "param2": "value2"
  })

  Available functions:
  ${tools.map(tool => `
  ${tool.function.name}: ${tool.function.description}
  Parameters: ${JSON.stringify(tool.function.parameters.properties, null, 2)}
  `).join('\n')}`;
}

// Process function calls from Gemini's response
export async function processFunctionCall(response: string): Promise<{
  function_call?: {
    name: string;
    arguments: string;
  };
  content?: string;
}> {
  try {
    // Match function calls like "functionName({ ... })"
    const match = response.match(/(\w+)\s*\(\s*({[\s\S]*})\s*\)/);
    if (!match) {
      return { content: response };
    }

    const [, name, args] = match;
    return {
      function_call: {
        name,
        arguments: args
      }
    };
  } catch (error) {
    console.error('Error processing function call:', error);
    return { content: response };
  }
}
