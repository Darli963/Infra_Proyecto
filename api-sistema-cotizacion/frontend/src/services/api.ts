import type {
  Motorcycle,
  PaginatedResponse,
  RiskQuestion,
  SimulatePayload,
  QuoteResult,
} from "./types";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
const STORAGE_KEY = "mq_auth";

function getToken(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { token: string }).token : null;
  } catch { return null; }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message ?? json.errors?.join(", ") ?? "Error de red");
  return json.data as T;
}

const pub  = <T>(path: string)                      => request<T>(path);
const get  = <T>(path: string)                      => request<T>(path, {}, true);
const post = <T>(path: string, body: unknown)       => request<T>(path, { method: "POST",  body: JSON.stringify(body) }, true);
const put  = <T>(path: string, body: unknown)       => request<T>(path, { method: "PUT",   body: JSON.stringify(body) }, true);
const del  =    (path: string)                      => request<void>(path, { method: "DELETE" }, true);

// ─── tipos del dealer ────────────────────────────────────────────────────────

export interface LoginResponse {
  dealership: { id: string; name: string; email: string; slug: string };
  token: string;
}

export interface MotorcycleInput {
  brand: string;
  model: string;
  year: number;
  engineCC: number;
  price: number;
  currency?: string;
  category: string;
  description?: string;
  active?: boolean;
  images?: { url: string; altText?: string; isPrimary?: boolean; sortOrder?: number }[];
}

// ─── cliente ─────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<LoginResponse>("/auth/dealership/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  },

  // endpoints públicos (sin token)
  public: {
    motorcycles: {
      list: (params?: URLSearchParams) =>
        pub<PaginatedResponse<Motorcycle>>(`/public/motorcycles${params ? `?${params}` : ""}`),
      get: (id: string) =>
        pub<Motorcycle>(`/public/motorcycles/${id}`),
    },
    riskQuestions: { list: () => pub<RiskQuestion[]>("/public/risk-questions") },
    quote: {
      simulate: (payload: SimulatePayload) =>
        request<QuoteResult>("/public/quote/simulate", { method: "POST", body: JSON.stringify(payload) }),
    },
  },

export interface QuoteRule {
  id: string;
  motorcycleId: string | null;
  name: string;
  factor: string;
  fixedCharge: string;
  currency: string;
  description: string | null;
  active: boolean;
  motorcycle: { id: string; brand: string; model: string } | null;
}

export interface QuoteRuleInput {
  name: string;
  factor: number;
  fixedCharge?: number;
  currency?: string;
  motorcycleId?: string | null;
  description?: string;
  active?: boolean;
}

export interface RiskQuestionAdmin {
  id: string;
  text: string;
  inputType: string;
  required: boolean;
  sortOrder: number;
  active: boolean;
  options: { id: string; label: string; riskFactor: string; sortOrder: number }[];
}

export interface RiskQuestionInput {
  text: string;
  inputType?: string;
  required?: boolean;
  sortOrder?: number;
  active?: boolean;
  options?: { label: string; riskFactor?: number; sortOrder?: number }[];
}

  // endpoints privados (con token)
  dealer: {
    motorcycles: {
      list: (params?: URLSearchParams) =>
        get<PaginatedResponse<Motorcycle>>(`/dealer/motorcycles${params ? `?${params}` : ""}`),
      get:    (id: string)                            => get<Motorcycle>(`/dealer/motorcycles/${id}`),
      create: (data: MotorcycleInput)                 => post<Motorcycle>("/dealer/motorcycles", data),
      update: (id: string, data: Partial<MotorcycleInput>) => put<Motorcycle>(`/dealer/motorcycles/${id}`, data),
      remove: (id: string)                            => del(`/dealer/motorcycles/${id}`),
    },
    quoteRules: {
      list:   ()                                         => get<QuoteRule[]>("/dealer/quote-rules"),
      get:    (id: string)                               => get<QuoteRule>(`/dealer/quote-rules/${id}`),
      create: (data: QuoteRuleInput)                     => post<QuoteRule>("/dealer/quote-rules", data),
      update: (id: string, data: Partial<QuoteRuleInput>) => put<QuoteRule>(`/dealer/quote-rules/${id}`, data),
      remove: (id: string)                               => del(`/dealer/quote-rules/${id}`),
    },
    riskQuestions: {
      list:   ()                                              => get<RiskQuestionAdmin[]>("/dealer/risk-questions"),
      create: (data: RiskQuestionInput)                      => post<RiskQuestionAdmin>("/dealer/risk-questions", data),
      update: (id: string, data: Partial<RiskQuestionInput>) => put<RiskQuestionAdmin>(`/dealer/risk-questions/${id}`, data),
      remove: (id: string)                                   => del(`/dealer/risk-questions/${id}`),
    },
  },
};
