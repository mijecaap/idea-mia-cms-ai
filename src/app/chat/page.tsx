import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ChatContainer } from "@/components/chat";

async function ChatPageContent() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <ChatContainer />;
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
