import { Link, useLocation } from "react-router-dom";
import { ScanLine, Database, Code2 } from "lucide-react";

const links = [
  { to: "/scan", label: "Scan", icon: ScanLine },
  { to: "/history", label: "History", icon: Database },
  { to: "/import", label: "Import", icon: Code2 },
];

export default function Navbar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/logo.svg" alt="Swaralipi Lab logo" className="w-10 h-10 rounded-xl shadow-md shadow-neutral-900/20 group-hover:scale-105 transition-transform" />
          <div className="leading-tight">
            <span className="block text-base font-extrabold tracking-tight text-neutral-900">
              Swaralipi <span className="text-neutral-900">Lab</span>
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Handwritten swaralipi reader
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white/80 p-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
                isActive(to)
                  ? "bg-neutral-900 text-white shadow"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
