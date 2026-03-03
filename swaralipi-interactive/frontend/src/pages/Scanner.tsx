import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import {
  Upload,
  Loader2,
  ArrowLeft,
  Cpu,
  AlertCircle
} from "lucide-react";
import { isMobile } from "../utils/device";

const SCAN_IMAGE_KEY = "swaralipi_scan_image";

export default function Scanner() {
  const navigate = useNavigate();
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "processing">("idle");
  const webcamRef = useRef<Webcam>(null);
  const mobile = isMobile();

  // Internal logic for neural ingestion simulation
  const handleDataIngestion = useCallback(
    (dataUrl: string) => {
      setStatus("processing");
      try {
        localStorage.setItem(SCAN_IMAGE_KEY, dataUrl);
        // Artificial delay to simulate neural network warm-up
        setTimeout(() => navigate("/result"), 1200);
      } catch (e) {
        setStatus("idle");
        setFileError("BUFFER_OVERFLOW: Image resolution is too high for local storage.");
      }
    },
    [navigate]
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setFileError("FORMAT_REJECTED: Please provide a standard JPG or PNG.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => handleDataIngestion(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex flex-col items-center p-8 selection:bg-neutral-900 selection:text-white">

      {/* Minimalist Navigation */}
      <div className="w-full max-w-2xl flex justify-start mb-16">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-neutral-400 hover:text-black transition-all group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Terminus</span>
        </button>
      </div>

      <div className="w-full max-w-xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-3">
            Scan Swara Notation
          </h1>
          <p className="text-neutral-500 text-sm font-medium">
            Supply high-contrast manuscript data for optimal neural classification.
          </p>
        </div>

        {/* Interface Module */}
        <div className="bg-white rounded-[2.5rem] border border-neutral-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
          {mobile ? (
            <div className="p-5">
              <div className="relative aspect-[4/5] rounded-[1.8rem] overflow-hidden bg-neutral-100 border border-neutral-200/50">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="absolute inset-0 w-full h-full object-cover grayscale-[0.2]"
                  videoConstraints={{ facingMode: "environment" }}
                />

                {/* Minimal Optic Viewfinder */}
                <div className="absolute inset-8 border border-white/30 rounded-lg pointer-events-none">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white" />
                </div>

                {status === "processing" && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="relative">
                      <Loader2 className="w-10 h-10 text-neutral-900 animate-spin opacity-20" />
                      <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-neutral-900 animate-pulse" />
                    </div>
                    <span className="mt-4 text-[9px] font-black uppercase tracking-[0.3em] text-neutral-900">Processing</span>
                  </div>
                )}
              </div>

              {/* Refined Capture Button */}
              <button
                onClick={() => {
                  const src = webcamRef.current?.getScreenshot();
                  if (src) handleDataIngestion(src);
                }}
                disabled={status === "processing"}
                className="mt-6 w-full h-14 rounded-2xl border border-neutral-900 bg-white text-neutral-900 flex items-center justify-center gap-3 hover:bg-neutral-900 hover:text-white transition-all active:scale-[0.98] disabled:opacity-30 group"
              >
                {/* <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-800 transition-colors">
                  <Zap className="w-3.5 h-3.5 text-neutral-900 group-hover:text-yellow-400 fill-current transition-colors" />
                </div> */}
                <span className="font-bold uppercase tracking-[0.2em] text-[10px]">Swara Capture</span>
              </button>
            </div>
          ) : (
            <div className="p-3">
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                  disabled={status === "processing"}
                />
                <div className="flex flex-col items-center justify-center py-24 px-10 rounded-[1.8rem] border-2 border-dashed border-neutral-100 hover:border-neutral-900 bg-neutral-50/30 hover:bg-white transition-all duration-700">

                  {status === "processing" ? (
                    <div className="flex flex-col items-center gap-5">
                      <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
                      <span className="text-neutral-900 font-black text-[10px] uppercase tracking-[0.2em]">Optimizing Port...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-white border border-neutral-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm group-hover:shadow-lg transition-all">
                        <Upload className="w-5 h-5 text-neutral-400" />
                      </div>
                      <h3 className="text-neutral-900 font-black uppercase tracking-[0.2em] text-[10px] mb-2">Initialize Data Port</h3>
                      <p className="text-neutral-400 text-xs font-medium">Drag manuscript or click to browse</p>
                    </>
                  )}
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Exception Display */}
        {fileError && (
          <div className="mt-10 p-4 border border-red-100 bg-red-50/50 rounded-2xl flex items-center justify-center gap-3 animate-in slide-in-from-bottom-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{fileError}</span>
          </div>
        )}
      </div>
    </div>
  );
}