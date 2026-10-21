import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Wrench } from "lucide-react";

// Data da última revisão dos Termos e da Política (os dois mudam juntos)
export const ULTIMA_ATUALIZACAO = "21 de outubro de 2026";

// Moldura comum dos Termos de Uso e da Política de Privacidade
export function LegalPage({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/login" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF7518]">
              <Wrench size={18} className="text-white" />
            </div>
            <span className="font-semibold text-[#1F1F1F]">AutOS</span>
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1F1F1F]"
          >
            <ArrowLeft size={15} />
            Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1F1F1F]">{titulo}</h1>
          <p className="mt-2 text-sm text-gray-500">
            Última atualização: {ULTIMA_ATUALIZACAO}
          </p>
        </div>

        <div className="space-y-8 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-base font-bold text-[#1F1F1F]">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-gray-600 [&_li]:ml-4 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
