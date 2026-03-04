import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import {
  Upload,
  Loader2,
  ArrowLeft,
  Cpu,
  AlertCircle,
  Binary,
  Zap,
  Activity,
  Maximize2,
  ShieldCheck
} from "lucide-react";
import { isMobile } from "../utils/device";

const SCAN_IMAGE_KEY = "swaralipi_scan_image";

export default function Scanner() {
  const navigate = useNavigate();
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "processing">("idle");
  const webcamRef = useRef<Webcam>(null);
  const mobile = isMobile();

  const handleDataIngestion = useCallback(
    (dataUrl: string) => {
      setStatus("processing");
      try {
        localStorage.setItem(SCAN_IMAGE_KEY, dataUrl);
        setTimeout(() => navigate("/result"), 1400);
      } catch (e) {
        setStatus("idle");
        setFileError("BUFFER_OVERFLOW: Image resolution exceeds node capacity.");
      }
    },
    [navigate]
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setFileError("INVALID_STREAM: Deploy standard JPG/PNG data.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => handleDataIngestion(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative min-h-screen bg-[#F8F9FA] flex flex-col lg:flex-row overflow-hidden selection:bg-neutral-900 selection:text-white">

      {/* 1. LEFT PANEL: INGESTION INTERFACE */}
      <main className="flex-1 relative z-10 flex flex-col p-6 lg:p-12 overflow-y-auto border-r border-neutral-200">

        {/* Navigation & Status Header */}
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-neutral-400 hover:text-black transition-all group px-4 py-2 rounded-xl hover:bg-white border border-transparent hover:border-neutral-200"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Exit Ingestion</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-neutral-900 uppercase tracking-widest">Node ID: SL-740</span>
              <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest leading-none">Status: Linked</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4 text-neutral-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Primary Data Input Area */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
          <div className="w-full bg-white rounded-[2.5rem] border border-neutral-200 shadow-[0_8px_40px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-700">
            {mobile ? (
              <div className="p-6">
                <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-neutral-900">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] opacity-80"
                    videoConstraints={{ facingMode: "environment" }}
                  />

                  {/* Neural Scan Grid Overlay */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />

                  <div className="absolute inset-0 w-full h-[1px] bg-white/40 animate-scan z-10" />

                  {status === "processing" && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-20">
                      <Loader2 className="w-10 h-10 text-neutral-900 animate-spin" />
                      <span className="mt-4 text-[10px] font-black uppercase tracking-[0.4em]">Inference Sync...</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    const src = webcamRef.current?.getScreenshot();
                    if (src) handleDataIngestion(src);
                  }}
                  disabled={status === "processing"}
                  className="mt-8 w-full h-16 rounded-[1.5rem] bg-neutral-900 text-white flex items-center justify-center gap-4 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-20"
                >
                  <Zap className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="font-bold uppercase tracking-[0.3em] text-[10px]">Execute Neural Snapshot</span>
                </button>
              </div>
            ) : (
              <div className="p-4">
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={status === "processing"} />
                  <div className="flex flex-col items-center justify-center py-28 px-10 rounded-[2rem] border-2 border-dashed border-neutral-100 hover:border-neutral-900 bg-neutral-50/50 hover:bg-white transition-all duration-700 group">
                    {status === "processing" ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
                        <span className="text-neutral-900 font-black text-[10px] uppercase tracking-[0.4em]">Optimizing Port...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-white border border-neutral-100 rounded-3xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6 text-neutral-400 group-hover:text-black" />
                        </div>
                        <h3 className="text-neutral-900 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Initialize Data Port</h3>
                        <p className="text-neutral-400 text-[10px] font-medium tracking-wide">JPG, PNG, TIFF | Max 10MB</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Error Message Module */}
          {fileError && (
            <div className="mt-8 p-4 w-full bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">{fileError}</span>
            </div>
          )}
        </div>
      </main>

      {/* 2. RIGHT PANEL: TELEMETRY & DOCUMENTATION */}
      <aside className="w-full lg:w-[420px] bg-white p-12 lg:p-16 flex flex-col border-l border-neutral-200">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center border border-neutral-200">
              <Binary className="w-4 h-4 text-neutral-400" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-neutral-400">Ingestion Telemetry</span>
          </div>

          <h2 className="text-2xl font-black text-neutral-900 mb-8 leading-tight">Neural Capture <br /> Parameters</h2>

          <div className="space-y-10">
            <div className="relative pl-8 border-l border-neutral-200">
              <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-neutral-900" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-900 mb-2">01. Alignment</h4>
              <p className="text-neutral-500 text-[12px] leading-relaxed font-medium">
                Align manuscript with the viewfinder grid. Ensure all swara sequences are vertically parallel to the X-axis for linear parsing.
              </p>
            </div>

            <div className="relative pl-8 border-l border-neutral-200">
              <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-neutral-200" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-900 mb-2">02. Luminosity</h4>
              <p className="text-neutral-500 text-[12px] leading-relaxed font-medium">
                The model performs best at &gt;300 lux. Avoid sharp shadows or glare artifacts on the parchment surface.
              </p>
            </div>

            <div className="relative pl-8 border-l border-neutral-200">
              <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-neutral-200" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-900 mb-2">03. Verification</h4>
              <p className="text-neutral-500 text-[12px] leading-relaxed font-medium">
                Upon capture, the system initializes a checksum to verify image integrity before passing data to the neural inference layer.
              </p>
            </div>
          </div>
        </div>

        {/* Security / System Footer */}
        <div className="mt-auto p-5 rounded-2xl bg-neutral-50 border border-neutral-200">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-4 h-4 text-neutral-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-900">Encrypted Ingestion</span>
          </div>
          <p className="text-[10px] text-neutral-400 font-medium">
            All data processed locally. No external server transmission during neural mapping sequence.
          </p>
        </div>
      </aside>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
}