import axios from "axios";

// Directly point to the FastAPI backend running on port 8000
// In dev, set VITE_API_URL in .env.development if you need to override it.
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

export const getApiBase = () => API_BASE;

function isRelativeApiBase(base: string) {
  return base.startsWith("/");
}

export function getBackendHintUrl() {
  return isRelativeApiBase(API_BASE) ? DEFAULT_BACKEND_URL : API_BASE;
}

function extractErrorDetail(data: unknown): string | null {
  if (!data) return null;
  if (typeof data === "string") return data;
  if (typeof data === "object" && data !== null && "detail" in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
  }
  return null;
}

export function getUserFacingApiError(error: unknown, action: "analyze" | "history"): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const detail = extractErrorDetail(error.response.data);
      const prefix = action === "analyze" ? "Analyze failed" : "History fetch failed";
      return detail ? `${prefix}: ${detail}` : `${prefix}: HTTP ${error.response.status}`;
    }
    return `Backend not reachable. Start it (e.g. run-backend.bat), then ensure it runs at ${getBackendHintUrl()}.`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return action === "analyze" ? "Analyze failed." : "Could not load history.";
}

export interface AnalyzeResponse {
  success: boolean;
  class_id: number | null;
  class_name: string | null;
  hindi_symbol: string | null;
  confidence: number;
  detections?: {
    class_id: number;
    class_name: string;
    hindi_symbol: string;
    confidence: number;
    bbox: number[];
  }[];
  timestamp?: string;
  message?: string;
}

export interface HistoryScan {
  id: number;
  timestamp: string;
  class_name: string;
  class_id: number;
  confidence: number;
  image_crop_base64: string | null;
  hindi_symbol?: string;
}

export interface HistoryResponse {
  success: boolean;
  scans: HistoryScan[];
}

export async function analyzeCrop(base64Image: string): Promise<AnalyzeResponse> {
  const { data } = await client.post<AnalyzeResponse>("/analyze", {
    image_base64: base64Image,
  });
  return data;
}

export async function getHistory(): Promise<HistoryResponse> {
  const { data } = await client.get<HistoryResponse>("/history");
  return data;
}
