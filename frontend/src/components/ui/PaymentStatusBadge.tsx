import type { StatusPagamento } from "../../services/serviceOrders";

const statusConfig: Record<
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

interface PaymentStatusBadgeProps {
  status: StatusPagamento;
}

export default function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
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
