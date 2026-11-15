import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Testes end-to-end: abrem o navegador e usam o sistema como uma pessoa
// (tela + API + banco). O Playwright sobe o backend e o frontend sozinho,
// num banco só do E2E que é recriado a cada execução.

// Banco do E2E: precisa ter "e2e" no nome (o backend se recusa a apagar outro).
// Ordem: E2E_DATABASE_URL (usado no CI) > usuário e senha do backend/.env.test
// (os testes do backend já usam) > postgres/postgres.
function urlDoBancoE2E() {
  if (process.env.E2E_DATABASE_URL) return process.env.E2E_DATABASE_URL;

  const envTest = path.resolve(__dirname, "../backend/.env.test");
  if (fs.existsSync(envTest)) {
    const linha = fs
      .readFileSync(envTest, "utf8")
      .match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (linha) {
      // Mesmo servidor, usuário e senha; só troca o banco
      const url = new URL(linha[1].trim());
      url.pathname = "/autos_e2e";
      return url.toString();
    }
  }

  return "postgresql://postgres:postgres@localhost:5432/autos_e2e?schema=public";
}

const DATABASE_URL = urlDoBancoE2E();

// Portas diferentes das de desenvolvimento, pra rodar com o dev aberto
const PORTA_API = 3334;
const PORTA_WEB = 5174;

export default defineConfig({
  testDir: "./tests",
  // Todos os testes usam o mesmo banco: um de cada vez
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORTA_WEB}`,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    // Em caso de falha, guarda print e o passo a passo (abre com npm run relatorio)
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // Recria o banco do E2E, cadastra os dados de teste e sobe a API
      command: "npm run e2e:servidor",
      cwd: "../backend",
      url: `http://localhost:${PORTA_API}/health`,
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: "pipe",
      env: {
        DATABASE_URL,
        PORT: String(PORTA_API),
        JWT_SECRET: "segredo_somente_para_o_e2e",
        JWT_EXPIRES_IN: "1h",
        CORS_ORIGIN: `http://localhost:${PORTA_WEB}`,
      },
    },
    {
      command: `npm run dev -- --port ${PORTA_WEB} --strictPort`,
      cwd: "../frontend",
      url: `http://localhost:${PORTA_WEB}`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { VITE_API_URL: `http://localhost:${PORTA_API}/api` },
    },
  ],
});
