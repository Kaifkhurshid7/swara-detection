import { Link, useLocation } from "react-router-dom";
import { Music2, ScanLine, History, Binary } from "lucide-react";

export default function Navbar() {
  const location = useLocation();

  // Helper for active link styling
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="relative border-b border-neutral-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50 overflow-hidden">

      {/* RULER GRADIENT BACKGROUND (Engineering Scale) */}
      <div
        className="absolute inset-x-0 bottom-0 h-[6px] opacity-20 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, #000 0, #000 1px, transparent 1px, transparent 10px), repeating-linear-gradient(90deg, #000 0, #000 1px, transparent 1px, transparent 40px)`,
          backgroundSize: '100% 4px, 100% 6px'
        }}
      />

      <div className="max-w-[1600px] mx-auto px-8 flex items-center justify-between h-16 relative z-10">

        {/* Brand Section: Scientific Identification */}
        <Link
          to="/"
          className="flex items-center gap-4 group transition-all"
        >
          <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-black transition-all group-hover:scale-105 duration-500">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase tracking-tight text-neutral-900">
                Swaralipi <span className="text-neutral-400 font-light italic">Lab</span>
              </span>
              <div className="h-3 w-[1px] bg-neutral-200 mx-1" />
              <span className="text-[10px] font-black text-amber-500 tracking-widest">YoloV8</span>
            </div>
            <span className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.4em] leading-none mt-1.5">
              Neural Terminal
            </span>
          </div>
        </Link>

        {/* Navigation Links: Modular Controls */}
        <div className="flex items-center gap-2">

          <Link
            to="/scan"
            className={`group relative flex items-center gap-3 px-5 py-2 rounded-xl transition-all duration-500 ${isActive("/scan")
              ? "bg-neutral-900 text-white shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
              : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 border border-transparent hover:border-neutral-100"
              }`}
          >
            <ScanLine className={`w-4 h-4 transition-transform group-hover:rotate-90 ${isActive("/scan") ? "text-white" : "text-neutral-400"}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ingest</span>

            {/* Active Indicator Dot */}
            {isActive("/scan") && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-neutral-900 rounded-full border-2 border-white animate-pulse" />
            )}
          </Link>

          <div className="w-[1px] h-4 bg-neutral-200 mx-2" />

          <Link
            to="/history"
            className={`group relative flex items-center gap-3 px-5 py-2 rounded-xl transition-all duration-500 ${isActive("/history")
              ? "bg-neutral-900 text-white shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
              : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 border border-transparent hover:border-neutral-100"
              }`}
          >
            <Binary className={`w-4 h-4 ${isActive("/history") ? "text-white" : "text-neutral-400"}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Archive</span>

            {isActive("/history") && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </Link>
        </div>

      </div>
    </nav>
  );
}