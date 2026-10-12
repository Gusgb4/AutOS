import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface ToolbarMenuProps {
  label: string;
  icon: LucideIcon;
  /** Quantos itens estão ativos (mostra um contador no botão). */
  activeCount?: number;
  children: ReactNode;
}

/** Botão da barra de ferramentas que abre um painel flutuante. */
export default function ToolbarMenu({
  label,
  icon: Icon,
  activeCount = 0,
  children,
}: ToolbarMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!open) return;

    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm hover:bg-gray-50 ${
          activeCount > 0 || open
            ? "border-[#FF7518] text-[#FF7518]"
            : "border-gray-200 text-gray-600"
        }`}
      >
        <Icon size={15} />
        {label}
        {activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF7518] px-1.5 text-[11px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-64 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
          {children}
        </div>
      )}
    </div>
  );
}