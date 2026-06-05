/* eslint-disable @typescript-eslint/no-explicit-any */

// app/api/culqi/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/shared/infrastructure/libs/prisma";
import { DataSuscriptionCancel } from "@/shared/infrastructure/types/culqi.suscription.cancel";

interface SuscriptionCharge {
  object: string;
  id: string;
  type: string;
  creation_date: number;
  data: string;
}

export interface DataSuscriptionFailed {
  planId: string;
  subsId: string;
  merchantId: string;
  chargeDate: string;
  cardNumber: string;
  cardBrand: string;
}

// sxn_live_02KOnl2nrMHN2NxJ

export async function POST(request: NextRequest) {
  const event = (await request.json()) as SuscriptionCharge;

  console.log("Evento recibido:", event);

  // if (event.type === "charge.creation.succeeded") {
  //   const data = JSON.parse(event.data) as DataSuscriptionSucceeded;

  //   const planFound = await prisma.culqiPlanes.findUnique({
  //     where: { planId: data. },
  //   });

  //   if (!planFound) {
  //     return NextResponse.json({
  //       success: false,
  //       message: `Plan con ID ${data.planId} no encontrado.`,
  //     });
  //   }

  //   const numberDays =
  //     planFound.interval === "MONTHLY"
  //       ? 30
  //       : planFound.interval === "ANNUAL"
  //         ? 365
  //         : planFound.interval === "QUARTERLY"
  //           ? 90
  //           : planFound.interval === "SEMIANNUAL"
  //             ? 180
  //             : 0;

  //   await prisma.userSubscription.update({
  //     where: { culqiSubscriptionId: data.subsId },
  //     data: {
  //       status: "ACTIVE",
  //       currentPeriodStart: new Date(data.chargeDate),
  //       currentPeriodEnd: new Date(
  //         new Date(data.chargeDate).getTime() +
  //           numberDays * 24 * 60 * 60 * 1000,
  //       ),
  //     },
  //   });

  //   return NextResponse.json({
  //     success: true,
  //     message: `Suscripción ${data.subsId} activada por ${numberDays} días.`,
  //   });
  // }

  // if (event.type === "charge.creation.failed") {
  //   const data = JSON.parse(event.data) as DataSuscriptionFailed;

  //   await prisma.userSubscription.update({
  //     where: { culqiSubscriptionId: data.subsId },
  //     data: {
  //       status: "INACTIVE",
  //     },
  //   });

  //   return NextResponse.json({
  //     success: true,
  //     message: `Suscripción ${data.subsId} desactivada.`,
  //   });
  // }

  if (event.type === "subscription.cancel.succeeded") {
    console.log("Suscripción cancelada:", event);
    const data = JSON.parse(event.data) as DataSuscriptionCancel;

    await prisma.userSubscription.update({
      where: { culqiSubscriptionId: data.message.object.subsId },
      data: {
        status: "CANCELED",
        canceledAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Suscripción ${data.message.object.subsId} cancelada.`,
    });
  }

  return NextResponse.json({
    success: true,
    message: "Webhook procesado, pero no se ha detectado ningún evento.",
  });
}
