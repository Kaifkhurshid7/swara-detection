import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { importNotation, type ImportResponse } from "../api/client";
import NeuralTooltip from "../components/NeuralTooltip";
import { Loader2, ArrowLeft, Terminal, FileCode2, Play, AlertCircle, Music2, Code2 } from "lucide-react";

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>

  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>

      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>

      <note>
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>

      <note>
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>

      <note>
        <pitch>
          <step>F</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>`;

export default function Import() {
    const navigate = useNavigate();
    const format = "musicxml";
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleImport = async () => {
        if (!content.trim()) return;
        setLoading(true);
        setResult(null);
        setError(null);
        try {
            const data = await importNotation(format, content);
            setResult(data);
        } catch (err: any) {
            setError(err.message || "Failed to parse notation.");
        } finally {
            setLoading(false);
        }
    };

    const loadSample = () => {
        setContent(SAMPLE_XML);
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

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-10 lg:py-14">
        <button
          onClick={() => navigate("/")}
          className="group inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to home
        </button>

        <header className="mt-8 flex flex-wrap items-end justify-between gap-6 animate-premium">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-900">MusicXML import</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight">Convert notes to swaras</h1>
            <p className="mt-4 text-lg text-neutral-600 leading-relaxed">
              Paste a MusicXML score and we will turn its Western notes (C D E F G A B) into Sa Re Ga Ma Pa Dha Ni, including komal and tivra.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700">
            <FileCode2 className="h-4 w-4" /> MusicXML
          </span>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px] items-stretch">
          {/* Input */}
          <section className="flex min-h-[420px] flex-col rounded-3xl border border-neutral-200 bg-white p-6 shadow-card focus-within:border-neutral-400 transition-colors animate-premium" style={{ animationDelay: "0.1s" }}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-neutral-900" />
                <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-900">Your MusicXML</h2>
              </div>
              <button
                onClick={loadSample}
                className="rounded-full border border-neutral-200 px-4 py-1.5 text-xs font-bold text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
              >
                Try a sample
              </button>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Paste your MusicXML here, or click "Try a sample" to see how it works...`}
              className="min-h-[280px] w-full flex-1 resize-none rounded-2xl border border-neutral-200 bg-neutral-50 p-5 font-mono text-sm leading-relaxed text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white transition-colors"
              style={{ tabSize: 2 }}
            />

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                onClick={() => { setContent(""); setResult(null); setError(null); }}
                disabled={!content && !result}
                className="text-xs font-bold text-neutral-500 hover:text-neutral-900 disabled:opacity-40 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleImport}
                disabled={!content.trim() || loading}
                className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-bold text-white hover:bg-black active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-neutral-900 transition-all"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                <span>Convert</span>
              </button>
            </div>
          </section>

          {/* Output */}
          <section className="flex min-h-[420px] flex-col rounded-3xl border border-neutral-200 bg-white p-6 shadow-card animate-premium" style={{ animationDelay: "0.2s" }}>
            <div className="mb-4 flex items-center gap-2">
              <Music2 className="h-4 w-4 text-neutral-900" />
              <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-900">Swara notation</h2>
            </div>

            <div className="flex-1 overflow-y-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
              {loading ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-neutral-500">
                  <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
                  <p className="text-sm font-semibold">Converting...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col gap-2 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-extrabold">Something went wrong</span>
                  </div>
                  <p className="text-sm">{error}</p>
                </div>
              ) : result?.swaras ? (
                result.swaras.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-4">
                      {result.swaras.map((swara, idx) => (
                        <NeuralTooltip key={idx} hindiSymbol={swara.hindi_symbol} englishName={swara.english_name} confidence={1.0} inline />
                      ))}
                    </div>

                    <div className="border-t border-neutral-200 pt-6">
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Note by note</h3>
                      <ul className="space-y-2">
                        {result.swaras.map((swara, idx) => (
                          <li key={idx} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-sm text-neutral-600">
                            <span>Note {idx + 1}</span>
                            <span className="font-extrabold text-neutral-900">{swara.english_name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <p className="text-sm font-extrabold text-neutral-900">No notes found</p>
                    <p className="mt-1 text-xs text-neutral-500">Check that your MusicXML contains note pitches.</p>
                  </div>
                )
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-neutral-400">
                  <Code2 className="h-10 w-10 stroke-[1.25]" />
                  <p className="max-w-[220px] text-sm font-medium">Your converted notation will appear here</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
