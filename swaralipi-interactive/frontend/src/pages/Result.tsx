import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { analyzeCrop, getUserFacingApiError, type AnalyzeResponse } from "../api/client";
import NeuralTooltip from "../components/NeuralTooltip";
import { Loader2, ArrowLeft, AlertCircle, ScanText, Layers, ShieldCheck } from "lucide-react";

const SCAN_IMAGE_KEY = "swaralipi_scan_image";

function getCroppedImageSrc(image: HTMLImageElement, crop: PixelCrop): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const sx = Math.max(0, Math.floor(crop.x * scaleX));
  const sy = Math.max(0, Math.floor(crop.y * scaleY));
  const sw = Math.max(1, Math.floor(crop.width * scaleX));
  const sh = Math.max(1, Math.floor(crop.height * scaleY));

  canvas.width = sw;
  canvas.height = sh;
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
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
      <div className="flex items-center justify-center min-vh-60 animate-premium">
        <Loader2 className="w-10 h-10 text-neutral-900 animate-spin" />
      </div>
    );
  }

  const isBackendError = !!result?.message?.toLowerCase().includes("backend not reachable");

  return (
    <div className="min-h-screen pt-32 pb-12 px-6 bg-neutral-50 flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto overflow-hidden">

      {/* Left: Control & Result Panel */}
      <aside className="w-full xl:w-[450px] shrink-0 flex flex-col gap-6 animate-premium">

        {/* Header Card */}
        <div className="neural-panel p-8 bg-neutral-900 text-white">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <ScanText className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-heading uppercase tracking-widest text-[14px]">Intelligence Monitor</h2>
            </div>
            <button
              onClick={() => navigate("/scan")}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              title="New Scan"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-neutral-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Processing Layer</span>
              </div>
              <span className="text-xs font-bold font-heading text-neutral-300">YOLOv8-Neural</span>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-neutral-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Security Protocol</span>
              </div>
              <span className="text-xs font-bold font-heading text-green-400">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Results Stream */}
        <div className="neural-panel flex-1 bg-white p-6 flex flex-col min-h-[400px]">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-6 px-2">Detection Stream</h3>

          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-neutral-400">
                <Loader2 className="w-10 h-10 animate-spin text-neutral-900" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Analyzing selection...</span>
              </div>
            )}

            {!loading && result && result.detections && result.detections.length > 0 && (
              result.detections.map((det, idx) => (
                <div key={idx} className="animate-premium" style={{ animationDelay: `${idx * 100}ms` }}>
                  <NeuralTooltip
                    hindiSymbol={det.hindi_symbol}
                    englishName={det.class_name || ""}
                    confidence={det.confidence}
                    inline
                  />
                </div>
              ))
            )}

            {!loading && result && !result.detections && result.hindi_symbol && (
              <NeuralTooltip
                hindiSymbol={result.hindi_symbol}
                englishName={result.class_name || ""}
                confidence={result.confidence}
                inline
              />
            )}

            {!loading && !result && (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest leading-loose">
                  Standing by for crop selection...<br />
                  <span className="text-[10px] font-medium lowercase italic text-neutral-300">Target a swara or full line</span>
                </p>
              </div>
            )}

            {!loading && result && result.message && (
              <div className={`rounded-[2rem] p-6 border ${isBackendError ? "bg-amber-50 border-amber-200" : "bg-neutral-50 border-neutral-100"}`}>
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className={`w-5 h-5 ${isBackendError ? "text-amber-600" : "text-neutral-400"}`} />
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-900">System Log</span>
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed">{result.message}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Right: Workspace */}
      <main className="flex-1 min-h-[600px] neural-panel bg-neutral-100 p-8 flex flex-col animate-premium [animation-delay:200ms]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Live Feed</span>
          </div>
          <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">Select region for neural parsing</p>
        </div>

        <div className="flex-1 bg-white rounded-[2rem] border border-neutral-200 shadow-inner p-8 flex items-center justify-center overflow-auto">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={onComplete}
            className="max-w-full"
          >
            <img
              ref={imgRef}
              src={source}
              alt="Notation feed"
              className="max-h-[65vh] w-auto shadow-2xl rounded-lg"
              style={{ maxWidth: "100%" }}
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>
      </main>
    </div>
  );
}
