import { isAxiosError } from "axios";

/** Extrai a mensagem de erro vinda do backend (ou devolve o texto padrão). */
export function mensagemDeErro(err: unknown, padrao: string): string {
  if (isAxiosError(err)) {
    const dados = err.response?.data as
      | { erro?: string; errors?: { message?: string }[] }
      | undefined;
    return dados?.erro || dados?.errors?.[0]?.message || padrao;
  }
  return padrao;
}