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
  valueColor?: boolean;
  // Com onClick o card vira botão; active destaca o card selecionado
  onClick?: () => void;
  active?: boolean;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accentColor = "#FF7518",
  valueColor = false,
  onClick,
  active = false,
}: StatCardProps) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      {...(onClick ? { type: "button" as const, onClick, "aria-pressed": active } : {})}
      className={`flex items-center gap-4 rounded-2xl bg-white p-5 text-left shadow-sm ${
        onClick ? "cursor-pointer transition hover:shadow-md" : ""
      }`}
      style={active ? { boxShadow: `0 0 0 2px ${accentColor}` } : undefined}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}
      >
        <Icon size={22} strokeWidth={2} />
      </div>

      <div className="flex flex-col">
        <span className="text-sm text-gray-500">{label}</span>
        <span
          className="text-2xl font-semibold"
          style={{ color: valueColor ? accentColor : "#1F1F1F" }}
        >
          {value}
        </span>

        {trend && (
          <span
            className={`text-xs font-medium ${trend.positive ? "text-emerald-600" : "text-red-500"}`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </Wrapper>
  );
}
