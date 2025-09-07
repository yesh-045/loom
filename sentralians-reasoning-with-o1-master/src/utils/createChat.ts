import { ChatMessage } from "@/lib/types";
import submitMessage from "./submitMessage";

export default async function createChat(userId: string, input: string, newUserMessage: ChatMessage): Promise<string> {
  try {
    const response = await fetch(`/api/chat/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: input,
      }),
    });

    const data = await response.json();
    const chatSessionId = data.chatSessionId;

    await submitMessage(userId, chatSessionId, newUserMessage)

    return chatSessionId;
  } catch (error) {
    console.error(error);
    throw error;
  }
}