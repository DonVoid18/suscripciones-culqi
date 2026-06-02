// lib/culqi.ts

const CULQI_API_URL = "https://api.culqi.com/v2";

type CulqiCustomerPayload = {
  first_name: string;
  last_name: string;
  email: string;
  address: string;
  address_city: string;
  country_code: string;
  phone_number: string;
  metadata?: Record<string, string | number | boolean>;
};

type CulqiCardPayload = {
  customer_id: string;
  token_id: string;
  metadata?: Record<string, string | number | boolean>;
};

type CulqiSubscriptionPayload = {
  card_id: string;
  plan_id: string;
  tyc: boolean;
  metadata?: Record<string, string | number | boolean>;
};

type CulqiRequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
};

async function culqiRequest<T>(
  path: string,
  options: CulqiRequestOptions = {},
): Promise<T> {
  const secretKey = process.env.CULQI_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Falta configurar CULQI_SECRET_KEY en .env.local");
  }

  const response = await fetch(`${CULQI_API_URL}${path}`, {
    method: options.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Error Culqi:", data);
    throw new Error(
      data?.merchant_message || data?.message || "Error al consumir Culqi",
    );
  }

  return data as T;
}

export async function getCulqiCustomerByEmail(email: string) {
  return culqiRequest<{
    data: Array<{
      id: string;
      email: string;
      creation_date: number;
    }>;
  }>(`/customers?email=${encodeURIComponent(email)}`, {
    method: "GET",
  });
}

export async function createCulqiCustomer(payload: CulqiCustomerPayload) {
  return culqiRequest<{
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  }>("/customers", { body: payload });
}

export async function createCulqiCard(payload: CulqiCardPayload) {
  return culqiRequest<{
    id: string;
    customer_id: string;
  }>("/cards", { body: payload });
}

export async function createCulqiSubscription(
  payload: CulqiSubscriptionPayload,
) {
  return culqiRequest<{
    id: string;
    status: number | string;
    active_card: string;
    plan: {
      plan_id: string;
      name: string;
      amount: number;
      currency: string;
    };
  }>("/recurrent/subscriptions/create", { body: payload });
}
