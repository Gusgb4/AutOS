import "dotenv/config";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Backup do banco com o pg_dump (vem junto com a instalação do PostgreSQL).
// Uso, com a DATABASE_URL do banco que se quer copiar (normalmente o de produção):
//   DATABASE_URL="postgresql://..." npm run backup
// O arquivo vai para backend/backups/, que fica fora do git: tem dados de clientes.

// No Windows o pg_dump costuma não estar no PATH: procura na pasta padrão,
// pegando a versão mais nova instalada
function acharPgDump(): string {
  if (process.env.PG_DUMP) return process.env.PG_DUMP;

  const pastaWindows = "C:\\Program Files\\PostgreSQL";
  if (process.platform === "win32" && fs.existsSync(pastaWindows)) {
    const versoes = fs
      .readdirSync(pastaWindows)
      .filter((v) => fs.existsSync(path.join(pastaWindows, v, "bin", "pg_dump.exe")))
      .sort((a, b) => Number(b) - Number(a));
    if (versoes.length > 0) {
      return path.join(pastaWindows, versoes[0], "bin", "pg_dump.exe");
    }
  }
  return "pg_dump";
}

function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Defina a DATABASE_URL do banco que vai ser copiado.");
    process.exit(1);
  }

  // Mostra só o servidor e o banco (nunca a senha), pra conferir se é o certo
  const destino = new URL(url);
  console.log(`Copiando o banco "${destino.pathname.slice(1)}" em ${destino.hostname}...`);

  // Parâmetros que só o Prisma entende (ex.: ?schema=public do .env local):
  // o pg_dump recusa a URL inteira se eles estiverem nela
  for (const parametro of [
    "schema",
    "connection_limit",
    "pool_timeout",
    "pgbouncer",
    "statement_cache_size",
    "socket_timeout",
  ]) {
    destino.searchParams.delete(parametro);
  }

  const pasta = path.resolve(__dirname, "..", "..", "backups");
  fs.mkdirSync(pasta, { recursive: true });
  const agora = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const arquivo = path.join(pasta, `autos-${agora}.dump`);

  // Formato custom (-Fc): compactado e restaurável com o pg_restore
  const resultado = spawnSync(
    acharPgDump(),
    [
      "--format=custom",
      "--no-owner",
      "--no-privileges",
      `--file=${arquivo}`,
      destino.toString(),
    ],
    { stdio: "inherit" },
  );

  if (resultado.error || resultado.status !== 0) {
    console.error(
      "O backup falhou (veja a mensagem do pg_dump acima). Se ele não foi encontrado, confira se o PostgreSQL está instalado ou aponte o caminho em PG_DUMP.",
    );
    process.exit(1);
  }

  const tamanho = (fs.statSync(arquivo).size / 1024).toFixed(0);
  console.log(`Backup salvo em ${arquivo} (${tamanho} KB).`);
  console.log("Guarde uma cópia fora deste computador (pendrive ou nuvem pessoal).");
}

main();
