import { getGeminiResponse } from "./getGeminiResponse";
// removed ChatMessage import to avoid duplicate-type conflicts across modules

export default async function generateChatName(input: string): Promise<string> {
  try {
    const response = await getGeminiResponse([
      {
        role: "system",
        content: "You are a helpful assistant that generates concise, descriptive chat titles. Create a short title (max 6 words) that summarizes the main topic or question from the user's input. Do not include quotes or extra formatting, just return the title."
      },
      {
        role: "user",
        content: `Generate a short chat title for this conversation starter: "${input}"`
      }
    ], 'gemini-1.5-flash');

    // Clean up the response and ensure it's not too long
    const title = String(response).trim().replace(/['"]/g, '');
    return title.length > 50 ? title.substring(0, 47) + '...' : title;
  } catch (error) {
    console.error("Error generating chat name:", error);
    // Fallback to a simple title based on input
    const fallbackTitle = input.length > 30 ? input.substring(0, 27) + '...' : input;
    return fallbackTitle || 'New Chat';
  }
}
