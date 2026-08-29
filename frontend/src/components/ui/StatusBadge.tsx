type Status =
  | "pendente"
  | "em_andamento"
  | "concluido"
  | "fechada"
  | "cancelado"
  | "atrasado";

const statusConfig: Record<Status, { label: string; className: string }> = {
  pendente: {
    label: "Pendente",
    className: "bg-amber-100 text-amber-700",
  },
  em_andamento: {
    label: "Em Andamento",
    className: "bg-amber-100 text-amber-700",
  },
  concluido: {
    label: "Concluído",
    className: "bg-emerald-100 text-emerald-700",
  },
  fechada: {
    label: "Fechada",
    className: "bg-emerald-100 text-emerald-700",
  },
  cancelado: {
    label: "Cancelada",
    className: "bg-red-100 text-red-700",
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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}