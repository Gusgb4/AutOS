import { useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { anonimizarCliente } from "../../services/clients";
import { mensagemDeErro } from "../../lib/errors";

// Palavra que precisa ser digitada: a remoção não tem volta
const CONFIRMACAO = "REMOVER";

interface RemoverDadosCardProps {
  clienteId: number;
  onRemovido: () => void;
}

// LGPD: quando o cliente pede pra apagar os dados dele
export default function RemoverDadosCard({
  clienteId,
  onRemovido,
}: RemoverDadosCardProps) {
  const [confirmando, setConfirmando] = useState(false);
  const [texto, setTexto] = useState("");
  const [removendo, setRemovendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleRemover() {
    setRemovendo(true);
    setErro(null);
    try {
      await anonimizarCliente(clienteId);
      onRemovido();
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível remover os dados."));
    } finally {
      setRemovendo(false);
    }
  }

  function cancelar() {
    setConfirmando(false);
    setTexto("");
    setErro(null);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <ShieldAlert size={18} />
          </div>
          <div>
            <p className="font-semibold text-[#1F1F1F]">
              Remover dados pessoais (LGPD)
            </p>
            <p className="text-xs text-gray-500">
              Use quando o cliente pedir. Nome, telefone, documento, e-mail,
              endereço e placas são apagados; as ordens de serviço e o
              financeiro continuam, sem identificar a pessoa. Não tem volta.
            </p>
          </div>
        </div>

        {!confirmando && (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="shrink-0 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Remover dados
          </button>
        )}
      </div>

      {confirmando && (
        <div className="flex flex-col gap-3 border-t border-red-100 bg-red-50/40 p-5 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1B2130]">
              Para confirmar, digite {CONFIRMACAO}
            </label>
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              autoFocus
              className="w-full rounded-lg border-[1.5px] border-gray-200 bg-white px-3 py-2.5 text-base outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 md:text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelar}
              disabled={removendo}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 sm:flex-none"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleRemover}
              disabled={texto.trim().toUpperCase() !== CONFIRMACAO || removendo}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 sm:flex-none"
            >
              {removendo && <Loader2 size={15} className="animate-spin" />}
              Remover definitivamente
            </button>
          </div>
        </div>
      )}

      {erro && (
        <p className="border-t border-red-100 px-5 py-3 text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
