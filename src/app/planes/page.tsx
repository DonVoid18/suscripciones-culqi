// app/planes/page.tsx

import CulqiSubscribeButton from "@/components/CulqiSubscribeButton";
import { prisma } from "@/shared/infrastructure/libs/prisma";

export const dynamic = "force-dynamic";

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

export default async function PlanesPage() {
  const planes = await prisma.culqiPlanes.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Planes de suscripción</h1>

      <section className="grid gap-6 md:grid-cols-2">
        {planes.length === 0 ? (
          <div className="rounded-xl border p-6 text-sm text-muted-foreground md:col-span-2">
            No hay planes activos registrados en la tabla culqi_planes.
          </div>
        ) : (
          planes.map((plan) => (
            <article key={plan.id} className="rounded-xl border p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{plan.name}</h2>
                  {plan.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {plan.currency}
                </span>
              </div>

              <div className="mt-6 space-y-1">
                <p className="text-3xl font-bold">
                  {currencyFormatter.format(plan.price / 100)}
                </p>
                <p className="text-sm text-muted-foreground">
                  ID Culqi: {plan.planId}
                </p>
              </div>

              <div className="mt-6">
                <CulqiSubscribeButton
                  planId={plan.planId}
                  amountInCents={plan.price}
                  planName={plan.name}
                  firstName={"Angelo Patrick"}
                  lastName={"Rios Nolasco"}
                  email={"angelopatrickriosnolasco@gmail.com"}
                  phone={"967107573"}
                  documentNumber={"75942730"}
                />
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}