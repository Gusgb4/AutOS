import { Lock } from "lucide-react";

interface DisabledBadgeProps {
  label?: string;
}

export default function DisabledBadge({
  label = "Desativado",
}: DisabledBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-400">
      <Lock size={11} />
      {label}
    </span>
  );
}