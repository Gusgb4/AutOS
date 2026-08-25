type Status =
  | "pendente"
  | "em_andamento"
  | "concluido"
  | "cancelado"
  | "atrasado";

const statusConfig: Record<Status, { label: string; className: string }> = {
  pendente: {
    label: "Pendente",
    className: "bg-amber-100 text-amber-700",
  },
  em_andamento: {
    label: "Em andamento",
    className: "bg-blue-100 text-blue-700",
  },
  concluido: {
    label: "Concluído",
    className: "bg-emerald-100 text-emerald-700",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-gray-100 text-gray-600",
  },
  atrasado: {
    label: "Atrasado",
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
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}