/**
 * API Client — Centralized HTTP layer for backend communication.
 *
 * Architecture:
 *   - Single Axios instance with shared config (base URL, timeout, headers)
 *   - Automatic backend warmup on first request (handles Render cold starts)
 *   - Structured error handling with user-friendly messages
 *   - TypeScript interfaces for all request/response shapes
 *
 * Environment:
 *   - Dev: Vite proxies /api → localhost:8000
 *   - Prod: Vercel rewrites /api → Render backend URL
 */

import axios from "axios";

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const REQUEST_TIMEOUT_MS = 120_000; // 2 minutes (accounts for cold starts)

const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: REQUEST_TIMEOUT_MS,
});

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface Detection {
  class_id: number;
  class_name: string;
  hindi_symbol: string;
  confidence: number;
  bbox: number[];
}

export interface AnalyzeResponse {
  success: boolean;
  class_id: number | null;
  class_name: string | null;
  hindi_symbol: string | null;
  confidence: number;
  detections?: Detection[];
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

// ─────────────────────────────────────────────────────────────
// Backend Warmup (Render Free Tier Cold Start Handling)
// ─────────────────────────────────────────────────────────────

let warmupPromise: Promise<void> | null = null;

/**
 * Ping the backend health endpoint to wake it from cold sleep.
 * Only runs in production — dev server is always hot.
 * Deduplicates concurrent warmup requests via shared promise.
 */
async function warmBackend(): Promise<void> {
  if (!import.meta.env.PROD) return;

  if (!warmupPromise) {
    warmupPromise = client
      .get("/", { timeout: REQUEST_TIMEOUT_MS })
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => { warmupPromise = null; });
  }
  await warmupPromise;
}

// ─────────────────────────────────────────────────────────────
// API Methods
// ─────────────────────────────────────────────────────────────

/**
 * Send a cropped image to the backend for swara detection.
 * Returns all detected swaras with confidence scores and bounding boxes.
 */
export async function analyzeCrop(imageBlob: Blob): Promise<AnalyzeResponse> {
  await warmBackend();

  const formData = new FormData();
  formData.append("file", imageBlob, "image.png");

  const { data } = await client.post<AnalyzeResponse>("/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/**
 * Fetch scan history from the database (most recent first).
 */
export async function getHistory(): Promise<HistoryResponse> {
  await warmBackend();
  const { data } = await client.get<HistoryResponse>("/history");
  return data;
}

/**
 * Parse MusicXML content and convert Western notation to Indian swaras.
 */
export async function importNotation(format: "musicxml", content: string): Promise<ImportResponse> {
  const { data } = await client.post<ImportResponse>("/import", { format, content });
  return data;
}

// ─────────────────────────────────────────────────────────────
// Error Handling
// ─────────────────────────────────────────────────────────────

/**
 * Extract a user-friendly error message from API failures.
 * Handles timeout, network errors, and structured error responses.
 */
export function getUserFacingApiError(error: unknown, action: "analyze" | "history"): string {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return "Backend took too long to respond. The server may be waking up — please wait about a minute and try again.";
    }
    if (error.response) {
      const detail = _extractErrorDetail(error.response.data);
      const prefix = action === "analyze" ? "Analyze failed" : "History fetch failed";
      return detail ? `${prefix}: ${detail}` : `${prefix}: HTTP ${error.response.status}`;
    }
    return "Backend not reachable right now. Please retry in about a minute.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return action === "analyze" ? "Analyze failed." : "Could not load history.";
}

// ─────────────────────────────────────────────────────────────
// Private Helpers
// ─────────────────────────────────────────────────────────────

function _extractErrorDetail(data: unknown): string | null {
  if (!data) return null;
  if (typeof data === "string") return data;
  if (typeof data === "object" && data !== null && "detail" in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
  }
  return null;
}
