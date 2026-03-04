import { Link } from "react-router-dom";
import {
  ScanLine,
  History,
  ArrowRight,
  Database,
  Zap,
  Microscope,
  Music2,
  Info,
  ExternalLink
} from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#F8F9FA] flex flex-col lg:flex-row overflow-hidden selection:bg-neutral-900 selection:text-white">

      {/* 1. MAIN RESEARCH CONSOLE (Left) */}
      <main className="flex-1 relative z-10 flex flex-col p-8 lg:p-20 overflow-y-auto">

        {/* Subtle Engineering Grid */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }}
        />

        <header className="relative z-10 mb-16">
          <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-white border border-neutral-200 text-neutral-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 animate-pulse" />
            <span>System Status: Operational</span>
          </div>
          <h1 className="text-6xl font-black text-neutral-900 tracking-[ -0.04em] mb-4">
            Swaralipi <span className="text-neutral-400 font-light italic tracking-normal">Lab</span>
          </h1>
          <p className="text-neutral-500 text-base font-medium max-w-md leading-relaxed">
            A specialized computational environment for the extraction and classification of Indian Classical notation.
          </p>
        </header>

        {/* Action Grid - Segmented with "Elevated White" cards */}
        <div className="relative z-10 grid gap-6 max-w-2xl mb-24">
          <Link
            to="/scan"
            className="group flex items-center justify-between p-8 rounded-3xl border border-neutral-200 bg-white hover:border-neutral-900 transition-all duration-500 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)]"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-neutral-900 text-white flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                <ScanLine className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Optical Ingestion</h2>
                <p className="text-neutral-400 text-xs mt-1 font-medium">Initialize real-time manuscript capture.</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full border border-neutral-100 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            to="/history"
            className="group flex items-center justify-between p-8 rounded-3xl border border-neutral-200 bg-white hover:border-neutral-900 transition-all duration-500 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)]"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-400 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition-all duration-500">
                <Database className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Dataset Archive</h2>
                <p className="text-neutral-400 text-xs mt-1 font-medium">Review historical inference logs.</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full border border-neutral-100 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Bottom Metadata Section */}
        <section className="relative z-10 mt-auto pt-10 border-t border-neutral-200/60">
          <div className="flex items-center gap-2 mb-6 text-neutral-400">
            <Info className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Core Swara Reference</span>
          </div>
          <div className="grid grid-cols-4 gap-4 max-w-xl">
            {['Sa', 'Re', 'Ga', 'Ma'].map((s) => (
              <div key={s} className="bg-neutral-100/50 border border-neutral-200/50 rounded-xl p-3 text-center">
                <span className="text-sm font-bold text-neutral-800">{s}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 2. RESEARCH PROTOCOL PANEL (Right) */}
      <aside className="w-full lg:w-[480px] bg-white border-l border-neutral-200 flex flex-col p-12 lg:p-16">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
              <Microscope className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-neutral-400">Protocol</h2>
          </div>

          <h3 className="text-3xl font-black text-neutral-900 mb-10 leading-tight">
            Methodology & <br /> Data Sequence
          </h3>

          <div className="space-y-12">
            {[
              { id: '01', title: 'Calibration', desc: 'Align manuscript with optic sensors. Adjust for ambient Lux values to optimize symbol contrast.' },
              { id: '02', title: 'ROI Segmentation', desc: 'Isolate the specific Swara cluster. Coordinate mapping allows the neural engine to focus on character geometry.' },
              { id: '03', title: 'Classification', desc: 'The model executes inference, mapping visual data to the Hindustani pitch-class ontology.' }
            ].map((step) => (
              <div key={step.id} className="relative pl-10 border-l-2 border-neutral-100 group">
                <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-white border-2 border-neutral-100 group-hover:border-neutral-900 transition-colors duration-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 group-hover:bg-neutral-900 transition-colors" />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">{step.id} / {step.title}</h4>
                <p className="text-neutral-500 text-[13px] leading-relaxed font-medium group-hover:text-neutral-700 transition-colors">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-10 border-t border-neutral-100">
          <button className="flex items-center justify-between w-full p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-600 hover:bg-neutral-900 hover:text-white transition-all group">
            <div className="flex items-center gap-3 font-bold text-xs">
              <Music2 className="w-4 h-4" />
              <span>Full Research Documentation</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
          </button>
        </div>
      </aside>
    </div>
  );
}