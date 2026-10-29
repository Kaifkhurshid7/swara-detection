import { X } from "lucide-react";

interface NeuralTooltipProps {
  hindiSymbol: string;
  englishName: string;
  confidence: number;
  left?: number;
  top?: number;
  inline?: boolean;
  onClose?: () => void;
}

export default function NeuralTooltip({
  hindiSymbol,
  englishName,
  confidence,
  left = 0,
  top = 0,
  inline = false,
  onClose,
}: NeuralTooltipProps) {
  const pct = Math.round(confidence * 100);
  const inlineClasses = inline
    ? "min-w-[148px] max-w-[180px] gap-2.5 p-3 bg-white border border-neutral-200 rounded-2xl shadow-sm"
    : "min-w-[220px] gap-4 p-6 absolute z-50 glass-card rounded-[2.5rem] shadow-2xl animate-premium";

  return (
    <div
      className={`flex flex-col transition-all duration-500 ${inlineClasses}`}
      style={inline ? undefined : { left: `${Math.max(8, left)}px`, top: `${Math.max(8, top)}px` }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between ${inline ? "pb-0 min-h-0" : "border-b border-neutral-100 pb-3"}`}>
        <div className="flex items-center gap-2">
          {/* <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-neutral-100 text-neutral-900">
            <Zap className="w-3 h-3 fill-current" />
          </div> */}
          {/* <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">Neural Insight</span> */}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-neutral-300 hover:text-neutral-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Symbol Area */}
      <div className={`flex items-center ${inline ? "gap-3" : "gap-5"}`}>
        <div className={`${inline ? "text-3xl" : "text-4xl"} font-black text-neutral-900 leading-none`} style={{ fontFamily: "serif" }}>
          {hindiSymbol}
        </div>
        <div className="flex flex-col">
          <span className={`${inline ? "text-[8px]" : "text-[10px]"} font-black uppercase tracking-widest text-neutral-400 leading-none mb-1`}>Classification</span>
          <span className={`${inline ? "text-[15px]" : "text-sm"} font-bold text-neutral-900 leading-tight`}>{englishName}</span>
        </div>
      </div>

      {/* Confidence Module */}
      <div className={`${inline ? "space-y-1.5" : "space-y-2"}`}>
        <div className={`flex items-center justify-between ${inline ? "text-[8px]" : "text-[9px]"} font-black uppercase tracking-widest text-neutral-400`}>
          <span>Accuracy</span>
          <span className="text-neutral-900">{pct}%</span>
        </div>
        <div className={`${inline ? "h-1" : "h-1.5"} w-full bg-neutral-100 rounded-full overflow-hidden`}>
          <div
            className="h-full rounded-full transition-all duration-1000 bg-neutral-900"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
