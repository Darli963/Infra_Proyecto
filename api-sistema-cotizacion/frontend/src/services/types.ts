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
  riskQuestionGroupId: string | null;
  quoteProfileId: string | null;
  images: MotorcycleImage[];
}

export interface QuoteProfile {
  id: string;
  dealershipId: string;
  name: string;
  description: string | null;
  factor: string;
  fixedCharge: string;
  minDownPayment: string;
  maxMonths: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RiskQuestionGroup {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  questions?: RiskQuestion[];
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
  questionId: string;
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
  groupId: string | null;
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
    ruleName?: string | null;
    ruleFactor?: string;
    ruleCharge?: string;
    profileName?: string | null;
    profileFactor?: string;
    profileCharge?: string;
    minDownPayment?: string;
    maxMonths?: number;
    riskFactor: string;
    surcharge: string;
    finalPrice: string;
  };
  expiresAt: string;
}
