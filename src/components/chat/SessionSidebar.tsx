"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, MoreVertical, Plus, Trash2, X } from "lucide-react";
import { ChatSession } from "@/lib/store";

interface SessionSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export function SessionSidebar({
  sessions,
  currentSessionId,
  isLoading = false,
  isOpen = false,
  onClose,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: SessionSidebarProps) {
  const handleSelectSession = (sessionId: string) => {
    onSelectSession(sessionId);
    // Close sidebar on mobile after selection
    onClose?.();
  };

  const handleNewSession = () => {
    onNewSession();
    // Close sidebar on mobile after creating new session
    onClose?.();
  };
  const formatDate = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffDays = Math.floor(
      (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return messageDate.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 border-r bg-muted/30 flex flex-col
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="p-4 flex items-center gap-2">
          <Button onClick={handleNewSession} className="flex-1 gap-2">
            <Plus className="h-4 w-4" />
            Nueva conversación
          </Button>
          {/* Close button - visible only on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

      <Separator />

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Cargando...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No hay conversaciones
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center gap-2 rounded-lg p-2 cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
                onClick={() => handleSelectSession(session.id)}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate max-w-[140px]">
                    {session.title || "Nueva conversación"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {formatDate(session.updatedAt)}
                    {session.messageCount !== undefined && (
                      <span> · {session.messageCount} msgs</span>
                    )}
                  </p>
                </div>

                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
    </>
  );
}
