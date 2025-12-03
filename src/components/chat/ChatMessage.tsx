"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Bot, User, Wrench } from "lucide-react";
import ReactMarkdown, { Components } from "react-markdown";
import { Message } from "@/lib/store";

interface ChatMessageProps {
  message: Message;
}

// Custom components for ReactMarkdown
const markdownComponents: Components = {
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-background/50 px-1 py-0.5 rounded text-xs" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  a: ({ children, ...props }) => (
    <a className="text-primary underline" {...props}>
      {children}
    </a>
  ),
  pre: ({ children }) => (
    <pre className="bg-background/50 p-2 rounded-md overflow-x-auto text-xs">
      {children}
    </pre>
  ),
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={`flex gap-3 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={isUser ? "bg-primary text-primary-foreground" : "bg-muted"}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div
        className={`flex max-w-[80%] flex-col gap-2 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Image if present */}
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Uploaded"
            className="max-h-64 rounded-lg border object-cover"
          />
        )}

        {/* Text content */}
        <Card
          className={`px-4 py-2 ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          {isAssistant ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown components={markdownComponents}>
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </Card>

        {/* Tool calls if present */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {message.toolCalls.map((tool, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs gap-1"
              >
                <Wrench className="h-3 w-3" />
                {tool.name.replace("strapi_", "")}
              </Badge>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
