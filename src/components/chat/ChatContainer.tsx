"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { SessionSidebar } from "./SessionSidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore, Message } from "@/lib/store";
import { LogOut, Settings, User } from "lucide-react";

export function ChatContainer() {
  const { data: session } = useSession();
  const skipFetchRef = useRef(false); // Flag to skip fetching messages after creating new session
  const {
    currentSessionId,
    messages,
    isLoading,
    sessions,
    sessionsLoading,
    setCurrentSession,
    setCurrentSessionKeepMessages,
    addMessage,
    setMessages,
    clearMessages,
    setLoading,
    setError,
    setSessions,
    setSessionsLoading,
    addSession,
    removeSession,
  } = useChatStore();

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch session messages when session changes (only if not skipped)
  useEffect(() => {
    if (currentSessionId && !skipFetchRef.current) {
      fetchSessionMessages(currentSessionId);
    }
    // Reset the skip flag after processing
    skipFetchRef.current = false;
  }, [currentSessionId]);

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await fetch("/api/chat/history");
      if (response.ok) {
        const data = await response.json();
        setSessions(
          data.sessions.map((s: { id: string; title: string; createdAt: string; updatedAt: string; _count: { messages: number } }) => ({
            id: s.id,
            title: s.title,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
            messageCount: s._count.messages,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchSessionMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(
          data.messages.map((m: { id: string; role: string; content: string; imageUrl?: string; createdAt: string; metadata?: { toolCalls?: Message["toolCalls"] } }) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            imageUrl: m.imageUrl,
            timestamp: new Date(m.createdAt),
            toolCalls: m.metadata?.toolCalls,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = useCallback(
    async (content: string, imageUrl?: string) => {
      // Add user message to UI immediately
      const userMessage = {
        role: "user" as const,
        content,
        imageUrl,
      };
      addMessage(userMessage);

      setLoading(true);
      setError(null);

      try {
        // Prepare messages for API (include the new message)
        const apiMessages = [
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
            imageUrl: m.imageUrl,
          })),
          userMessage,
        ];

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            sessionId: currentSessionId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al enviar mensaje");
        }

        const data = await response.json();

        // Add assistant response to UI
        addMessage({
          role: "assistant",
          content: data.content,
          toolCalls: data.toolCalls,
        });

        // Update session ID if new (skip fetching messages since we already have them)
        if (data.sessionId && data.sessionId !== currentSessionId) {
          skipFetchRef.current = true; // Don't fetch messages, we already have them in state
          setCurrentSessionKeepMessages(data.sessionId);
          
          // Add new session to the list
          addSession({
            id: data.sessionId,
            title: content.slice(0, 50),
            createdAt: new Date(),
            updatedAt: new Date(),
            messageCount: 2,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error desconocido";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [messages, currentSessionId, addMessage, setLoading, setError, setCurrentSessionKeepMessages, addSession]
  );

  const handleNewSession = () => {
    clearMessages();
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSession(sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/history?sessionId=${sessionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        removeSession(sessionId);
        toast.success("Conversación eliminada");
      } else {
        toast.error("Error al eliminar conversación");
      }
    } catch (error) {
      toast.error("Error al eliminar conversación");
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <SessionSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        isLoading={sessionsLoading}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-semibold">CMS AI Agent</h1>
            <p className="text-xs text-muted-foreground">
              Gestiona tu contenido con inteligencia artificial
            </p>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {session?.user?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">
                  {session?.user?.name || session?.user?.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <User className="h-4 w-4 mr-2" />
                {session?.user?.email}
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Messages */}
        <MessageList messages={messages} isLoading={isLoading} />

        {/* Input */}
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
