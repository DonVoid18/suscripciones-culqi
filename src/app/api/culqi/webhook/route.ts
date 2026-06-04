// app/api/culqi/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/shared/infrastructure/libs/prisma";

// Verifica que el webhook realmente viene de Culqi
function verifyWebhookAuth(request: NextRequest): boolean {
  const culqiToken = request.headers.get("authorization");
  const expectedToken = process.env.CULQI_WEBHOOK_TOKEN;

  if (!expectedToken) return true; // si no configuraste auth, omitir validación
  return culqiToken === `Bearer ${expectedToken}`;
}

export async function POST(request: NextRequest) {
  // 1. Verificar autenticación
  if (!verifyWebhookAuth(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let event: any;

  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  // 2. Idempotencia: ignorar si ya fue procesado
  const existing = await prisma.culqiWebhookEvent.findUnique({
    where: { eventId: event.id },
  });

  if (existing?.processed) {
    return NextResponse.json({ success: true, message: "Ya procesado." });
  }

  // 3. Guardar evento antes de procesarlo
  await prisma.culqiWebhookEvent.upsert({
    where: { eventId: event.id },
    update: {},
    create: {
      eventId: event.id,
      eventType: event.type,
      payload: event,
      processed: false,
    },
  });

  // 4. Procesar según tipo de evento
  try {
    await handleEvent(event);

    // Marcar como procesado SOLO si todo salió bien
    await prisma.culqiWebhookEvent.update({
      where: { eventId: event.id },
      data: { processed: true },
    });
  } catch (error) {
    console.error("Error procesando evento:", event.type, error);
    // No marcamos processed: true → Culqi reintentará
    return NextResponse.json(
      { success: false, message: "Error procesando evento." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, message: "Webhook procesado." });
}

async function handleEvent(event: any) {
  const data = event.data?.object ?? event.data;

  switch (event.type) {
    case "charge.creation": {
      // Cobro exitoso → activar suscripción
      const subscriptionId = data.subscription_id;
      if (!subscriptionId) break;

      await prisma.userSubscription.updateMany({
        where: { culqiSubscriptionId: subscriptionId },
        data: {
          status: "ACTIVE",
          currentPeriodStart: new Date(data.creation_date),
          // Culqi no manda currentPeriodEnd directamente en el charge,
          // lo calculas según el intervalo del plan (ver nota abajo)
        },
      });
      break;
    }

    case "subscription.update": {
      const subscriptionId = data.id;
      if (!subscriptionId) break;

      if (data.status === "canceled") {
        await prisma.userSubscription.updateMany({
          where: { culqiSubscriptionId: subscriptionId },
          data: {
            status: "CANCELED",
            canceledAt: new Date(),
          },
        });
      }
      break;
    }

    default:
      console.log("Evento no manejado:", event.type);
  }
}
