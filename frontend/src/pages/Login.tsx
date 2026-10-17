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
      await signIn({ email, senha });
      navigate("/", { replace: true });
    } catch (err: any) {
      const apiMessage =
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0]?.message ||
        "Não foi possível concluir. Tente novamente.";
      setError(apiMessage);
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
            <div className="mb-4 rounded-xl border border-re  d-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
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
                  className="w-full rounded-xl border border-white/10 bg-[#242424] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#FF7518]"
                />
              </div>
            </Field>

            <Field
              label="Senha"
              action={
                <button
                  type="button"
                  className="text-xs font-medium text-[#FF7518] hover:underline"
                >
                  Esqueceu a senha?
                </button>
              }
            >
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
                  className="w-full rounded-xl border border-white/10 bg-[#242424] py-2.5 pl-9 pr-9 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#FF7518]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {/* Checkbox */}
            <label className="flex items-start gap-2 text-xs text-gray-400">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#242424] accent-[#FF7518]"
              />
              <span>Lembre-me por 30 dias</span>
            </label>

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
        </div>

        {/* Trust badges */}
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