"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { Message } from "@/lib/store";
import { Loader2 } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading = false }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="text-center max-w-md">
          <h2 className="text-xl md:text-2xl font-semibold mb-2">
            ¡Bienvenido al CMS AI Agent!
          </h2>
          <p className="text-muted-foreground mb-4 text-sm md:text-base">
            Soy tu asistente para gestionar el contenido de tu tienda. Puedo ayudarte a:
          </p>
          <ul className="text-xs md:text-sm text-muted-foreground text-left space-y-2">
            <li>📦 Crear y editar productos</li>
            <li>📂 Organizar categorías</li>
            <li>📝 Escribir artículos para el blog</li>
            <li>📊 Consultar órdenes y estadísticas</li>
            <li>🖼️ Analizar imágenes para crear contenido</li>
          </ul>
          <p className="text-xs md:text-sm text-muted-foreground mt-4">
            Escribe tu primera pregunta o sube una imagen para comenzar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 min-h-0 p-2 md:p-4">
      <div className="space-y-4 max-w-4xl mx-auto">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Pensando...</span>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
