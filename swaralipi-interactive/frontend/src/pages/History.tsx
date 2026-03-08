import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  BarChart3,
  ArrowLeft,
  Terminal,
  Cpu,
  History as HistoryIcon
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
  const navigate = useNavigate();
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans">
        <Loader2 className="w-12 h-12 text-black animate-spin mb-4" />
        <span className="text-black font-black uppercase tracking-[0.5em] text-[10px]">Accessing_Archives...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] relative flex flex-col overflow-hidden font-sans text-neutral-900 selection:bg-black selection:text-white">

      {/* HEADER: MATCHING THE RESULT PAGE SYSTEM BAR */}
      <nav className="w-full bg-white border-b-4 border-black flex items-center justify-between p-8 relative z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]">
            <HistoryIcon className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-900 leading-none mb-1">Archival_Node</h2>
            <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Database className="w-3 h-3" /> System_Logs_Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right pr-6 border-r-2 border-neutral-100">
            <span className="block text-[9px] font-black text-neutral-400 uppercase tracking-widest">Entry_Count</span>
            <span className="text-xl font-mono font-black text-neutral-900">{scans.length.toString().padStart(3, '0')}</span>
          </div>
          <button
            onClick={() => navigate("/scan")}
            className="p-3 border-2 border-black bg-white hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <main className="flex-1 relative p-6 lg:p-12 overflow-y-auto scrollbar-hide">
        {/* Engineering Grid Overlay */}
        <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />

        <div className="relative z-10 max-w-6xl mx-auto">

          {error ? (
            <div className="border-4 border-black bg-white p-12 shadow-[12px_12px_0px_0px_rgba(239,68,68,1)] flex flex-col items-center text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-6" />
              <h3 className="text-xl font-black text-black uppercase tracking-tighter mb-2">Interface_Failure</h3>
              <p className="text-xs text-neutral-500 font-bold max-w-md leading-relaxed mb-8">{error}</p>
              <div className="px-6 py-3 border-2 border-black bg-neutral-50 font-mono text-[10px] font-black uppercase tracking-widest">
                Kernel_Message: Check_Backend_Service
              </div>
            </div>
          ) : scans.length === 0 ? (
            <div className="border-4 border-dashed border-neutral-200 bg-white/50 p-24 flex flex-col items-center text-center">
              <FileSearch className="w-16 h-16 text-neutral-200 mb-6" />
              <p className="text-xs font-black text-neutral-300 uppercase tracking-[0.4em]">Empty_Data_Stream</p>
              <p className="text-[10px] text-neutral-400 mt-4 font-bold uppercase">No records found in local storage node.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {scans.map((s, idx) => (
                <div
                  key={s.id}
                  className="group bg-white border-4 border-black p-6 flex flex-col md:flex-row items-center gap-8 transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                >
                  {/* Image/Index Section */}
                  <div className="relative">
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-black flex items-center justify-center text-[10px] font-black text-white z-10">
                      {(scans.length - idx).toString().padStart(2, '0')}
                    </div>
                    <div className="w-32 h-32 border-2 border-black overflow-hidden bg-neutral-50">
                      {s.image_crop_base64 ? (
                        <img
                          src={`data:image/png;base64,${s.image_crop_base64}`}
                          alt="Scan Metadata"
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music2 className="w-8 h-8 text-neutral-200" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Identification Section */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{formatTime(s.timestamp)}</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-6">
                      <h2 className="text-6xl font-black text-black leading-none">{s.hindi_symbol || '∅'}</h2>
                      <div className="h-px md:h-8 w-full md:w-[4px] bg-neutral-100 md:bg-black mb-2" />
                      <div className="pb-1">
                        <span className="text-[10px] block font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Classification</span>
                        <span className="text-lg font-black text-black uppercase tracking-tighter">
                          {s.class_name || 'Undefined'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Confidence / Action Section */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
                    <div className="w-full sm:w-48 p-4 border-2 border-black bg-neutral-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-3 h-3 text-black" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Precision</span>
                        </div>
                        <span className="text-xs font-mono font-black">{Math.round(s.confidence * 100)}%</span>
                      </div>
                      <div className="h-3 bg-white border-2 border-black p-[2px]">
                        <div
                          className="h-full bg-emerald-400 border-r border-black"
                          style={{ width: `${s.confidence * 100}%` }}
                        />
                      </div>
                    </div>

                    <button className="w-full sm:w-auto p-4 border-4 border-black bg-white hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* FOOTER: SYSTEM STATUS BAR */}
      <footer className="p-8 border-t-4 border-black bg-neutral-900 text-white flex flex-col md:flex-row justify-between items-center gap-6 relative z-20">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Auth_Node: Verified</span>
          </div>
          <div className="flex items-center gap-3">
            <Hash className="w-3 h-3 text-neutral-500" />
            <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest">Archive_UUID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
          </div>
        </div>
        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.5em]">
          Swaralipi_Neural_Archive_v1.0
        </p>
      </footer>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}