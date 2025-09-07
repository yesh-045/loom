/* eslint-disable @typescript-eslint/no-explicit-any */
interface OpenAIFunctionTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

import createQuizTool from "./function-calling-tools/createQuiz";
import createPptTool from "./function-calling-tools/createPptSlides";
import createFlashcardsTool from "./function-calling-tools/createFlashcards";
import createSpellingQuizTool from "./function-calling-tools/createSpellingQuiz";
import drawCanvasTool from "./function-calling-tools/drawCanvas";
import imageUploadTool from "./function-calling-tools/imageUpload";
import createPhysicsSimulatorTool from "./function-calling-tools/createPhysicsSimulator";
import createTextToSpeech from "./function-calling-tools/createTextToSpeech";

const functionCallingTools: OpenAIFunctionTool[] = [
  createQuizTool,
  createPptTool,
  createFlashcardsTool,
  createSpellingQuizTool,
  drawCanvasTool,
  imageUploadTool,
  createPhysicsSimulatorTool,
  createTextToSpeech,
];

export default functionCallingTools;