import type {
  Motorcycle,
  PaginatedResponse,
  RiskQuestion,
  SimulatePayload,
  QuoteResult,
} from "./types";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? "Error de red");
  return (await res.json()).data as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message ?? json.errors?.join(", ") ?? "Error de red");
  return json.data as T;
}

export const api = {
  motorcycles: {
    list: (params?: URLSearchParams) =>
      get<PaginatedResponse<Motorcycle>>(`/public/motorcycles${params ? `?${params}` : ""}`),
    get: (id: string) =>
      get<Motorcycle>(`/public/motorcycles/${id}`),
  },
  riskQuestions: {
    list: () => get<RiskQuestion[]>("/public/risk-questions"),
  },
  quote: {
    simulate: (payload: SimulatePayload) =>
      post<QuoteResult>("/public/quote/simulate", payload),
  },
};
