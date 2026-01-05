// frontend/src/api/ai.ts
import axios from "axios";

export type AiProvider = "kimi" | "qwen" | "deepseek";

// ✅ 新的：车辆特征
export interface VehicleFeatures {
  brand: string;        // 品牌
  age_years: number;    // 车龄
  engine: number;       // 排量
  gearbox: string;      // 变速箱
  transfer_cnt: number; // 过户次数
  price_new: number;    // 新车指导价（万）
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
    features: VehicleFeatures;
    predicted_price: number;
  }) => aiClient.post<PriceAnalysisResponse>("/price-analysis", data),
};
