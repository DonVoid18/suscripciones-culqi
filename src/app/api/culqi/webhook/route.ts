// app/api/culqi/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/shared/infrastructure/libs/prisma";

type CulqiChargePayload = {
  creationDate?: number;
  email?: string;
  subscription_id?: string;
  outcome?: {
    merchantMessage?: string;
    merchant_message?: string;
    userMessage?: string;
    user_message?: string;
  };
  metadata?: {
    subscription_id?: string;
    subscriptionId?: string;
    email?: string;
  };
  source?: {
    customerId?: string;
    metadata?: {
      email?: string;
      subscription_id?: string;
      subscriptionId?: string;
    };
  };
};

export async function POST(request: NextRequest) {
  let event: any;

  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  // Idempotencia: ignorar si ya fue procesado
  const existing = await prisma.culqiWebhookEvent.findUnique({
    where: { eventId: event.id },
  });

  if (existing?.processed) {
    return NextResponse.json({ success: true, message: "Ya procesado." });
  }

  // Guardar evento antes de procesarlo
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

  // Procesar según tipo de evento
  try {
    await handleEvent(event);

    await prisma.culqiWebhookEvent.update({
      where: { eventId: event.id },
      data: { processed: true },
    });
  } catch (error) {
    console.error("Error procesando evento:", event.type, error);
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
    // ✅ Cobro exitoso → activar/renovar suscripción
    case "charge.creation.succeeded": {
      const charge = data as CulqiChargePayload;
      const subscription = await findSubscriptionForCharge(charge);

      if (!subscription) {
        console.warn("No se encontró la suscripción para el cargo exitoso.", {
          chargeId: event.id,
          email: charge.email ?? charge.source?.metadata?.email,
          customerId: charge.source?.customerId,
        });
        break;
      }

      const periodStart = toDateFromCulqiTimestamp(charge.creationDate);
      if (!periodStart) {
        console.warn("Cargo exitoso sin creationDate válido.", {
          chargeId: event.id,
          subscriptionId: subscription.id,
        });
        break;
      }

      await prisma.userSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          currentPeriodStart: periodStart,
          currentPeriodEnd: calculatePeriodEnd(
            periodStart,
            subscription.plan.interval,
            subscription.plan.intervalCount,
          ),
        },
      });
      break;
    }

    // ❌ Cobro fallido → marcar para reintento o cancelar
    case "charge.creation.failed": {
      const charge = data as CulqiChargePayload;
      const subscription = await findSubscriptionForCharge(charge);

      if (!subscription) break;

      await prisma.userSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "PAST_DUE", // Pago pendiente, no cancelar aún
        },
      });

      // Opcional: registrar el motivo del fallo
      console.warn(
        `Cobro fallido para suscripción ${subscription.id}:`,
        charge.outcome?.merchantMessage ??
          charge.outcome?.merchant_message ??
          data.decline_reason,
      );
      break;
    }

    // Suscripción actualizada/cancelada desde el dashboard de Culqi
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

async function findSubscriptionForCharge(charge: CulqiChargePayload) {
  const subscriptionId =
    charge.metadata?.subscription_id ??
    charge.metadata?.subscriptionId ??
    charge.subscription_id ??
    charge.source?.metadata?.subscription_id ??
    charge.source?.metadata?.subscriptionId;

  if (subscriptionId) {
    return prisma.userSubscription.findUnique({
      where: { culqiSubscriptionId: subscriptionId },
      include: { plan: true },
    });
  }

  const customerId = charge.source?.customerId;
  if (customerId) {
    return prisma.userSubscription.findFirst({
      where: { culqiCustomerId: customerId },
      include: { plan: true },
    });
  }

  const email = charge.email ?? charge.source?.metadata?.email;
  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        subscriptions: {
          include: { plan: true },
          take: 1,
        },
      },
    });

    return user?.subscriptions[0] ?? null;
  }

  return null;
}

function toDateFromCulqiTimestamp(timestamp?: number): Date | null {
  if (typeof timestamp !== "number" || Number.isNaN(timestamp)) {
    return null;
  }

  const milliseconds =
    timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;

  return new Date(milliseconds);
}

// Calcula el fin del período según el intervalo del plan
function calculatePeriodEnd(
  start: Date,
  interval?: string,
  intervalCount = 1,
): Date {
  const end = new Date(start);
  const safeIntervalCount = Math.max(intervalCount, 1);

  switch (interval) {
    case "MONTHLY":
      end.setMonth(end.getMonth() + safeIntervalCount);
      break;
    case "QUARTERLY":
      end.setMonth(end.getMonth() + 3 * safeIntervalCount);
      break;
    case "SEMIANNUAL":
      end.setMonth(end.getMonth() + 6 * safeIntervalCount);
      break;
    case "ANNUAL":
      end.setFullYear(end.getFullYear() + safeIntervalCount);
      break;
    default:
      end.setMonth(end.getMonth() + safeIntervalCount); // fallback mensual
  }

  return end;
}
