import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  valueColor?: string;
  trend?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconBg = "bg-navy/8",
  iconColor = "text-navy",
  valueColor = "text-navy",
  trend,
}: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        {trend && (
          <span className="text-[11px] font-medium text-muted-foreground">{trend}</span>
        )}
      </div>
      <div className="mt-3">
        <p className={cn("text-stat", valueColor)}>{value}</p>
        <p className="text-[13px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}
