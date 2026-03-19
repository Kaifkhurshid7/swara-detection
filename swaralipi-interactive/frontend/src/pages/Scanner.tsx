import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import {
  Upload,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Zap,
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

  // Decorative swaras for the background
  const hindiSwaras = ["सा", "रे", "ग", "म", "प"];

  const handleDataIngestion = useCallback(
    (dataUrl: string) => {
      setStatus("processing");
      try {
        localStorage.setItem(SCAN_IMAGE_KEY, dataUrl);
        setTimeout(() => navigate("/result"), 1400);
      } catch (e) {
        setStatus("idle");
        setFileError("BUFFER_OVERFLOW: Resolution exceeds node capacity.");
      }
    },
    [navigate]
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setFileError("INVALID_STREAM: Deploy standard JPG/PNG.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => handleDataIngestion(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative min-h-screen bg-[#FDFDFD] flex flex-col lg:flex-row overflow-hidden selection:bg-neutral-900 selection:text-white font-sans">

      {/* --- DECORATIVE HINDI SWARA SPREAD --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {hindiSwaras.map((s, i) => (
          <span
            key={i}
            className="absolute font-black select-none text-black/[0.06]"
            style={{
              left: `${(i * 25) % 100}%`,
              top: `${(i * 40) % 100}%`,
              transform: `rotate(${(i * 45) % 360}deg)`,
              fontSize: '8rem',
              fontFamily: 'serif'
            }}
          >
            {s}
          </span>
        ))}
      </div>

      {/* 1. LEFT PANEL: INGESTION INTERFACE */}
      <main className="flex-1 relative z-10 flex flex-col p-8 lg:p-12 overflow-y-auto border-r-4 border-black">

        {/* Engineering Grid Overlay */}
        <div
          className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 0H0V60H60V0zM1 59V1H59V59H1z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }}
        />

        {/* Top Terminal Header - Reduced margin for "upward" lift */}
        <div className="relative z-10 flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-4 px-6 py-3 border-2 border-black bg-white hover:bg-black hover:text-white transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Exit_Terminal</span>
          </button>

          <div className="flex items-center gap-6">
            {/* <div className="text-right hidden sm:block font-mono">
              <p className="text-[10px] font-black text-neutral-900 uppercase tracking-widest">Neural_Sync</p>
              <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-[0.2em] mt-1">Live Connection</p>
            </div> */}
            {/* <div className="w-12 h-12 bg-black flex items-center justify-center shadow-lg rounded-lg">
              <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div> */}
          </div>
        </div>

        {/* Central Capture Module - justify-start pulls it up */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-start max-w-2xl mx-auto w-full mt-4">
          <header className="text-center mb-8">
            <h1 className="text-5xl font-black text-neutral-900 tracking-[-0.04em] mb-4 uppercase">Data Ingestion</h1>
            <p className="text-neutral-500 text-sm font-medium tracking-tight border-b-2 border-neutral-100 pb-4">
              Supply musical manuscripts for spatial coordinate mapping.
            </p>
          </header>

          <div className="w-full bg-white border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-700">
            {mobile ? (
              <div className="p-6">
                <div className="relative aspect-[3/4] border-2 border-black overflow-hidden bg-neutral-900">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/png"
                    className="absolute inset-0 w-full h-full object-cover grayscale opacity-70"
                    videoConstraints={{ facingMode: "environment" }}
                  />

                  <div className="absolute inset-10 border-2 border-white/30 pointer-events-none">
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white" />
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white" />
                  </div>

                  <div className="absolute inset-0 w-full h-[3px] bg-emerald-400 animate-scan z-10 shadow-[0_0_20px_rgba(52,211,153,0.8)]" />

                  {status === "processing" && (
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-20">
                      <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Ingesting Data...</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    const src = webcamRef.current?.getScreenshot();
                    if (src) handleDataIngestion(src);
                  }}
                  disabled={status === "processing"}
                  className="mt-6 w-full h-16 bg-black text-white flex items-center justify-center gap-4 hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-50 shadow-[8px_8px_0px_0px_rgba(16,185,129,0.3)]"
                >
                  <Zap className="w-5 h-5 text-emerald-400 fill-current" />
                  <span className="font-black uppercase tracking-[0.4em] text-xs">Execute Capture</span>
                </button>
              </div>
            ) : (
              <div className="p-8">
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={status === "processing"} />
                  {/* Reduced py-16 to pull the UI up further */}
                  <div className="flex flex-col items-center justify-center py-16 px-10 border-4 border-dashed border-neutral-200 hover:border-black hover:bg-neutral-50 transition-all duration-500 group">
                    {status === "processing" ? (
                      <div className="flex flex-col items-center gap-6">
                        <Loader2 className="w-12 h-12 text-black animate-spin" />
                        <span className="text-black font-black text-xs uppercase tracking-[0.5em]">Synchronizing Stream...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-black text-white flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 transition-transform">
                          <Upload className="w-8 h-8" />
                        </div>
                        <h3 className="text-black font-black uppercase tracking-[0.3em] text-sm mb-2">Initialize Disk Port</h3>
                        <p className="text-neutral-400 text-[10px] font-black tracking-widest uppercase">[ Click to select file stream ]</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            )}
          </div>

          {fileError && (
            <div className="mt-8 p-6 w-full bg-red-50 border-2 border-red-600 flex items-center gap-5 animate-in fade-in slide-in-from-top-4 shadow-[8px_8px_0px_0px_rgba(220,38,38,0.1)]">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <span className="text-[11px] font-black text-red-600 uppercase tracking-[0.2em]">{fileError}</span>
            </div>
          )}
        </div>
      </main>

      {/* 2. RIGHT PANEL: TELEMETRY */}
      <aside className="w-full lg:w-[480px] bg-white p-12 lg:p-16 flex flex-col relative">
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-black flex items-center justify-center text-white">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-neutral-400 font-mono">Protocol_01-A</h2>
          </div>

          <h2 className="text-4xl font-black text-neutral-900 mb-12 leading-tight tracking-tighter uppercase">Inference <br /> Sequence</h2>

          <div className="space-y-12">
            {[
              { id: '01', title: 'Grid Alignment', desc: 'Position the manuscript within the white viewfinder boundary. Center the swara for feature extraction.' },
              { id: '02', title: 'ROI Definition', desc: 'The engine isolates pixel data within the Region of Interest for prioritized neural processing.' },
              { id: '03', title: 'Inference Handshake', desc: 'Prioritized stream to YOLOv8 for classification of Hindustani pitch-class ontology.' }
            ].map((step) => (
              <div key={step.id} className="relative pl-12 border-l-4 border-black group">
                <div className="absolute -left-[10px] top-0 w-4 h-4 bg-white border-4 border-black rounded-full" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-900 mb-2">{step.id} // {step.title}</h4>
                <p className="text-neutral-500 text-xs leading-relaxed font-semibold">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-8 border-t-2 border-neutral-100">
          {/* <div className="flex items-center gap-4 mb-4">
            <ShieldCheck className="w-6 h-6 text-black" />
            <span className="text-[11px] font-black uppercase tracking-widest text-neutral-900">Secure Enclave Active</span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed font-bold uppercase tracking-tighter">
            Local execution only. Zero cloud data transmission during capture phase.
          </p>
          <div className="mt-6 flex items-center justify-between font-mono text-[9px] text-neutral-300 uppercase tracking-widest">
            <span>Root_Auth: Verified</span>
            <span className="text-black font-black">Core_v4.0.2</span>
          </div> */}
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
          animation: scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}