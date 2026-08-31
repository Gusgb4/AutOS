import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Car,
  Wrench,
  Plus,
  Trash2,
  Loader2,
  Check,
  PackageSearch,
  AlertTriangle,
} from "lucide-react";
import { listClients, type Client } from "../services/clients";
import { listStock, type StockItem } from "../services/stock";
import { listUsers, type Mechanic } from "../services/users";
import {
  createServiceOrder,
  addServiceToOrder,
  addPartToOrder,
  removeServiceFromOrder,
  removePartFromOrder,
  type ServiceOrder,
} from "../services/serviceOrders";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-gray-200 bg-[#FBFBFC] py-2.5 pl-9 pr-3 text-sm text-[#1B2130] outline-none transition focus:border-[#FF7518] focus:bg-white focus:ring-2 focus:ring-[#FDE7DA]";
const plainInputClass =
  "w-full rounded-lg border-[1.5px] border-gray-200 bg-[#FBFBFC] px-3 py-2.5 text-sm text-[#1B2130] outline-none transition focus:border-[#FF7518] focus:bg-white focus:ring-2 focus:ring-[#FDE7DA]";

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function capitalizeName(nome: string) {
  return nome
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(" ");
}

function apiErrorMessage(err: any, fallback: string) {
  return (
    err?.response?.data?.erro ||
    err?.response?.data?.error ||
    err?.response?.data?.errors?.[0]?.message ||
    fallback
  );
}

type ServicoItem = ServiceOrder["servicos"][number];
type PecaItem = ServiceOrder["pecas"][number];

function ServicoRow({
  servico,
  saving,
  onSave,
  onRemove,
}: {
  servico: ServicoItem;
  saving: boolean;
  onSave: (descricao: string, valor: number) => void;
  onRemove: () => void;
}) {
  const [descricao, setDescricao] = useState(servico.descricao);
  const [valorTexto, setValorTexto] = useState(String(servico.valor));
  useEffect(() => {
    setDescricao(servico.descricao);
    setValorTexto(String(servico.valor));
  }, [servico.id, servico.descricao, servico.valor]);

  const dirty =
    descricao.trim() !== servico.descricao ||
    Number(valorTexto.replace(",", ".")) !== Number(servico.valor);

  function handleSave() {
    const valorNumero = Number(valorTexto.replace(",", "."));
    if (!descricao.trim() || !valorNumero || valorNumero <= 0) {
      alert("Descrição e valor válidos são obrigatórios.");
      return;
    }
    onSave(descricao.trim(), valorNumero);
  }

  return (
    <li className="flex flex-col gap-3 bg-gray-50/50 p-5 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1.5 sm:flex-[0.75]">
        <label className="text-xs font-semibold text-[#1B2130]">
          Descrição do serviço
        </label>
        <input
          type="text"
          value={descricao}
          disabled={saving}
          onChange={(e) => setDescricao(e.target.value)}
          className={plainInputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[#1B2130]">
          Valor (R$)
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={valorTexto}
          disabled={saving}
          onChange={(e) => setValorTexto(e.target.value)}
          className={`${plainInputClass} text-right sm:w-32 sm:flex-none`}
        />
      </div>
      <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center">
        {dirty && !saving && (
          <button
            type="button"
            onClick={handleSave}
            aria-label="Salvar alteração"
            className="flex h-full w-full items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50"
          >
            <Check size={16} />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={saving}
        className="ml-auto flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#FF7518] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e6690f] disabled:opacity-60"
      >
        {saving ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Trash2 size={15} />
        )}
        Remover
      </button>
    </li>
  );
}

function PecaRow({
  peca,
  saving,
  onSaveQuantidade,
  onRemove,
}: {
  peca: PecaItem;
  saving: boolean;
  onSaveQuantidade: (novaQuantidade: number) => void;
  onRemove: () => void;
}) {
  const [quantidadeTexto, setQuantidadeTexto] = useState(
    String(peca.quantidade),
  );

  useEffect(() => {
    setQuantidadeTexto(String(peca.quantidade));
  }, [peca.id, peca.quantidade]);

  const dirty = Number(quantidadeTexto) !== peca.quantidade;

  function handleSave() {
    const novaQuantidade = Number(quantidadeTexto);
    if (!novaQuantidade || novaQuantidade <= 0) {
      alert("Informe uma quantidade válida maior que zero.");
      return;
    }
    onSaveQuantidade(novaQuantidade);
  }

  return (
    <li className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center">
      <span className={`${plainInputClass} bg-white sm:flex-[2]`}>
        {peca.item_estoque.nome}
      </span>
      <input
        type="number"
        min={1}
        value={quantidadeTexto}
        disabled={saving}
        onChange={(e) => setQuantidadeTexto(e.target.value)}
        className={`${plainInputClass} text-right sm:w-24`}
      />
      <span
        className={`${plainInputClass} bg-white text-right font-medium sm:w-32`}
      >
        {formatCurrency(Number(peca.valor_unitario) * peca.quantidade)}
      </span>
      {dirty && !saving && (
        <button
          type="button"
          onClick={handleSave}
          aria-label="Salvar alteração"
          className="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-lg text-emerald-600 hover:bg-emerald-50 sm:self-auto"
        >
          <Check size={16} />
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={saving}
        aria-label="Remover"
        className="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40 sm:self-auto"
      >
        {saving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
      </button>
    </li>
  );
}

export default function NewServiceOrder() {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState<Client[]>([]);
  const [mecanicos, setMecanicos] = useState<Mechanic[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loadingApoio, setLoadingApoio] = useState(true);
  const [erroApoio, setErroApoio] = useState<string | null>(null);

  const [clienteId, setClienteId] = useState<number | "">("");
  const [veiculoId, setVeiculoId] = useState<number | "">("");
  const [mecanicoId, setMecanicoId] = useState<number | "">("");
  const [criando, setCriando] = useState(false);
  const [erroCriacao, setErroCriacao] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState("");

  const [ordem, setOrdem] = useState<ServiceOrder | null>(null);

  const [descricaoServico, setDescricaoServico] = useState("");
  const [valorServico, setValorServico] = useState("");
  const [addingServico, setAddingServico] = useState(false);
  const [erroServico, setErroServico] = useState<string | null>(null);
  const [savingServicoId, setSavingServicoId] = useState<number | null>(null);

  const [itemEstoqueId, setItemEstoqueId] = useState<number | "">("");
  const [quantidadePeca, setQuantidadePeca] = useState("");
  const [addingPeca, setAddingPeca] = useState(false);
  const [erroPeca, setErroPeca] = useState<string | null>(null);
  const [savingPecaId, setSavingPecaId] = useState<number | null>(null);

  useEffect(() => {
    async function carregarApoio() {
      setLoadingApoio(true);
      setErroApoio(null);
      try {
        const [clientesData, mecanicosData, stockData] = await Promise.all([
          listClients(),
          listUsers(),
          listStock(),
        ]);
        setClientes(clientesData);
        setMecanicos(Array.isArray(mecanicosData) ? mecanicosData : []);
        setStockItems(stockData);
      } catch (err) {
        console.error(err);
        setErroApoio(
          "Não foi possível carregar clientes, mecânicos ou estoque. Recarregue a página.",
        );
      } finally {
        setLoadingApoio(false);
      }
    }
    carregarApoio();
  }, []);

  const clienteSelecionado = useMemo(
    () => clientes.find((c) => c.id === clienteId) ?? null,
    [clientes, clienteId],
  );
  const veiculosDoCliente = clienteSelecionado?.veiculos ?? [];
  const itemEstoqueSelecionado = useMemo(
    () => stockItems.find((i) => i.id === itemEstoqueId) ?? null,
    [stockItems, itemEstoqueId],
  );

  function handleClienteChange(id: number | "") {
    setClienteId(id);
    setVeiculoId("");
  }

  async function handleCriarOrdem() {
    if (!clienteId || !veiculoId || !mecanicoId) {
      setErroCriacao(
        "Selecione cliente, veículo e mecânico antes de continuar.",
      );
      return;
    }
    setCriando(true);
    setErroCriacao(null);
    try {
      const nova = await createServiceOrder({
        cliente_id: Number(clienteId),
        veiculo_id: Number(veiculoId),
        mecanico_id: Number(mecanicoId),
        observacoes: observacoes.trim() || undefined,
      });
      setOrdem(nova);
    } catch (err: any) {
      setErroCriacao(apiErrorMessage(err, "Erro ao criar ordem de serviço."));
    } finally {
      setCriando(false);
    }
  }

  async function handleAddServico() {
    if (!ordem) return;
    const valorNumero = Number(valorServico.replace(",", "."));
    if (!descricaoServico.trim() || !valorNumero || valorNumero <= 0) {
      setErroServico("Preencha a descrição e um valor maior que zero.");
      return;
    }
    setAddingServico(true);
    setErroServico(null);
    try {
      const atualizada = await addServiceToOrder(ordem.id, {
        descricao: descricaoServico.trim(),
        valor: valorNumero,
      });
      setOrdem(atualizada);
      setDescricaoServico("");
      setValorServico("");
    } catch (err: any) {
      setErroServico(apiErrorMessage(err, "Erro ao adicionar serviço."));
    } finally {
      setAddingServico(false);
    }
  }

  async function handleRemoveServico(serviceId: number) {
    if (!ordem) return;
    setSavingServicoId(serviceId);
    try {
      const atualizada = await removeServiceFromOrder(ordem.id, serviceId);
      setOrdem(atualizada);
    } catch (err) {
      console.error(err);
      alert("Erro ao remover serviço.");
    } finally {
      setSavingServicoId(null);
    }
  }

  async function handleUpdateServico(
    servico: ServicoItem,
    novaDescricao: string,
    novoValor: number,
  ) {
    if (!ordem) return;
    if (
      novaDescricao === servico.descricao &&
      novoValor === Number(servico.valor)
    ) {
      return;
    }

    setSavingServicoId(servico.id);

    try {
      await removeServiceFromOrder(ordem.id, servico.id);
    } catch (err) {
      console.error(err);
      alert(
        "Não foi possível remover o serviço para editar. Nada foi alterado.",
      );
      setSavingServicoId(null);
      return;
    }

    try {
      const atualizada = await addServiceToOrder(ordem.id, {
        descricao: novaDescricao,
        valor: novoValor,
      });
      setOrdem(atualizada);
    } catch (err) {
      console.error(err);
      try {
        const restaurada = await addServiceToOrder(ordem.id, {
          descricao: servico.descricao,
          valor: Number(servico.valor),
        });
        setOrdem(restaurada);
        alert(
          "Não foi possível salvar a alteração. O serviço original foi restaurado.",
        );
      } catch (err2) {
        console.error(err2);
        alert(
          `Erro grave: o serviço "${servico.descricao}" foi removido e não pôde ser restaurado. Adicione-o novamente manualmente.`,
        );
      }
    } finally {
      setSavingServicoId(null);
    }
  }

  async function handleAddPeca() {
    if (!ordem || !itemEstoqueId) {
      setErroPeca("Selecione uma peça do estoque.");
      return;
    }
    const quantidadeNumero = Number(quantidadePeca);
    if (!quantidadeNumero || quantidadeNumero <= 0) {
      setErroPeca("Informe uma quantidade maior que zero.");
      return;
    }
    setAddingPeca(true);
    setErroPeca(null);
    try {
      const resultado = await addPartToOrder(ordem.id, {
        item_estoque_id: Number(itemEstoqueId),
        quantidade: quantidadeNumero,
      });
      setOrdem(resultado.ordem);
      setStockItems((prev) =>
        prev.map((item) =>
          item.id === Number(itemEstoqueId)
            ? { ...item, quantidade: resultado.estoque_restante }
            : item,
        ),
      );
      setItemEstoqueId("");
      setQuantidadePeca("");
    } catch (err: any) {
      setErroPeca(
        apiErrorMessage(
          err,
          "Erro ao adicionar peça — verifique o estoque disponível.",
        ),
      );
    } finally {
      setAddingPeca(false);
    }
  }

  async function handleRemovePeca(peca: PecaItem) {
    if (!ordem) return;
    setSavingPecaId(peca.id);
    try {
      const atualizada = await removePartFromOrder(ordem.id, peca.id);
      setOrdem(atualizada);
      setStockItems((prev) =>
        prev.map((item) =>
          item.id === peca.item_estoque.id
            ? { ...item, quantidade: item.quantidade + peca.quantidade }
            : item,
        ),
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao remover peça.");
    } finally {
      setSavingPecaId(null);
    }
  }

  async function handleUpdatePecaQuantidade(
    peca: PecaItem,
    novaQuantidade: number,
  ) {
    if (!ordem) return;
    if (novaQuantidade === peca.quantidade) return;

    setSavingPecaId(peca.id);

    try {
      await removePartFromOrder(ordem.id, peca.id);
    } catch (err) {
      console.error(err);
      alert("Não foi possível remover a peça para editar. Nada foi alterado.");
      setSavingPecaId(null);
      return;
    }

    try {
      const resultado = await addPartToOrder(ordem.id, {
        item_estoque_id: peca.item_estoque.id,
        quantidade: novaQuantidade,
      });
      setOrdem(resultado.ordem);
      setStockItems((prev) =>
        prev.map((item) =>
          item.id === peca.item_estoque.id
            ? { ...item, quantidade: resultado.estoque_restante }
            : item,
        ),
      );
    } catch (err) {
      console.error(err);
      try {
        const restaurado = await addPartToOrder(ordem.id, {
          item_estoque_id: peca.item_estoque.id,
          quantidade: peca.quantidade,
        });
        setOrdem(restaurado.ordem);
        setStockItems((prev) =>
          prev.map((item) =>
            item.id === peca.item_estoque.id
              ? { ...item, quantidade: restaurado.estoque_restante }
              : item,
          ),
        );
        alert(
          "Estoque insuficiente para essa quantidade. A quantidade original foi restaurada.",
        );
      } catch (err2) {
        console.error(err2);
        alert(
          `Erro grave: a peça "${peca.item_estoque.nome}" foi removida e não pôde ser restaurada. Adicione-a novamente manualmente.`,
        );
      }
    } finally {
      setSavingPecaId(null);
    }
  }

  if (loadingApoio) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Carregando dados...
      </div>
    );
  }

  if (erroApoio) {
    return (
      <div className="p-10 text-center text-sm text-red-500">{erroApoio}</div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F1F1F]">
            Nova Ordem de Serviço
          </h1>
          <p className="text-sm text-gray-500">
            {ordem
              ? `OS #${ordem.id} — adicione serviços e peças abaixo`
              : "Selecione cliente, veículo e mecânico para abrir a ordem"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/ordens-servico")}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft size={15} />
          Voltar
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <User size={18} />
          </div>
          <div>
            <p className="font-semibold text-[#1F1F1F]">
              Cliente, veículo e mecânico
            </p>
            <p className="text-xs text-gray-500">
              {ordem
                ? "Definidos na abertura da OS"
                : "Obrigatório para abrir a ordem"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 p-5 sm:grid-cols-3">
          <Field label="Cliente">
            <div className="relative">
              <User
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <select
                value={clienteId}
                onChange={(e) =>
                  handleClienteChange(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                disabled={!!ordem}
                className={inputClass}
              >
                <option value="">Selecione...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </Field>

          <Field label="Veículo">
            <div className="relative">
              <Car
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <select
                value={veiculoId}
                onChange={(e) =>
                  setVeiculoId(e.target.value ? Number(e.target.value) : "")
                }
                disabled={!!ordem || !clienteId}
                className={inputClass}
              >
                <option value="">
                  {clienteId ? "Selecione..." : "Escolha um cliente primeiro"}
                </option>
                {veiculosDoCliente.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.placa} — {v.marca} {v.modelo}
                  </option>
                ))}
              </select>
            </div>
          </Field>

          <Field label="Mecânico responsável">
            <div className="relative">
              <Wrench
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <select
                value={mecanicoId}
                onChange={(e) =>
                  setMecanicoId(e.target.value ? Number(e.target.value) : "")
                }
                disabled={!!ordem}
                className={inputClass}
              >
                <option value="">Selecione...</option>
                {mecanicos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {capitalizeName(m.nome)}
                  </option>
                ))}
              </select>
            </div>
          </Field>
        </div>

        <div className="border-t border-gray-100 p-5">
          <Field label="Observações (opcional)" full>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              disabled={!!ordem}
              placeholder="Alguma anotação para o mecânico responsável..."
              rows={2}
              className={plainInputClass}
            />
          </Field>
        </div>

        {erroCriacao && (
          <p className="px-5 pb-2 text-sm text-red-500">{erroCriacao}</p>
        )}

        {!ordem && (
          <div className="flex justify-end border-t border-gray-100 p-4">
            <button
              type="button"
              onClick={handleCriarOrdem}
              disabled={criando}
              className="flex items-center gap-2 rounded-lg bg-[#FF7518] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#FF7518]/30 hover:bg-[#e6690f] disabled:opacity-60"
            >
              {criando ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Check size={15} />
                  Abrir Ordem de Serviço
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {ordem && (
        <>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Wrench size={18} />
              </div>
              <div>
                <p className="font-semibold text-[#1F1F1F]">Serviços</p>
                <p className="text-xs text-gray-500">Descrição livre + valor</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 bg-gray-50/50 p-5 sm:flex-row sm:items-end">
              <Field label="Descrição do serviço" full>
                <input
                  type="text"
                  value={descricaoServico}
                  onChange={(e) => setDescricaoServico(e.target.value)}
                  placeholder="Ex: Troca de óleo e filtro"
                  className={plainInputClass}
                />
              </Field>
              <Field label="Valor (R$)">
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorServico}
                  onChange={(e) => setValorServico(e.target.value)}
                  placeholder="0,00"
                  className={`${plainInputClass} sm:w-32`}
                />
              </Field>
              <button
                type="button"
                onClick={handleAddServico}
                disabled={addingServico}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#FF7518] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e6690f] disabled:opacity-60"
              >
                <Plus size={15} />
                Adicionar
              </button>
            </div>
            {erroServico && (
              <p className="px-5 pb-4 text-sm text-red-500">{erroServico}</p>
            )}

            {ordem.servicos.length > 0 && (
              <ul className="divide-y divide-gray-50 border-t border-gray-100">
                {ordem.servicos.map((s) => (
                  <ServicoRow
                    key={s.id}
                    servico={s}
                    saving={savingServicoId === s.id}
                    onSave={(descricao, valor) =>
                      handleUpdateServico(s, descricao, valor)
                    }
                    onRemove={() => handleRemoveServico(s.id)}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#FF7518]">
                <PackageSearch size={18} />
              </div>
              <div>
                <p className="font-semibold text-[#1F1F1F]">Peças do estoque</p>
                <p className="text-xs text-gray-500">
                  A quantidade é descontada do estoque assim que a peça é
                  adicionada
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 bg-gray-50/50 p-5 sm:flex-row sm:items-end">
              <Field label="Peça" full>
                <select
                  value={itemEstoqueId}
                  onChange={(e) =>
                    setItemEstoqueId(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  className={plainInputClass}
                >
                  <option value="">Selecione...</option>
                  {stockItems.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      disabled={item.quantidade === 0}
                    >
                      {item.nome} (disponível: {item.quantidade})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Quantidade">
                <input
                  type="number"
                  min={1}
                  max={itemEstoqueSelecionado?.quantidade ?? undefined}
                  value={quantidadePeca}
                  onChange={(e) => setQuantidadePeca(e.target.value)}
                  className={`${plainInputClass} sm:w-28`}
                />
              </Field>
              <button
                type="button"
                onClick={handleAddPeca}
                disabled={addingPeca}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#FF7518] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e6690f] disabled:opacity-60"
              >
                <Plus size={15} />
                Adicionar
              </button>
            </div>
            {erroPeca && (
              <p className="flex items-center gap-1.5 px-5 pb-4 text-sm text-red-500">
                <AlertTriangle size={14} />
                {erroPeca}
              </p>
            )}

            {ordem.pecas.length > 0 && (
              <ul className="divide-y divide-gray-50 border-t border-gray-100">
                {ordem.pecas.map((p) => (
                  <PecaRow
                    key={p.id}
                    peca={p}
                    saving={savingPecaId === p.id}
                    onSaveQuantidade={(novaQuantidade) =>
                      handleUpdatePecaQuantidade(p, novaQuantidade)
                    }
                    onRemove={() => handleRemovePeca(p)}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Valor total da OS
              </p>
              <p className="text-2xl font-semibold text-[#1F1F1F]">
                {formatCurrency(ordem.valor_total)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/ordens-servico/${ordem.id}`)}
              className="flex items-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e6690f]"
            >
              Ir para detalhes da OS
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-1 flex-col gap-1.5 ${full ? "sm:flex-[2]" : ""}`}
    >
      <label className="text-xs font-semibold text-[#1B2130]">{label}</label>
      {children}
    </div>
  );
}
