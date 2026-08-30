import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  UserPlus,
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

type Mode = "login" | "register";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!isLogin && senha !== confirmarSenha) {
      setError("As senhas não coincidem");
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        await signIn({ email, senha });
      } else {
        await signUp({ nome, email, senha });
      }
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

  function toggleMode(next: Mode) {
    setMode(next);
    setError(null);
    setNome("");
    setEmail("");
    setSenha("");
    setConfirmarSenha("");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#151515] px-4 py-10">
      {/* Glow decorativo no topo */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-1 w-full max-w-md -translate-x-1/2 bg-gradient-to-r from-transparent via-[#FF7518] to-transparent blur-sm" />

      <div className="w-full max-w-md">
        {/* Badge */}
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF7518]/30 bg-[#FF7518]/10 px-3 py-1 text-xs font-medium text-[#FF7518]">
            {isLogin ? (
              <>
                <Lock size={12} />
                Login seguro
              </>
            ) : (
              <>
                <UserPlus size={12} />
                Conta gratuita
              </>
            )}
          </span>
        </div>

        {/* Título */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-white">
            {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
          </h1>
          {isLogin && (
            <p className="mt-1 text-sm text-gray-400">
              Entre com sua conta para continuar.
            </p>
          )}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/5 bg-[#1C1C1C] p-6 shadow-xl">
          {/* Mensagem de erro da API */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#242424] py-3 text-sm font-medium text-white transition hover:bg-[#2c2c2c]"
          >
            <GoogleIcon />
            Continue com Google
          </button>

          {/* Divisor */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-gray-500">
              {isLogin ? "ou logue com email" : "ou registre seu email"}
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Formulário */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <Field label="Nome completo">
                <div className="relative">
                  <UserPlus
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="William Squena"
                    required
                    minLength={2}
                    className="w-full rounded-xl border border-white/10 bg-[#242424] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#FF7518]"
                  />
                </div>
              </Field>
            )}

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
                isLogin ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-[#FF7518] hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                ) : undefined
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
                  placeholder={
                    isLogin ? "Coloque sua senha" : "Crie uma senha forte"
                  }
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

            {!isLogin && (
              <Field label="Confirme sua senha">
                <div className="relative">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Reescreva sua senha"
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#242424] py-2.5 pl-9 pr-9 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#FF7518]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    aria-label={
                      showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </Field>
            )}

            {/* Checkbox */}
            {isLogin ? (
              <label className="flex items-start gap-2 text-xs text-gray-400">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#242424] accent-[#FF7518]"
                />
                <span>Lembre-me por 30 dias</span>
              </label>
            ) : (
              <label className="flex items-start gap-2 text-xs text-gray-400">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#242424] accent-[#FF7518]"
                />
                <span>
                  Eu concordo com os{" "}
                  <a href="#" className="text-[#FF7518] hover:underline">
                    Termos de Serviço
                  </a>{" "}
                  e{" "}
                  <a href="#" className="text-[#FF7518] hover:underline">
                    Política de Privacidade
                  </a>
                </span>
              </label>
            )}

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
                  {isLogin ? "Continue para o Menu" : "Crie sua conta"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-5 text-center text-sm text-gray-400">
            {isLogin ? (
              <>
                Não tem conta?{" "}
                <button
                  type="button"
                  onClick={() => toggleMode("register")}
                  className="font-medium text-[#FF7518] hover:underline"
                >
                  Crie uma agora já!
                </button>
              </>
            ) : (
              <>
                Já tenho uma conta?{" "}
                <button
                  type="button"
                  onClick={() => toggleMode("login")}
                  className="font-medium text-[#FF7518] hover:underline"
                >
                  Entre!
                </button>
              </>
            )}
          </p>
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

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}