import { expect, type Locator, type Page } from "@playwright/test";

// Dados cadastrados por backend/src/scripts/e2e-preparar.ts: mudou lá, muda aqui
export const E2E = {
  dono: { email: "dono.e2e@teste.com", senha: "senhaE2E123" },
  funcionario: { email: "funcionario.e2e@teste.com", senha: "senhaE2E123" },
  cliente: "Cliente E2E",
  veiculo: "E2E0001 — Fiat Uno",
  peca: "Filtro de óleo E2E",
};

export async function entrar(page: Page, usuario: { email: string; senha: string }) {
  await page.goto("/login");
  await page.getByPlaceholder("você@email.com").fill(usuario.email);
  await page.getByPlaceholder("Coloque sua senha").fill(usuario.senha);
  await page.getByRole("button", { name: /Continue para o Menu/ }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

// Os rótulos das telas ficam ao lado do campo (sem htmlFor): acha o rótulo
// pelo texto e pega o campo dentro do mesmo bloco
export function campo(page: Page | Locator, rotulo: string): Locator {
  const texto = rotulo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return page
    .locator("label")
    .filter({ hasText: new RegExp(`^\\s*${texto}(\\s|\\(|$)`) })
    .first()
    .locator("xpath=..")
    .locator("input, select, textarea")
    .first();
}

// Valor em destaque logo abaixo do texto "Valor total da OS"
export function valorTotalDaOs(page: Page): Locator {
  return page.getByText("Valor total da OS").locator("xpath=following-sibling::p[1]");
}
