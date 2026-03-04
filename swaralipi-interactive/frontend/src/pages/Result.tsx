import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { analyzeCrop, getUserFacingApiError, type AnalyzeResponse } from "../api/client";
import NeuralTooltip from "../components/NeuralTooltip";
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  Terminal,
  Settings2,
  Database,
  Info,
  Maximize2,
  CheckCircle2
} from "lucide-react";

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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-8 h-8 text-neutral-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#FDFDFD] flex flex-col lg:flex-row overflow-hidden font-sans text-neutral-900">

      {/* LEFT PANEL: ANALYSIS CONSOLE */}
      <aside className="w-full lg:w-[480px] bg-white border-r border-neutral-200 flex flex-col relative z-20">

        {/* Module Header */}
        <div className="p-8 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-white border border-neutral-200 flex items-center justify-center shadow-sm">
              <Terminal className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-900 leading-none mb-1">Analysis Console</h2>
              <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Module v4.2.0 — Inference Active</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/scan")}
            className="p-2.5 rounded-lg border border-neutral-200 text-neutral-400 hover:text-neutral-900 hover:bg-white transition-all shadow-sm"
            title="Return to Input"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">

          {/* Section 1: System Parameters */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-3.5 h-3.5 text-neutral-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">System Parameters</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50">
                <span className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">Model Architecture</span>
                <span className="text-xs font-semibold text-neutral-800">YOLOv8x-Swaralipi</span>
              </div>
              <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50">
                <span className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">Inference Engine</span>
                <span className="text-xs font-semibold text-neutral-800 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Local Node
                </span>
              </div>
            </div>
          </section>

          {/* Section 2: Methodology Description */}
          <section className="p-6 rounded-2xl bg-neutral-900 text-neutral-300">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-3.5 h-3.5 text-neutral-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Analysis Methodology</h3>
            </div>
            <p className="text-[11px] leading-relaxed font-medium opacity-80">
              The neural engine utilizes spatial coordinate mapping to identify musical notation.
              Upon defining a Region of Interest (ROI) on the workbench, the system performs a localized
              pixel scan to classify swara symbols and measure confidence intervals.
            </p>
          </section>

          {/* Section 3: Detection Metadata */}
          <section className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-3.5 h-3.5 text-neutral-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Detection Metadata</h3>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 border border-neutral-100 rounded-2xl border-dashed">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-300" />
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Processing ROI...</span>
                </div>
              ) : (
                <>
                  {result?.detections && result.detections.length > 0 && (
                    (() => {
                      const topResult = [...result.detections].sort((a, b) => b.confidence - a.confidence)[0];
                      return (
                        <NeuralTooltip
                          hindiSymbol={topResult.hindi_symbol}
                          englishName={topResult.class_name || ""}
                          confidence={topResult.confidence}
                          inline
                        />
                      );
                    })()
                  )}

                  {result && !result.detections && result.hindi_symbol && (
                    <NeuralTooltip
                      hindiSymbol={result.hindi_symbol}
                      englishName={result.class_name || ""}
                      confidence={result.confidence}
                      inline
                    />
                  )}

                  {!result && !loading && (
                    <div className="border border-neutral-100 rounded-2xl py-12 px-6 text-center bg-neutral-50/30">
                      <p className="text-[11px] font-medium text-neutral-400 leading-relaxed italic">
                        No active ROI detected. Please select a segment on the visual workbench to initialize parsing.
                      </p>
                    </div>
                  )}

                  {result?.message && (
                    <div className={`rounded-xl p-4 border ${result.success === false ? "bg-red-50/50 border-red-100 text-red-700" : "bg-neutral-50 border-neutral-200 text-neutral-600"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">System Response</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{result.message}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>

        {/* Console Footer */}
        <div className="p-6 border-t border-neutral-100 bg-neutral-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Integrity Verified</span>
          </div>
          <span className="text-[9px] font-mono text-neutral-400">#00214-SEC</span>
        </div>
      </aside>

      {/* RIGHT PANEL: VISUAL WORKBENCH */}
      <main className="flex-1 p-8 lg:p-12 flex flex-col relative bg-[#F8F9FA]">

        {/* Subtle Engineering Grid */}
        <div
          className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h30v30H0V0zm1 1h28v28H1V1z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }}
        />

        <div className="relative z-10 flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-300 border border-neutral-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400">Visual Workspace — High Fidelity Feed</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Resolution:</span>
              <span className="text-[9px] font-bold text-neutral-600">Native</span>
            </div>
            <Maximize2 className="w-3.5 h-3.5 text-neutral-300" />
          </div>
        </div>

        <div className="relative z-10 flex-1 bg-white border border-neutral-200 shadow-sm rounded-xl p-8 flex items-center justify-center overflow-auto ring-1 ring-black/[0.02]">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={onComplete}
            className="max-w-full"
          >
            <img
              ref={imgRef}
              src={source}
              alt="Manuscript"
              className="max-h-[65vh] w-auto transition-opacity duration-500"
              style={{ maxWidth: "100%" }}
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        <div className="relative z-10 mt-8 flex justify-center">
          <div className="px-6 py-2.5 rounded-lg border border-neutral-200 bg-white/80 backdrop-blur-sm shadow-sm flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-900">ROI Mapping</span>
            </div>
            <div className="w-[1px] h-3 bg-neutral-200" />
            <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest italic">
              Draw selection box to initiate classification
            </p>
          </div>
        </div>
      </main>

      <style>{`
        .ReactCrop__crop-selection {
          border: 1px solid #171717 !important;
          box-shadow: 0 0 0 9999px rgba(255, 255, 255, 0.7) !important;
          border-radius: 2px !important;
        }
        .ReactCrop__drag-handle {
          width: 8px !important;
          height: 8px !important;
          background-color: #171717 !important;
          border-radius: 1px !important;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}