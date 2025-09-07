import { GeminiTool } from "@/lib/geminiTypes";

const imageUpload: GeminiTool = {
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