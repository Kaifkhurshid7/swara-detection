import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  analyzeCrop,
  getUserFacingApiError,
  type AnalyzeResponse
} from "../api/client";
import { exportToMusicXML, exportToPdf, exportToText, downloadFile } from "../utils/exportNotation";
import {
  Loader2,
  CheckCircle2,
  Crosshair,
  Crop as CropIcon,
  ArrowLeft,
  Copy,
  Check,
  FileCode2,
  Code2,
  FileText
} from "lucide-react";

const SCAN_IMAGE_KEY = "swaralipi_scan_image";

function getCroppedImageBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(null);
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const sx = Math.max(0, Math.floor(crop.x * scaleX));
    const sy = Math.max(0, Math.floor(crop.y * scaleY));
    const sw = Math.max(1, Math.floor(crop.width * scaleX));
    const sh = Math.max(1, Math.floor(crop.height * scaleY));

    canvas.width = sw;
    canvas.height = sh;
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
}

export default function Result() {
  const navigate = useNavigate();
  const imgRef = useRef<HTMLImageElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop | undefined>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [storedDetections, setStoredDetections] = useState<NonNullable<AnalyzeResponse["detections"]>>([]);
  const [copied, setCopied] = useState(false);

  const latestDetections = result?.detections || storedDetections;

  const handleStoreLatest = () => {
    if (result?.detections) {
      setStoredDetections(result.detections);
      setResult(null);
      setCrop(undefined);
    }
  };

  const handleClear = () => {
    setStoredDetections([]);
    setResult(null);
    setCrop(undefined);
  };


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
      const blob = await getCroppedImageBlob(imgRef.current, c);
      if (!blob) return;
      setLoading(true);
      setResult(null);
      try {
        const data = await analyzeCrop(blob);
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

  const handleCopyNotation = () => {
    if (latestDetections.length === 0) return;
    const text = latestDetections.map(d => d.hindi_symbol).join(" ");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportXML = () => {
    if (latestDetections.length === 0) return;
    const xml = exportToMusicXML([latestDetections]);
    downloadFile(xml, "swaralipi.musicxml", "application/vnd.recordare.musicxml+xml");
  };

  const handleExportText = () => {
    if (latestDetections.length === 0) return;
    const text = exportToText([latestDetections]);
    downloadFile(text, "swaralipi.txt", "text/plain");
  };

  const handleExportPdf = () => {
    if (latestDetections.length === 0) return;
    exportToPdf([latestDetections]);
  };

  if (!source) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-neutral-50 font-sans">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-neutral-900" />
        <span className="text-sm font-bold text-neutral-900">Loading your manuscript...</span>
      </div>
    );
  }

  const hasDetections = !!result?.detections && result.detections.length > 0;
  const step = result ? 3 : crop ? 2 : 1;

  const steps = [
    { n: 1, label: "Select" },
    { n: 2, label: "Read" },
    { n: 3, label: "Export" },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-neutral-50 font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/scan")}
              aria-label="Scan another image"
              className="group flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </button>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-500">Step 2 of 2</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">Select and read</h1>
            </div>
          </div>

          {/* Progress stepper */}
          <ol className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2">
            {steps.map((s, i) => {
              const done = step > s.n || (s.n === 3 && hasDetections);
              const active = step === s.n;
              return (
                <li key={s.n} className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold transition-colors ${
                      done || active ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    {done && s.n < step ? <Check className="h-3.5 w-3.5" /> : s.n}
                  </span>
                  <span className={`text-xs font-bold ${active ? "text-neutral-900" : "text-neutral-400"}`}>{s.label}</span>
                  {i < steps.length - 1 && <span aria-hidden className="mx-1 w-6 border-t-2 border-dashed border-neutral-300" />}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Workspace: fixed height on desktop, only the swara list scrolls */}
        <div className="mt-6 grid gap-6 lg:h-[calc(100vh-11.5rem)] lg:min-h-[560px] lg:grid-cols-[420px_minmax(0,1fr)]">
          {/* LEFT: one panel */}
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-card">
            {/* Detected swaras (scrolls) */}
            <section className="flex min-h-0 flex-1 flex-col p-6 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-900">Detected swaras</h2>
                {hasDetections && (
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-bold text-neutral-600">
                    {result!.detections!.length} found
                  </span>
                )}
              </div>

              <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin">
                {loading ? (
                  <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50">
                    <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
                    <span className="text-sm font-semibold text-neutral-600">Reading your notation...</span>
                  </div>
                ) : result ? (
                  hasDetections ? (
                    <ul className="space-y-2">
                      {result.detections!.map((det, idx) => {
                        const pct = Math.round(det.confidence * 100);
                        return (
                          <li key={idx} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 hover:border-neutral-400 transition-colors">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 font-serif text-2xl font-bold text-neutral-900">
                              {det.hindi_symbol}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-3">
                                <p className="truncate text-sm font-extrabold text-neutral-900">{det.class_name || "Unknown"}</p>
                                <span className="text-xs font-bold text-neutral-500">{pct}%</span>
                              </div>
                              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                                <div className="h-full rounded-full bg-neutral-900 transition-all duration-700" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <span className="w-5 text-right text-[11px] font-bold text-neutral-300">{idx + 1}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="flex h-full min-h-[160px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-6 text-center">
                      <p className="text-sm font-extrabold text-neutral-900">No swaras found</p>
                      <p className="mt-1 text-xs text-neutral-500">{result.message || "Try selecting a tighter area around the notation."}</p>
                    </div>
                  )
                ) : (
                  <div className="flex h-full min-h-[160px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-6 text-center">
                    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-neutral-900 shadow-sm">
                      <CropIcon className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-extrabold text-neutral-900">Waiting for your selection</p>
                    <p className="mt-1 text-xs text-neutral-500">Drag a box over the notation to begin.</p>
                  </div>
                )}
              </div>

              {hasDetections && (
                <button
                  onClick={handleStoreLatest}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-bold text-white hover:bg-black active:scale-[0.99] transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Add to notation
                </button>
              )}
            </section>

            {/* Your notation (pinned) */}
            <section className="shrink-0 border-t border-neutral-200 bg-neutral-50 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-900">Your notation</h2>
                {latestDetections.length > 0 && (
                  <button onClick={handleClear} className="text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors">
                    Clear
                  </button>
                )}
              </div>

              <div className="mt-3 max-h-24 min-h-[56px] overflow-y-auto rounded-2xl border border-neutral-200 bg-white px-4 py-3">
                <div className="flex flex-wrap gap-x-4 gap-y-1 font-devanagari text-2xl leading-relaxed text-neutral-900">
                  {latestDetections.length > 0 ? (
                    latestDetections.map((det, idx) => (
                      <span key={idx} className="select-none border-b-2 border-neutral-900 font-bold">
                        {det.hindi_symbol}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm font-medium text-neutral-400">Nothing added yet</span>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2">
                {[
                  { label: "PDF", icon: FileText, onClick: handleExportPdf },
                  { label: "XML", icon: FileCode2, onClick: handleExportXML },
                  { label: "TXT", icon: Code2, onClick: handleExportText },
                ].map(({ label, icon: Icon, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    disabled={latestDetections.length === 0}
                    title={label === "XML" ? "Export MusicXML" : `Export ${label}`}
                    className="flex flex-col items-center gap-1 rounded-xl border border-neutral-200 bg-white px-2 py-2.5 text-[11px] font-bold text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-neutral-200 disabled:hover:text-neutral-700 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
                <button
                  onClick={handleCopyNotation}
                  disabled={latestDetections.length === 0}
                  className="flex flex-col items-center gap-1 rounded-xl bg-neutral-900 px-2 py-2.5 text-[11px] font-bold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </section>
          </aside>

          {/* RIGHT: manuscript viewer */}
          <main className="flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
            <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CropIcon className="h-4 w-4 text-neutral-900" />
                <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-900">Manuscript viewer</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-600">
                <Crosshair className="h-3.5 w-3.5" />
                {crop ? `Selection at ${Math.round(crop.x)}, ${Math.round(crop.y)}` : "No selection yet"}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={onComplete}
                className="max-w-full no-greyscale-crop self-start"
              >
                <img
                  ref={imgRef}
                  src={source}
                  alt="Your uploaded manuscript"
                  className="max-h-none min-h-0 h-auto w-auto max-w-full manuscript-target align-top rounded-lg"
                  style={{ maxWidth: "100%" }}
                  crossOrigin="anonymous"
                />
              </ReactCrop>
            </div>
            <p className="mt-3 shrink-0 text-xs text-neutral-500">Tip: drag on the image to draw a box. Release to read the swaras inside it.</p>
          </main>
        </div>
      </div>

      <style>{`
        .manuscript-target {
          filter: none !important;
          -webkit-filter: none !important;
          opacity: 1 !important;
        }

        .ReactCrop__overlay, .ReactCrop__crop-mask {
          display: none !important;
        }

        .ReactCrop__crop-selection {
          border: 2px solid #171717 !important;
          box-shadow: none !important;
          border-radius: 6px !important;
          background-color: rgba(23, 23, 23, 0.06) !important;
        }

        .ReactCrop__child-wrapper {
          background-color: transparent !important;
        }

        .ReactCrop__crop-selection:after {
          content: '';
          position: absolute;
          inset: 0;
          border: 1px dashed #fff;
          border-radius: 4px;
          pointer-events: none;
        }

        .ReactCrop__drag-handle {
          width: 12px !important;
          height: 12px !important;
          background-color: #fff !important;
          border: 2px solid #171717 !important;
          border-radius: 50% !important;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
      `}</style>
    </div>
  );
}
