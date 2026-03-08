import { Link, useLocation } from "react-router-dom";
import { Music2, ScanLine, Binary, Hash } from "lucide-react";

export default function Navbar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  // Small decorative swaras for the navbar spread
  const navSwaras = ["सा", "प", "नि", "म"];

  return (
    <nav className="relative border-b-4 border-black bg-white sticky top-0 z-50 overflow-hidden">

      {/* --- DECORATIVE NAV SWARAS (Minimal & Aesthetic) --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.08]">
        {navSwaras.map((s, i) => (
          <span
            key={i}
            className="absolute font-black select-none text-black"
            style={{
              left: `${(i * 25) + 10}%`,
              top: '20%',
              fontSize: '2.5rem',
              transform: `rotate(${i * 15}deg)`,
              fontFamily: 'serif'
            }}
          >
            {s}
          </span>
        ))}
      </div>

      {/* RULER GRADIENT (Engineering Scale - Sharp Black) */}
      <div
        className="absolute inset-x-0 bottom-0 h-[8px] opacity-10 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, #000 0, #000 2px, transparent 2px, transparent 15px)`,
          backgroundSize: '100% 100%'
        }}
      />

      <div className="max-w-[1600px] mx-auto px-8 flex items-center justify-between h-20 relative z-10">

        {/* Brand Section */}
        <Link
          to="/"
          className="flex items-center gap-5 group transition-all"
        >
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group-hover:-translate-y-0.5">
            <Music2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="text-lg font-black uppercase tracking-tighter text-neutral-900">
                Swaralipi <span className="text-neutral-300 font-light italic tracking-normal">Lab</span>
              </span>
              <span className="px-2 py-0.5 bg-black text-white text-[8px] font-black rounded uppercase tracking-widest">
                v4.0
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Hash className="w-2.5 h-2.5 text-neutral-400" />
              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.3em] leading-none">
                Neural Inference Terminal
              </span>
            </div>
          </div>
        </Link>

        {/* Navigation Controls */}
        <div className="flex items-center gap-4">
          <Link
            to="/scan"
            className={`group relative flex items-center gap-3 px-6 py-2.5 rounded-xl border-2 transition-all duration-300 ${isActive("/scan")
              ? "border-black bg-black text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)]"
              : "border-transparent text-neutral-500 hover:border-neutral-200 hover:bg-neutral-50"
              }`}
          >
            <ScanLine className={`w-4 h-4 transition-transform group-hover:rotate-90 ${isActive("/scan") ? "text-emerald-400" : "text-neutral-400"}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ingest</span>
            {isActive("/scan") && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
            )}
          </Link>

          <Link
            to="/history"
            className={`group relative flex items-center gap-3 px-6 py-2.5 rounded-xl border-2 transition-all duration-300 ${isActive("/history")
              ? "border-black bg-black text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)]"
              : "border-transparent text-neutral-500 hover:border-neutral-200 hover:bg-neutral-50"
              }`}
          >
            <Binary className={`w-4 h-4 ${isActive("/history") ? "text-emerald-400" : "text-neutral-400"}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Archive</span>
            {isActive("/history") && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
            )}
          </Link>

          <div className="h-8 w-[2px] bg-neutral-100 mx-2" />

          {/* Device Status Indicator */}
          {/* <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-neutral-100">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest">Status</span>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Live_Feed</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div> */}
        </div>
      </div>
    </nav>
  );
}