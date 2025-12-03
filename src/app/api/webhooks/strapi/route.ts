import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Webhook secret for verification (should match Strapi webhook config)
const WEBHOOK_SECRET = process.env.STRAPI_WEBHOOK_SECRET || "cms-ai-webhook-secret";

interface StrapiWebhookPayload {
  event: string;
  model: string;
  entry?: {
    id: number;
    documentId?: string;
    [key: string]: unknown;
  };
  createdAt?: string;
  updatedAt?: string;
}

export async function POST(req: Request) {
  try {
    // Verify webhook secret from headers
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      console.warn("Webhook: Invalid authorization");
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const payload: StrapiWebhookPayload = await req.json();

    // Log the webhook event
    console.log("Strapi webhook received:", {
      event: payload.event,
      model: payload.model,
      entryId: payload.entry?.id,
    });

    // Store webhook event in database
    await prisma.webhookEvent.create({
      data: {
        event: payload.event,
        model: payload.model,
        entryId: payload.entry?.documentId || payload.entry?.id?.toString(),
        payload: JSON.parse(JSON.stringify(payload)),
        processed: false,
      },
    });

    // Process event based on type
    switch (payload.event) {
      case "entry.create":
        await handleEntryCreate(payload);
        break;
      case "entry.update":
        await handleEntryUpdate(payload);
        break;
      case "entry.delete":
        await handleEntryDelete(payload);
        break;
      case "entry.publish":
        await handleEntryPublish(payload);
        break;
      case "entry.unpublish":
        await handleEntryUnpublish(payload);
        break;
      default:
        console.log("Unhandled webhook event:", payload.event);
    }

    // Mark as processed
    await prisma.webhookEvent.updateMany({
      where: {
        event: payload.event,
        model: payload.model,
        entryId: payload.entry?.documentId || payload.entry?.id?.toString(),
        processed: false,
      },
      data: {
        processed: true,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 }
    );
  }
}

async function handleEntryCreate(payload: StrapiWebhookPayload) {
  // Could be used to notify connected clients via WebSocket
  // Or update any cached data
  console.log(`New ${payload.model} created:`, payload.entry?.id);
}

async function handleEntryUpdate(payload: StrapiWebhookPayload) {
  console.log(`${payload.model} updated:`, payload.entry?.id);
}

async function handleEntryDelete(payload: StrapiWebhookPayload) {
  console.log(`${payload.model} deleted:`, payload.entry?.id);
}

async function handleEntryPublish(payload: StrapiWebhookPayload) {
  console.log(`${payload.model} published:`, payload.entry?.id);
}

async function handleEntryUnpublish(payload: StrapiWebhookPayload) {
  console.log(`${payload.model} unpublished:`, payload.entry?.id);
}

// GET endpoint to check webhook status
export async function GET() {
  return NextResponse.json({
    status: "active",
    message: "Strapi webhook endpoint ready",
  });
}
