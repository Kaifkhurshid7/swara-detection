import { Cpu } from "lucide-react";

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
  return (
    <div
      className={`flex flex-col gap-2 min-w-[180px] rounded-xl border border-neutral-200 bg-white shadow-cardHover p-4 ${
        inline ? "" : "absolute z-50"
      }`}
      style={inline ? undefined : { left: `${Math.max(8, left)}px`, top: `${Math.max(8, top)}px` }}
    >
      <div className="flex items-center gap-2 text-neutral-500 text-xs font-medium uppercase tracking-wider">
        <Cpu className="w-3.5 h-3.5" />
        <span>Detection</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-neutral-400 hover:text-neutral-600"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
      <div className="text-3xl font-semibold text-neutral-900" style={{ fontFamily: "serif" }}>
        {hindiSymbol}
      </div>
      <div className="text-sm text-neutral-600">{englishName}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-neutral-900 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-neutral-500 tabular-nums font-medium">{pct}%</span>
      </div>
    </div>
  );
}
