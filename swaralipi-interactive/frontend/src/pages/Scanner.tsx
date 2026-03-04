import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import {
  Upload,
  Loader2,
  ArrowLeft,
  Cpu,
  AlertCircle,
  Camera,
  Binary,
  Zap
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
        // Artificial latency to simulate neural engine synchronization
        setTimeout(() => navigate("/result"), 1400);
      } catch (e) {
        setStatus("idle");
        setFileError("BUFFER_OVERFLOW: Image resolution exceeds local storage capacity.");
      }
    },
    [navigate]
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setFileError("INVALID_FORMAT: Deploy standard JPG or PNG data streams.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => handleDataIngestion(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative min-h-screen bg-[#FDFDFD] flex flex-col items-center p-8 overflow-hidden selection:bg-neutral-900 selection:text-white">

      {/* Background Texture - Lab Grid */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
      />

      {/* Navigation: Terminus */}
      <div className="relative z-10 w-full max-w-2xl flex justify-start mb-16">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 text-neutral-400 hover:text-black transition-all group px-4 py-2 rounded-full hover:bg-neutral-50 border border-transparent hover:border-neutral-100"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span className="text-[9px] font-black uppercase tracking-[0.4em]">Return to Core</span>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Header: Technical Nomenclature */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-500 text-[9px] font-black uppercase tracking-[0.2em] mb-8">
            {/* <Binary className="w-3 h-3" /> */}
            {/* <span>Optic Ingestion Node</span> */}
          </div>
          <h1 className="text-4xl font-black tracking-tight text-neutral-900 mb-4">
            Neural Ingestion
          </h1>
          <p className="text-neutral-500 text-sm font-medium leading-relaxed max-w-sm mx-auto opacity-80">
            Deploy high-fidelity manuscript data for real-time neural sequence mapping.
          </p>
        </div>

        {/* Primary Interface Module */}
        <div className="bg-white rounded-[2.5rem] border border-neutral-200 shadow-[0_8px_40px_rgba(0,0,0,0.03)] overflow-hidden animate-in fade-in zoom-in-95 duration-700">
          {mobile ? (
            <div className="p-6">
              <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-neutral-900 border border-neutral-200/50">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="absolute inset-0 w-full h-full object-cover grayscale-[0.4] opacity-90"
                  videoConstraints={{ facingMode: "environment" }}
                />

                {/* Laser Scan Animation */}
                <div className="absolute inset-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent animate-scan z-10 shadow-[0_0_15px_rgba(255,255,255,0.5)]" />

                {/* Viewfinder Geometry */}
                <div className="absolute inset-12 border border-white/10 rounded-2xl pointer-events-none">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-white/40" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-white/40" />
                </div>

                {status === "processing" && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center z-20 animate-in fade-in duration-300">
                    <div className="relative">
                      <Loader2 className="w-12 h-12 text-neutral-900 animate-spin opacity-10" />
                      <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-neutral-900 animate-pulse" />
                    </div>
                    <span className="mt-6 text-[10px] font-black uppercase tracking-[0.5em] text-neutral-900">Computing Inference</span>
                  </div>
                )}
              </div>

              {/* Trigger Button */}
              <button
                onClick={() => {
                  const src = webcamRef.current?.getScreenshot();
                  if (src) handleDataIngestion(src);
                }}
                disabled={status === "processing"}
                className="mt-8 w-full h-16 rounded-[1.5rem] border border-neutral-900 bg-white text-neutral-900 flex items-center justify-center gap-4 hover:bg-neutral-900 hover:text-white transition-all duration-500 active:scale-[0.97] disabled:opacity-20 group"
              >
                <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center group-hover:bg-neutral-800 transition-colors">
                  <Zap className="w-4 h-4 text-neutral-900 group-hover:text-yellow-400 fill-current transition-colors" />
                </div>
                <span className="font-bold uppercase tracking-[0.3em] text-[10px]">Execute Neural Snapshot</span>
              </button>
            </div>
          ) : (
            <div className="p-4">
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                  disabled={status === "processing"}
                />
                <div className="flex flex-col items-center justify-center py-32 px-10 rounded-[2rem] border-2 border-dashed border-neutral-100 hover:border-neutral-900 bg-neutral-50/20 hover:bg-white transition-all duration-700 group">

                  {status === "processing" ? (
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative">
                        <Loader2 className="w-10 h-10 text-neutral-900 animate-spin" />
                        <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-neutral-900" />
                      </div>
                      <span className="text-neutral-900 font-black text-[10px] uppercase tracking-[0.4em]">Synchronizing Port...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-white border border-neutral-100 rounded-3xl flex items-center justify-center mb-8 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-700">
                        <Upload className="w-6 h-6 text-neutral-300 group-hover:text-black transition-colors" />
                      </div>
                      <h3 className="text-neutral-900 font-black uppercase tracking-[0.3em] text-[10px] mb-3">Initialize Data Port</h3>
                      <p className="text-neutral-400 text-[11px] font-medium tracking-wide">Supply notation manuscripts via local disk</p>
                    </>
                  )}
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Exception Handling */}
        {fileError && (
          <div className="mt-12 p-5 border border-red-100 bg-red-50/30 rounded-3xl flex items-center justify-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            </div>
            <span className="text-[9px] font-black text-red-600 uppercase tracking-[0.2em]">{fileError}</span>
          </div>
        )}
      </div>

      {/* Global CSS for the Scan Line */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}