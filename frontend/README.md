# AutOS · Frontend

Interface web do AutOS (React 19 + TypeScript + Vite + Tailwind CSS).

A documentação do projeto (como rodar, funcionalidades, API e testes) está no
[README principal](../README.md) e na pasta [docs](../docs).

```bash
npm install
npm run dev     # ambiente local em http://localhost:5173
npm run lint    # ESLint (deve passar sem erros)
npm run build   # checagem de tipos + build de produção
```

Pontos de entrada úteis:

- `src/routes/index.tsx`: rotas e proteção por perfil
- `src/services/`: chamadas à API (uma por módulo)
- `src/lib/pdf.ts`, `pdfOrdemServico.ts`, `pdfRelatorios.ts`: PDFs
- `src/config/oficina.ts`: dados da oficina (cabeçalho dos PDFs, termos e política)
- `src/assets/logo-oficina.png`: logo usada nos PDFs
