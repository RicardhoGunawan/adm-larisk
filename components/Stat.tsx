import { Card, CardContent } from "@/components/ui/Card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const tones = {
    default: "bg-muted text-foreground",
    good: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-700",
    bad: "bg-red-100 text-red-700",
  } as const;
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <p className="text-[13px] font-medium text-muted-foreground leading-tight">{label}</p>
        </div>
        <p className="mt-3 text-xl sm:text-2xl font-bold tracking-tight break-words">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{hint}</p>}
      </CardContent>
    </Card>
  );
}
