import { ChatMessage } from "@/lib/types";

export default function selectAIModel(messageInput: ChatMessage[]): "gemini" {
  if (messageInput.length === 0) {
      throw new Error("Message input array is empty");
  }

  return "gemini";
}