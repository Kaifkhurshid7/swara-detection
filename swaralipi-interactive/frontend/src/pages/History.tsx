import { useState, useEffect } from "react";
import { getHistory, getUserFacingApiError, type HistoryScan } from "../api/client";
import { 
  Loader2, 
  Music2, 
  AlertCircle, 
  Clock, 
  Database, 
  FileSearch, 
  ChevronRight, 
  Hash, 
  BarChart3 
} from "lucide-react";

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { 
      dateStyle: "medium", 
      timeStyle: "short" 
    });
  } catch {
    return iso;
  }
}

export default function History() {
  const [scans, setScans] = useState<HistoryScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHistory()
      .then((res) => setScans(res.scans || []))
      .catch((err) => setError(getUserFacingApiError(err, "history")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-neutral-300 animate-spin" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Retrieving Archive</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] relative overflow-hidden font-sans text-neutral-900">
      {/* Engineering Grid Texture */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }} 
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 lg:py-20">
        
        {/* Header Section */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-100 pb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-neutral-900 rounded-lg">
                <Database className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400">Data Repository</span>
            </div>
            <h1 className="text-4xl font-black text-neutral-900 tracking-tight">Scan History</h1>
            <p className="text-sm text-neutral-500 mt-2 font-medium">Historical record of all neural inference operations.</p>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right">
              <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Total Logs</span>
              <span className="text-2xl font-mono font-bold text-neutral-900">{scans.length.toString().padStart(3, '0')}</span>
            </div>
            <div className="w-px h-10 bg-neutral-200" />
            <div className="text-right">
              <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">System Status</span>
              <span className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-2 justify-end">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Operational
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main>
          {error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50/50 p-8 flex flex-col items-center text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mb-4" />
              <h3 className="text-sm font-bold text-red-900 uppercase tracking-wider mb-2">Interface Interrupted</h3>
              <p className="text-xs text-red-700 max-w-md leading-relaxed mb-6">{error}</p>
              <div className="px-4 py-2 bg-white border border-red-100 rounded-lg text-[10px] font-mono text-red-500">
                ERR_BACKEND_UNREACHABLE: Check run-backend.bat
              </div>
            </div>
          ) : scans.length === 0 ? (
            <div className="rounded-[2.5rem] border-2 border-dashed border-neutral-100 p-20 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center mb-6">
                <FileSearch className="w-8 h-8 text-neutral-200" />
              </div>
              <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">No archival data found</p>
              <p className="text-xs text-neutral-400 mt-2 italic">Initiate a spatial scan on the workbench to populate history.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scans.map((s, idx) => (
                <div 
                  key={s.id} 
                  className="group relative bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 transition-all hover:shadow-xl hover:shadow-neutral-200/50 hover:border-neutral-300"
                >
                  {/* Image Profile */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute -top-2 -left-2 w-6 h-6 rounded bg-neutral-900 flex items-center justify-center text-[10px] font-mono text-white z-10">
                      {(scans.length - idx).toString().padStart(2, '0')}
                    </div>
                    {s.image_crop_base64 ? (
                      <img
                        src={`data:image/png;base64,${s.image_crop_base64}`}
                        alt="Crop metadata"
                        className="w-24 h-24 rounded-xl object-cover border border-neutral-100 grayscale hover:grayscale-0 transition-all duration-500"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-neutral-50 flex items-center justify-center border border-neutral-100">
                        <Music2 className="w-6 h-6 text-neutral-200" />
                      </div>
                    )}
                  </div>

                  {/* Primary Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{formatTime(s.timestamp)}</span>
                    </div>
                    <div className="flex items-baseline gap-4">
                      <h2 className="text-4xl font-serif text-neutral-900">{s.hindi_symbol || '∅'}</h2>
                      <div className="h-4 w-px bg-neutral-200" />
                      <span className="text-sm font-bold text-neutral-800 uppercase tracking-tighter">
                        {s.class_name || 'Unclassified'}
                      </span>
                    </div>
                  </div>

                  {/* Metadata Stats */}
                  <div className="w-full md:w-auto flex items-center gap-4">
                    <div className="px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 flex-1 md:flex-none min-w-[120px]">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="w-3 h-3 text-neutral-400" />
                        <span className="text-[9px] font-bold text-neutral-400 uppercase">Confidence</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-mono font-bold text-neutral-900">
                           {Math.round(s.confidence * 100)}%
                         </span>
                         <div className="flex-1 h-1 bg-neutral-200 rounded-full overflow-hidden min-w-[40px]">
                            <div 
                              className="h-full bg-neutral-900" 
                              style={{ width: `${s.confidence * 100}%` }} 
                            />
                         </div>
                      </div>
                    </div>

                    <button className="p-4 rounded-xl border border-neutral-100 hover:bg-neutral-900 hover:text-white transition-all group-hover:border-neutral-900">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <footer className="mt-20 pt-10 border-t border-neutral-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Hash className="w-3 h-3 text-neutral-300" />
                    <span className="text-[10px] font-mono text-neutral-400 italic">ARCHIVE_AUTH_v4</span>
                </div>
            </div>
            <p className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">
                Data generated via Swaralipi Neural Pipeline
            </p>
        </footer>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}