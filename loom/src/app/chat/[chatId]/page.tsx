import ChatLayout from "@/components/chat/ChatLayout";
import prisma from "@/lib/db"
import { redirect } from "next/navigation";

// Force dynamic rendering to avoid database issues during build
export const dynamic = 'force-dynamic'

export default async function ChatPage({ params }: { params: { chatId: string } }) {
  // Stub user for simplified authentication
  const stubUser = {
    id: "demo-user-id",
    name: "Demo User",
    email: "demo@example.com"
  }

  const chatOwner = await prisma.chat.findUnique({
    where: {
      chatSessionId: params.chatId
    },
    select: {
      userId: true
    }
  })

  if (!chatOwner || chatOwner.userId !== stubUser.id) {
    return redirect("/");
  }

  const chatsHistory = await prisma.chat.findMany({
    where: {
      userId: stubUser.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const chats = await prisma.chat.findUnique({
    where: {
      chatSessionId: params.chatId
    },
    select: {
      messages: {
        select: {
          role: true,
          content: true,
          messageType: true
        }
      }
    }
  })

  const filteredMessages = chats?.messages.map((message) => {
    const { messageType, ...rest } = message;
    if (messageType === null) {
      return rest;
    }
    return message;
  }) || [];

  return (
    <div className="flex flex-col h-screen bg-grid-black/[0.1]">
      <ChatLayout chatHistory={chatsHistory} userId={stubUser.id} messages={filteredMessages} chatId={params.chatId} />
    </div>
  )
}