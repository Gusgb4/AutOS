import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
  FileCheck,
  Loader2,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { trocarSenha } from "../services/auth";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isFirstAccess = !!user?.trocar_senha;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (novaSenha.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError("A nova senha e a confirmação não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      await trocarSenha({
        senha_atual: senhaAtual,
        nova_senha: novaSenha,
      });

      if (user) {
        updateUser({ ...user, trocar_senha: false });
      }

      navigate("/", { replace: true });
    } catch (err: any) {
      const apiMessage =
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0]?.message ||
        "Erro ao alterar a senha. Verifique sua senha atual.";
      setError(apiMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#151515] px-4 py-10">
      <div className="pointer-events-none absolute left-1/2 top-0 h-1 w-full max-w-md -translate-x-1/2 bg-gradient-to-r from-transparent via-[#FF7518] to-transparent blur-sm" />

      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF7518]/30 bg-[#FF7518]/10 px-3 py-1 text-xs font-medium text-[#FF7518]">
            <KeyRound size={12} />
            {isFirstAccess ? "Primeiro Acesso" : "Segurança da Conta"}
          </span>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-white">
            {isFirstAccess ? "Defina sua nova senha" : "Alterar Senha"}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {isFirstAccess
              ? "Por razões de segurança, informe sua senha provisória atual e escolha uma nova senha."
              : "Informe sua senha atual e escolha uma nova senha segura."}
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#1C1C1C] p-6 shadow-xl">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-300">
                Senha Atual {isFirstAccess ? "(provisória recebida no terminal)" : ""}
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type={showCurrent ? "text" : "password"}
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Digite sua senha atual"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#242424] py-2.5 pl-9 pr-9 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#FF7518]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-300">
                Nova Senha
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type={showNew ? "text" : "password"}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-white/10 bg-[#242424] py-2.5 pl-9 pr-9 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#FF7518]"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-300">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-white/10 bg-[#242424] py-2.5 pl-9 pr-9 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#FF7518]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF7518] py-3 text-sm font-semibold text-white transition hover:bg-[#e6690f] disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Salvar Nova Senha e Entrar
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {!isFirstAccess && (
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full rounded-xl border border-white/10 bg-[#242424] py-2.5 text-sm font-medium text-gray-300 transition hover:bg-[#2c2c2c]"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} />
            SSL Criptado
          </span>
          <span className="flex items-center gap-1.5">
            <BadgeCheck size={14} />
            SOC 2 Compilado
          </span>
          <span className="flex items-center gap-1.5">
            <FileCheck size={14} />
            GDPR Pronto
          </span>
        </div>
      </div>
    </div>
  );
}