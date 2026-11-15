import type { Notificacao } from "../services/notificacoes";

// Notificações dispensadas no X. Elas são calculadas na hora pelo backend
// (não ficam guardadas), então o "dispensar" fica no navegador, por usuário.
// Guarda o tipo junto: se a notificação piorar (revisão próxima virou vencida),
// ela volta a aparecer.
type Dispensadas = Record<string, Notificacao["tipo"]>;

function chave(usuarioId: number) {
  return `@autos:notificacoes-dispensadas:${usuarioId}`;
}

export function lerDispensadas(usuarioId: number): Dispensadas {
  try {
    const salvo = localStorage.getItem(chave(usuarioId));
    return salvo ? (JSON.parse(salvo) as Dispensadas) : {};
  } catch {
    return {};
  }
}

export function salvarDispensadas(usuarioId: number, dispensadas: Dispensadas) {
  try {
    localStorage.setItem(chave(usuarioId), JSON.stringify(dispensadas));
  } catch {
    // Navegador sem armazenamento (aba anônima, por exemplo): só não lembra
  }
}

export function estaDispensada(n: Notificacao, dispensadas: Dispensadas) {
  return dispensadas[n.id] === n.tipo;
}

// Esquece as dispensadas que não estão mais na lista (o problema foi
// resolvido). Assim, se acontecer de novo, a notificação aparece.
export function limparResolvidas(
  dispensadas: Dispensadas,
  atuais: Notificacao[],
): Dispensadas {
  const ids = new Set(atuais.map((n) => n.id));
  return Object.fromEntries(
    Object.entries(dispensadas).filter(([id]) => ids.has(id)),
  ) as Dispensadas;
}
