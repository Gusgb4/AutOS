import { useState, type ReactNode } from "react";

// Gráficos dos relatórios, em barras simples (sem biblioteca).
// Uma série só = laranja do sistema. Atual × comparado = laranja × azul
// (par validado também para daltonismo). Os valores ficam escritos ao lado
// das barras e a tabela completa continua embaixo de cada gráfico.
export const COR_ATUAL = "#FF7518";
export const COR_COMPARADO = "#2563EB";

const moeda = (valor: number) =>
  valor
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\u00A0/g, " ");

// Versão curta pros rótulos do eixo: R$ 1,2 mil
const moedaCurta = (valor: number) =>
  valor >= 1000
    ? `R$ ${(valor / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`
    : moeda(valor);

export function GraficoCard({
  titulo,
  subtitulo,
  legenda,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  legenda?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1F1F1F]">{titulo}</p>
          {subtitulo && <p className="text-xs text-gray-500">{subtitulo}</p>}
        </div>
        {legenda}
      </div>
      {children}
    </div>
  );
}

export function Legenda({ itens }: { itens: { rotulo: string; cor: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
      {itens.map((i) => (
        <span key={i.rotulo} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: i.cor }}
          />
          {i.rotulo}
        </span>
      ))}
    </div>
  );
}

function SemDados({ texto }: { texto: string }) {
  return <p className="py-6 text-center text-sm text-gray-400">{texto}</p>;
}

