import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { analyzeCrop, getUserFacingApiError, type AnalyzeResponse } from "../api/client";
import NeuralTooltip from "../components/NeuralTooltip";
import { Loader2, ArrowLeft, AlertCircle, ScanText, Layers, ShieldCheck, Activity, Target } from "lucide-react";

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
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FA]">
        <Loader2 className="w-10 h-10 text-neutral-900 animate-spin" />
      </div>
    );
  }

  const isBackendError = !!result?.message?.toLowerCase().includes("backend not reachable");

  return (
    <div className="relative min-h-screen bg-[#F8F9FA] flex flex-col lg:flex-row overflow-hidden selection:bg-neutral-900 selection:text-white">

      {/* LEFT: INTELLIGENCE MONITOR (Side Control) */}
      <aside className="w-full lg:w-[450px] bg-white border-r border-neutral-200 flex flex-col p-8 lg:p-12 overflow-y-auto relative z-20">

        {/* Header Section */}
        <div className="mb-10 flex items-center justify-between">
          <button
            onClick={() => navigate("/scan")}
            className="flex items-center gap-3 text-neutral-400 hover:text-black transition-all group px-4 py-2 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-100"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Reset Node</span>
          </button>
          <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center shadow-lg shadow-neutral-200">
            <Activity className="w-5 h-5 text-white animate-pulse" />
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 leading-tight">Intelligence <br /> Monitor</h2>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-neutral-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Processing Layer</span>
              </div>
              <span className="text-[10px] font-bold text-neutral-900">YOLOv8-Neural</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-neutral-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Status</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-500">OPTIMIZED</span>
            </div>
          </div>
        </div>

        {/* Detection Stream Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-3.5 h-3.5 text-neutral-400" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Inference Stream</h3>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-900" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Parsing Data...</span>
              </div>
            ) : (
              <>
                {result?.detections?.map((det, idx) => (
                  <NeuralTooltip
                    key={idx}
                    hindiSymbol={det.hindi_symbol}
                    englishName={det.class_name || ""}
                    confidence={det.confidence}
                    inline
                  />
                ))}

                {result && !result.detections && result.hindi_symbol && (
                  <NeuralTooltip
                    hindiSymbol={result.hindi_symbol}
                    englishName={result.class_name || ""}
                    confidence={result.confidence}
                    inline
                  />
                )}

                {!result && !loading && (
                  <div className="border-2 border-dashed border-neutral-100 rounded-[2rem] py-20 px-8 text-center">
                    <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest leading-loose italic">
                      Awaiting spatial definition <br />
                      <span className="normal-case font-medium text-neutral-400">Draw a bounding box on the right feed</span>
                    </p>
                  </div>
                )}

                {result?.message && (
                  <div className={`rounded-2xl p-5 border ${isBackendError ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-neutral-50 border-neutral-200 text-neutral-600"}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="w-4 h-4 opacity-50" />
                      <span className="text-[9px] font-black uppercase tracking-widest">System Log</span>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed">{result.message}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </aside>

      {/* RIGHT: WORKSPACE FEED (The Analysis Feed) */}
      <main className="flex-1 p-8 lg:p-16 flex flex-col relative overflow-hidden">

        {/* Subtle Lab Grid Texture */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }}
        />

        <div className="relative z-10 flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400 tracking-widest">Active Coordinate Mapping</span>
          </div>
          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Cross-Origin Data Stream</p>
        </div>

        <div className="relative z-10 flex-1 bg-white rounded-[3rem] border border-neutral-200 shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-10 flex items-center justify-center overflow-auto ring-8 ring-neutral-100/50">
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
              className="max-h-[60vh] w-auto shadow-2xl rounded-xl border border-neutral-200 grayscale-[0.1] hover:grayscale-0 transition-all duration-700"
              style={{ maxWidth: "100%" }}
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        <footer className="relative z-10 mt-8 flex justify-center">
          <div className="px-6 py-2 rounded-full bg-neutral-900/5 backdrop-blur-md border border-neutral-200 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neutral-900" />
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-900">ROI: Active</span>
            </div>
            <div className="h-3 w-[1px] bg-neutral-300" />
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest italic">Define swara boundaries manually</span>
          </div>
        </footer>
      </main>

      <style>{`
        /* Minimal custom styling for crop area to match lab theme */
        .ReactCrop__crop-selection {
          border: 2px solid #000 !important;
          box-shadow: 0 0 0 4000px rgba(255, 255, 255, 0.6) !important;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}