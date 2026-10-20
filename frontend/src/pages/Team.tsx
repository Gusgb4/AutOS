import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  ClipboardList,
  Search,
  Loader2,
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
  type TeamMember,
} from "../services/users";

const ABAS = [
  { id: "membros", label: "Membros", icon: Users },
  { id: "produtividade", label: "Produtividade", icon: TrendingUp },
] as const;

type Aba = (typeof ABAS)[number]["id"];

export default function Team() {
  const { user } = useAuth();
  const [aba, setAba] = useState<Aba>("membros");
  const [membros, setMembros] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [alterando, setAlterando] = useState<number | null>(null);

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
      <div>
        <h1 className="text-2xl font-semibold text-[#1F1F1F]">Equipe</h1>
        <p className="text-sm text-gray-500">
          Gerencie o acesso da equipe e acompanhe as ordens de serviço de cada
          pessoa.
        </p>
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
                            <div className="flex justify-end">
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
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
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
    </div>
  );
}
