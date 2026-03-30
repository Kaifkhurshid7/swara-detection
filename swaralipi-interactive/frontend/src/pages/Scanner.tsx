import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import {
  Upload,
  Loader2,
  ArrowLeft,
  AlertCircle,
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
            className="group flex items-center gap-4 px-6 py-3 bg-white hover:bg-black hover:text-white transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1"
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

          <div className="w-full bg-transparent border-0 shadow-none overflow-hidden transition-all duration-700">
            {mobile ? (
              <div className="p-6">
                <div className="relative aspect-[3/4] border-0 overflow-hidden bg-transparent">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/png"
                    className="absolute inset-0 w-full h-full object-cover"
                    videoConstraints={{ facingMode: "environment" }}
                  />

                  {/* No overlay borders for natural camera look */}

                  {/* No scanning line for natural camera look */}

                  {status === "processing" && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-transparent">
                      <Loader2 className="w-14 h-14 text-black animate-spin" />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    const src = webcamRef.current?.getScreenshot();
                    if (src) handleDataIngestion(src);
                  }}
                  disabled={status === "processing"}
                  className="mt-6 w-full h-14 bg-white text-black border border-neutral-300 rounded-lg flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-base shadow hover:bg-neutral-100 active:scale-[0.98] disabled:opacity-50 transition-all"
                >
                  Capture
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
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-neutral-400 font-mono">How to Use the Scanner</h2>
          </div>

          <h2 className="text-4xl font-black text-neutral-900 mb-12 leading-tight tracking-tighter uppercase">How the Scanner Works</h2>

          <div className="space-y-12">
            {/* Step 1: Grid Alignment */}
            <div className="relative pl-12 border-l-4 border-black group">
              <div className="absolute -left-[10px] top-0 w-4 h-4 bg-white border-4 border-black rounded-full" />
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-900 mb-2">01 // Grid Alignment</h4>
              <p className="text-neutral-500 text-xs leading-relaxed font-semibold">
                Place the manuscript within the white viewfinder boundary on the left.<br />
                Center the swara you want to scan for best feature extraction.<br />
                You can use your camera or upload an image file.
              </p>
            </div>

            {/* Step 2: ROI Definition */}
            <div className="relative pl-12 border-l-4 border-black group">
              <div className="absolute -left-[10px] top-0 w-4 h-4 bg-white border-4 border-black rounded-full" />
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-900 mb-2">02 // ROI Definition</h4>
              <p className="text-neutral-500 text-xs leading-relaxed font-semibold">
                The engine will automatically isolate pixel data within the Region of Interest (ROI) for focused neural processing.<br />
                Make sure the swara is clearly visible and not obstructed.
              </p>
            </div>

            {/* Step 3: Inference Handshake */}
            <div className="relative pl-12 border-l-4 border-black group">
              <div className="absolute -left-[10px] top-0 w-4 h-4 bg-white border-4 border-black rounded-full" />
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-900 mb-2">03 // Inference Handshake</h4>
              <p className="text-neutral-500 text-xs leading-relaxed font-semibold">
                The prioritized image stream is sent to the YOLOv8 neural engine for classification.<br />
                The system will recognize and display the Hindustani pitch-class (swara) detected in the manuscript.
              </p>
            </div>
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
