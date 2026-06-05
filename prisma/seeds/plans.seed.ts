// prisma/seed-planes-culqi.ts

import { prisma } from "@/shared/infrastructure/libs/prisma";
import { PlanInterval } from "@prisma/client";

const API_URL = "https://api.culqi.com/v2/recurrent/plans/create";

interface PlanPayload {
  name: string;
  short_name: string;
  description: string;
  amount: number;
  currency: "PEN" | "USD";
  interval_unit_time: number;
  interval_count: number;
  initial_cycles: {
    count: number;
    has_initial_charge: boolean;
    amount: number;
    interval_unit_time: number;
  };
}

interface CulqiPlan {
  id: string;
  name: string;
  amount: number;
  currency: string;
}

function getPlanInterval(intervalCount: number): PlanInterval {
  switch (intervalCount) {
    case 1:
      return PlanInterval.MONTHLY;
    case 3:
      return PlanInterval.QUARTERLY;
    case 6:
      return PlanInterval.SEMIANNUAL;
    case 12:
      return PlanInterval.ANNUAL;
    default:
      throw new Error(`Intervalo no soportado: ${intervalCount}`);
  }
}

const PLANS: Array<PlanPayload> = [
  {
    name: "Plan Mensual",
    short_name: "plan-mensual",
    description: "Suscripción mensual",
    amount: 2990, // S/ 29.90
    currency: "PEN",
    interval_unit_time: 3,
    interval_count: 1,
    initial_cycles: {
      count: 0,
      has_initial_charge: false,
      amount: 0,
      interval_unit_time: 1,
    },
  },
  {
    name: "Plan Trimestral",
    short_name: "plan-trimestral",
    description: "Suscripción trimestral",
    amount: 7990, // S/ 79.90
    currency: "PEN",
    interval_unit_time: 3,
    interval_count: 3,
    initial_cycles: {
      count: 0,
      has_initial_charge: false,
      amount: 0,
      interval_unit_time: 1,
    },
  },
  // {
  //   name: "Plan Semestral",
  //   short_name: "plan-semestral",
  //   description: "Suscripción semestral",
  //   amount: 14990, // S/ 149.90
  //   currency: "PEN",
  //   interval_unit_time: 3,
  //   interval_count: 6,
  //   initial_cycles: {
  //     count: 0,
  //     has_initial_charge: false,
  //     amount: 0,
  //     interval_unit_time: 1,
  //   },
  // },
  {
    name: "Plan Anual",
    short_name: "plan-anual",
    description: "Suscripción anual",
    amount: 29900, // S/ 299.00
    currency: "PEN",
    interval_unit_time: 4,
    interval_count: 1,
    initial_cycles: {
      count: 0,
      has_initial_charge: false,
      amount: 0,
      interval_unit_time: 1,
    },
  },
];

async function createPlan(
  data: PlanPayload,
  secretKey: string,
): Promise<CulqiPlan | null> {
  try {
    console.log("\nCreando plan:", data.name);

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}\n${text || "Sin respuesta"}`);
    }

    return JSON.parse(text) as CulqiPlan;
  } catch (error) {
    console.error(
      "Error creando plan:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export async function seedPlans() {
  const secretKey = process.env.CULQI_SECRET_KEY;

  if (!secretKey) {
    throw new Error("La variable de entorno CULQI_SECRET_KEY no está definida");
  }

  const results: Record<string, string> = {};

  for (const { ...planData } of PLANS) {
    const plan = await createPlan(planData, secretKey);
    if (plan) {
      await prisma.culqiPlanes.create({
        data: {
          planId: plan.id,
          name: planData.name,
          description: planData.description,
          price: planData.amount,
          currency: planData.currency,
          active: true,
          interval: getPlanInterval(planData.interval_count),
          intervalCount: planData.interval_count,
        },
      });

      console.log(`✅ ${planData.name} — ID: ${plan.id}`);
    }
  }
}
