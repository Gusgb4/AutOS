import type { StatusPagamento } from "../../services/serviceOrders";

const pagamentoConfig: Record<
  StatusPagamento,
  { label: string; className: string }
> = {
  PENDENTE: {
    label: "Pendente",
    className: "bg-red-100 text-red-700",
  },
  PARCIAL: {
    label: "Parcial",
    className: "bg-amber-100 text-amber-700",
  },
  PAGO: {
    label: "Pago",
    className: "bg-emerald-100 text-emerald-700",
  },
};

interface PagamentoBadgeProps {
  status: StatusPagamento;
}

export default function PagamentoBadge({ status }: PagamentoBadgeProps) {
  const config = pagamentoConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
