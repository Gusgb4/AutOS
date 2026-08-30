import { useState, useEffect, type FormEvent } from "react";
import {
  X,
  User,
  Phone,
  IdCard,
  Mail,
  MapPin,
  Calendar,
  Lock,
  Car,
  Tag,
  Hash,
  Trash2,
  Check,
} from "lucide-react";

export interface ClientFormData {
  nome: string;
  telefone: string;
  documento: string;
}

export interface NewVehicleData {
  marca: string;
  modelo: string;
  placa: string;
  ano: number;
}

interface ClientFormModalProps {
  mode: "add" | "edit";
  open: boolean;
  clientName?: string;
  initialData?: ClientFormData;
  submitting?: boolean;
  onClose: () => void;
  onSave: (data: ClientFormData, vehicle?: NewVehicleData) => void;
  onDelete?: () => void;
}

const emptyForm: ClientFormData = {
  nome: "",
  telefone: "",
  documento: "",
};

const emptyVehicle = {
  marca: "",
  modelo: "",
  placa: "",
  ano: "",
};

export default function ClientFormModal({
  mode,
  open,
  clientName,
  initialData,
  submitting = false,
  onClose,
  onSave,
  onDelete,
}: ClientFormModalProps) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState<ClientFormData>(initialData ?? emptyForm);

  const [wantsVehicle, setWantsVehicle] = useState(false);
  const [vehicle, setVehicle] = useState(emptyVehicle);

  useEffect(() => {
    if (open) {
      setForm(initialData ?? emptyForm);
      setWantsVehicle(false);
      setVehicle(emptyVehicle);
    }
  }, [open, initialData]);

  if (!open) return null;

  function handleChange<K extends keyof ClientFormData>(
    key: K,
    value: ClientFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleVehicleChange(key: keyof typeof emptyVehicle, value: string) {
    setVehicle((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    let vehiclePayload: NewVehicleData | undefined;

    if (!isEdit && wantsVehicle) {
      if (!vehicle.marca || !vehicle.modelo || !vehicle.placa || !vehicle.ano) {
        alert("Preencha todos os campos do veículo ou desative a opção de adicionar veículo.");
        return;
      }
      vehiclePayload = {
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        placa: vehicle.placa,
        ano: Number(vehicle.ano),
      };
    }

    onSave(form, vehiclePayload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-16 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-8rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3.5 border-b border-gray-100 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <User size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-[#1B2130]">
              {isEdit ? (
                <>
                  Editar Cliente:{" "}
                  <span className="text-[#FF7518]">{clientName}</span>
                </>
              ) : (
                "Novo Cliente"
              )}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {isEdit
                ? "Atualize os dados de contato deste cliente."
                : "Cadastre um novo cliente e, se quiser, o primeiro veículo dele."}
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
          id="client-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5"
        >
          <SectionLabel>Dados pessoais</SectionLabel>

          <div className="mb-1 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Nome completo" full>
              <InputWithIcon icon={User}>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => handleChange("nome", e.target.value)}
                  placeholder="Ex: João Silva"
                  required
                  className="input-field"
                />
              </InputWithIcon>
            </Field>

            <Field label="Telefone">
              <InputWithIcon icon={Phone}>
                <input
                  type="tel"
                  value={form.telefone}
                  onChange={(e) => handleChange("telefone", e.target.value)}
                  placeholder="(47) 99xxx-xxxx"
                  required
                  className="input-field"
                />
              </InputWithIcon>
            </Field>

            <Field label="Documento (CPF/CNPJ)">
              <InputWithIcon icon={IdCard}>
                <input
                  type="text"
                  value={form.documento}
                  onChange={(e) => handleChange("documento", e.target.value)}
                  placeholder="000.000.000-00"
                  required
                  className="input-field"
                />
              </InputWithIcon>
            </Field>

            {/* -------- Campos desativados (ainda não suportados pelo backend) -------- */}

            <Field label="Email" optional disabled>
              <InputWithIcon icon={Mail} disabled>
                <input
                  type="email"
                  value=""
                  disabled
                  placeholder="Desativado"
                  className="input-field input-field-disabled"
                />
              </InputWithIcon>
            </Field>

            <Field label="Endereço" optional disabled full>
              <InputWithIcon icon={MapPin} disabled>
                <input
                  type="text"
                  value=""
                  disabled
                  placeholder="Desativado"
                  className="input-field input-field-disabled"
                />
              </InputWithIcon>
            </Field>

            <Field label="Status" disabled>
              <div className="flex gap-2 opacity-50">
                <button
                  type="button"
                  disabled
                  className="flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-gray-200 bg-gray-50 px-2.5 py-2 text-xs font-bold text-gray-400"
                >
                  <Lock size={11} />
                  Desativado
                </button>
              </div>
            </Field>

            <Field label="Cliente desde" disabled>
              <div className="relative">
                <Calendar
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                />
                <input
                  type="text"
                  disabled
                  value="Desativado"
                  className="w-full rounded-lg border border-dashed border-gray-200 bg-gray-100 py-2.5 pl-9 pr-3 text-sm text-gray-400 outline-none"
                />
              </div>
            </Field>
          </div>

          <p className="mb-4 mt-2 flex items-center gap-1.5 text-xs text-gray-400">
            <Lock size={12} />
            Os campos acima ainda não são suportados pelo sistema e não serão
            salvos.
          </p>

          {/* -------- Veículo (só no modo "add") -------- */}
          {!isEdit && (
            <>
              <button
                type="button"
                onClick={() => setWantsVehicle((v) => !v)}
                className="mb-3.5 flex w-full items-center justify-between rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3.5 py-3 text-left hover:bg-gray-100/70"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <Car size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1B2130]">
                      Adicionar veículo agora
                    </p>
                    <p className="text-xs text-gray-500">
                      Opcional — dá pra fazer isso depois no perfil do cliente
                    </p>
                  </div>
                </div>
                <span
                  className={`relative h-[21px] w-9 shrink-0 rounded-full transition ${
                    wantsVehicle ? "bg-[#FF7518]" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`absolute top-[2.5px] h-4 w-4 rounded-full bg-white shadow transition-all ${
                      wantsVehicle ? "left-[17px]" : "left-[2.5px]"
                    }`}
                  />
                </span>
              </button>

              {wantsVehicle && (
                <div className="mb-2 rounded-xl border border-gray-200 p-3.5">
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <Field label="Marca">
                      <InputWithIcon icon={Tag}>
                        <input
                          type="text"
                          value={vehicle.marca}
                          onChange={(e) =>
                            handleVehicleChange("marca", e.target.value)
                          }
                          placeholder="Ex: Toyota"
                          className="input-field"
                        />
                      </InputWithIcon>
                    </Field>
                    <Field label="Modelo">
                      <InputWithIcon icon={Car}>
                        <input
                          type="text"
                          value={vehicle.modelo}
                          onChange={(e) =>
                            handleVehicleChange("modelo", e.target.value)
                          }
                          placeholder="Ex: Camry"
                          className="input-field"
                        />
                      </InputWithIcon>
                    </Field>
                    <Field label="Placa">
                      <InputWithIcon icon={Hash}>
                        <input
                          type="text"
                          value={vehicle.placa}
                          onChange={(e) =>
                            handleVehicleChange(
                              "placa",
                              e.target.value.toUpperCase(),
                            )
                          }
                          placeholder="ABC-1234"
                          className="input-field uppercase"
                        />
                      </InputWithIcon>
                    </Field>
                    <Field label="Ano">
                      <InputWithIcon icon={Calendar}>
                        <input
                          type="number"
                          value={vehicle.ano}
                          onChange={(e) =>
                            handleVehicleChange("ano", e.target.value)
                          }
                          placeholder="Ex: 2019"
                          min={1900}
                          max={new Date().getFullYear() + 1}
                          className="input-field"
                        />
                      </InputWithIcon>
                    </Field>
                  </div>
                </div>
              )}
            </>
          )}
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
              Remover cliente
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
              form="client-form"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-[#FF7518] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#FF7518]/30 hover:bg-[#e6690f] disabled:opacity-60"
            >
              <Check size={15} />
              {submitting
                ? "Salvando..."
                : isEdit
                  ? "Salvar Alterações"
                  : "Salvar Cliente"}
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
        .input-field-disabled {
          background: #F3F4F6 !important;
          color: #9AA4B8 !important;
          border-style: dashed !important;
          cursor: not-allowed;
        }
        .input-field-disabled::placeholder {
          color: #B4BAC6;
        }
      `}</style>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wide text-gray-400">
        {children}
      </span>
      <span className="h-px flex-1 bg-gray-100" />
    </div>
  );
}

interface FieldProps {
  label: string;
  optional?: boolean;
  full?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

function Field({ label, optional, full, disabled, children }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <label
        className={`text-xs font-semibold ${
          disabled ? "text-gray-400" : "text-[#1B2130]"
        }`}
      >
        {label}{" "}
        {optional && (
          <span className="font-medium text-gray-400">(opcional)</span>
        )}
      </label>
      {children}
    </div>
  );
}

function InputWithIcon({
  icon: Icon,
  disabled,
  children,
}: {
  icon: typeof User;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon
        size={15}
        className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${
          disabled ? "text-gray-300" : "text-gray-400"
        }`}
      />
      {children}
    </div>
  );
}