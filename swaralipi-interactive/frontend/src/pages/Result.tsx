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
  Database,
  Maximize2,
  CheckCircle2,
  Layers,
  Crosshair,
  Copy,
  Check,
  ClipboardList,
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans">
        <Loader2 className="w-12 h-12 text-black animate-spin mb-4" />
        <span className="text-black font-black uppercase tracking-[0.5em] text-[10px]">Synchronizing_Nodes...</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#FDFDFD] flex flex-col lg:flex-row items-start overflow-hidden font-sans text-neutral-900 selection:bg-black selection:text-white">

      {/* LEFT PANEL: SYSTEM CONSOLE */}
      <aside className="w-full lg:w-[380px] xl:w-[400px] bg-white border-r-4 border-black flex flex-col self-stretch relative z-20">

        {/* <div className="p-8 border-b-4 border-black flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]">
              <Terminal className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-900 leading-none mb-1">Inference_Node</h2>
              <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Cpu className="w-3 h-3" /> YOLOv8_Engine_Active
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/scan")}
            className="p-3 border-2 border-black bg-white hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div> */}

        <div className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-6 scrollbar-hide">

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4 text-black" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-900">Sequence_Protocol</h3>
            </div>

            <div className="relative space-y-3">
              <div className={`flex items-start gap-4 p-4 border-2 transition-all duration-300 ${!crop ? 'border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-neutral-200 opacity-50 shadow-none'}`}>
                <div className={`w-8 h-8 flex items-center justify-center text-[11px] font-black ${!crop ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-500'}`}>01</div>
                <div className="flex-1">
                  <h4 className="text-[11px] font-black uppercase tracking-widest mb-1 text-neutral-900">Spatial Selection</h4>
                  <p className="text-[10px] leading-relaxed font-bold text-neutral-500">
                    Select and isolate the Region of Interest (ROI) on your manuscript.<br />
                    This helps the neural engine focus on the relevant musical notation for accurate analysis.
                  </p>
                </div>
                {crop && <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1" />}
              </div>

              <div className={`flex items-start gap-4 p-4 border-2 transition-all duration-300 ${crop && !result ? 'border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-neutral-200 opacity-50 shadow-none'}`}>
                <div className={`w-8 h-8 flex items-center justify-center text-[11px] font-black ${crop && !result ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-500'}`}>02</div>
                <div className="flex-1">
                  <h4 className="text-[11px] font-black uppercase tracking-widest mb-1 text-neutral-900">Swaras Synthesis</h4>
                  <p className="text-[10px] leading-relaxed font-bold text-neutral-500">
                    The system will now analyze the selected region and classify each swara (note) in sequence.<br />
                    Results will be displayed below as the neural engine completes its recognition.
                  </p>
                </div>
                {loading ? <Loader2 className="w-5 h-5 text-emerald-500 mt-1 animate-spin" /> : result ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1" /> : null}
              </div>
            </div>
          </section>

          <section className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-4 h-4 text-black" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-900">Detections</h3>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 border-4 border-dashed border-neutral-100 bg-neutral-50/50">
                  <Loader2 className="w-12 h-12 text-black animate-spin" />
                  <span className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.5em]">De-Convolution In Progress...</span>
                </div>
              ) : result ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {result.detections && result.detections.length > 0 ? (
                    <div className="max-h-[38vh] overflow-y-auto rounded-2xl border-2 border-black bg-white">
                      <div className="divide-y divide-neutral-200">
                      {result.detections.map((det, idx) => {
                        const pct = Math.round(det.confidence * 100);
                        return (
                        <div key={idx} className="grid grid-cols-[56px_minmax(0,1fr)_56px] items-center gap-3 px-4 py-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-3xl font-black text-neutral-900" style={{ fontFamily: "serif" }}>
                            {det.hindi_symbol}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-neutral-400">Classification</p>
                                <p className="truncate text-[15px] font-bold text-neutral-900">{det.class_name || "Unknown"}</p>
                              </div>
                              <span className="shrink-0 rounded-full border border-neutral-300 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-neutral-600">
                                {pct}%
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                              <div
                                className="h-full rounded-full bg-black transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          <div className="text-right text-[10px] font-black uppercase tracking-[0.25em] text-neutral-300">
                            {String(idx + 1).padStart(2, "0")}
                          </div>
                        </div>
                        );
                      })}
                      </div>
                    </div>
                  ) : (
                    <div className="border-4 border-dashed border-neutral-200 p-8 text-center">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-loose">
                        Null <br />
                        <span className="text-red-500">[ Recalibrate ROI ]</span>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-4 border-dashed border-neutral-100 py-12 px-6 text-center">
                  <p className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.4em] leading-loose italic">
                    Waiting for Input... <br />
                    <span className="normal-case text-neutral-400 font-bold">Initialize workbench coordinates</span>
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-4 h-4 text-black" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-900">Transcription</h3>
              </div>
              <div className="flex items-center gap-4">
                {result?.detections && result.detections.length > 0 && (
                  <button onClick={handleStoreLatest} className="flex items-center gap-1.5 group bg-black text-white px-3 py-1.5 hover:bg-neutral-800 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-[1px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Store Latest</span>
                  </button>
                )}
                {latestDetections.length > 0 && (
                  <button onClick={handleClear} className="flex items-center gap-1.5 group hover:bg-neutral-100 px-3 py-1.5 transition-colors border-2 border-transparent hover:border-black">
                    <span className="text-[10px] font-black text-black uppercase tracking-widest">Clear</span>
                  </button>
                )}
              </div>
            </div>

            <div className={`p-5 border-4 border-black bg-white transition-all ${latestDetections.length ? 'opacity-100' : 'opacity-20'}`}>
              <div className="font-devanagari text-3xl leading-relaxed tracking-[0.2em] text-neutral-900 min-h-[48px] flex flex-wrap gap-x-5 gap-y-2">
                {latestDetections.length > 0 ? (
                  latestDetections.map((det, idx) => (
                    <span key={idx} className={
                      "transition-colors cursor-default select-none text-black font-black pb-1 border-b-4 border-black animate-pulse"
                    }>
                      {det.hindi_symbol}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-black uppercase tracking-[0.5em] text-neutral-300 italic">No_Data</span>
                )}
              </div>
            </div>

            {latestDetections.length > 0 && (
              <div className="flex items-center justify-end gap-6 pt-2">
                <button onClick={handleExportPdf} className="flex items-center gap-1.5 group">
                  <FileText className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
                  <span className="text-[10px] font-black text-neutral-400 group-hover:text-black uppercase tracking-widest transition-colors">Export PDF</span>
                </button>
                <button onClick={handleExportXML} className="flex items-center gap-1.5 group">
                  <FileCode2 className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
                  <span className="text-[10px] font-black text-neutral-400 group-hover:text-black uppercase tracking-widest transition-colors">Export XML</span>
                </button>
                <button onClick={handleExportText} className="flex items-center gap-1.5 group">
                  <Code2 className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
                  <span className="text-[10px] font-black text-neutral-400 group-hover:text-black uppercase tracking-widest transition-colors">Export TXT</span>
                </button>
                <div className="w-[2px] h-4 bg-neutral-200 mx-1" />
                <button onClick={handleCopyNotation} className="flex items-center gap-2 group">
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${copied ? 'text-black' : 'text-neutral-400 group-hover:text-black'}`}>
                    {copied ? 'Copied' : 'Copy'}
                  </span>
                  {copied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />}
                </button>
              </div>
            )}
          </section>
        </div>
        {/* 
        <div className="p-8 border-t-4 border-black bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Node_Sync: OK</span>
          </div>
          <p className="text-[9px] font-bold text-neutral-400 uppercase">Kernel_v4.0.2</p>
        </div> */}
      </aside>

      {/* RIGHT PANEL: VISUAL WORKBENCH */}
      <main className="flex-1 self-stretch p-5 lg:p-8 flex flex-col relative bg-[#F8F9FA]">
        <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />

        <div className="relative z-10 flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-black" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-black">Precision_Workspace</h3>
          </div>
          <div className="flex items-center gap-8 bg-white border-2 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 border-r-2 border-neutral-100 pr-6">
              <Crosshair className="w-4 h-4 text-black" />
              <span className="text-[10px] font-black font-mono uppercase">
                {crop ? `${Math.round(crop.x)} : ${Math.round(crop.y)}` : '00 : 00'}
              </span>
            </div>
            <Maximize2 className="w-4 h-4 text-black hover:scale-110 cursor-pointer transition-transform" />
          </div>
        </div>

        <div className="relative z-10 flex-1 bg-white border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,0.05)] p-4 lg:p-6 flex items-start justify-start overflow-auto">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={onComplete}
            className="max-w-full no-greyscale-crop self-start"
          >
            <img
              ref={imgRef}
              src={source}
              alt="Manuscript"
              className="max-h-none min-h-0 h-auto w-auto max-w-full transition-all duration-500 manuscript-target align-top"
              style={{ maxWidth: "100%" }}
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>
        {/* 
        <div className="relative z-10 mt-10 flex justify-center">
          <div className="px-8 py-4 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-black'}`} />
              <span className="text-[11px] font-black uppercase tracking-widest">ROI_{crop ? 'LOCKED' : 'AWAITING'}</span>
            </div>
            <div className="w-[2px] h-6 bg-black" />
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest italic">
              Define manuscript boundaries to trigger neural handshake
            </p>
          </div>
        </div> */}
      </main>

      <style>{`
        /* THE "HARD RESET" CSS */
        
        /* 1. Stop any grayscale filtering on the image itself */
        .manuscript-target {
          filter: none !important;
          -webkit-filter: none !important;
          opacity: 1 !important;
        }

        /* 2. Kill the dark overlay that causes the "greyscale" look */
        .ReactCrop__overlay, .ReactCrop__crop-mask {
          display: none !important;
          background-color: transparent !important;
          opacity: 0 !important;
        }

        /* 3. Ensure the selection box doesn't dim the background */
        .ReactCrop__crop-selection {
          border: 3px solid #000 !important;
          box-shadow: none !important; 
          border-radius: 0px !important;
          background-color: transparent !important;
        }

        /* 4. Ensure the child container doesn't have a background color */
        .ReactCrop__child-wrapper {
          background-color: transparent !important;
        }

        .ReactCrop__crop-selection:after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border: 1px dashed #fff;
          pointer-events: none;
        }

        .ReactCrop__drag-handle {
          width: 10px !important;
          height: 10px !important;
          background-color: #000 !important;
          border: 1px solid #fff !important;
          border-radius: 0% !important;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
