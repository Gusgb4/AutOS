import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Prepara o banco de teste uma vez (migrate reset)
    globalSetup: ["./tests/globalSetup.ts"],
    // Carrega o .env.test e limpa o banco antes de cada teste
    setupFiles: ["./tests/setup.ts"],
    // Todos os arquivos usam o mesmo banco, então rodam um de cada vez
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/server.ts", "src/types/**"],
      reporter: ["text", "html"],
    },
  },
});
