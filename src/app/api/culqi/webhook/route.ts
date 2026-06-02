// app/api/culqi/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

    console.log("Webhook Culqi recibido:", event);

    /*
      Aquí debes validar y actualizar tu base de datos.

      Ejemplos:
      - Si el cargo de la suscripción fue exitoso:
        marcar suscripción como activa o pagada.

      - Si el cargo falló:
        marcar pago como fallido y notificar al cliente.

      - Si la suscripción fue cancelada:
        actualizar estado a cancelada.
    */

    return NextResponse.json({
      success: true,
      message: "Webhook recibido.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Error procesando webhook.",
      },
      { status: 500 },
    );
  }
}