/** Ranking: uma barra por item, maior em cima, valor escrito à direita. */
export function BarrasHorizontais({
  itens,
  vazio,
  formatar = moeda,
}: {
  itens: { chave: string | number; rotulo: string; valor: number; detalhe?: string }[];
  vazio: string;
  formatar?: (valor: number) => string;
}) {
  if (itens.length === 0) return <SemDados texto={vazio} />;
  const maximo = Math.max(...itens.map((i) => i.valor), 1);

  return (
    <ul className="space-y-2.5">
      {itens.map((item) => (
        <li
          key={item.chave}
          className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[minmax(0,14rem)_1fr_auto]"
          title={`${item.rotulo}: ${formatar(item.valor)}${item.detalhe ? ` · ${item.detalhe}` : ""}`}
        >
          <span className="truncate text-gray-700">{item.rotulo}</span>
          <div className="h-2.5 w-full rounded-full bg-gray-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((item.valor / maximo) * 100, item.valor > 0 ? 1.5 : 0)}%`,
                backgroundColor: COR_ATUAL,
              }}
            />
          </div>
          <span className="whitespace-nowrap text-right font-medium text-[#1F1F1F]">
            {formatar(item.valor)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Atual × comparado para poucas medidas (ex.: entradas e saídas). */
export function BarrasComparacao({
  grupos,
  rotuloAtual,
  rotuloComparado,
}: {
  grupos: { rotulo: string; atual: number; comparado: number }[];
  rotuloAtual: string;
  rotuloComparado: string;
}) {
  const maximo = Math.max(...grupos.flatMap((g) => [g.atual, g.comparado]), 1);
  const largura = (v: number) => `${Math.max((v / maximo) * 100, v > 0 ? 1.5 : 0)}%`;

  return (
    <div className="space-y-4">
      {grupos.map((g) => (
        <div key={g.rotulo}>
          <p className="mb-1.5 text-sm font-medium text-gray-700">{g.rotulo}</p>
          {[
            { rotulo: rotuloAtual, valor: g.atual, cor: COR_ATUAL },
            { rotulo: rotuloComparado, valor: g.comparado, cor: COR_COMPARADO },
          ].map((serie) => (
            <div
              key={serie.rotulo}
              className="mb-1 grid grid-cols-[1fr_auto] items-center gap-3 text-sm"
              title={`${g.rotulo} · ${serie.rotulo}: ${moeda(serie.valor)}`}
            >
              <div className="h-2.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: largura(serie.valor), backgroundColor: serie.cor }}
                />
              </div>
              <span className="whitespace-nowrap text-right text-xs text-gray-600">
                <span className="text-gray-400">{serie.rotulo}: </span>
                <span className="font-medium text-[#1F1F1F]">{moeda(serie.valor)}</span>
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Uma barra dividida em partes que somam 100% (ex.: mão de obra × peças). */
export function BarraComposicao({
  partes,
  vazio,
}: {
  partes: { rotulo: string; valor: number; percentual: number; cor: string }[];
  vazio: string;
}) {
  const total = partes.reduce((acc, p) => acc + p.valor, 0);
  if (total <= 0) return <SemDados texto={vazio} />;

  return (
    <div>
      {/* gap-0.5 = o respiro de 2px entre as partes */}
      <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full">
        {partes
          .filter((p) => p.valor > 0)
          .map((p) => (
            <div
              key={p.rotulo}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ width: `${p.percentual}%`, backgroundColor: p.cor }}
              title={`${p.rotulo}: ${moeda(p.valor)} (${p.percentual.toLocaleString("pt-BR")}%)`}
            />
          ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {partes.map((p) => (
          <span key={p.rotulo} className="flex items-center gap-1.5 text-gray-700">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.cor }} />
            {p.rotulo}:
            <span className="font-medium text-[#1F1F1F]">{moeda(p.valor)}</span>
            <span className="text-xs text-gray-400">
              ({p.percentual.toLocaleString("pt-BR")}%)
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// Períodos de até 62 dias vão por dia; maiores, por mês (senão as barras somem)
const LIMITE_DIAS = 62;

function somarDia(iso: string, dias: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Faturamento ao longo do período. O backend só manda os dias com OS:
 * aqui os dias vazios entram como zero, pra o eixo do tempo ficar certo.
 */
export function ColunasNoTempo({
  inicio,
  fim,
  dias,
}: {
  inicio: string;
  fim: string;
  dias: { data: string; ordens: number; total: number }[];
}) {
  const porDia = new Map(dias.map((d) => [d.data, d]));
  const quantidadeDias =
    Math.round(
      (new Date(`${fim}T12:00:00Z`).getTime() - new Date(`${inicio}T12:00:00Z`).getTime()) /
        86_400_000,
    ) + 1;
  const porMes = quantidadeDias > LIMITE_DIAS;

  const colunas: { chave: string; rotulo: string; total: number; ordens: number }[] = [];
  for (let i = 0; i < quantidadeDias; i++) {
    const dia = somarDia(inicio, i);
    const dados = porDia.get(dia);
    const [ano, mes, numeroDia] = dia.split("-");
    const chave = porMes ? `${ano}-${mes}` : dia;
    const rotulo = porMes
      ? `${MESES[Number(mes) - 1]}/${ano.slice(2)}`
      : `${numeroDia}/${mes}`;
    const ultima = colunas[colunas.length - 1];
    if (ultima && ultima.chave === chave) {
      ultima.total += dados?.total ?? 0;
      ultima.ordens += dados?.ordens ?? 0;
    } else {
      colunas.push({ chave, rotulo, total: dados?.total ?? 0, ordens: dados?.ordens ?? 0 });
    }
  }

  if (colunas.every((c) => c.total === 0)) {
    return <SemDados texto="Nenhuma OS finalizada no período." />;
  }

  return (
    <GraficoColunas colunas={colunas} porMes={porMes} />
  );
}

function GraficoColunas({
  colunas,
  porMes,
}: {
  colunas: { chave: string; rotulo: string; total: number; ordens: number }[];
  porMes: boolean;
}) {
  // Coluna apontada (mouse, toque ou teclado). O detalhe aparece numa linha
  // acima do gráfico, e não flutuando: assim nada é cortado nem cria rolagem.
  const [apontada, setApontada] = useState<string | null>(null);
  const maximo = Math.max(...colunas.map((c) => c.total), 1);
  const maiorColuna = colunas.reduce((a, b) => (b.total > a.total ? b : a));
  const detalhe = colunas.find((c) => c.chave === apontada) ?? null;
  // Com muitas colunas, só alguns rótulos no eixo, pra não encavalar
  const passoRotulo = Math.ceil(colunas.length / 10);
  // Só rola de lado quando não cabe (muitos dias numa tela estreita)
  const larguraMinima = colunas.length > 31 ? `${colunas.length * 12}px` : undefined;

  return (
    <div>
      <p className="mb-3 min-h-5 text-sm" aria-live="polite">
        {detalhe ? (
          <>
            <span className="font-semibold text-[#1F1F1F]">{detalhe.rotulo}: </span>
            <span className="font-medium text-[#1F1F1F]">{moeda(detalhe.total)}</span>
            <span className="text-gray-500">
              {" "}
              · {detalhe.ordens} {detalhe.ordens === 1 ? "OS finalizada" : "OS finalizadas"}
            </span>
          </>
        ) : (
          <span className="text-gray-500">
            Maior {porMes ? "mês" : "dia"}: {maiorColuna.rotulo} ({moedaCurta(maiorColuna.total)}).
            Passe o mouse ou toque numa coluna para ver o valor.
          </span>
        )}
      </p>

      <div className="overflow-x-auto overflow-y-hidden">
        <div style={{ minWidth: larguraMinima }}>
          <div
            className="flex h-48 items-end gap-0.5 border-b border-gray-200"
            onMouseLeave={() => setApontada(null)}
          >
            {colunas.map((c) => {
              const ativa = c.chave === apontada;
              return (
                <button
                  key={c.chave}
                  type="button"
                  aria-label={`${c.rotulo}: ${moeda(c.total)}, ${c.ordens} OS`}
                  onMouseEnter={() => setApontada(c.chave)}
                  onFocus={() => setApontada(c.chave)}
                  onClick={() => setApontada(c.chave)}
                  className="flex h-full flex-1 items-end rounded-t outline-none focus-visible:bg-gray-100"
                >
                  <span
                    className="block w-full rounded-t transition-opacity"
                    style={{
                      height:
                        c.total > 0 ? `${Math.max((c.total / maximo) * 100, 1.5)}%` : "0%",
                      backgroundColor: COR_ATUAL,
                      opacity: apontada && !ativa ? 0.45 : 1,
                    }}
                  />
                </button>
              );
            })}
          </div>
          <div className="mt-1.5 flex gap-0.5">
            {colunas.map((c, i) => (
              <span
                key={c.chave}
                className="flex-1 overflow-hidden whitespace-nowrap text-center text-[10px] text-gray-400"
              >
                {i % passoRotulo === 0 ? c.rotulo : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
