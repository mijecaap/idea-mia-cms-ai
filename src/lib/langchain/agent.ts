import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage, ToolMessage } from "@langchain/core/messages";
import { createStrapiTools } from "./tools";
import { CMS_AGENT_SYSTEM_PROMPT } from "./prompts";
import { StrapiClient } from "@/lib/strapi/client";

export interface AgentConfig {
  strapiClient: StrapiClient;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  imageUrl?: string;
}

export interface AgentResponse {
  content: string;
  toolCalls?: {
    name: string;
    args: Record<string, unknown>;
    result: string;
  }[];
  requiresConfirmation?: boolean;
  pendingAction?: {
    tool: string;
    args: Record<string, unknown>;
    description: string;
  };
}

export class CMSAgent {
  private model: ChatGoogleGenerativeAI;
  private tools: ReturnType<typeof createStrapiTools>;
  private modelWithTools: ReturnType<ChatGoogleGenerativeAI["bindTools"]>;

  constructor(config: AgentConfig) {
    // Initialize Gemini 2.5 Flash model
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: config.temperature ?? 0.7,
      maxOutputTokens: config.maxTokens ?? 4096,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // Create Strapi tools
    this.tools = createStrapiTools(config.strapiClient);

    // Bind tools to model
    this.modelWithTools = this.model.bindTools(this.tools);
  }

  private convertToLangChainMessages(messages: ChatMessage[]): BaseMessage[] {
    const langChainMessages: BaseMessage[] = [
      new SystemMessage(CMS_AGENT_SYSTEM_PROMPT),
    ];

    for (const msg of messages) {
      if (msg.role === "user") {
        if (msg.imageUrl) {
          // Multimodal message with image
          langChainMessages.push(
            new HumanMessage({
              content: [
                { type: "text", text: msg.content },
                { type: "image_url", image_url: { url: msg.imageUrl } },
              ],
            })
          );
        } else {
          langChainMessages.push(new HumanMessage(msg.content));
        }
      } else if (msg.role === "assistant") {
        langChainMessages.push(new AIMessage(msg.content));
      } else if (msg.role === "system") {
        langChainMessages.push(new SystemMessage(msg.content));
      }
    }

    return langChainMessages;
  }

  /**
   * Extracts text content from a response that might be a string or multimodal array
   */
  private extractTextContent(content: unknown): string {
    // If it's already a string, return it
    if (typeof content === "string") {
      return content;
    }

    // If it's an array (multimodal response), extract text parts
    if (Array.isArray(content)) {
      const textParts: string[] = [];
      for (const part of content) {
        if (typeof part === "string") {
          textParts.push(part);
        } else if (part && typeof part === "object") {
          // Handle {type: "text", text: "..."} format from Gemini
          if ("text" in part && typeof part.text === "string") {
            textParts.push(part.text);
          }
          // Handle {type: "text", content: "..."} alternative format
          else if ("content" in part && typeof part.content === "string") {
            textParts.push(part.content);
          }
        }
      }
      return textParts.join("\n\n");
    }

    // Fallback: try to stringify (shouldn't happen normally)
    return String(content);
  }

  async chat(messages: ChatMessage[]): Promise<AgentResponse> {
    const langChainMessages = this.convertToLangChainMessages(messages);
    const toolCalls: AgentResponse["toolCalls"] = [];

    // Initial response from model
    let response = await this.modelWithTools.invoke(langChainMessages);

    // Process tool calls if any
    while (response.tool_calls && response.tool_calls.length > 0) {
      // Add the AI response with tool calls to the conversation
      langChainMessages.push(response);

      for (const toolCall of response.tool_calls) {
        // Find and execute the tool
        const tool = this.tools.find((t) => t.name === toolCall.name);
        
        if (tool) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (tool as any).invoke(toolCall.args);
            const resultString = typeof result === "string" ? result : JSON.stringify(result);
            
            toolCalls.push({
              name: toolCall.name,
              args: toolCall.args as Record<string, unknown>,
              result: resultString,
            });

            // Add tool result as ToolMessage (proper way to handle tool responses)
            langChainMessages.push(
              new ToolMessage({
                content: resultString,
                tool_call_id: toolCall.id || `call_${Date.now()}`,
              })
            );
          } catch (error) {
            // Handle tool execution errors
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            langChainMessages.push(
              new ToolMessage({
                content: JSON.stringify({ success: false, error: errorMessage }),
                tool_call_id: toolCall.id || `call_${Date.now()}`,
              })
            );
          }
        }
      }

      // Get next response after tool execution
      response = await this.modelWithTools.invoke(langChainMessages);
    }

    return {
      content: this.extractTextContent(response.content),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }

  async *streamChat(messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
    const langChainMessages = this.convertToLangChainMessages(messages);

    const stream = await this.modelWithTools.stream(langChainMessages);

    for await (const chunk of stream) {
      if (typeof chunk.content === "string" && chunk.content) {
        yield chunk.content;
      }
    }
  }
}

// Factory function to create agent with Strapi API Token
export function createCMSAgent(userStrapiToken?: string): CMSAgent {
  // Use the global API token for Strapi operations (not the user's JWT)
  const strapiToken = process.env.STRAPI_API_TOKEN;
  
  if (!strapiToken) {
    throw new Error("STRAPI_API_TOKEN is not configured");
  }

  const strapiClient = new StrapiClient({
    baseUrl: process.env.STRAPI_URL || "http://localhost:1337",
    token: strapiToken,
  });

  return new CMSAgent({ strapiClient });
}
