import { expect, test } from "@playwright/test";
import { E2E, entrar } from "./dados";

test("lança uma despesa com categoria e estorna", async ({ page }) => {
  await entrar(page, E2E.dono);
  await page.goto("/financeiro");

  await page.getByRole("button", { name: "Novo Lançamento" }).click();
  await page.getByRole("button", { name: "Despesa", exact: true }).click();
  await page
    .locator("select", { has: page.locator("option", { hasText: "Escolha a categoria" }) })
    .selectOption({ label: "Energia" });
  await page.getByPlaceholder("Ex: Compra de óleo lubrificante").fill("Conta de luz E2E");
  // Campo type="number": o Playwright só aceita o número no formato do navegador
  await page.getByPlaceholder("0,00").fill("150");
  await page.getByRole("button", { name: "Salvar Lançamento" }).click();

  const linha = page.getByRole("row", { name: /Conta de luz E2E/ });
  await expect(linha).toBeVisible();

  // Estorno pede confirmação na própria linha; o estornado sai da lista
  await linha.getByRole("button", { name: /Estornar/ }).click();
  await linha.getByRole("button", { name: "Sim" }).click();
  await expect(linha).toHaveCount(0);
});
