interface OpenAIFunctionTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

const imageUpload: OpenAIFunctionTool = {
  type: "function",
  function: {
    name: "image_upload",
    description: "Use this function if the user wants to upload an image",
    parameters: {
      type: "object",
      properties: {
      },
      required: [],
      additionalProperties: false,
    },
  },
};

export default imageUpload;