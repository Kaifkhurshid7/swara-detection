import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { importNotation, type ImportResponse } from "../api/client";
import NeuralTooltip from "../components/NeuralTooltip";
import { Loader2, ArrowLeft, Terminal, FileCode2, Play, AlertCircle, Music2, Code2 } from "lucide-react";

const SAMPLE_XML = `<score-partwise>
  <part id="P1">
    <measure number="1">
      <note><pitch><step>C</step><alter>0</alter></pitch></note>
      <note><pitch><step>D</step><alter>-1</alter></pitch></note>
      <note><pitch><step>E</step><alter>0</alter></pitch></note>
      <note><pitch><step>F</step><alter>1</alter></pitch></note>
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
        <div className="relative min-h-screen bg-[#FDFDFD] flex flex-col font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />

            <header className="relative z-10 px-8 py-6 border-b border-neutral-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate("/")} className="p-2.5 rounded-lg border border-neutral-200 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-all shadow-sm">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-neutral-900 tracking-tight">Parser Engine</h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1">MusicXML Ingestion</p>
                    </div>
                </div>
                <div className="flex bg-neutral-100/50 p-1 rounded-xl border border-neutral-200 shadow-sm">
                    <button
                        onClick={() => { setContent(""); setResult(null); }}
                        className={`flex items-center gap-2 px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all bg-white shadow-sm text-neutral-900`}
                    >
                        <FileCode2 className="w-3.5 h-3.5" /> MusicXML
                    </button>
                </div>
            </header>

            <main className="flex-1 relative z-10 p-8 lg:p-12 flex flex-col lg:flex-row gap-8 max-w-[1600px] mx-auto w-full">

                {/* LEFT COLUMN: EDITOR */}
                <div className="flex-1 flex flex-col min-w-[50%]">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-neutral-400">
                            <Terminal className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Source Code</span>
                        </div>
                        <button onClick={loadSample} className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors">
                            Load Sample Data
                        </button>
                    </div>

                    <div className="flex-1 rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden flex flex-col relative focus-within:border-neutral-400 transition-colors">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={`Paste MusicXML data here...`}
                            className="flex-1 w-full bg-transparent p-6 font-mono text-sm leading-relaxed text-neutral-700 outline-none resize-none placeholder:text-neutral-300"
                            style={{ tabSize: 2 }}
                        />
                        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end">
                            <button
                                onClick={handleImport}
                                disabled={!content.trim() || loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 disabled:hover:bg-neutral-900"
                            >
                                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                <span>Compile</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: RESULTS */}
                <div className="w-full lg:w-[480px] flex flex-col">
                    <div className="mb-4 flex items-center gap-2 text-neutral-400">
                        <Music2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Parsed Notation</span>
                    </div>

                    <div className="flex-1 rounded-2xl border border-neutral-200 bg-white shadow-sm p-8 overflow-y-auto">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center text-neutral-300 space-y-4">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Parsing DOM...</p>
                            </div>
                        ) : error ? (
                            <div className="rounded-xl p-6 border border-red-100 bg-red-50 text-red-700 flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="font-bold text-xs uppercase tracking-wide">Error</span>
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

                                    <div className="pt-8 mt-8 border-t border-neutral-100">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">AST Mapping Summary</h4>
                                        <ul className="space-y-2">
                                            {result.swaras.map((swara, idx) => (
                                                <li key={idx} className="flex justify-between items-center text-xs font-mono p-2 rounded bg-neutral-50 text-neutral-600">
                                                    <span>Node {idx}</span>
                                                    <span className="font-bold text-neutral-900 border-b border-neutral-200 pb-0.5">{swara.english_name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-center">
                                    <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest italic">No swaras detected in output. <br /><span className="normal-case opacity-70">Check schema formatting.</span></p>
                                </div>
                            )
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-neutral-200 space-y-4">
                                <Code2 className="w-12 h-12 stroke-[1]" />
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Awaiting Output</p>
                            </div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}
