import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Users,
  UserCheck,
  UserX,
  ClipboardList,
  Search,
  Loader2,
  Plus,
  KeyRound,
  Copy,
  Check,
  X,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import StatCard from "../components/ui/StatCard";
import ProdutividadeTab from "../components/team/ProdutividadeTab";
import { useAuth } from "../contexts/AuthContext";
import { PERFIL_LABEL } from "../lib/auth";
import { mensagemDeErro } from "../lib/errors";
import {
  listTeam,
  activateUser,
  deactivateUser,
  createUser,
  resetUserPassword,
  type TeamMember,
} from "../services/users";

interface SenhaGeradaInfo {
  titulo: string;
  nome: string;
  email: string;
  senha: string;
}

const ABAS = [
  { id: "membros", label: "Membros", icon: Users },
  { id: "produtividade", label: "Produtividade", icon: TrendingUp },
] as const;

type Aba = (typeof ABAS)[number]["id"];

export default function Team() {
  const [aba, setAba] = useState<Aba>("membros");
  const { user } = useAuth();
  const [membros, setMembros] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [alterando, setAlterando] = useState<number | null>(null);
  const [redefinindo, setRedefinindo] = useState<number | null>(null);

  // Estados do modal "Novo membro"
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoPerfil, setNovoPerfil] = useState<"FUNCIONARIO" | "PROPRIETARIO">(
    "FUNCIONARIO",
  );
  const [criando, setCriando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  // Estados do modal de exibição da senha provisória
  const [senhaGerada, setSenhaGerada] = useState<SenhaGeradaInfo | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let ativo = true;
    listTeam()
      .then((data) => {
        if (ativo) setMembros(data);
      })
      .catch((e) => {
        if (!ativo) return;
        console.error(e);
        setErro("Não foi possível carregar a equipe.");
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  function abrirModalNovo() {
    setNovoNome("");
    setNovoEmail("");
    setNovoPerfil("FUNCIONARIO");
    setErroModal(null);
    setModalNovoAberto(true);
  }

  function fecharModalNovo() {
    if (criando) return;
    setModalNovoAberto(false);
    setErroModal(null);
  }

  async function handleCriarMembro(e: FormEvent) {
    e.preventDefault();
    setErroModal(null);

    const nomeLimpo = novoNome.trim();
    const emailLimpo = novoEmail.trim();

    if (!nomeLimpo || !emailLimpo) {
      setErroModal("Preencha o nome e o e-mail do membro.");
      return;
    }

    setCriando(true);
    try {
      const { usuario, senha_provisoria } = await createUser({
        nome: nomeLimpo,
        email: emailLimpo,
        perfil: novoPerfil,
      });

      setMembros((atuais) =>
        [...atuais, usuario].sort((a, b) => a.nome.localeCompare(b.nome)),
      );
      setModalNovoAberto(false);
      setCopiado(false);
      setSenhaGerada({
        titulo: "Membro cadastrado com sucesso!",
        nome: usuario.nome,
        email: usuario.email,
        senha: senha_provisoria,
      });
    } catch (err) {
      setErroModal(mensagemDeErro(err, "Não foi possível cadastrar o membro."));
    } finally {
      setCriando(false);
    }
  }

  async function handleRedefinirSenha(membro: TeamMember) {
    if (
      !confirm(
        `Gerar uma nova senha provisória para "${membro.nome}"?\n\nA senha atual deixará de funcionar imediatamente e a pessoa precisará criar uma nova senha no próximo login.`,
      )
    ) {
      return;
    }

    setRedefinindo(membro.id);
    setErro(null);
    try {
      const { senha_provisoria } = await resetUserPassword(membro.id);
      setCopiado(false);
      setSenhaGerada({
        titulo: "Senha redefinida com sucesso!",
        nome: membro.nome,
        email: membro.email,
        senha: senha_provisoria,
      });
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível redefinir a senha."));
    } finally {
      setRedefinindo(null);
    }
  }

  async function handleAlternar(membro: TeamMember) {
    const desativando = membro.ativo;
    const acao = desativando ? "Desativar" : "Reativar";
    if (!confirm(`${acao} o acesso de "${membro.nome}"?`)) return;

    setAlterando(membro.id);
    setErro(null);
    try {
      const atualizado = desativando
        ? await deactivateUser(membro.id)
        : await activateUser(membro.id);

      setMembros((atuais) =>
        atuais.map((m) =>
          m.id === membro.id ? { ...m, ativo: atualizado.ativo } : m,
        ),
      );
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível alterar o status."));
    } finally {
      setAlterando(null);
    }
  }

  async function handleCopiarSenha() {
    if (!senhaGerada) return;
    try {
      await navigator.clipboard.writeText(senhaGerada.senha);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Fallback caso o navegador bloqueie a API de clipboard
      const input = document.createElement("input");
      input.value = senhaGerada.senha;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  }

  const totalAtivos = membros.filter((m) => m.ativo).length;
  const totalDesativados = membros.length - totalAtivos;
  const osEmCurso = membros.reduce((soma, m) => soma + m.os_ativas, 0);

  const termo = busca.trim().toLowerCase();
  const exibidos = useMemo(
    () =>
      termo
        ? membros.filter(
            (m) =>
              m.nome.toLowerCase().includes(termo) ||
              m.email.toLowerCase().includes(termo),
          )
        : membros,
    [membros, termo],
  );

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F1F1F]">Equipe</h1>
          <p className="text-sm text-gray-500">
            Gerencie o acesso da equipe e acompanhe as ordens de serviço de cada
            pessoa.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirModalNovo}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e66812]"
        >
          <Plus size={18} />
          Novo membro
        </button>
      </div>

      <div className="flex w-fit gap-1 rounded-xl bg-white p-1 shadow-sm">
        {ABAS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setAba(a.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                aba === a.id
                  ? "bg-[#FF7518] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={16} />
              {a.label}
            </button>
          );
        })}
      </div>

      {aba === "produtividade" && <ProdutividadeTab />}

      {aba === "membros" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="TOTAL DA EQUIPE"
              value={membros.length}
              icon={Users}
              accentColor="#FF7518"
            />
            <StatCard
              label="ATIVOS"
              value={totalAtivos}
              icon={UserCheck}
              accentColor="#10B981"
            />
            <StatCard
              label="DESATIVADOS"
              value={totalDesativados}
              icon={UserX}
              accentColor="#6B7280"
            />
            <StatCard
              label="OS EM CURSO"
              value={osEmCurso}
              icon={ClipboardList}
              accentColor="#2563EB"
            />
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF75181A] text-[#FF7518]">
                  <Users size={18} />
                </div>
                <div>
                  <p className="font-semibold text-[#1F1F1F]">Membros</p>
                  <p className="text-xs text-gray-500">
                    Mostrando {exibidos.length} de {membros.length} pessoas
                  </p>
                </div>
              </div>

              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome ou email..."
                  className="w-64 rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#FF7518]"
                />
              </div>
            </div>

            {erro && (
              <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-600">
                {erro}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin" />
                Carregando equipe...
              </div>
            ) : exibidos.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                Nenhuma pessoa encontrada.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                      <th className="px-5 py-3 font-medium">Nome</th>
                      <th className="px-5 py-3 font-medium">Perfil</th>
                      <th className="px-5 py-3 font-medium">
                        Ordens de serviço
                      </th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 text-right font-medium">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {exibidos.map((m) => {
                      const ehVoce = m.id === user?.id;
                      return (
                        <tr
                          key={m.id}
                          className={`border-b border-gray-50 last:border-0 ${
                            m.ativo ? "" : "bg-gray-50/60"
                          }`}
                        >
                          <td className="px-5 py-4">
                            <div
                              className={`flex items-center gap-3 ${
                                m.ativo ? "" : "opacity-60"
                              }`}
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF75181A] text-sm font-semibold text-[#FF7518]">
                                {m.nome.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-[#1F1F1F]">
                                  {m.nome}
                                  {ehVoce && (
                                    <span className="ml-2 text-xs font-normal text-gray-400">
                                      (você)
                                    </span>
                                  )}
                                </p>
                                <p className="truncate text-xs text-gray-500">
                                  {m.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                              {PERFIL_LABEL[m.perfil]}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            <span className="font-medium text-[#1F1F1F]">
                              {m.total_os}
                            </span>{" "}
                            OS
                            {m.os_ativas > 0 && (
                              <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                                {m.os_ativas} em curso
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {m.ativo ? (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                                Ativo
                              </span>
                            ) : (
                              <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600">
                                Desativado
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleRedefinirSenha(m)}
                                disabled={redefinindo === m.id || ehVoce}
                                title={
                                  ehVoce
                                    ? "Use a opção 'Alterar senha' na barra lateral para trocar sua própria senha"
                                    : "Gerar uma nova senha provisória para este membro"
                                }
                                className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {redefinindo === m.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <KeyRound size={12} />
                                )}
                                Redefinir senha
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAlternar(m)}
                                disabled={
                                  alterando === m.id || (ehVoce && m.ativo)
                                }
                                title={
                                  ehVoce && m.ativo
                                    ? "Você não pode desativar sua própria conta"
                                    : undefined
                                }
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                  m.ativo
                                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                }`}
                              >
                                {alterando === m.id && (
                                  <Loader2 size={12} className="animate-spin" />
                                )}
                                {m.ativo ? "Desativar" : "Reativar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal: Novo Membro */}
      {modalNovoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-[#1F1F1F]">
                  Novo membro da equipe
                </h2>
                <p className="text-xs text-gray-500">
                  Uma senha provisória será gerada automaticamente.
                </p>
              </div>
              <button
                type="button"
                onClick={fecharModalNovo}
                disabled={criando}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCriarMembro} className="mt-4 space-y-4">
              {erroModal && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">
                  {erroModal}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Nome completo
                </label>
                <input
                  type="text"
                  required
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex.: João da Silva"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF7518]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  E-mail de acesso
                </label>
                <input
                  type="email"
                  required
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  placeholder="joao@oficina.com"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF7518]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Perfil de acesso
                </label>
                <select
                  value={novoPerfil}
                  onChange={(e) =>
                    setNovoPerfil(
                      e.target.value as "FUNCIONARIO" | "PROPRIETARIO",
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#FF7518]"
                >
                  <option value="FUNCIONARIO">Funcionário (Mecânico)</option>
                  <option value="PROPRIETARIO">Proprietário (Admin)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={fecharModalNovo}
                  disabled={criando}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criando}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e66812] disabled:opacity-50"
                >
                  {criando && <Loader2 size={14} className="animate-spin" />}
                  Criar membro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Exibição da Senha Provisória */}
      {senhaGerada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-[#1F1F1F]">
                  {senhaGerada.titulo}
                </h2>
                <p className="text-xs text-gray-500">
                  {senhaGerada.nome} ({senhaGerada.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSenhaGerada(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Senha provisória gerada
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 font-mono text-base font-semibold tracking-wider text-[#1F1F1F]">
                    {senhaGerada.senha}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopiarSenha}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF7518] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#e66812]"
                  >
                    {copiado ? (
                      <>
                        <Check size={15} />
                        Copiada!
                      </>
                    ) : (
                      <>
                        <Copy size={15} />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0 text-amber-600"
                />
                <div>
                  <p className="font-semibold">
                    Atenção: copie esta senha agora!
                  </p>
                  <p className="mt-0.5 text-amber-700">
                    Por segurança, esta senha provisória só é exibida esta única
                    vez. No primeiro acesso, o membro será obrigado a definir
                    uma nova senha pessoal.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setSenhaGerada(null)}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Entendi, fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
