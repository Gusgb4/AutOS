import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
  FileCheck,
  Loader2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { mensagemDeErro } from "../lib/errors";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    setSubmitting(true);
    try {
      const loggedUser = await signIn({ email, senha });
      if (loggedUser?.trocar_senha) {
        navigate("/trocar-senha", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(
        mensagemDeErro(err, "Não foi possível concluir. Tente novamente."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#151515] px-4 py-10">
      {/* Glow decorativo no topo */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-1 w-full max-w-md -translate-x-1/2 bg-gradient-to-r from-transparent via-[#FF7518] to-transparent blur-sm" />

      <div className="w-full max-w-md">
        {/* Badge */}
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF7518]/30 bg-[#FF7518]/10 px-3 py-1 text-xs font-medium text-[#FF7518]">
            <Lock size={12} />
            Login seguro
          </span>
        </div>

        {/* Título */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-white">
            Bem-vindo de volta!
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Entre com sua conta para continuar.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/5 bg-[#1C1C1C] p-6 shadow-xl">
          {/* Mensagem de erro da API */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Formulário */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label="Email">
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="você@email.com"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#242424] py-2.5 pl-9 pr-3 text-base text-white placeholder:text-gray-500 outline-none focus:border-[#FF7518] md:text-sm"
                />
              </div>
            </Field>

            <Field label="Senha">
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Coloque sua senha"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-white/10 bg-[#242424] py-2.5 pl-9 pr-11 text-base text-white placeholder:text-gray-500 outline-none focus:border-[#FF7518] md:pr-9 md:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-300 md:right-3 md:inline-block md:h-auto md:w-auto"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <p className="text-xs text-gray-400">
              Esqueceu a senha? Peça ao proprietário da oficina para redefinir.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF7518] py-3 text-sm font-semibold text-white transition hover:bg-[#e6690f] disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Continue para o Menu
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Rodapé com Termos de Serviço e Política de Privacidade */}
          <div className="mt-5 border-t border-white/5 pt-4 text-center text-xs text-gray-400">
            <Link
              to="/termos-de-uso"
              className="text-[#FF7518] hover:underline"
            >
              Termos de Serviço
            </Link>{" "}
            e{" "}
            <Link
              to="/politica-de-privacidade"
              className="text-[#FF7518] hover:underline"
            >
              Política de Privacidade
            </Link>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500 md:flex-nowrap md:gap-6">
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

interface FieldProps {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function Field({ label, action, children }: FieldProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-medium text-gray-300">{label}</label>
        {action}
      </div>
      {children}
    </div>
  );
}
