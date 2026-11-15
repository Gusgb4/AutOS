// Roda o teste de carga do começo ao fim, num ambiente só de teste:
//   1. recria o banco autos_e2e e cadastra os dados de teste
//   2. sobe o backend local na porta 3335
//   3. roda o cenário do k6 (carga/cenario.js)
//   4. desliga o backend
// Uso, na raiz do projeto:  node carga/rodar.mjs
// Precisa do k6 instalado (no Windows: winget install k6 --source winget).
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, "..");
const PORTA = 3335;

// Mesmo banco do E2E: E2E_DATABASE_URL, ou usuário e senha do backend/.env.test
// com o banco trocado pra autos_e2e (o backend só aceita apagar banco "e2e")
function urlDoBanco() {
  if (process.env.E2E_DATABASE_URL) return process.env.E2E_DATABASE_URL;

  const envTest = path.join(raiz, "backend", ".env.test");
  if (fs.existsSync(envTest)) {
    const linha = fs
      .readFileSync(envTest, "utf8")
      .match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (linha) {
      const url = new URL(linha[1].trim());
      url.pathname = "/autos_e2e";
      return url.toString();
    }
  }
  return "postgresql://postgres:postgres@localhost:5432/autos_e2e?schema=public";
}

// Logo depois de instalar, o terminal (e o VS Code) ainda não enxerga o k6 no
// PATH. Por isso procura também nas pastas onde o instalador do Windows coloca.
function acharK6() {
  const candidatos = [
    process.env.K6,
    "k6",
    "C:\\Program Files\\k6\\k6.exe",
    path.join(process.env.LOCALAPPDATA ?? "", "Microsoft", "WinGet", "Links", "k6.exe"),
  ].filter(Boolean);
  return candidatos.find((c) => spawnSync(c, ["version"]).status === 0);
}

const K6 = acharK6();
if (!K6) {
  console.error(
    "k6 não encontrado. Instale com: winget install k6 --source winget e feche e abra o VS Code " +
      "(ou informe o caminho do k6.exe em K6).",
  );
  process.exit(1);
}

const pastaResultados = path.join(aqui, "resultados");
fs.mkdirSync(pastaResultados, { recursive: true });
const logBackend = fs.createWriteStream(path.join(pastaResultados, "backend.log"));

console.log("Preparando o banco e subindo o backend de teste...");
const ehWindows = process.platform === "win32";
const backend = spawn("npm run e2e:servidor", {
  cwd: path.join(raiz, "backend"),
  shell: true,
  detached: !ehWindows,
  env: {
    ...process.env,
    DATABASE_URL: urlDoBanco(),
    PORT: String(PORTA),
    JWT_SECRET: "segredo_somente_para_o_teste_de_carga",
    JWT_EXPIRES_IN: "2h",
    CORS_ORIGIN: "http://localhost",
  },
});
backend.stdout.pipe(logBackend);
backend.stderr.pipe(logBackend);

function pararBackend() {
  if (backend.exitCode !== null) return;
  if (ehWindows) {
    spawnSync("taskkill", ["/pid", String(backend.pid), "/T", "/F"]);
  } else {
    process.kill(-backend.pid, "SIGTERM");
  }
}
process.on("SIGINT", () => {
  pararBackend();
  process.exit(130);
});

async function esperarApi() {
  for (let tentativa = 0; tentativa < 90; tentativa++) {
    if (backend.exitCode !== null) {
      throw new Error("O backend parou antes de subir. Veja carga/resultados/backend.log.");
    }
    try {
      const res = await fetch(`http://localhost:${PORTA}/health`);
      if (res.ok) return;
    } catch {
      // ainda subindo
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("O backend não respondeu em 3 minutos. Veja carga/resultados/backend.log.");
}

let codigo = 1;
try {
  await esperarApi();
  console.log(`Backend no ar em http://localhost:${PORTA}. Rodando o k6 (cerca de 3 minutos e meio)...\n`);
  const k6 = spawnSync(K6, ["run", "-e", `API=http://localhost:${PORTA}/api`, "cenario.js"], {
    cwd: aqui,
    stdio: "inherit",
  });
  codigo = k6.status ?? 1;
  console.log(
    codigo === 0
      ? "\nTodos os critérios de carga passaram. Números em carga/resultados/resumo.json."
      : "\nAlgum critério de carga não passou (veja os ✗ acima). Números em carga/resultados/resumo.json.",
  );
} catch (erro) {
  console.error(erro.message);
} finally {
  pararBackend();
}
process.exit(codigo);
