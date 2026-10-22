import {
  calcularConsulta,
  type EstadoPainel,
} from "../../lib/periodoPainel";

// Botões e datas do período e da comparação do Financeiro
const inputClass =
  "rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#FF7518]";

function Opcoes<T extends string>({
  rotulo,
  valor,
  opcoes,
  onChange,
}: {
  rotulo: string;
  valor: T;
  opcoes: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="flex flex-wrap gap-1.5">
      {opcoes.map((o) => {
        const ativo = o.id === valor;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(o.id)}
            className={`rounded-lg border-[1.5px] px-3 py-2 text-xs font-semibold transition ${
              ativo
                ? "border-[#FF7518] bg-[#FFF4EC] text-[#FF7518]"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function PainelPeriodo({
  estado,
  onChange,
}: {
  estado: EstadoPainel;
  onChange: (e: EstadoPainel) => void;
}) {
  const alterar = (patch: Partial<EstadoPainel>) => onChange({ ...estado, ...patch });
  const incompleto = calcularConsulta(estado) === null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm lg:flex-row lg:items-start lg:gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#1B2130]">Período</span>
        <Opcoes
          rotulo="Período"
          valor={estado.periodo}
          onChange={(periodo) => alterar({ periodo })}
          opcoes={[
            { id: "mes", label: "Este mês" },
            { id: "mes_passado", label: "Mês passado" },
            { id: "livre", label: "Escolher datas" },
          ]}
        />
        {estado.periodo === "livre" && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              aria-label="Início do período"
              value={estado.inicio}
              max={estado.fim || undefined}
              onChange={(e) => alterar({ inicio: e.target.value })}
              className={inputClass}
            />
            <span className="text-xs text-gray-400">até</span>
            <input
              type="date"
              aria-label="Fim do período"
              value={estado.fim}
              min={estado.inicio || undefined}
              onChange={(e) => alterar({ fim: e.target.value })}
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#1B2130]">Comparar com</span>
        <Opcoes
          rotulo="Comparar com"
          valor={estado.comparacao}
          onChange={(comparacao) => alterar({ comparacao })}
          opcoes={[
            { id: "anterior", label: "Período anterior" },
            { id: "ano", label: "Ano passado" },
            { id: "livre", label: "Escolher datas" },
          ]}
        />
        {estado.comparacao === "livre" && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              aria-label="Início da comparação"
              value={estado.compInicio}
              max={estado.compFim || undefined}
              onChange={(e) => alterar({ compInicio: e.target.value })}
              className={inputClass}
            />
            <span className="text-xs text-gray-400">até</span>
            <input
              type="date"
              aria-label="Fim da comparação"
              value={estado.compFim}
              min={estado.compInicio || undefined}
              onChange={(e) => alterar({ compFim: e.target.value })}
              className={inputClass}
            />
          </div>
        )}
      </div>

      {incompleto && (
        <p className="text-xs text-gray-500 lg:self-center">
          Escolha as datas (início antes do fim) para atualizar os números.
        </p>
      )}
    </div>
  );
}
