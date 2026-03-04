import { Link } from "react-router-dom";
import { ScanLine, History, ArrowRight, Zap, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[100vh] pt-32 pb-20 px-6 max-w-6xl mx-auto flex flex-col items-center">

      {/* Hero Section */}
      <header className="text-center mb-24 animate-premium">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 text-[10px] font-bold uppercase tracking-widest mb-8">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Next-Generation Swaralipi OCR</span>
        </div>

        <h1 className="text-6xl sm:text-8xl font-black text-neutral-900 tracking-tightest mb-8 leading-[0.9]">
          Swaralipi <span className="text-neutral-400 font-light italic">Pro.</span>
        </h1>

        <p className="text-neutral-500 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
          The ultimate precision tool for classical musical notation.
          Identify symbols with neural-grade accuracy and real-time feedback.
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid md:grid-cols-2 gap-8 w-full animate-premium [animation-delay:200ms]">
        <Link
          to="/scan"
          className="group relative h-[400px] rounded-[3rem] p-12 bg-neutral-900 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-neutral-200"
        >
          <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-700">
            <ScanLine className="w-96 h-96 text-white" />
          </div>

          <div className="relative h-full flex flex-col justify-between z-10">
            <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
              <ScanLine className="w-8 h-8 text-black" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                Scanner <ArrowRight className="w-6 h-6 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
              </h2>
              <p className="text-neutral-400 text-lg leading-relaxed max-w-xs font-medium">
                Initialize the high-precision vision engine to parse musical scores.
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/history"
          className="group relative h-[400px] rounded-[3rem] p-12 bg-white border border-neutral-100 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-neutral-200"
        >
          <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-700">
            <History className="w-96 h-96 text-neutral-900" />
          </div>

          <div className="relative h-full flex flex-col justify-between z-10">
            <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-900 transition-colors duration-500">
              <History className="w-8 h-8 text-neutral-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-4 flex items-center gap-3">
                Archive <ArrowRight className="w-6 h-6 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
              </h2>
              <p className="text-neutral-500 text-lg leading-relaxed max-w-xs font-medium">
                Access your neural processing logs and previously identified swaras.
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Info Bar */}
      <footer className="mt-20 w-full animate-premium [animation-delay:400ms]">
        <div className="glass-card rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-20 h-20 rounded-[2rem] bg-neutral-100 flex items-center justify-center shrink-0 shadow-inner">
            <Zap className="w-10 h-10 text-neutral-900 fill-neutral-900" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-neutral-900 mb-2">Neural Identification Protocol</h4>
            <p className="text-neutral-500 leading-relaxed font-medium">
              Our vision engine uses advanced convolutional neural networks to isolate and
              identify Devanagari musical notes with a precision-first threshold.
              <strong> Drag to multi-scan </strong> entire lines for rapid ingestion.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
