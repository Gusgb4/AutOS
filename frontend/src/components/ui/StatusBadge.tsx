type Status = "ABERTA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA";

const statusConfig: Record<Status, { label: string; className: string }> = {
  ABERTA: {
    label: "Aberta",
    className: "bg-blue-100 text-blue-700",
  },
  EM_ANDAMENTO: {
    label: "Em Andamento",
    className: "bg-amber-100 text-amber-700",
  },
  FINALIZADA: {
    label: "Finalizada",
    className: "bg-emerald-100 text-emerald-700",
  },
  CANCELADA: {
    label: "Cancelada",
    className: "bg-red-100 text-red-700",
  },
};

interface StatusBadgeProps {
  status: Status;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
