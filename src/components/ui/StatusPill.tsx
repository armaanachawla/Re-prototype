import { CheckCircle2, CircleDashed, Equal, MessageCircle, Radar, TrendingDown, TrendingUp, Target, Loader } from "lucide-react";
import type { StatusKind } from "@/lib/recovery";

const STYLES: Record<StatusKind, { icon: typeof CheckCircle2; cls: string; label: string }> = {
  improving: { icon: TrendingUp, cls: "bg-sage-soft text-sage-deep", label: "Improving compared with last assessment" },
  consistent: { icon: Equal, cls: "bg-sand-soft text-sand-deep", label: "Staying consistent" },
  lower: { icon: TrendingDown, cls: "bg-terracotta-soft text-terracotta-deep", label: "Lower than last assessment" },
  "not-reached": { icon: CircleDashed, cls: "bg-terracotta-soft text-terracotta-deep", label: "Goal not yet reached" },
  reached: { icon: Target, cls: "bg-sage-soft text-sage-deep", label: "Reached" },
  discuss: { icon: MessageCircle, cls: "bg-rose-soft text-rose-deep", label: "Worth discussing at your next appointment" },
  completed: { icon: CheckCircle2, cls: "bg-sage-soft text-sage-deep", label: "Completed" },
  "in-progress": { icon: Loader, cls: "bg-cream text-taupe", label: "In progress" },
  tracking: { icon: Radar, cls: "bg-cream text-taupe", label: "Tracking" },
};

/** Status label that always pairs colour with an icon and words, never colour alone. */
export function StatusPill({ kind, label, className = "" }: { kind: StatusKind; label?: string; className?: string }) {
  const s = STYLES[kind];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium ${s.cls} ${className}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label ?? s.label}
    </span>
  );
}
