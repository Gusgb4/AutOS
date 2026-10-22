import { Bell, Plus, Trash2 } from "lucide-react";

// Um lembrete no formulário (campos vazios viram "" até a pessoa preencher)
export interface LembreteForm {
  // Lembrete que já existe no banco; sem id é novo
  id?: number;
  nome: string;
  intervalo_dias: number | "";
  intervalo_km: number | "";
}

// Sugestões com intervalos comuns; a oficina ajusta como quiser
const SUGESTOES: { nome: string; intervalo_dias: number; intervalo_km: number }[] = [
  { nome: "Troca de óleo", intervalo_dias: 180, intervalo_km: 10000 },
  { nome: "Correia dentada", intervalo_dias: 1460, intervalo_km: 60000 },
  { nome: "Revisão geral", intervalo_dias: 365, intervalo_km: 10000 },
  { nome: "Filtro de ar", intervalo_dias: 365, intervalo_km: 15000 },
  { nome: "Pastilhas de freio", intervalo_dias: 365, intervalo_km: 20000 },
];

const MAX_LEMBRETES = 10;

interface LembretesEditorProps {
  lembretes: LembreteForm[];
  onChange: (lembretes: LembreteForm[]) => void;
}

const campoClass =
  "w-full rounded-lg border-[1.5px] border-gray-200 bg-white px-3 py-2 text-base text-[#1B2130] outline-none focus:border-[#FF7518] focus:ring-2 focus:ring-[#FDE7DA] md:text-sm";

export default function LembretesEditor({
  lembretes,
  onChange,
}: LembretesEditorProps) {
  const nomesUsados = new Set(lembretes.map((l) => l.nome.trim().toLowerCase()));
  const sugestoesLivres = SUGESTOES.filter(
    (s) => !nomesUsados.has(s.nome.toLowerCase()),
  );
  const cheio = lembretes.length >= MAX_LEMBRETES;

  function alterar(indice: number, patch: Partial<LembreteForm>) {
    onChange(lembretes.map((l, i) => (i === indice ? { ...l, ...patch } : l)));
  }

  function remover(indice: number) {
    onChange(lembretes.filter((_, i) => i !== indice));
  }

  function adicionar(novo: LembreteForm) {
    if (!cheio) onChange([...lembretes, novo]);
  }

  const numero = (valor: string) => (valor ? Number(valor) : "");

  return (
    <div className="mt-5 border-t border-gray-100 pt-4">
      <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-[#1B2130]">
        <Bell size={14} className="text-gray-400" />
        Lembretes de manutenção{" "}
        <span className="font-normal text-gray-400">(opcional)</span>
      </p>
      <p className="mb-3 text-xs text-gray-500">
        Cada lembrete avisa pelo que vencer primeiro: os dias ou os km. A
        contagem recomeça quando o lembrete é marcado como feito numa ordem de
        serviço encerrada.
      </p>

      {lembretes.length > 0 && (
        <ul className="mb-3 space-y-3">
          {lembretes.map((l, i) => (
            <li
              key={l.id ?? `novo-${i}`}
              className="rounded-xl border border-gray-200 bg-gray-50/60 p-3"
            >
              <div className="flex items-start gap-2">
                <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-[1fr_7rem_7rem]">
                  <label className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                    <span className="text-[11px] font-semibold text-gray-500">
                      Nome
                    </span>
                    <input
                      type="text"
                      value={l.nome}
                      onChange={(e) => alterar(i, { nome: e.target.value })}
                      placeholder="Ex.: Troca de óleo"
                      maxLength={60}
                      required
                      className={campoClass}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-gray-500">
                      A cada (dias)
                    </span>
                    <input
                      type="number"
                      value={l.intervalo_dias}
                      onChange={(e) =>
                        alterar(i, { intervalo_dias: numero(e.target.value) })
                      }
                      placeholder="180"
                      min={1}
                      required
                      className={campoClass}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-gray-500">
                      A cada (km)
                    </span>
                    <input
                      type="number"
                      value={l.intervalo_km}
                      onChange={(e) =>
                        alterar(i, { intervalo_km: numero(e.target.value) })
                      }
                      placeholder="10000"
                      min={1}
                      required
                      className={campoClass}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => remover(i)}
                  aria-label={`Remover lembrete ${l.nome || ""}`.trim()}
                  title="Remover lembrete"
                  className="mt-5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 md:h-8 md:w-8"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!cheio && (
        <div className="flex flex-wrap items-center gap-2">
          {sugestoesLivres.map((s) => (
            <button
              key={s.nome}
              type="button"
              onClick={() => adicionar({ ...s })}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-[#FF7518] hover:text-[#FF7518]"
            >
              + {s.nome}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              adicionar({ nome: "", intervalo_dias: "", intervalo_km: "" })
            }
            className="flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-[#FF7518] hover:text-[#FF7518]"
          >
            <Plus size={12} />
            Outro
          </button>
        </div>
      )}
      {cheio && (
        <p className="text-xs text-gray-400">
          Limite de {MAX_LEMBRETES} lembretes por veículo.
        </p>
      )}
    </div>
  );
}
