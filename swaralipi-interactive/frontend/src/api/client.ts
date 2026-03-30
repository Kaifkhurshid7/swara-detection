import axios from "axios";

// Always go through the same API path in dev and production.
// Vite proxies /api locally; Vercel rewrites /api to Render in production.
const API_BASE = import.meta.env.VITE_API_URL || "/api";
const REQUEST_TIMEOUT_MS = 120000;

const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: REQUEST_TIMEOUT_MS,
});

export const getApiBase = () => API_BASE;

function isRelativeApiBase(base: string) {
  return base.startsWith("/");
}

export function getBackendHintUrl() {
  return isRelativeApiBase(API_BASE) ? "/api" : API_BASE;
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
    if (error.code === "ECONNABORTED") {
      return "Backend took too long to respond. On Render free tier, the server may be waking up. Please wait about a minute and try again.";
    }
    if (error.response) {
      const detail = extractErrorDetail(error.response.data);
      const prefix = action === "analyze" ? "Analyze failed" : "History fetch failed";
      return detail ? `${prefix}: ${detail}` : `${prefix}: HTTP ${error.response.status}`;
    }
    return `Backend not reachable right now. Please retry in about a minute. Backend URL: ${getBackendHintUrl()}.`;
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


export interface ImportResponse {
  success: boolean;
  swaras: {
    class_id: number;
    english_name: string;
    hindi_symbol: string;
  }[];
}

let warmupPromise: Promise<void> | null = null;

async function warmBackend() {
  if (!import.meta.env.PROD) return;
  if (!warmupPromise) {
    warmupPromise = client
      .get("/", { timeout: REQUEST_TIMEOUT_MS })
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        warmupPromise = null;
      });
  }
  await warmupPromise;
}

export async function analyzeCrop(imageBlob: Blob): Promise<AnalyzeResponse> {
  await warmBackend();
  const formData = new FormData();
  formData.append("file", imageBlob, "image.png");

  const { data } = await client.post<AnalyzeResponse>("/analyze", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
}

export async function getHistory(): Promise<HistoryResponse> {
  await warmBackend();
  const { data } = await client.get<HistoryResponse>("/history");
  return data;
}


export async function importNotation(format: "musicxml", content: string): Promise<ImportResponse> {
  const { data } = await client.post<ImportResponse>("/import", { format, content });
  return data;
}
