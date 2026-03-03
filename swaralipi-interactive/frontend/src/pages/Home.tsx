import { Link } from "react-router-dom";
import { ScanLine, History, Crop, ArrowRight, Database } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center max-w-5xl mx-auto px-6 py-12">

      {/* Hero Section */}
      <header className="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 text-xs font-medium mb-6">
          {/* <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> */}
          {/* <span>AI-Powered Notation Analysis</span> */}
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-neutral-900 tracking-tight mb-6">
          Swaralipi <span className="text-neutral-500 font-light italic">Interactive</span>
        </h1>

        <p className="text-neutral-500 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
          The bridge between classical notation and digital intelligence.
          Upload your scores, isolate symbols, and identify Hindi Swaras with real-time confidence scoring.
        </p>
      </header>

      {/* Primary Actions */}
      <div className="grid sm:grid-cols-2 gap-8 w-full max-w-4xl">
        <Link
          to="/scan"
          className="group relative flex flex-col p-8 rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-xl hover:border-neutral-900 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ScanLine className="w-24 h-24 rotate-12" />
          </div>

          <div className="mb-6 w-12 h-12 rounded-lg bg-neutral-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <ScanLine className="w-6 h-6" />
          </div>

          <div className="relative z-10">
            <h2 className="text-xl font-bold text-neutral-900 mb-2 flex items-center gap-2">
              Start Scanning <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </h2>
            <p className="text-neutral-500 leading-relaxed">
              Capture or upload high-resolution images of musical notation for instant analysis.
            </p>
          </div>
        </Link>

        <Link
          to="/history"
          className="group relative flex flex-col p-8 rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-xl hover:border-neutral-900 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Database className="w-24 h-24 -rotate-12" />
          </div>

          <div className="mb-6 w-12 h-12 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition-colors duration-300">
            <History className="w-6 h-6" />
          </div>

          <div className="relative z-10">
            <h2 className="text-xl font-bold text-neutral-900 mb-2 flex items-center gap-2">
              Review History <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </h2>
            <p className="text-neutral-500 leading-relaxed">
              Access your library of previous detections and saved notation insights.
            </p>
          </div>
        </Link>
      </div>

      {/* Instructional Tooltip Section */}
      <footer className="mt-16 w-full max-w-4xl">
        <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-neutral-50 border border-neutral-200/60">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center shadow-sm">
            <Crop className="w-5 h-5 text-neutral-400" />
          </div>
          <div className="text-center md:text-left">
            <h4 className="text-sm font-semibold text-neutral-800 mb-1">How it works</h4>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Navigate to the result screen, then <strong>click and drag</strong> to draw a bounding box over any musical symbol.
              Our vision model will instantly parse the selection to display the Hindi symbol and detection confidence.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}