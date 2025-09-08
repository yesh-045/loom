import ChatLayout from "@/components/chat/ChatLayout";
import prisma from "@/lib/db";

// Force dynamic rendering to avoid database issues during build
export const dynamic = 'force-dynamic'

export default async function Home() {
  // Stub user for simplified authentication
  const stubUser = {
    id: "demo-user-id",
    name: "Demo User",
    email: "demo@example.com"
  }

  const chatsHistory = await prisma.chat.findMany({
    where: {
      userId: stubUser.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <ChatLayout chatHistory={chatsHistory} userId={stubUser.id} />
    </div>
  );
}