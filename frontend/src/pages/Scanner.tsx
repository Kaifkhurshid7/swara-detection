import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import {
  Upload,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Camera,
  Crop,
  Cpu,
  Lightbulb,
} from "lucide-react";
import { isMobile } from "../utils/device";

const SCAN_IMAGE_KEY = "swaralipi_scan_image";

const guide = [
  {
    icon: Camera,
    title: "Add your image",
    text: "Upload an image file, or take a photo with your camera. Use good lighting and keep the page flat so the handwriting is easy to read.",
  },
  {
    icon: Crop,
    title: "Select the notation",
    text: "On the next screen, drag a box around the swaras you want to read. Keep the box tight and make sure nothing covers the notation.",
  },
  {
    icon: Cpu,
    title: "Get your result",
    text: "Your selection is analysed and every swara is listed in Devanagari with a confidence score. Then copy it or export it as PDF, MusicXML or text.",
  },
];

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
        setFileError("This image is too large to open. Try a smaller photo or a lower resolution.");
      }
    },
    [navigate]
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setFileError("That file is not an image. Please choose a JPG or PNG.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => handleDataIngestion(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-neutral-50 overflow-hidden selection:bg-neutral-900 selection:text-white font-sans">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-neutral-200/60 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(#d4d4d4 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "linear-gradient(to bottom, black, transparent 70%)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent 70%)",
          }}
        />
        <span className="absolute right-[6%] top-[8%] select-none font-serif text-[12rem] leading-none text-neutral-900/[0.04]">सा</span>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10 py-10 lg:py-14">
        <button
          onClick={() => navigate("/")}
          className="group inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to home
        </button>

        <header className="mt-8 max-w-2xl animate-premium">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-900">Step 1 of 2</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight">Scan a manuscript</h1>
          <p className="mt-4 text-lg text-neutral-600 leading-relaxed">
            Upload a photo of your swaralipi or capture it with your camera. You will choose the exact area to read on the next screen.
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-5 items-start">
          {/* Upload / capture card */}
          <section className="lg:col-span-3 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-card animate-premium" style={{ animationDelay: "0.1s" }}>
            {mobile ? (
              <div>
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-100">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/png"
                    className="absolute inset-0 h-full w-full object-cover"
                    videoConstraints={{ facingMode: "environment" }}
                  />
                  {status === "processing" && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                      <Loader2 className="h-12 w-12 animate-spin text-neutral-900" />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    const src = webcamRef.current?.getScreenshot();
                    if (src) handleDataIngestion(src);
                  }}
                  disabled={status === "processing"}
                  className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 text-sm font-bold text-white hover:bg-black active:scale-[0.98] disabled:opacity-50 transition-all"
                >
                  <Camera className="h-5 w-5" />
                  Take photo
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={status === "processing"} />
                <div className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-8 py-16 text-center transition-all duration-300 hover:border-neutral-900 hover:bg-white">
                  {status === "processing" ? (
                    <div className="flex flex-col items-center gap-5">
                      <Loader2 className="h-12 w-12 animate-spin text-neutral-900" />
                      <span className="text-sm font-bold text-neutral-900">Loading your image...</span>
                    </div>
                  ) : (
                    <>
                      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-xl shadow-neutral-900/20 transition-transform duration-300 group-hover:scale-110">
                        <Upload className="h-7 w-7" />
                      </div>
                      <h3 className="text-xl font-extrabold text-neutral-900">Upload an image</h3>
                      <p className="mt-2 text-sm text-neutral-500">Click to choose a PNG or JPG from your device</p>
                      <span className="mt-6 inline-flex items-center rounded-full bg-neutral-900 px-5 py-2 text-xs font-bold text-white group-hover:bg-black">
                        Choose file
                      </span>
                    </>
                  )}
                </div>
              </label>
            )}

            {fileError && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">{fileError}</span>
              </div>
            )}

            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900" />
              <p>Dark ink on a light background works best. Keep the page flat and avoid shadows across the notation.</p>
            </div>
          </section>

          {/* Guide */}
          <aside className="lg:col-span-2 animate-premium" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-900">How scanning works</h2>
            <ol className="mt-6 space-y-0">
              {guide.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="relative flex gap-4 pb-8 last:pb-0">
                  {i < guide.length - 1 && (
                    <span aria-hidden className="absolute left-5 top-12 bottom-0 border-l-2 border-dashed border-neutral-300" />
                  )}
                  <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white ring-4 ring-neutral-50">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold tracking-[0.2em] text-neutral-400">STEP 0{i + 1}</p>
                    <h3 className="mt-0.5 text-lg font-extrabold">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    </div>
  );
}
