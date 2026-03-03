import { Link, useLocation } from "react-router-dom";
import { Music2, ScanLine, History } from "lucide-react";

export default function Navbar() {
  const location = useLocation();

  // Helper for active link styling
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b border-neutral-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">

        {/* Brand Section */}
        <Link
          to="/"
          className="flex items-center gap-3 group transition-all"
        >
          <div className="w-9 h-9 bg-neutral-900 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-black transition-colors">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-tighter leading-none text-neutral-900">
              Swaralipi <span className="text-neutral-400 font-medium">Interactive</span>
            </span>
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-[0.2em] leading-none mt-1.5">
              Precision Analysis
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1.5">
          <Link
            to="/scan"
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${isActive("/scan")
                ? "bg-neutral-900 text-white shadow-lg shadow-neutral-200"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
          >
            <ScanLine className={`w-4 h-4 ${isActive("/scan") ? "text-white" : "text-neutral-400"}`} />
            <span className="hidden sm:inline">Initialize Scan</span>
          </Link>

          <Link
            to="/history"
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${isActive("/history")
                ? "bg-neutral-900 text-white shadow-lg shadow-neutral-200"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
          >
            <History className={`w-4 h-4 ${isActive("/history") ? "text-white" : "text-neutral-400"}`} />
            <span className="hidden sm:inline">Archive</span>
          </Link>
        </div>

      </div>
    </nav>
  );
}