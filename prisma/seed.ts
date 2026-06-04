// prisma/seed-planes-culqi.ts

import { prisma } from "@/shared/infrastructure/libs/prisma";

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

const PLANS: Array<PlanPayload & { envKey: string }> = [
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
    envKey: "CULQI_PLAN_MONTHLY",
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
    envKey: "CULQI_PLAN_QUARTERLY",
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
  //   envKey: "CULQI_PLAN_SEMIANNUAL",
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
    envKey: "CULQI_PLAN_ANNUAL",
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

async function main() {
  const secretKey = process.env.CULQI_SECRET_KEY;

  if (!secretKey) {
    throw new Error("La variable de entorno CULQI_SECRET_KEY no está definida");
  }

  const results: Record<string, string> = {};

  for (const { envKey, ...planData } of PLANS) {
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
        },
      });

      results[envKey] = plan.id;
      console.log(`✅ ${planData.name} — ID: ${plan.id}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
