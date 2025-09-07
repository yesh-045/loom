interface OpenAIFunctionTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

const createTextToSpeech: OpenAIFunctionTool = {
  type: "function",
  function: {
    name: "generate_text_to_speech",
    description: "Generate speech from text using ElevenLabs TTS. Use this for narration, explanations, or any spoken content.",
    parameters: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The text to convert to speech."
        },
        voice: {
          type: "string",
          description: "The ID of the voice to use.",
          enum: ["pNInz6obpgDQGcFmaJgB"], // Adam voice
        },
        purpose: {
          type: "string",
          description: "The purpose of this speech generation (e.g., 'slide narration', 'explanation', 'practice')",
          enum: ["slide narration", "explanation", "practice"],
        }
      },
      required: ["text", "purpose"]
    }
  }
};

export default createTextToSpeech;
