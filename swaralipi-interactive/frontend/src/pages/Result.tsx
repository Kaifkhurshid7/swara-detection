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
  Database,
  Maximize2,
  CheckCircle2,
  MousePointer2,
  Layers,
  Fingerprint,
  Crosshair
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
    <div className="relative min-h-screen bg-[#FDFDFD] flex flex-col lg:flex-row overflow-hidden font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">

      {/* LEFT PANEL: SYSTEM CONSOLE */}
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
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">

          {/* DIF SECTION: INTERACTIVE STEPS */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-3.5 h-3.5 text-neutral-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Operation Sequence</h3>
            </div>

            <div className="relative space-y-3">
              {/* Step 1: Define ROI */}
              <div className={`flex items-start gap-4 p-5 rounded-xl border transition-all duration-500 ${!crop ? 'bg-neutral-900 border-neutral-800 shadow-xl shadow-neutral-200' : 'bg-neutral-50 border-neutral-100 opacity-60'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${!crop ? 'bg-white text-black' : 'bg-neutral-200 text-neutral-500'}`}>01</div>
                <div className="flex-1">
                  <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${!crop ? 'text-white' : 'text-neutral-500'}`}>Region Definition</h4>
                  <p className={`text-[10px] leading-relaxed ${!crop ? 'text-neutral-400' : 'text-neutral-400'}`}>Identify and select the specific swara notation on the workbench feed.</p>
                </div>
                {crop ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-1" /> : <MousePointer2 className="w-4 h-4 text-white mt-1 animate-pulse" />}
              </div>

              {/* Step 2: Inference Pipeline */}
              <div className={`flex items-start gap-4 p-5 rounded-xl border transition-all duration-500 ${crop && !result ? 'bg-neutral-900 border-neutral-800 shadow-xl' : 'bg-neutral-50 border-neutral-100 opacity-60'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${crop && !result ? 'bg-white text-black' : 'bg-neutral-200 text-neutral-500'}`}>02</div>
                <div className="flex-1">
                  <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${crop && !result ? 'text-white' : 'text-neutral-500'}`}>Neural Parsing</h4>
                  <p className={`text-[10px] leading-relaxed ${crop && !result ? 'text-neutral-400' : 'text-neutral-400'}`}>Execute localized pattern recognition via YOLOv8 inference architecture.</p>
                </div>
                {loading ? <Loader2 className="w-4 h-4 text-white mt-1 animate-spin" /> : result ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-1" /> : null}
              </div>
            </div>
          </section>

          {/* RESULTS SECTION: LIVE METADATA */}
          <section className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-3.5 h-3.5 text-neutral-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Live Detection Stream</h3>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 border border-neutral-100 rounded-2xl border-dashed bg-neutral-50/50">
                  <Fingerprint className="w-8 h-8 text-neutral-200 animate-pulse" />
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Scanning Metadata...</span>
                </div>
              ) : result ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                  {result.detections && result.detections.length > 0 ? (
                    <NeuralTooltip
                      hindiSymbol={result.detections[0].hindi_symbol}
                      englishName={result.detections[0].class_name || ""}
                      confidence={result.detections[0].confidence}
                      inline
                    />
                  ) : result.hindi_symbol ? (
                    <NeuralTooltip
                      hindiSymbol={result.hindi_symbol}
                      englishName={result.class_name || ""}
                      confidence={result.confidence}
                      inline
                    />
                  ) : null}
                </div>
              ) : (
                <div className="border border-neutral-100 rounded-2xl py-12 px-6 text-center bg-neutral-50/30">
                  <p className="text-[11px] font-medium text-neutral-400 leading-relaxed italic">
                    Awaiting ROI definition. <br />
                    Select a manuscript segment to initiate the pipeline.
                  </p>
                </div>
              )}

              {result?.message && (
                <div className={`rounded-xl p-4 border mt-4 ${result.success === false ? "bg-red-50/50 border-red-100 text-red-700" : "bg-neutral-50 border-neutral-200 text-neutral-600"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Protocol Response</span>
                  </div>
                  <p className="text-[11px] leading-relaxed font-mono opacity-80">{result.message}</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Console Footer */}
        <div className="p-6 border-t border-neutral-100 bg-neutral-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Node Integrity: 100%</span>
          </div>
          <span className="text-[9px] font-mono text-neutral-400 uppercase">Latency: Optmized</span>
        </div>
      </aside>

      {/* RIGHT PANEL: VISUAL WORKBENCH */}
      <main className="flex-1 p-8 lg:p-12 flex flex-col relative bg-[#F8F9FA]">

        {/* Engineering Grid Layer */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />

        <div className="relative z-10 flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-neutral-400 shadow-sm" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400">Digital Workspace — Optic Mapping Feed</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Crosshair className="w-3 h-3 text-neutral-300" />
              <span className="text-[9px] font-mono text-neutral-500">
                {crop ? `X:${Math.round(crop.x)} Y:${Math.round(crop.y)}` : '0.00, 0.00'}
              </span>
            </div>
            <Maximize2 className="w-3.5 h-3.5 text-neutral-300 hover:text-neutral-900 cursor-pointer transition-colors" />
          </div>
        </div>

        {/* Image Container */}
        <div className="relative z-10 flex-1 bg-white border border-neutral-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-2xl p-8 flex items-center justify-center overflow-auto">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={onComplete}
            className="max-w-full"
          >
            <img
              ref={imgRef}
              src={source}
              alt="Notation Feed"
              className="max-h-[68vh] w-auto transition-all duration-700 grayscale-[0.1]"
              style={{ maxWidth: "100%" }}
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        {/* Interaction Bar */}
        <div className="relative z-10 mt-8 flex justify-center">
          <div className="px-6 py-3 rounded-xl border border-neutral-200 bg-white shadow-sm flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-neutral-900'}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-900">ROI: {crop ? 'Active' : 'Awaiting'}</span>
            </div>
            <div className="w-[1px] h-4 bg-neutral-100" />
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-[0.15em] italic">
              Define coordinate boundaries to trigger inference engine
            </p>
          </div>
        </div>
      </main>

      <style>{`
        .ReactCrop__crop-selection {
          border: 1px solid #171717 !important;
          box-shadow: 0 0 0 9999px rgba(255, 255, 255, 0.8) !important;
          border-radius: 4px !important;
        }
        .ReactCrop__drag-handle {
          width: 7px !important;
          height: 7px !important;
          background-color: #171717 !important;
          border-radius: 50% !important;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}