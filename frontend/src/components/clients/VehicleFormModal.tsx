import { useState, useEffect, type FormEvent } from "react";
import { X, Car, Hash, Tag, Calendar, Trash2, Check } from "lucide-react";

export interface VehicleFormData {
  marca: string;
  modelo: string;
  placa: string;
  ano: number | "";
}

interface VehicleFormModalProps {
  mode: "add" | "edit";
  open: boolean;
  initialData?: VehicleFormData;
  submitting?: boolean;
  onClose: () => void;
  onSave: (data: VehicleFormData) => void;
  onDelete?: () => void;
}

const emptyForm: VehicleFormData = {
  marca: "",
  modelo: "",
  placa: "",
  ano: "",
};

export default function VehicleFormModal({
  mode,
  open,
  initialData,
  submitting = false,
  onClose,
  onSave,
  onDelete,
}: VehicleFormModalProps) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState<VehicleFormData>(initialData ?? emptyForm);

  useEffect(() => {
    if (open) {
      setForm(initialData ?? emptyForm);
    }
  }, [open, initialData]);

  if (!open) return null;

  function handleChange<K extends keyof VehicleFormData>(
    key: K,
    value: VehicleFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-16 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-8rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3.5 border-b border-gray-100 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Car size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-[#1B2130]">
              {isEdit ? "Editar Veículo" : "Adicionar Veículo"}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {isEdit
                ? "Atualize os dados deste veículo."
                : "Cadastre um novo veículo para este cliente."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <form
          id="vehicle-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5"
        >
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Marca">
              <InputWithIcon icon={Tag}>
                <input
                  type="text"
                  value={form.marca}
                  onChange={(e) => handleChange("marca", e.target.value)}
                  placeholder="Ex: Toyota"
                  required
                  className="input-field"
                />
              </InputWithIcon>
            </Field>

            <Field label="Modelo">
              <InputWithIcon icon={Car}>
                <input
                  type="text"
                  value={form.modelo}
                  onChange={(e) => handleChange("modelo", e.target.value)}
                  placeholder="Ex: Camry"
                  required
                  className="input-field"
                />
              </InputWithIcon>
            </Field>

            <Field label="Placa">
              <InputWithIcon icon={Hash}>
                <input
                  type="text"
                  value={form.placa}
                  onChange={(e) =>
                    handleChange("placa", e.target.value.toUpperCase())
                  }
                  placeholder="ABC-1234"
                  required
                  className="input-field uppercase"
                />
              </InputWithIcon>
            </Field>

            <Field label="Ano">
              <InputWithIcon icon={Calendar}>
                <input
                  type="number"
                  value={form.ano}
                  onChange={(e) =>
                    handleChange(
                      "ano",
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  placeholder="Ex: 2019"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  required
                  className="input-field"
                />
              </InputWithIcon>
            </Field>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-gray-100 bg-gray-50/60 p-4">
          {isEdit && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 rounded-lg px-1 py-2 text-xs font-bold text-red-500 hover:text-red-600"
            >
              <Trash2 size={14} />
              Remover veículo
            </button>
          )}

          <div className="ml-auto flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#1B2130] hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="vehicle-form"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-[#FF7518] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#FF7518]/30 hover:bg-[#e6690f] disabled:opacity-60"
            >
              <Check size={15} />
              {submitting ? "Salvando..." : isEdit ? "Salvar Alterações" : "Salvar Veículo"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          font-size: 13.5px;
          color: #1B2130;
          border: 1.5px solid #E7E9EE;
          border-radius: 7px;
          padding: 10px 12px 10px 34px;
          background: #FBFBFC;
          outline: none;
          transition: 0.13s;
        }
        .input-field:focus {
          border-color: #FF7518;
          background: #fff;
          box-shadow: 0 0 0 3px #FDE7DA;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#1B2130]">{label}</label>
      {children}
    </div>
  );
}

function InputWithIcon({
  icon: Icon,
  children,
}: {
  icon: typeof Car;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      {children}
    </div>
  );
}