import { isAxiosError } from "axios";

/**
 * Extrai a mensagem de erro vinda do backend (ou devolve o texto padrão).
 * O backend usa `erro` nas rotas com AppError e `error` em outras (login,
 * estoque); erros de validação do Zod vêm em `errors[0].message`.
 */
export function mensagemDeErro(err: unknown, padrao: string): string {
  if (isAxiosError(err)) {
    const dados = err.response?.data as
      | { erro?: string; error?: string; errors?: { message?: string }[] }
      | undefined;
    return (
      dados?.erro || dados?.error || dados?.errors?.[0]?.message || padrao
    );
  }
  return padrao;
}
