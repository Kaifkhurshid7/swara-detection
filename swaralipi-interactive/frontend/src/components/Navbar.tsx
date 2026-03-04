import { Link, useLocation } from "react-router-dom";
import { Music2, ScanLine, History } from "lucide-react";

export default function Navbar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-5xl z-50">
      <div className="glass-card rounded-[2rem] px-6 py-3 flex items-center justify-between">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-neutral-900 rounded-2xl flex items-center justify-center group-hover:rotate-[10deg] transition-transform duration-500">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-tight text-neutral-900 leading-tight">
              Swaralipi <span className="text-neutral-400 font-light italic">Pro</span>
            </span>
            <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-[0.2em] leading-none mt-1">
              Neural OCR
            </span>
          </div>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-2">
          <Link
            to="/scan"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${isActive("/scan")
              ? "bg-neutral-900 text-white shadow-lg shadow-neutral-200"
              : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
          >
            <ScanLine className="w-4 h-4" />
            <span className="hidden sm:inline">Scanner</span>
          </Link>

          <Link
            to="/history"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${isActive("/history")
              ? "bg-neutral-900 text-white shadow-lg shadow-neutral-200"
              : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Archive</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
