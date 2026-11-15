import { expect, test } from "@playwright/test";
import { E2E, campo, entrar, valorTotalDaOs } from "./dados";

test("dia de oficina: abre a OS, adiciona serviço e peças, encerra e recebe", async ({ page }) => {
  await entrar(page, E2E.dono);

  // Abertura
  await page.goto("/ordens-servico/novo");
  await campo(page, "Cliente").selectOption({ label: E2E.cliente });
  await campo(page, "Veículo").selectOption({ label: E2E.veiculo });
  await campo(page, "Mecânico responsável").selectOption({ index: 1 });
  await campo(page, "Reclamação do cliente").fill("Barulho ao frear");
  await page.getByRole("button", { name: "Abrir Ordem de Serviço" }).click();

  // Serviço (o primeiro "Adicionar" é o dos serviços; o segundo, o das peças)
  const adicionar = page.getByRole("button", { name: "Adicionar", exact: true });
  await campo(page, "Descrição do serviço").fill("Troca de pastilhas");
  await campo(page, "Valor (R$)").fill("100,00");
  await adicionar.nth(0).click();
  await expect(valorTotalDaOs(page)).toHaveText(/100,00/);

  // Peça do estoque: 2 × R$ 40,00
  await campo(page, "Peça").selectOption({ label: `${E2E.peca} (disponível: 10)` });
  await campo(page, "Quantidade").fill("2");
  await adicionar.nth(1).click();
  await expect(valorTotalDaOs(page)).toHaveText(/180,00/);

  // Tela da OS: peça comprada na hora (só o proprietário vê)
  await page.getByRole("button", { name: "Ir para detalhes da OS" }).click();
  await expect(page).toHaveURL(/\/ordens-servico\/\d+$/);
  await page.getByRole("button", { name: /Peça nova/ }).click();
  await page.getByLabel("Nome da peça").fill("Sensor E2E");
  await page.getByLabel("Preço de venda (R$)").fill("50,00");
  await page.getByRole("button", { name: "Cadastrar e adicionar" }).click();
  await expect(valorTotalDaOs(page)).toHaveText(/230,00/);

  // Encerrar pede confirmação do navegador
  page.once("dialog", (dialogo) => dialogo.accept());
  await page.getByRole("button", { name: "Encerrar OS" }).click();
  await expect(page.getByText("Finalizada", { exact: true }).first()).toBeVisible();

  // Pagamento: o valor já vem com o saldo e a forma padrão é Pix
  await page.getByRole("button", { name: "Registrar" }).click();
  await expect(page.locator("span", { hasText: /^Pago$/ }).first()).toBeVisible();
});
