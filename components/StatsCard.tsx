import { Card } from "@/components/ui/Card";

export function StatsCard({
  label,
  value,
  sub,
  trend,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-4 sm:p-5 flex flex-col min-w-0">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 leading-tight">{label}</p>
        {icon && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 border border-zinc-200">{icon}</span>}
      </div>
      <p className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 break-words">{value}</p>
      {sub && <p className="mt-1 text-xs font-medium leading-relaxed text-zinc-600 line-clamp-2">{sub}</p>}
      {trend && <p className="mt-2 text-xs font-semibold text-emerald-700">{trend}</p>}
    </Card>
  );
}
