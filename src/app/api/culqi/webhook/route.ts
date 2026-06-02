// app/api/culqi/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/shared/infrastructure/libs/prisma";

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

    await prisma.culqiWebhookEvent.upsert({
      where: { eventId: event.id },
      update: {},
      create: {
        eventId: event.id,
        eventType: event.type,
        payload: event,
      },
    });

    return NextResponse.json({ success: true, message: "Webhook recibido." });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Error procesando webhook." },
      { status: 500 },
    );
  }
}
