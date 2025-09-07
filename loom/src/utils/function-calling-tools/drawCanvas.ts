interface OpenAIFunctionTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

const drawCanvas: OpenAIFunctionTool = {
  type: "function",
  function: {
    name: "draw_canvas",
    description: "Use this function if the user wants to draw on a canvas to explain something",
    parameters: {
      type: "object",
      properties: {
      },
      required: [],
      additionalProperties: false,
    },
  },
};

export default drawCanvas;