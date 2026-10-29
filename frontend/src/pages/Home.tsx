import { Link } from "react-router-dom";
import {
  ScanLine,
  ArrowRight,
  Database,
  Code2,
  Crop,
  Cpu,
  Camera,
  ShieldCheck,
  Zap,
  Languages,
  Upload,
} from "lucide-react";

const swaras = ["सा", "रे", "ग", "म", "प", "ध", "नि", "सां"];

function UploadArt() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="flex w-full max-w-[240px] flex-col items-center rounded-2xl border-2 border-dashed border-neutral-300 bg-white px-5 py-6 text-center shadow-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-900 text-white">
          <Upload className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-bold text-neutral-900">Drop or choose an image</p>
        <p className="mt-0.5 text-[11px] text-neutral-500">PNG or JPG of your swaralipi</p>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-semibold text-neutral-700">
          <Camera className="h-3 w-3" /> or use camera
        </span>
      </div>
    </div>
  );
}

function CropArt() {
  const corner = "absolute h-2.5 w-2.5 bg-neutral-900";
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="relative w-full max-w-[260px] rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="space-y-3 font-serif text-xl text-neutral-400">
          <p className="tracking-[0.35em]">सा रे ग म</p>
          <div className="relative -mx-2 px-2 py-1">
            <div className="absolute inset-0 rounded-sm border-2 border-neutral-900 bg-neutral-900/5" />
            <span className={`${corner} -left-1 -top-1`} />
            <span className={`${corner} -right-1 -top-1`} />
            <span className={`${corner} -bottom-1 -left-1`} />
            <span className={`${corner} -bottom-1 -right-1`} />
            <p className="relative tracking-[0.35em] text-neutral-900">प ध नि</p>
          </div>
          <p className="tracking-[0.35em]">नि ध प म</p>
        </div>
        <span className="absolute -bottom-3 right-4 rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-bold text-white">Selected</span>
      </div>
    </div>
  );
}

function ResultArt() {
  const rows = [
    { sym: "प", name: "Pa", pct: 96 },
    { sym: "ध", name: "Dha", pct: 91 },
    { sym: "नि", name: "Ni", pct: 88 },
  ];
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-[260px] divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white shadow-sm">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-3 px-3 py-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 font-serif text-xl font-bold text-neutral-900">{r.sym}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-900">{r.name}</span>
                <span className="font-semibold text-neutral-500">{r.pct}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-neutral-900" style={{ width: `${r.pct}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const steps = [
  {
    n: "01",
    icon: Camera,
    title: "Add your manuscript",
    text: "Take a photo with your camera or upload an image of a handwritten or printed swaralipi.",
    art: <UploadArt />,
  },
  {
    n: "02",
    icon: Crop,
    title: "Select the notation",
    text: "Drag a box around the swaras you want to read. A tighter box gives a cleaner result.",
    art: <CropArt />,
  },
  {
    n: "03",
    icon: Cpu,
    title: "Get your swaras",
    text: "Each swara is detected, shown in Devanagari with a confidence score, and ready to export.",
    art: <ResultArt />,
  },
];

