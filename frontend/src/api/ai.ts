// frontend/src/api/ai.ts
import axios from "axios";

export type AiProvider = "kimi" | "qwen" | "deepseek";

export interface HouseFeatures {
  area_sqm: number;
  bedrooms: number;
  age_years: number;
}

export interface PriceAnalysisResponse {
  provider: AiProvider;
  predicted_price: number;
  analysis_markdown: string;
}

const AI_BASE_URL =
  import.meta.env.VITE_AI_BASE_URL || "http://localhost:8080";

const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 60000,
});
export default aiClient;

export const aiAPI = {
  priceAnalysis: (data: {
    provider: AiProvider;
    features: HouseFeatures;
    predicted_price: number;
  }) => aiClient.post<PriceAnalysisResponse>("/price-analysis", data),
};
