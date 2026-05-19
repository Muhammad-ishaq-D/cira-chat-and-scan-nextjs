import { ScanFace } from "lucide-react";

interface FaceScanTopButtonProps {
  onClick: () => void;
  label?: string;
}

/**
 * Sticky top "Face Scan" CTA used in chat surfaces.
 * Features an animated conic-gradient border for emphasis.
 */
export default function FaceScanTopButton({ onClick, label = "Face Scan" }: FaceScanTopButtonProps) {
  return (
    <button
      onClick={onClick}
      title="Start Face Scan"
      className="relative group active:scale-[0.97] transition-transform"
    >
      {/* Animated gradient border */}
      <span
        aria-hidden
        className="absolute -inset-[2px] rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"
        style={{
          background:
            "conic-gradient(from 0deg, #10b981, #06b6d4, #8b5cf6, #ec4899, #f59e0b, #10b981)",
          animation: "spin 4s linear infinite",
          filter: "blur(0.5px)",
        }}
      />
      {/* Soft glow */}
      <span
        aria-hidden
        className="absolute -inset-2 rounded-2xl opacity-40 group-hover:opacity-60 blur-md transition-opacity"
        style={{
          background:
            "conic-gradient(from 0deg, #10b981, #06b6d4, #8b5cf6, #ec4899, #f59e0b, #10b981)",
          animation: "spin 4s linear infinite",
        }}
      />
      {/* Inner pill */}
      <span className="relative flex items-center gap-2 px-3.5 h-9 rounded-2xl bg-white text-foreground text-xs font-semibold font-body shadow-sm">
        <ScanFace size={16} strokeWidth={1.8} className="text-emerald-600" />
        {label}
      </span>
    </button>
  );
}
