import type { Vehicle } from "../services/vehicles";

/**
 * Uma revisão está vencida quando a data prevista já passou
 * OU a quilometragem atual já alcançou o km previsto.
 * (Mesma regra que já existia no perfil do cliente.)
 */
export function isMaintenanceOverdue(
  vehicle: Pick<Vehicle, "lembrete_manutencao" | "quilometragem_atual">,
): boolean {
  const lembrete = vehicle.lembrete_manutencao;
  if (!lembrete) return false;

  const dataVencida = new Date(lembrete.proxima_data) <= new Date();
  const kmVencido = (vehicle.quilometragem_atual ?? 0) >= lembrete.proximo_km;

  return dataVencida || kmVencido;
}   