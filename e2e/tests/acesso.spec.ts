import { expect, test } from "@playwright/test";
import { E2E, entrar } from "./dados";

test.describe("Acesso e permissões", () => {
  test("senha errada mostra o erro e continua no login", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("você@email.com").fill(E2E.dono.email);
    await page.getByPlaceholder("Coloque sua senha").fill("senha_errada");
    await page.getByRole("button", { name: /Continue para o Menu/ }).click();

    await expect(page.getByText(/incorretos/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("proprietário entra e vê o menu completo", async ({ page }) => {
    await entrar(page, E2E.dono);

    for (const menu of ["Ordens de Serviço", "Clientes", "Estoque", "Financeiro", "Relatórios", "Equipe"]) {
      await expect(page.getByRole("link", { name: menu, exact: true })).toBeVisible();
    }
  });

  test("funcionário não vê o financeiro e não abre os relatórios pela URL", async ({ page }) => {
    await entrar(page, E2E.funcionario);

    await expect(page.getByRole("link", { name: "Ordens de Serviço", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Financeiro", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Relatórios", exact: true })).toHaveCount(0);

    await page.goto("/relatorios");
    await expect(page).not.toHaveURL(/\/relatorios/);
  });
});
