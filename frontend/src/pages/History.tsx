import { useCallback, useEffect, useMemo, useState } from "react";
import { getHistory, getUserFacingApiError, type HistoryScan } from "../api/client";
import { Link } from "react-router-dom";
import {
  Music2,
  AlertCircle,
  Clock,
  FileSearch,
  ArrowRight,
  BarChart3,
  Search,
  RefreshCw,
  X,
  Layers,
  Gauge,
  Trophy,
} from "lucide-react";

type SortKey = "newest" | "high" | "low";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "high", label: "Highest confidence" },
  { key: "low", label: "Lowest confidence" },
];

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

/** Map a 0-100 confidence to a label and colour set. */
function confidenceTone(pct: number) {
  if (pct >= 80) {
    return { label: "High", bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (pct >= 60) {
    return { label: "Medium", bar: "bg-amber-500", chip: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  return { label: "Low", bar: "bg-red-500", chip: "bg-red-50 text-red-700 border-red-200" };
}

function SkeletonCard() {
  return (
    <div className="flex animate-pulse flex-col items-center gap-6 rounded-3xl border border-neutral-200 bg-white p-5 md:flex-row">
      <div className="h-28 w-28 rounded-2xl bg-neutral-100" />
      <div className="w-full flex-1 space-y-4">
        <div className="mx-auto h-3 w-32 rounded-full bg-neutral-100 md:mx-0" />
        <div className="mx-auto h-12 w-48 rounded-xl bg-neutral-100 md:mx-0" />
      </div>
      <div className="h-20 w-full rounded-2xl bg-neutral-100 md:w-56" />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: typeof Layers; label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-neutral-200 bg-white p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">{label}</p>
        <p className="truncate text-2xl font-extrabold leading-tight text-neutral-900">{value}</p>
        {hint && <p className="truncate text-xs font-semibold text-neutral-500">{hint}</p>}
      </div>
    </div>
  );
}

export default function History() {
  const [scans, setScans] = useState<HistoryScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [swaraFilter, setSwaraFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("newest");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getHistory()
      .then((res) => setScans(res.scans || []))
      .catch((err) => setError(getUserFacingApiError(err, "history")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Scan number is fixed by arrival order (API returns newest first), so it
  // stays stable while the list is filtered or re-sorted.
  const numbering = useMemo(() => {
    const map = new Map<number, number>();
    scans.forEach((s, idx) => map.set(s.id, scans.length - idx));
    return map;
  }, [scans]);

  const stats = useMemo(() => {
    if (scans.length === 0) return null;
    const avg = scans.reduce((sum, s) => sum + s.confidence, 0) / scans.length;
    const counts = new Map<string, number>();
    scans.forEach((s) => {
      if (s.class_name) counts.set(s.class_name, (counts.get(s.class_name) || 0) + 1);
    });
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return { avg: Math.round(avg * 100), top };
  }, [scans]);

  const swaraChips = useMemo(() => {
    const counts = new Map<string, number>();
    scans.forEach((s) => {
      if (s.class_name) counts.set(s.class_name, (counts.get(s.class_name) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [scans]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = scans.filter((s) => {
      if (swaraFilter && s.class_name !== swaraFilter) return false;
      if (!q) return true;
      return (s.class_name || "").toLowerCase().includes(q) || (s.hindi_symbol || "").includes(q);
    });
    if (sort === "high") list = [...list].sort((a, b) => b.confidence - a.confidence);
    if (sort === "low") list = [...list].sort((a, b) => a.confidence - b.confidence);
    return list;
  }, [scans, query, swaraFilter, sort]);

  const filtersActive = query.trim() !== "" || swaraFilter !== null;
  const clearFilters = () => {
    setQuery("");
    setSwaraFilter(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-neutral-50 font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-neutral-200/60 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(#d4d4d4 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "linear-gradient(to bottom, black, transparent 60%)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent 60%)",
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
        <header className="flex flex-wrap items-end justify-between gap-6 animate-premium">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-900">History</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight">Your recent scans</h1>
            <p className="mt-4 text-lg text-neutral-600 leading-relaxed">
              Every symbol you have scanned, with the swara we found and how confident we were.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              aria-label="Refresh history"
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700 transition-all hover:border-neutral-400 hover:text-neutral-900 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              to="/scan"
              className="group inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-bold text-white hover:bg-black hover:-translate-y-0.5 transition-all"
            >
              New scan
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </header>

        {/* Summary */}
        {!loading && !error && stats && (
          <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Summary">
            <StatCard icon={Layers} label="Total scans" value={String(scans.length)} />
            <StatCard icon={Gauge} label="Average confidence" value={`${stats.avg}%`} hint={confidenceTone(stats.avg).label} />
            <StatCard
              icon={Trophy}
              label="Most scanned"
              value={stats.top ? stats.top[0] : "-"}
              hint={stats.top ? `${stats.top[1]} ${stats.top[1] === 1 ? "scan" : "scans"}` : undefined}
            />
          </section>
        )}

        {/* Controls */}
        {!loading && !error && scans.length > 0 && (
          <section className="mt-8 space-y-4" aria-label="Filters">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Search scans</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by swara name or symbol"
                  className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-11 pr-10 text-sm font-semibold text-neutral-900 placeholder:font-medium placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </label>
              <label className="sm:w-60">
                <span className="sr-only">Sort scans</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-900 focus:border-neutral-900 focus:outline-none"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSwaraFilter(null)}
                className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ${
                  swaraFilter === null
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
                }`}
              >
                All
              </button>
              {swaraChips.map(([name, count]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSwaraFilter(swaraFilter === name ? null : name)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-colors ${
                    swaraFilter === name
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  {name} <span className="opacity-60">{count}</span>
                </button>
              ))}
            </div>

            <p className="text-xs font-semibold text-neutral-500">
              Showing {visible.length} of {scans.length} {scans.length === 1 ? "scan" : "scans"}
            </p>
          </section>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-4" aria-busy="true" aria-label="Loading your scans">
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center rounded-3xl border border-red-200 bg-white p-12 text-center shadow-card">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-extrabold">Unable to load your history</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-500">{error}</p>
              <button
                type="button"
                onClick={load}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-black"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
              <span className="mt-4 text-xs font-semibold text-neutral-500">
                If this keeps happening, check that the backend is running
              </span>
            </div>
          ) : scans.length === 0 ? (
            <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-neutral-300 bg-white/70 p-16 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
                <FileSearch className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-extrabold">No scans yet</h3>
              <p className="mt-2 text-sm text-neutral-500">Scan a manuscript and your results will show up here.</p>
              <Link
                to="/scan"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-bold text-white hover:bg-black transition-colors"
              >
                Scan a manuscript
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-neutral-300 bg-white/70 p-14 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-extrabold">No scans match your filters</h3>
              <p className="mt-2 text-sm text-neutral-500">Try a different swara or clear the search.</p>
              {filtersActive && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-black"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {visible.map((s) => {
                const pct = Math.round(s.confidence * 100);
                const tone = confidenceTone(pct);
                return (
                  <div
                    key={s.id}
                    className="group flex flex-col items-center gap-6 rounded-3xl border border-neutral-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-400 hover:shadow-xl hover:shadow-neutral-200 md:flex-row"
                  >
                    <div className="relative">
                      <span className="absolute -left-2 -top-2 z-10 flex h-7 min-w-7 items-center justify-center rounded-full bg-neutral-900 px-1.5 text-[10px] font-extrabold text-white">
                        {(numbering.get(s.id) ?? 0).toString().padStart(2, "0")}
                      </span>
                      <div className="h-28 w-28 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
                        {s.image_crop_base64 ? (
                          <img
                            src={`data:image/png;base64,${s.image_crop_base64}`}
                            alt="Scanned symbol"
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Music2 className="h-8 w-8 text-neutral-300" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <div className="mb-3 flex items-center justify-center gap-2 text-neutral-400 md:justify-start">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold">{formatTime(s.timestamp)}</span>
                      </div>
                      <div className="flex flex-col items-center gap-3 md:flex-row md:items-end md:gap-6">
                        <h2 className="font-serif text-6xl font-bold leading-none text-neutral-900">{s.hindi_symbol || "∅"}</h2>
                        <div>
                          <span className="block text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Swara</span>
                          <span className="text-xl font-extrabold text-neutral-900">{s.class_name || "Undefined"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full rounded-2xl bg-neutral-50 p-4 md:w-56">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">
                          <BarChart3 className="h-3.5 w-3.5" />
                          Confidence
                        </div>
                        <span className="text-sm font-extrabold text-neutral-900">{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                        <div className={`h-full rounded-full transition-all duration-700 ${tone.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`mt-3 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone.chip}`}>
                        {tone.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
