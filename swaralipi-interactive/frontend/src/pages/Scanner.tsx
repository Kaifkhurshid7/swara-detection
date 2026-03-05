import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import {
  Upload,
  Loader2,
  ArrowLeft,
  Cpu,
  AlertCircle,
  Zap,
  Activity,
  ShieldCheck,
  Target
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

      {/* 1. LEFT PANEL: DATA INGESTION INTERFACE */}
      <main className="flex-1 relative z-10 flex flex-col p-6 lg:p-16 overflow-y-auto border-r border-neutral-200">

        {/* Engineering Grid Overlay */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }}
        />

        {/* Top Terminal Header */}
        <div className="relative z-10 flex items-center justify-between mb-16">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-4 text-neutral-400 hover:text-neutral-900 transition-all group px-5 py-2.5 rounded-xl bg-white/50 backdrop-blur-sm border border-neutral-200 hover:shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Terminus</span>
          </button>

          <div className="flex items-center gap-5">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-neutral-900 uppercase tracking-widest">swara detection</p>
              <p className="text-[8px] font-bold text-neutral-900 uppercase tracking-widest mt-1">Live Connection Signal</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5 text-neutral-900 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Central Capture Module */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
          <header className="text-center mb-10">
            <h1 className="text-4xl font-black text-neutral-900 tracking-tight mb-3">Neural Ingestion</h1>
            <p className="text-neutral-400 text-xs font-medium tracking-wide">Supply musical notation manuscripts for spatial mapping.</p>
          </header>

          <div className="w-full bg-white rounded-[3rem] border border-neutral-200 shadow-[0_30px_60px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-700 ring-8 ring-neutral-100/50">
            {mobile ? (
              <div className="p-8">
                <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden bg-neutral-950">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/png"
                    className="absolute inset-0 w-full h-full object-cover grayscale-[0.3] opacity-80"
                    videoConstraints={{ facingMode: "environment" }}
                  />

                  {/* Viewfinder Overlay */}
                  <div className="absolute inset-8 border border-white/20 rounded-2xl pointer-events-none">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/60" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/60" />
                  </div>

                  <div className="absolute inset-0 w-full h-[2px] bg-white/40 animate-scan z-10 shadow-[0_0_15px_rgba(255,255,255,0.5)]" />

                  {status === "processing" && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center z-20">
                      <div className="relative mb-6">
                        <Loader2 className="w-12 h-12 text-neutral-900 animate-spin opacity-20" />
                        <Cpu className="absolute inset-0 m-auto w-5 h-5 text-neutral-900" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-900">Synchronizing...</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    const src = webcamRef.current?.getScreenshot();
                    if (src) handleDataIngestion(src);
                  }}
                  disabled={status === "processing"}
                  className="mt-10 w-full h-16 rounded-2xl bg-neutral-900 text-white flex items-center justify-center gap-4 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-20 shadow-xl shadow-neutral-200"
                >
                  <Zap className="w-4 h-4 text-amber-400 fill-current" />
                  <span className="font-black uppercase tracking-[0.3em] text-[10px]">Execute Neural Capture</span>
                </button>
              </div>
            ) : (
              <div className="p-6">
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={status === "processing"} />
                  <div className="flex flex-col items-center justify-center py-32 px-10 rounded-[2.5rem] border-2 border-dashed border-neutral-100 hover:border-neutral-900 bg-neutral-50/30 hover:bg-white transition-all duration-700 group">
                    {status === "processing" ? (
                      <div className="flex flex-col items-center gap-6">
                        <Loader2 className="w-10 h-10 text-neutral-900 animate-spin" />
                        <span className="text-neutral-900 font-black text-[10px] uppercase tracking-[0.5em]">Optimizing Port...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-24 h-24 bg-white border border-neutral-100 rounded-[2rem] flex items-center justify-center mb-10 shadow-sm group-hover:scale-110 group-hover:shadow-xl transition-all duration-500">
                          <Upload className="w-8 h-8 text-neutral-400 group-hover:text-black transition-colors" />
                        </div>
                        <h3 className="text-neutral-900 font-black uppercase tracking-[0.3em] text-[11px] mb-3">Initialize Data Port</h3>
                        <p className="text-neutral-400 text-[10px] font-medium tracking-widest uppercase">Select Local Disk Stream</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Exception Handler */}
          {fileError && (
            <div className="mt-10 p-5 w-full bg-white border border-red-100 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{fileError}</span>
            </div>
          )}
        </div>
      </main>

      {/* 2. RIGHT PANEL: TELEMETRY & SCALE */}
      <aside className="w-full lg:w-[450px] bg-white p-12 lg:p-20 flex flex-col border-l border-neutral-200 relative">

        {/* Decorative Vertical Ruler */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[6px] opacity-10 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(180deg, #000 0, #000 1px, transparent 1px, transparent 20px)`,
            backgroundSize: '4px 100%'
          }}
        />

        <div className="mb-16">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center border border-neutral-200">
              <Target className="w-5 h-5 text-neutral-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">Telemetry 01-A</span>
          </div>

          <h2 className="text-3xl font-black text-neutral-900 mb-12 leading-tight">Capture <br /> Protocol</h2>

          <div className="space-y-12">
            {[
              { id: '01', title: 'Grid Alignment', desc: 'Position the musical manuscript within the viewfinder. Ensure the swara is centered for optimal feature extraction.' },
              { id: '02', title: 'ROI Definition', desc: 'Define the Region of Interest (ROI) on the workbench. This isolates the pixel data for neural processing.' },
              { id: '03', title: 'Inference Handshake', desc: 'The system initiates a prioritized data stream to the YOLOv8 engine for real-time identification.' }
            ].map((step) => (
              <div key={step.id} className="relative pl-10 border-l border-neutral-100 group">
                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-neutral-200 group-hover:bg-neutral-900 transition-colors" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-900 mb-2">{step.id} / {step.title}</h4>
                <p className="text-neutral-500 text-[12px] leading-relaxed font-medium">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Security / System Footer */}
        <div className="mt-auto pt-10 border-t border-neutral-100">
          <div className="flex items-center gap-4 mb-4">
            <ShieldCheck className="w-5 h-5 text-neutral-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900">Encrypted Sandbox</span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed font-medium">
            Inference is executed within a local secure enclave. Zero data transmission to cloud nodes during capture phase.
          </p>
        </div>
      </aside>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}