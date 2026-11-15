import { expect, test } from "@playwright/test";
import { E2E, campo, entrar } from "./dados";

test("cadastra cliente já com veículo e lembrete, e abre o perfil", async ({ page }) => {
  await entrar(page, E2E.dono);
  await page.goto("/clientes");

  await page.getByRole("button", { name: "Adicionar Cliente" }).click();
  await campo(page, "Nome completo").fill("Maria Teste E2E");
  await campo(page, "Telefone").fill("47988887777");

  // Cadastro rápido do veículo, no mesmo formulário
  await page.getByRole("button", { name: /Adicionar veículo agora/ }).click();
  await campo(page, "Marca").fill("VW");
  await campo(page, "Modelo").fill("Gol");
  await campo(page, "Placa").fill("e2e0002");
  await campo(page, "Ano").fill("2012");
  await campo(page, "Quilometragem (KM)").fill("85000");
  await page.getByRole("button", { name: "+ Troca de óleo" }).click();

  await page.getByRole("button", { name: "Salvar Cliente" }).click();

  await page.getByText("Maria Teste E2E").first().click();
  await expect(page).toHaveURL(/\/clientes\/\d+$/);
  // Placa salva em maiúsculas e lembrete criado
  await expect(page.getByText("E2E0002").first()).toBeVisible();
  await expect(page.getByText(/Troca de óleo:/)).toBeVisible();
});
