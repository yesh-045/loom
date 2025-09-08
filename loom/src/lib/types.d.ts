type Choice = {
  text: string;
  isCorrect: boolean;
};

export type Question = {
  questionText: string;
  choices: Choice[];
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: "text" | "image_url", text?: string, image_url?: { url: string } }>;
  componentMessageType?: "quiz" | "ppt" | "flashcards" | "physics" | "spelling" | "canvas" | "image" | "speech" | "speech-training";
};

export type AIResponse = {
  content: string;
  contentType?: "text" | "quiz" | "ppt" | "flashcards" | "spelling" | "canvas" | "image" | "physics" | "speech" | "speech-training"; 
};