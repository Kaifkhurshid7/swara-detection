import { useState, useEffect } from "react";
import { getHistory, getUserFacingApiError, type HistoryScan } from "../api/client";
import { Loader2, Music2, AlertCircle } from "lucide-react";

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function History() {
  const [scans, setScans] = useState<HistoryScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHistory()
      .then((res) => setScans(res.scans || []))
      .catch((err) => setError(getUserFacingApiError(err, "history")))
      .finally(() => setLoading(false));
  }, []);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-neutral-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-neutral-800 font-medium">Could not load history</p>
            <p className="text-sm text-neutral-600 mt-1">{error}</p>
            <p className="text-xs text-neutral-500 mt-2">Run <code className="bg-amber-100 px-1 rounded">run-backend.bat</code> from the project folder.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-8">Scan history</h1>
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-neutral-200" />
        <ul className="space-y-6">
          {scans.length === 0 && (
            <li className="flex items-center gap-4 text-neutral-500 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <Music2 className="w-5 h-5 flex-shrink-0" />
              <span>No scans yet. Capture an image and crop a symbol to see results here.</span>
            </li>
          )}
          {scans.map((s) => (
            <li key={s.id} className="relative flex gap-4 pl-12">
              <div className="absolute left-2.5 top-6 w-4 h-4 rounded-full bg-neutral-900 border-2 border-white shadow-sm" />
              <div className="flex-1 min-w-0 rounded-xl border border-neutral-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-card">
                {s.image_crop_base64 && (
                  <img
                    src={`data:image/png;base64,${s.image_crop_base64}`}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover border border-neutral-200 flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-neutral-500 text-xs mb-0.5">{formatTime(s.timestamp)}</p>
                  {s.hindi_symbol != null && (
                    <p className="text-2xl text-neutral-900 mb-1 font-semibold" style={{ fontFamily: "serif" }}>
                      {s.hindi_symbol}
                    </p>
                  )}
                  <p className="text-neutral-600 text-sm">{s.class_name}</p>
                  <p className="text-neutral-500 text-xs">Confidence: {Math.round(s.confidence * 100)}%</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
