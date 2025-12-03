import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createCMSAgent, ChatMessage } from "@/lib/langchain/agent";

export const maxDuration = 60; // Allow up to 60 seconds for AI responses

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Ensure user exists in our database (sync from session)
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {
        name: session.user.name,
        strapiUserId: session.user.strapiUserId,
        updatedAt: new Date(),
      },
      create: {
        email: session.user.email,
        name: session.user.name,
        strapiUserId: session.user.strapiUserId,
      },
    });

    // Parse request body
    const body = await req.json();
    const { messages, sessionId } = body as {
      messages: ChatMessage[];
      sessionId?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Mensajes inválidos" },
        { status: 400 }
      );
    }

    // Create or get chat session
    let chatSession;
    if (sessionId) {
      chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId, userId: user.id },
      });
    }

    if (!chatSession) {
      // Create new session with title from first message
      const firstMessage = messages[0].content.slice(0, 100);
      chatSession = await prisma.chatSession.create({
        data: {
          userId: user.id,
          title: firstMessage,
        },
      });
    }

    // Save user message to database
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.role === "user") {
      await prisma.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          role: "user",
          content: lastUserMessage.content,
          imageUrl: lastUserMessage.imageUrl,
        },
      });
    }

    // Create agent and process chat
    const agent = createCMSAgent();
    const response = await agent.chat(messages);

    // Save assistant response to database
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "assistant",
        content: response.content,
        metadata: response.toolCalls ? JSON.parse(JSON.stringify({ toolCalls: response.toolCalls })) : undefined,
      },
    });

    // Log any tool calls that modified data
    if (response.toolCalls) {
      for (const toolCall of response.toolCalls) {
        if (["strapi_create", "strapi_update", "strapi_delete", "strapi_publish", "strapi_batch_create"].includes(toolCall.name)) {
          const result = JSON.parse(toolCall.result);
          await prisma.actionLog.create({
            data: {
              userId: user.id,
              sessionId: chatSession.id,
              actionType: toolCall.name.replace("strapi_", "") as "create" | "update" | "delete" | "publish" | "batch_create",
              contentType: (toolCall.args.contentType as string) || "unknown",
              payload: JSON.parse(JSON.stringify(toolCall.args)),
              response: result,
              success: result.success,
              errorMessage: result.error,
            },
          });
        }
      }
    }

    return NextResponse.json({
      content: response.content,
      sessionId: chatSession.id,
      toolCalls: response.toolCalls,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
