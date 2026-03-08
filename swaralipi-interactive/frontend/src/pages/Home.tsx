import { Link } from "react-router-dom";
import {
  ScanLine,
  ArrowRight,
  Database,
  Microscope,
  Music2,
  ExternalLink,
  Code2,
  Hash,
  Activity
} from "lucide-react";

export default function Home() {
  // The 12 swaras of the Hindustani scale in Devanagari
  const hindiSwaras = ["सा", "रे", "ग", "म", "प", "ध", "नि", "सां", "रे़", "ग़", "मँ", "ध़"];

  return (
    <div className="relative min-h-screen bg-[#FDFDFD] flex flex-col lg:flex-row overflow-hidden selection:bg-neutral-900 selection:text-white font-sans">

      {/* --- DECORATIVE HINDI SWARA SPREAD (DIF SPEC) --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {hindiSwaras.map((s, i) => (
          <span
            key={i}
            className="absolute font-black select-none text-black/[0.08] transition-all duration-1000"
            style={{
              // Wide-area procedural distribution
              left: `${(i * 31) % 115 - 10}%`,
              top: `${(i * 23) % 110 - 5}%`,
              transform: `rotate(${(i * 85) % 360}deg)`,
              fontSize: `${(i % 3 === 0) ? '8rem' : '4rem'}`, // Varied decorative scale
              fontFamily: 'serif'
            }}
          >
            {s}
          </span>
        ))}
      </div>

      {/* 1. MAIN RESEARCH CONSOLE (Left) */}
      <main className="flex-1 relative z-10 flex flex-col p-8 lg:p-20 overflow-y-auto">

        {/* Engineering Grid Overlay */}
        <div
          className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 0H0V60H60V0zM1 59V1H59V59H1z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }}
        />

        <header className="relative z-10 mb-20">
          {/* <div className="inline-flex items-center gap-4 px-4 py-1.5 rounded-lg bg-black text-white text-[9px] font-black uppercase tracking-[0.4em] mb-10 shadow-xl">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>Neural-Acoustic-Inference v4.0</span>
          </div> */}
          <h1 className="text-8xl font-black text-neutral-900 tracking-[-0.06em] mb-6 leading-none">
            Swaralipi <span className="text-neutral-300 font-light italic tracking-normal">Lab</span>
          </h1>
          <p className="text-neutral-500 text-lg font-medium max-w-md leading-relaxed border-l-4 border-black pl-6">
            A specialized computational environment for the extraction and classification of Indian Classical notation.
          </p>
        </header>

        {/* Action Grid - DIF Elevated Structure */}
        <div className="relative z-10 grid gap-8 max-w-2xl">

          {/* UPLOAD FILE */}
          <Link
            to="/scan"
            className="group relative flex items-center justify-between p-10 rounded-3xl border-2 border-neutral-900 bg-white hover:bg-neutral-50 transition-all duration-500 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1"
          >
            <div className="flex items-center gap-8">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 bg-neutral-900 rounded-xl rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                <div className="relative w-16 h-16 bg-black border-2 border-black rounded-xl flex items-center justify-center text-white">
                  <ScanLine className="w-8 h-8 stroke-[2px]" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Upload File</h2>
                <p className="text-neutral-400 text-[11px] mt-1 font-black uppercase tracking-[0.2em]">Initialize manuscript capture</p>
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-2 border-neutral-900 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
              <ArrowRight className="w-6 h-6" />
            </div>
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* DATASET ARCHIVE */}
            <Link
              to="/history"
              className="group p-8 rounded-3xl border-2 border-neutral-200 bg-white/80 backdrop-blur-sm hover:border-black transition-all duration-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-6 group-hover:bg-black group-hover:text-white transition-all">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-neutral-900">Dataset Archive</h3>
              <p className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mt-1">Review inference logs</p>
            </Link>

            {/* PARSER CONVERTER */}
            <Link
              to="/import"
              className="group p-8 rounded-3xl border-2 border-neutral-200 bg-white/80 backdrop-blur-sm hover:border-black transition-all duration-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-6 group-hover:bg-black group-hover:text-white transition-all">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-neutral-900">Parser converter</h3>
              <p className="text-neutral-400 text-[10px] font-black uppercase tracking-widest mt-1">Import external XML</p>
            </Link>
          </div>
        </div>

        {/* System Metadata Footer */}
        {/* <footer className="relative z-10 mt-auto pt-10 border-t-2 border-neutral-100 flex items-center justify-between text-[10px] font-mono text-neutral-400 uppercase tracking-[0.4em]">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><Hash className="w-3 h-3" /> System_Root: Verified</span>
            <span>Latent: 0.002ms</span>
          </div>
          <span className="font-black text-black">© 2026 Swaralipi Neural Pipeline</span>
        </footer> */}
      </main>

      {/* 2. RESEARCH PROTOCOL PANEL (Right) */}
      <aside className="w-full lg:w-[500px] bg-white border-l-4 border-neutral-900 flex flex-col p-12 lg:p-20 relative">
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-white shadow-2xl">
              <Microscope className="w-7 h-7 stroke-[1.5px]" />
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-neutral-400 font-mono">Protocol</h2>
          </div>

          <h3 className="text-4xl font-black text-neutral-900 mb-12 leading-tight tracking-tighter">
            Methodology & <br /> Data Sequence
          </h3>

          <div className="space-y-16">
            {[
              { id: '01', title: 'Data Ingestion', desc: 'Initialize the optical sensor or local file stream. Capture the musical manuscript for high-fidelity coordinate mapping.' },
              { id: '02', title: 'Segment Isolation', desc: 'Define the Region of Interest (ROI) by dragging a bounding box. This focuses the neural engine.' },
              { id: '03', title: 'Classification', desc: 'The YOLOv8-driven brain.pt parses visual patterns into the Hindustani pitch-class ontology.' }
            ].map((step) => (
              <div key={step.id} className="relative pl-12 border-l-4 border-neutral-900 group">
                <div className="absolute -left-[10px] top-0 w-4 h-4 bg-white border-4 border-neutral-900 rounded-full group-hover:bg-black transition-all duration-300" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-900 mb-3">{step.id} // {step.title}</h4>
                <p className="text-neutral-500 text-sm leading-relaxed font-medium">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* <div className="mt-auto">
          <button className="flex items-center justify-between w-full p-6 rounded-2xl bg-black text-white hover:bg-neutral-800 transition-all group shadow-[8px_8px_0px_0px_rgba(163,163,163,0.5)]">
            <div className="flex items-center gap-4 font-black text-[11px] uppercase tracking-[0.4em]">
              <Music2 className="w-5 h-5" />
              <span>Full Lab Specs</span>
            </div>
            <ExternalLink className="w-5 h-5 opacity-40 group-hover:opacity-100" />
          </button>
        </div> */}
      </aside>
    </div>
  );
}