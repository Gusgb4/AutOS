# Teste de carga

Mede como a API se comporta com vários usuários ao mesmo tempo: tempo de
resposta e taxa de erro, no uso normal e num pico.

## Como foi feito

- **Ferramenta:** [k6](https://k6.io), que simula usuários fazendo requisições
  à API e mede cada resposta.
- **Ambiente:** backend rodando **localmente** (porta 3335), com banco PostgreSQL
  local só de teste (`autos_e2e`), recriado a cada execução. O teste **não roda
  contra a produção**: no plano gratuito do Render e do Neon, mediria o limite
  do plano, e não o sistema, e poderia derrubar o serviço.
- **Dados:** antes da carga, o teste cadastra 30 clientes, 30 veículos e 30 OS
  (metade finalizadas), para as listas e os relatórios terem conteúdo.
- **Arquivos:** [`carga/cenario.js`](../carga/cenario.js) (o cenário) e
  [`carga/rodar.mjs`](../carga/rodar.mjs) (prepara o banco, sobe o backend,
  roda o k6 e desliga tudo).

### O que cada usuário simulado faz

Repete, com 1 a 3 segundos de pausa entre uma tela e outra, como uma pessoa:

1. **Sempre:** lista de OS, detalhe de uma OS, lista de clientes, estoque e
   notificações.
2. **1 em cada 4 vezes:** resumo financeiro e relatório de vendas do mês.
3. **1 em cada 5 vezes:** abre uma OS e lança um serviço (escrita no banco).

### Quantos usuários

A oficina tem de 2 a 5 pessoas usando o sistema ao mesmo tempo. O teste vai
até **20 usuários simultâneos**, quatro vezes o uso real:

| Fase | Duração | Usuários |
|---|---|---|
| Subida | 30 s | 0 → 5 |
| Uso normal | 1 min | 5 |
| Subida ao pico | 30 s | 5 → 20 |
| Pico sustentado | 1 min | 20 |
| Fim | 20 s | 20 → 0 |

### Critérios de aprovação

| Critério | Meta |
|---|---|
| Requisições com erro | menos de 1% |
| Tempo de resposta (95% das requisições) | abaixo de 500 ms |
| Tempo de resposta (99% das requisições) | abaixo de 1,5 s |
| Verificações de resposta (status 2xx) | acima de 99% |

## Como rodar

```bash
# 1. Instalar o k6 (uma vez). No Windows:
winget install k6 --source winget
# depois, abrir um terminal novo

# 2. Na raiz do projeto
node carga/rodar.mjs
```

Leva cerca de 4 minutos. O banco usado é o mesmo do E2E (veja o README). O
resumo aparece no terminal, e os números completos ficam em
`carga/resultados/resumo.json` (fora do git).

## Resultados

**Data:** 15/11/2026 · **Ambiente:** computador de desenvolvimento (Windows 10),
backend e PostgreSQL locais · **Duração:** 3 min 23 s · **Pico:** 20 usuários
simultâneos

**Todos os critérios passaram.**

| Métrica | Resultado | Meta | Passou? |
|---|---|---|---|
| Requisições no total | 6.265 | — | — |
| Requisições por segundo | 30,9 | — | — |
| Ciclos de uso completos (iterações) | 1.030 | — | — |
| Erros (`http_req_failed`) | **0%** (0 de 6.265) | < 1% | ✅ |
| Tempo mediano | 5,5 ms | — | — |
| Tempo médio | 7,6 ms | — | — |
| p(90) | 17,5 ms | — | — |
| p(95) | **23,2 ms** | < 500 ms | ✅ |
| p(99) | abaixo de 1,5 s | < 1,5 s | ✅ |
| Tempo máximo | 157,6 ms | — | — |
| Verificações (`checks`) | **100%** (6.114 de 6.114) | > 99% | ✅ |

### Leitura dos resultados

- Mesmo no pico, com 20 pessoas ao mesmo tempo (quatro vezes o uso real da
  oficina), 95% das respostas saíram em até 23 ms, mais de 20 vezes abaixo da
  meta, e nenhuma requisição falhou.
- A resposta mais lenta de todo o teste levou 158 ms, ainda bem abaixo de
  meio segundo. As consultas mais pesadas (relatório de vendas e resumo
  financeiro) e as escritas (abrir OS e lançar serviço) entraram nessa conta.
- Para o tamanho da Franz Motors, a API tem folga de sobra. O gargalo em
  produção não é carga, e sim o plano gratuito do Render (veja abaixo).

## Limitações

- O resultado vale para a máquina em que o teste rodou. Em produção, o backend
  roda no plano gratuito do Render, com menos processamento, e o banco fica
  em outro servidor (Neon), o que soma alguns milissegundos por consulta.
- No plano gratuito, o primeiro acesso depois de 15 minutos parado leva de 30 a
  50 segundos (o servidor "acorda"). Isso não é carga, é o plano; resolve-se
  com o plano pago.
