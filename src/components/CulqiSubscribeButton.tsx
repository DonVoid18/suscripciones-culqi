// components/CulqiSubscribeButton.tsx

"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    CulqiCheckout: new (
      publicKey: string,
      config: Record<string, unknown>
    ) => CulqiCheckoutInstance;
  }
}

type CulqiCheckoutInstance = {
  culqi?: () => void | Promise<void>;
  error?: {
    merchant_message?: string;
  };
  token?: {
    id: string;
  };
  close: () => void;
  open: () => void;
};

let culqiScriptPromise: Promise<void> | null = null;

type CulqiSubscribeButtonProps = {
  planId: string;
  amountInCents: number;
  planName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentNumber?: string;
};

function loadCulqiScript(): Promise<void> {
  if (typeof window !== "undefined" && typeof window.CulqiCheckout === "function") {
    return Promise.resolve();
  }

  if (culqiScriptPromise) {
    return culqiScriptPromise;
  }

  culqiScriptPromise = new Promise((resolve, reject) => {
    const scriptUrl = "https://js.culqi.com/checkout-js";
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${scriptUrl}"]`
    );

    const finish = () => {
      if (typeof window.CulqiCheckout === "function") {
        resolve();
        return;
      }

      reject(new Error("Culqi Checkout se cargó, pero no expuso window.CulqiCheckout."));
    };

    const fail = () => reject(new Error("No se pudo cargar Culqi Checkout"));

    if (existingScript) {
      existingScript.addEventListener("load", finish, { once: true });
      existingScript.addEventListener("error", fail, { once: true });

      if (existingScript.dataset.culqiLoaded === "true") {
        finish();
      }

      return;
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => {
      script.dataset.culqiLoaded = "true";
      finish();
    };
    script.onerror = fail;
    document.body.appendChild(script);
  });

  return culqiScriptPromise;
}

export default function CulqiSubscribeButton({
  planId,
  amountInCents,
  planName,
  firstName,
  lastName,
  email,
  phone,
  documentNumber,
}: CulqiSubscribeButtonProps) {
  const checkoutRef = useRef<CulqiCheckoutInstance | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function initCulqi() {
      try {
        await loadCulqiScript();

        const publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY;

        if (!publicKey) {
          setMessage("Falta configurar NEXT_PUBLIC_CULQI_PUBLIC_KEY.");
          return;
        }

        const paymentMethods = {
          tarjeta: true,
          yape: false,
          billetera: false,
          bancaMovil: false,
          agente: false,
          cuotealo: false,
        };

        const settings = {
          title: planName,
          currency: "PEN",
          amount: amountInCents,
        };

        const client = {
          email,
        };

        const options = {
          lang: "es",
          installments: false,
          modal: true,
          paymentMethods,
          paymentMethodsSort: Object.keys(paymentMethods),
        };

        const appearance = {
          theme: "default",
          hiddenCulqiLogo: false,
          menuType: "sidebar",
          buttonCardPayText: "Suscribirme",
          defaultStyle: {
            bannerColor: "#111827",
            buttonBackground: "#111827",
            buttonTextColor: "#ffffff",
            priceColor: "#111827",
          },
        };

        const config = {
          settings,
          client,
          options,
          appearance,
        };

        const CulqiCheckout = window.CulqiCheckout;

        if (typeof CulqiCheckout !== "function") {
          throw new Error(
            "Culqi Checkout no expuso un constructor válido. Revisa que el script se haya cargado por completo."
          );
        }

        const Culqi = new CulqiCheckout(publicKey, config);

        Culqi.culqi = async () => {
          if (Culqi.token) {
            const tokenId = Culqi.token.id;
            Culqi.close();

            try {
              setLoading(true);
              setMessage("Creando suscripción...");

              const response = await fetch("/api/culqi/subscribe", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  tokenId,
                  planId,
                  firstName,
                  lastName,
                  email,
                  phone,
                  documentNumber,
                }),
              });

              const data = await response.json();

              if (!response.ok || !data.success) {
                throw new Error(data.message || "No se pudo crear la suscripción.");
              }

              setMessage("Suscripción creada correctamente.");
            } catch (error) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Error al procesar la suscripción."
              );
            } finally {
              setLoading(false);
            }
          } else if (Culqi.error) {
            setMessage(Culqi.error?.merchant_message || "Error en Culqi Checkout.");
          }
        };

        checkoutRef.current = Culqi;
        setReady(true);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Error al inicializar Culqi Checkout."
        );
      }
    }

    initCulqi();
  }, [
    planId,
    amountInCents,
    planName,
    firstName,
    lastName,
    email,
    phone,
    documentNumber,
  ]);

  const openCheckout = () => {
    if (!checkoutRef.current) {
      setMessage("Culqi todavía no está listo.");
      return;
    }

    checkoutRef.current.open();
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={openCheckout}
        disabled={!ready || loading}
        className="rounded-lg bg-black px-5 py-3 text-white disabled:opacity-50"
      >
        {loading ? "Procesando..." : "Suscribirme"}
      </button>

      {message && <p className="text-sm text-gray-700">{message}</p>}
    </div>
  );
}