import { expect, test } from "@playwright/test";
import { E2E, entrar } from "./dados";

test("resumo financeiro mostra os gráficos e compara com o ano passado", async ({ page }) => {
  await entrar(page, E2E.dono);
  await page.goto("/relatorios");

  await page.getByRole("button", { name: /Resumo financeiro/ }).click();
  await expect(page.getByText("Entradas e saídas", { exact: true })).toBeVisible();
  await expect(page.getByText("Do que vem o faturamento", { exact: true })).toBeVisible();

  // O relatório abre no mês atual; o ano passado começa no dia 1 do mesmo mês
  const [, mes, ano] = new Date()
    .toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
    .split("/");
  await page.getByRole("radio", { name: "Mesmo período do ano passado" }).click();
  await expect(
    page.getByText(new RegExp(`Comparado com 01/${mes}/${Number(ano) - 1}`)).first(),
  ).toBeVisible();
});
