// app/api/culqi/subscribe/route.ts

import {
  createCulqiCard,
  createCulqiCustomer,
  createCulqiSubscription,
  getCulqiCustomerByEmail,
} from "@/lib/culqi";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/shared/infrastructure/libs/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      tokenId,
      planId,
      firstName,
      lastName,
      email,
      phone,
      documentNumber,
    } = body;

    if (!tokenId || !planId || !firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Faltan datos obligatorios para crear la suscripción.",
        },
        { status: 400 },
      );
    }

    const selectedPlan = await prisma.culqiPlanes.findFirst({
      where: {
        planId,
        active: true,
      },
      select: {
        id: true,
        planId: true,
        name: true,
        active: true,
      },
    });

    if (!selectedPlan) {
      return NextResponse.json(
        {
          success: false,
          message: "El plan seleccionado no es válido.",
        },
        { status: 400 },
      );
    }

    const existingCustomerResponse = await getCulqiCustomerByEmail(email);
    const customer =
      existingCustomerResponse.data.find((item) => item.email === email) ??
      (await createCulqiCustomer({
        first_name: firstName,
        last_name: lastName,
        email,
        address: "Huánuco",
        address_city: "Huánuco",
        country_code: "PE",
        phone_number: phone,
        metadata: {
          document_number: documentNumber || "",
        },
      }));

    const card = await createCulqiCard({
      customer_id: customer.id,
      token_id: tokenId,
      metadata: {
        email,
        document_number: documentNumber || "",
      },
    });

    const subscription = await createCulqiSubscription({
      card_id: card.id,
      plan_id: selectedPlan.planId,
      tyc: true,
      metadata: {
        email,
        document_number: documentNumber || "",
      },
    });

    const user = await prisma.user.findMany();

    await prisma.userSubscription.create({
      data: {
        userId: user[0].id,
        planId: selectedPlan.id,
        culqiSubscriptionId: subscription.id,
        culqiCustomerId: customer.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Suscripción creada correctamente.",
      data: {
        culqi_customer_id: customer.id,
        culqi_card_id: card.id,
        culqi_subscription_id: subscription.id,
        status: subscription.status,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error interno al crear la suscripción.",
      },
      { status: 500 },
    );
  }
}