function ImportArt() {
  const notes = [
    ["C", "सा", "Sa"],
    ["D", "रे", "Re"],
    ["E", "ग", "Ga"],
    ["F", "म", "Ma"],
  ];
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-3 p-5">
      <div className="w-[44%] rounded-xl border border-neutral-200 bg-white p-3 font-mono text-[9px] leading-[1.45] text-neutral-500 shadow-sm">
        <p className="text-neutral-400">&lt;note&gt;</p>
        <p className="pl-2">&lt;step&gt;<span className="font-bold text-neutral-900">C</span>&lt;/step&gt;</p>
        <p className="pl-2">&lt;octave&gt;4&lt;/octave&gt;</p>
        <p className="text-neutral-400">&lt;/note&gt;</p>
        <p className="mt-1 text-neutral-300">+ D, E, F ...</p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-neutral-900" />
      <div className="grid w-[40%] grid-cols-2 gap-2">
        {notes.map(([w, sym, name]) => (
          <div key={w} className="rounded-xl border border-neutral-200 bg-white py-2 text-center shadow-sm">
            <p className="font-serif text-xl font-bold leading-none text-neutral-900">{sym}</p>
            <p className="mt-1 text-[10px] font-semibold text-neutral-500">{w} to {name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScanArt() {
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-4 p-5">
      <div className="relative w-[52%] rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
        <div className="space-y-1.5 font-serif text-lg leading-none text-neutral-400">
          <p className="tracking-[0.3em]">सा रे ग</p>
          <div className="relative -mx-1.5 px-1.5 py-1">
            <div className="absolute inset-0 rounded-sm border-2 border-neutral-900 bg-neutral-900/5" />
            <p className="relative tracking-[0.3em] text-neutral-900">म प ध</p>
          </div>
          <p className="tracking-[0.3em]">नि ध प</p>
        </div>
      </div>
      <div className="flex w-[34%] flex-col items-center rounded-xl border-2 border-dashed border-neutral-300 bg-white px-3 py-4 text-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-white">
          <Upload className="h-4 w-4" />
        </span>
        <p className="mt-2 text-[11px] font-bold text-neutral-900">Upload image</p>
        <p className="mt-0.5 text-[9px] text-neutral-500">or use camera</p>
      </div>
    </div>
  );
}

function HistoryArt() {
  const rows = [
    { sym: "ध", name: "Dha", pct: 94, time: "Today, 10:42" },
    { sym: "ग", name: "Ga", pct: 88, time: "Today, 10:40" },
    { sym: "म", name: "Ma", pct: 71, time: "Yesterday" },
  ];
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-2 px-6 py-4">
      {rows.map((r, i) => (
        <div
          key={r.name}
          className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-sm"
          style={{ opacity: 1 - i * 0.18 }}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 font-serif text-lg font-bold text-neutral-900">{r.sym}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-neutral-900">{r.name}</span>
              <span className="text-neutral-400">{r.time}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-neutral-900" style={{ width: `${r.pct}%` }} />
              </div>
              <span className="text-[10px] font-semibold text-neutral-500">{r.pct}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const tools = [
  { to: "/scan", title: "Scan a Manuscript", text: "Upload an image or use your camera, crop the notation and get every swara identified in seconds.", cta: "Begin", icon: ScanLine, img: "/screens/scanner.png", art: <ScanArt />, dark: false },
  { to: "/history", title: "Scan History", text: "Look back at your recent scans with the detected swara, a preview and a confidence score.", cta: "Open", icon: Database, img: "/screens/history.png", art: <HistoryArt />, dark: false },
  { to: "/import", title: "MusicXML Import", text: "Paste a MusicXML score and convert its Western notes into swaras (Sa Re Ga Ma).", cta: "Import", icon: Code2, img: "/screens/import.png", art: <ImportArt />, dark: false },
];

const stats = [
  { icon: Languages, value: "12", label: "Swara classes" },
  { icon: Zap, value: "3 formats", label: "PDF, XML, TXT export" },
  { icon: ShieldCheck, value: "91%", label: "mAP@50 accuracy" },
];

/** Illustrated manuscript with detection boxes, drawn inline so it works offline. */
function ManuscriptArt() {
  const rows = [0, 1, 2];
  const boxes = [
    { x: 58, y: 98, w: 46, h: 54, label: "सा" },
    { x: 172, y: 98, w: 46, h: 54, label: "ग" },
    { x: 116, y: 188, w: 46, h: 54, label: "प" },
    { x: 230, y: 188, w: 46, h: 54, label: "नि" },
  ];
  return (
    <svg viewBox="0 0 340 330" className="w-full h-auto drop-shadow-[0_30px_40px_rgba(0,0,0,0.15)]" role="img" aria-label="Manuscript with detected swaras">
      <defs>
        <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f5f5f5" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="324" height="314" rx="18" fill="url(#paper)" stroke="#e5e5e5" strokeWidth="2" />
      <rect x="8" y="8" width="324" height="40" rx="18" fill="#171717" />
      <rect x="8" y="30" width="324" height="18" fill="#171717" />
      <circle cx="30" cy="28" r="5" fill="#a3a3a3" />
      <circle cx="48" cy="28" r="5" fill="#d4d4d4" />
      <circle cx="66" cy="28" r="5" fill="#e5e5e5" />
      <text x="316" y="33" textAnchor="end" fontSize="11" fill="#d4d4d4" fontFamily="monospace" letterSpacing="2">RAAG YAMAN</text>

      {rows.map((r) => (
        <g key={r}>
          {[0, 1, 2, 3, 4].map((l) => (
            <line key={l} x1="30" x2="310" y1={92 + r * 90 + l * 11} y2={92 + r * 90 + l * 11} stroke="#d4d4d4" strokeWidth="1" />
          ))}
        </g>
      ))}

      {[
        ["सा", 66, 138], ["रे", 120, 138], ["ग", 180, 138], ["म", 240, 138],
        ["प", 124, 228], ["ध", 180, 228], ["नि", 238, 228], ["सां", 284, 228],
        ["ग", 66, 300], ["रे", 120, 300], ["सा", 180, 300],
      ].map(([t, x, y], i) => (
        <text key={i} x={x as number} y={y as number} fontSize="30" fontWeight="700" fill="#0a0a0a" fontFamily="serif">{t}</text>
      ))}

      {boxes.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="6" fill="rgba(0,0,0,0.06)" stroke="#171717" strokeWidth="2" strokeDasharray="5 3" />
          <rect x={b.x} y={b.y - 16} width="38" height="16" rx="4" fill="#171717" />
          <text x={b.x + 5} y={b.y - 4.5} fontSize="10" fill="#fff" fontFamily="monospace">{(0.91 + i * 0.02).toFixed(2)}</text>
        </g>
      ))}
    </svg>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen bg-white text-neutral-900 overflow-hidden selection:bg-neutral-900 selection:text-white">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 w-[640px] h-[640px] rounded-full bg-neutral-100 blur-3xl" />
        <div className="absolute top-[40%] -left-48 w-[520px] h-[520px] rounded-full bg-neutral-200/40 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(#d4d4d4 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "linear-gradient(to bottom, black, transparent 70%)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent 70%)",
          }}
        />
      </div>

      {/* HERO */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-16 lg:pt-24 pb-20 grid lg:grid-cols-2 gap-14 items-center">
        <div className="animate-premium">
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 backdrop-blur px-4 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 animate-pulse" />
            Reads handwritten Indian classical music notation
          </span>

          <h1 className="mt-7 text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.02] tracking-tight">
            Read a <span className="text-neutral-900">swaralipi</span>
            <br />
            in seconds.
          </h1>

          <p className="mt-6 text-lg text-neutral-600 max-w-xl leading-relaxed">
            Take a photo or upload a handwritten manuscript, select the part you want, and Swaralipi Lab
            identifies every swara in Devanagari. Review the result, then export it as PDF, MusicXML or text.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              to="/scan"
              className="group inline-flex items-center gap-3 rounded-2xl bg-neutral-900 px-7 py-4 text-sm font-bold text-white shadow-xl shadow-neutral-900/20 hover:bg-black hover:shadow-neutral-900/20 transition-all duration-300 hover:-translate-y-0.5"
            >
              <ScanLine className="w-5 h-5" />
              Scan a manuscript
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/history"
              className="inline-flex items-center gap-3 rounded-2xl border border-neutral-300 bg-white/70 px-7 py-4 text-sm font-bold text-neutral-800 hover:border-neutral-900 transition-all duration-300"
            >
              <Database className="w-5 h-5" />
              View history
            </Link>
          </div>

          <dl className="mt-12 grid grid-cols-3 gap-4 max-w-lg">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-2xl border border-neutral-200 bg-white/70 backdrop-blur p-4">
                <Icon className="w-4 h-4 text-neutral-900 mb-2" />
                <dt className="text-xl font-extrabold tracking-tight">{value}</dt>
                <dd className="text-[11px] text-neutral-500 font-medium mt-0.5">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Illustration */}
        <div className="relative animate-premium" style={{ animationDelay: "0.15s" }}>
          <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-neutral-100 to-neutral-50 -rotate-3" />
          <div className="relative max-w-md mx-auto lg:ml-auto">
            <ManuscriptArt />
            <div className="absolute -bottom-5 -left-4 sm:-left-10 flex items-center gap-3 rounded-2xl bg-white border border-neutral-200 px-4 py-3 shadow-xl">
              <img src="/logo.svg" alt="" className="w-10 h-10 rounded-xl" />
              <div>
                <p className="text-xs text-neutral-500 font-medium">Detected</p>
                <p className="text-sm font-extrabold">सा रे ग म प ध नि</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Swara ribbon */}
      <div className="relative border-y border-neutral-200 bg-neutral-900 text-neutral-100 py-5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-6 font-serif text-2xl sm:text-3xl">
          {swaras.map((s, i) => (
            <span key={i} className="opacity-80 hover:opacity-100 hover:text-white transition-colors cursor-default">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* TOOLS */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-900">What you can do</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight">Everything you need to digitise a swaralipi</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {tools.map(({ to, title, text, cta, icon: Icon, img, art, dark }) => (
            <Link
              key={to}
              to={to}
              className={`group flex flex-col overflow-hidden rounded-3xl border hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ${
                dark
                  ? "bg-neutral-900 border-neutral-900 text-white hover:shadow-neutral-900/30"
                  : "bg-white border-neutral-200 text-neutral-900 hover:border-neutral-400 hover:shadow-neutral-200"
              }`}
            >
              <div className={`relative h-48 overflow-hidden border-b ${dark ? "border-white/10 bg-neutral-800" : "border-neutral-100 bg-neutral-50"}`}>
                {art ?? (
                  <img
                    src={img}
                    alt={`${title} preview`}
                    loading="lazy"
                    className="absolute left-5 right-5 top-5 w-[calc(100%-2.5rem)] max-w-none rounded-xl border border-neutral-200 shadow-xl object-cover object-top transition-transform duration-500 group-hover:scale-[1.04] group-hover:-translate-y-1"
                  />
  
                )}
                <div className={`absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t ${dark ? "from-neutral-900/70" : "from-white/80"} to-transparent`} />
              </div>
              <div className="flex flex-1 flex-col p-7">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-5 transition-colors ${
                  dark ? "bg-white text-neutral-900" : "bg-neutral-100 text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-extrabold">{title}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${dark ? "text-neutral-400" : "text-neutral-500"}`}>{text}</p>
                <span className="mt-auto pt-6 inline-flex items-center gap-2 text-sm font-bold">
                  {cta} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative bg-neutral-50 border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-900">How it works</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight">Three steps from page to pitch</h2>
            <p className="mt-3 text-neutral-500">No account and no setup. Bring a manuscript and see the result in seconds.</p>
          </div>

          <ol className="grid md:grid-cols-3 gap-x-8 gap-y-0">
            {steps.map(({ n, icon: Icon, title, text, art }, i) => {
              const last = i === steps.length - 1;
              return (
                <li key={n} className="relative flex flex-col">
                  {/* Stepper node + dotted connector */}
                  <div className="relative mb-6 flex items-center">
                    <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-extrabold text-white ring-8 ring-neutral-50">
                      {n}
                    </span>
                    {!last && (
                      <span aria-hidden className="hidden md:block absolute left-12 top-1/2 h-0 w-[calc(100%-1rem)] -translate-y-px border-t-2 border-dashed border-neutral-400" />
                    )}
                  </div>

                  {/* Card */}
                  <div className="group flex flex-1 flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-xl hover:shadow-neutral-200 hover:-translate-y-1 transition-all duration-300">
                    <div className="h-52 border-b border-neutral-100 bg-neutral-50 bg-[radial-gradient(#d4d4d4_1px,transparent_1px)] [background-size:16px_16px]">
                      {art}
                    </div>
                    <div className="p-7">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                          <Icon className="h-4 w-4" />
                        </span>
                        <h3 className="text-xl font-extrabold">{title}</h3>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-neutral-600">{text}</p>
                    </div>
                  </div>

                  {/* Mobile vertical connector */}
                  {!last && (
                    <span aria-hidden className="md:hidden mx-auto my-3 h-10 border-l-2 border-dashed border-neutral-400" />
                  )}
                </li>
              );
            })}
          </ol>

          <div className="mt-12 flex justify-center">
            <Link
              to="/scan"
              className="group inline-flex items-center gap-3 rounded-2xl bg-neutral-900 px-7 py-4 text-sm font-bold text-white hover:bg-black hover:-translate-y-0.5 hover:shadow-xl hover:shadow-neutral-900/20 transition-all duration-300"
            >
              Try it now
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative bg-neutral-900 text-neutral-400">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-8">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <Link to="/" className="inline-flex items-center gap-3">
                <img src="/logo.svg" alt="Swaralipi Lab logo" className="w-10 h-10 rounded-xl ring-1 ring-white/20" />
                <span className="text-lg font-extrabold tracking-tight text-white">Swaralipi Lab</span>
              </Link>
              <p className="mt-5 max-w-sm text-sm leading-relaxed">
                Turn handwritten Indian classical music notation into clean, digital swaras you can review,
                copy and export.
              </p>
              <p className="mt-6 font-serif text-2xl text-white/30 tracking-widest select-none">सा रे ग म प ध नि</p>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Product</h4>
              <ul className="mt-5 space-y-3 text-sm">
                <li><Link to="/scan" className="hover:text-white transition-colors">Scan a manuscript</Link></li>
                <li><Link to="/history" className="hover:text-white transition-colors">Scan history</Link></li>
                <li><Link to="/import" className="hover:text-white transition-colors">Import MusicXML</Link></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Technology</h4>
              <ul className="mt-5 space-y-3 text-sm">
                <li>YOLOv8 detection</li>
                <li>FastAPI backend</li>
                <li>React + TypeScript</li>
                <li>OpenCV refinement</li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white">At a glance</h4>
              <ul className="mt-5 space-y-3 text-sm">
                <li className="flex items-center gap-2"><Languages className="w-4 h-4 text-white" /> 12 swara classes</li>
                <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-white" /> 0.91 mAP@50</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-white" /> PDF, MusicXML, TXT export</li>
              </ul>
            </div>
          </div>

          <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span>© 2026 Swaralipi Lab. Built for Indian classical music.</span>
            <span>Handwritten swaralipi recognition</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
