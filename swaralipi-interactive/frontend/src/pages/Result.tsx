import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { analyzeCrop, getUserFacingApiError, type AnalyzeResponse } from "../api/client";
import NeuralTooltip from "../components/NeuralTooltip";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";

const SCAN_IMAGE_KEY = "swaralipi_scan_image";

function getCroppedImageSrc(image: HTMLImageElement, crop: PixelCrop): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // ReactCrop gives crop in rendered-image pixels; map to natural-image pixels.
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const sx = Math.max(0, Math.floor(crop.x * scaleX));
  const sy = Math.max(0, Math.floor(crop.y * scaleY));
  const sw = Math.max(1, Math.floor(crop.width * scaleX));
  const sh = Math.max(1, Math.floor(crop.height * scaleY));

  canvas.width = sw;
  canvas.height = sh;
  ctx.drawImage(
    image,
    sx, sy, sw, sh,
    0, 0, canvas.width, canvas.height
  );
  return canvas.toDataURL("image/png");
}

export default function Result() {
  const navigate = useNavigate();
  const imgRef = useRef<HTMLImageElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop | undefined>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(SCAN_IMAGE_KEY);
    if (!stored) {
      navigate("/scan", { replace: true });
      return;
    }
    setSource(stored);
  }, [navigate]);

  const onComplete = useCallback(
    async (c: PixelCrop) => {
      if (!imgRef.current || !source || c.width < 10 || c.height < 10) return;
      const base64 = getCroppedImageSrc(imgRef.current, c);
      if (!base64) return;
      setLoading(true);
      setResult(null);
      try {
        const data = await analyzeCrop(base64);
        setResult(data);
      } catch (err) {
        const message = getUserFacingApiError(err, "analyze");
        setResult({
          success: false,
          class_id: null,
          class_name: null,
          hindi_symbol: null,
          confidence: 0,
          message,
        });
      } finally {
        setLoading(false);
      }
    },
    [source]
  );

  if (!source) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
      </div>
    );
  }

  const isBackendError = !!result?.message?.toLowerCase().includes("backend not reachable");

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row bg-neutral-50">
      {/* Left: Result panel */}
      <aside className="w-full lg:w-80 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-neutral-200 bg-white p-6 lg:min-h-[60vh] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Result</h2>
          <button
            type="button"
            onClick={() => navigate("/scan")}
            className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> New scan
          </button>
        </div>
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-neutral-500">
            <Loader2 className="w-10 h-10 text-neutral-900 animate-spin" />
            <span className="text-sm">Detecting swara...</span>
          </div>
        )}

        {!loading && result && result.class_id != null && result.hindi_symbol && (
          <NeuralTooltip
            hindiSymbol={result.hindi_symbol}
            englishName={result.class_name || ""}
            confidence={result.confidence}
            inline
          />
        )}
        {!loading && result && result.class_id == null && result.message && (
          <div className={`rounded-xl border p-4 ${isBackendError ? "border-amber-200 bg-amber-50" : "border-neutral-200 bg-neutral-50"}`}>
            {isBackendError && <AlertCircle className="w-5 h-5 text-amber-600 mb-2" />}
            <p className="text-sm text-neutral-700">{result.message}</p>
            {isBackendError && (
              <p className="mt-2 text-xs text-neutral-500">
                From project folder: run <code className="bg-neutral-200 px-1 rounded">run-backend.bat</code> or <code className="bg-neutral-200 px-1 rounded">backend\run.bat</code>.
              </p>
            )}
          </div>
        )}
        {!loading && !result && (
          <p className="text-neutral-500 text-sm py-8">Draw a box over one symbol, then release to analyze.</p>
        )}
      </aside>

      {/* Right: Crop area */}
      <div className="flex-1 p-6 overflow-auto">
        <p className="text-neutral-500 text-sm mb-3">Drag a box over one swara symbol, then release to analyze.</p>
        <div className="flex justify-center bg-white rounded-xl border border-neutral-200 p-4 min-h-[400px] shadow-card">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={onComplete}
            aspect={undefined}
            className="max-w-full"
          >
            <img
              ref={imgRef}
              src={source}
              alt="Notation"
              className="max-h-[70vh] w-auto"
              style={{ maxWidth: "100%" }}
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>
      </div>
    </div>
  );
}
