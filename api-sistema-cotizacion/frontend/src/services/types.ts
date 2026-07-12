export interface MotorcycleImage {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Motorcycle {
  id: string;
  brand: string;
  model: string;
  year: number;
  engineCC: number;
  price: string;
  currency: string;
  category: string;
  description: string | null;
  active: boolean;
  images: MotorcycleImage[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface RiskQuestionOption {
  id: string;
  label: string;
  riskFactor: string;
  sortOrder: number;
}

export interface RiskQuestion {
  id: string;
  text: string;
  inputType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT" | "NUMBER" | "BOOLEAN";
  required: boolean;
  sortOrder: number;
  options: RiskQuestionOption[];
}

export interface SimulatePayload {
  motorcycleId: string;
  applicantName: string;
  applicantEmail: string;
  responses: { questionId: string; optionId?: string; textValue?: string }[];
}

export interface QuoteResult {
  simulationId: string;
  currency: string;
  breakdown: {
    basePrice: string;
    ruleName: string | null;
    ruleFactor: string;
    ruleCharge: string;
    riskFactor: string;
    surcharge: string;
    finalPrice: string;
  };
  expiresAt: string;
}
