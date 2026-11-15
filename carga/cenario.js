// Teste de carga do AutOS com k6: vários usuários usando a API ao mesmo tempo.
// Não rode direto: use "node carga/rodar.mjs", que sobe um backend local num
// banco só de teste e chama este cenário. Nunca aponte para a produção.
import http from "k6/http";
import { check, group, sleep } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";

const API = __ENV.API || "http://localhost:3335/api";

// Usuário cadastrado pelo backend/src/scripts/e2e-preparar.ts
const DONO = { email: "dono.e2e@teste.com", senha: "senhaE2E123" };

// Quantos clientes, veículos e OS o setup cadastra antes da carga
const QUANTIDADE_INICIAL = 30;

// A oficina tem poucas pessoas usando ao mesmo tempo (2 a 5). O teste sobe
// até 20 usuários simultâneos, uma margem de 4 vezes o uso real.
export const options = {
  scenarios: {
    oficina: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 5 }, // chega ao uso normal
        { duration: "1m", target: 5 }, // uso normal
        { duration: "30s", target: 20 }, // pico
        { duration: "1m", target: 20 }, // pico sustentado
        { duration: "20s", target: 0 }, // fim
      ],
    },
  },
  // Critérios de aprovação: se algum falhar, o k6 termina com erro
  thresholds: {
    http_req_failed: ["rate<0.01"], // menos de 1% de erro
    http_req_duration: ["p(95)<500", "p(99)<1500"], // 95% abaixo de 0,5 s
    checks: ["rate>0.99"],
  },
};

function json(token) {
  return {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

// Junta as URLs com id numa só linha no resumo (ex.: GET /service-orders/:id)
function comNome(params, nome) {
  return { ...params, tags: { name: nome } };
}

function mesAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const ultimo = new Date(ano, hoje.getMonth() + 1, 0).getDate();
  return { inicio: `${ano}-${mes}-01`, fim: `${ano}-${mes}-${ultimo}` };
}

// Roda uma vez antes da carga: entra e cadastra dados pra a carga não ser
// feita num banco vazio (listas e relatórios com conteúdo de verdade)
export function setup() {
  const login = http.post(`${API}/auth/login`, JSON.stringify(DONO), json());
  if (login.status !== 200) {
    throw new Error(`Login falhou (${login.status}): ${login.body}`);
  }
  const token = login.json("token");
  const mecanicoId = login.json("user.id");
  const p = json(token);

  const pares = [];
  const ordens = [];
  for (let i = 1; i <= QUANTIDADE_INICIAL; i++) {
    const cliente = http.post(
      `${API}/clients`,
      JSON.stringify({ nome: `Cliente Carga ${i}`, telefone: `4799990${String(i).padStart(4, "0")}` }),
      p,
    ).json();
    const veiculo = http.post(
      `${API}/vehicles`,
      JSON.stringify({
        cliente_id: cliente.id,
        placa: `CRG${String(i).padStart(4, "0")}`,
        marca: "Fiat",
        modelo: "Uno",
        ano: 2015,
        quilometragem_atual: 40000,
      }),
      p,
    ).json();
    pares.push({ cliente_id: cliente.id, veiculo_id: veiculo.id });

    const ordem = http.post(
      `${API}/service-orders`,
      JSON.stringify({ cliente_id: cliente.id, veiculo_id: veiculo.id, mecanico_id: mecanicoId }),
      p,
    ).json();
    http.post(
      `${API}/service-orders/${ordem.id}/services`,
      JSON.stringify({ descricao: "Revisão", valor: 100 + i }),
      p,
    );
    // Metade das OS finalizadas, pra os relatórios terem faturamento
    if (i % 2 === 0) {
      http.patch(`${API}/service-orders/${ordem.id}/status`, JSON.stringify({ status: "EM_ANDAMENTO" }), p);
      http.patch(`${API}/service-orders/${ordem.id}/status`, JSON.stringify({ status: "FINALIZADA" }), p);
    }
    ordens.push(ordem.id);
  }

  return { token, mecanicoId, pares, ordens, periodo: mesAtual() };
}

// O que cada usuário simulado faz, repetidamente: o uso típico da oficina
export default function (dados) {
  const p = json(dados.token);
  const ok = (res, nome) => check(res, { [`${nome}: status 2xx`]: (r) => r.status >= 200 && r.status < 300 });

  group("consultas do dia a dia", () => {
    ok(http.get(`${API}/service-orders`, comNome(p, "GET /service-orders")), "lista de OS");
    const id = dados.ordens[Math.floor(Math.random() * dados.ordens.length)];
    ok(http.get(`${API}/service-orders/${id}`, comNome(p, "GET /service-orders/:id")), "detalhe da OS");
    ok(http.get(`${API}/clients`, comNome(p, "GET /clients")), "lista de clientes");
    ok(http.get(`${API}/stock`, comNome(p, "GET /stock")), "estoque");
    ok(http.get(`${API}/notificacoes`, comNome(p, "GET /notificacoes")), "notificações");
  });

  // 1 em cada 4 vezes: a parte de gestão (proprietário)
  if (Math.random() < 0.25) {
    group("gestão", () => {
      ok(http.get(`${API}/financial/resumo`, comNome(p, "GET /financial/resumo")), "resumo financeiro");
      const { inicio, fim } = dados.periodo;
      ok(
        http.get(`${API}/reports/sales?inicio=${inicio}&fim=${fim}`, comNome(p, "GET /reports/sales")),
        "relatório de vendas",
      );
    });
  }

  // 1 em cada 5 vezes: abre uma OS e lança um serviço (escrita no banco)
  if (Math.random() < 0.2) {
    group("abrir OS", () => {
      const par = dados.pares[Math.floor(Math.random() * dados.pares.length)];
      const criada = http.post(
        `${API}/service-orders`,
        JSON.stringify({ ...par, mecanico_id: dados.mecanicoId }),
        comNome(p, "POST /service-orders"),
      );
      if (ok(criada, "abrir OS")) {
        ok(
          http.post(
            `${API}/service-orders/${criada.json("id")}/services`,
            JSON.stringify({ descricao: "Troca de óleo", valor: 150 }),
            comNome(p, "POST /service-orders/:id/services"),
          ),
          "adicionar serviço",
        );
      }
    });
  }

  // Tempo de "pensar" entre uma tela e outra, como uma pessoa
  sleep(1 + Math.random() * 2);
}

// Resumo no terminal e um JSON com os números, pra guardar no relatório
export function handleSummary(dados) {
  return {
    stdout: textSummary(dados, { indent: "  ", enableColors: true }),
    "resultados/resumo.json": JSON.stringify(dados, null, 2),
  };
}
