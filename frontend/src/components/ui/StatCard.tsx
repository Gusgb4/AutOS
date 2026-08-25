import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive?: boolean;
  };
  accentColor?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accentColor = "#FF7518",
}: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}
      >
        <Icon size={22} strokeWidth={2} />
      </div>

      <div className="flex flex-col">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-2xl font-semibold text-[#1F1F1F]">{value}</span>

        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.positive ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}