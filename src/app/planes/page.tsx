// app/planes/page.tsx

import CulqiSubscribeButton from "@/components/CulqiSubscribeButton";

export const dynamic = "force-dynamic";

export default function PlanesPage() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Planes de suscripción</h1>

      <section className="rounded-xl border p-6">
        <div className="mt-6">
          Pago de 299
          <CulqiSubscribeButton
            planId={process.env.CULQI_PLAN_ANUAL || ""}
            amountInCents={29900} // S/ 299.00 → 29900 centavos
            planName="Plan Anual"
            firstName={"Angelo Patrick"}
            lastName={"Rios Nolasco"}
            email={"angelopatrickriosnolasco@gmail.com"}
            phone={"967107573"}
            documentNumber={"75942730"}
          />
        </div>
        <div className="mt-6">
          Pago de 29.90
          <CulqiSubscribeButton
            planId={process.env.CULQI_PLAN_MENSUAL || ""}
            amountInCents={2990} // S/ 29.90 → 2990 centavos
            planName="Plan Mensual"
            firstName={"Angelo Patrick"}
            lastName={"Rios Nolasco"}
            email={"angelopatrickriosnolasco@gmail.com"}
            phone={"967107573"}
            documentNumber={"75942730"}
          />
        </div>
      </section>
    </main>
  );
}