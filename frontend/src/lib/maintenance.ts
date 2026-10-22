import type { MaintenanceReminder, Vehicle } from "../services/vehicles";

/**
 * Um lembrete está vencido quando a data prevista já passou
 * OU a quilometragem atual já alcançou o km previsto.
 * (Mesma regra das notificações.)
 */
export function isLembreteVencido(
  lembrete: Pick<MaintenanceReminder, "proxima_data" | "proximo_km">,
  quilometragemAtual: number | undefined,
): boolean {
  const dataVencida = new Date(lembrete.proxima_data) <= new Date();
  const kmVencido = (quilometragemAtual ?? 0) >= lembrete.proximo_km;
  return dataVencida || kmVencido;
}

/** O veículo tem pelo menos um lembrete vencido. */
export function isMaintenanceOverdue(
  vehicle: Pick<Vehicle, "lembretes" | "quilometragem_atual">,
): boolean {
  return (vehicle.lembretes ?? []).some((l) =>
    isLembreteVencido(l, vehicle.quilometragem_atual),
  );
}   