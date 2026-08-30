import { useState, useEffect, type FormEvent } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Car,
  Trash2,
  Check,
  Plus,
} from "lucide-react";

export interface ClientVehicleSummary {
  id: string;
  modelo: string;
  placa: string;
}

export interface ClientFormData {
  id?: string;
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
  status: "ativo" | "inativo";
  clienteDesde?: string; // só leitura no modo edit
}

export interface NewVehicleData {
  modelo: string;
  ano: string;
  placa: string;
  cor: string;
}

interface ClientFormModalProps {
  mode: "add" | "edit";
  open: boolean;
  client?: ClientFormData;
  vehicles?: ClientVehicleSummary[];
  onClose: () => void;
  onSave: (data: ClientFormData, vehicle?: NewVehicleData) => void;
  onDelete?: () => void;
  onAddVehicle?: () => void;
}

const emptyClient: ClientFormData = {
  nome: "",
  telefone: "",
  email: "",
  endereco: "",
  status: "ativo",
};

export default function ClientFormModal({
  mode,
  open,
  client,
  vehicles = [],
  onClose,
  onSave,
  onDelete,
  onAddVehicle,
}: ClientFormModalProps) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState<ClientFormData>(client ?? emptyClient);
  const [wantsVehicle, setWantsVehicle] = useState(false);
  const [vehicle, setVehicle] = useState<NewVehicleData>({
    modelo: "",
    ano: "",
    placa: "",
    cor: "",
  });

  // Sincroniza o form quando abre/troca de cliente
  useEffect(() => {
    if (open) {
      setForm(client ?? emptyClient);
      setWantsVehicle(false);
      setVehicle({ modelo: "", ano: "", placa: "", cor: "" });
    }
  }, [open, client]);

  if (!open) return null;

  function handleChange<K extends keyof ClientFormData>(
    key: K,
    value: ClientFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const vehiclePayload =
      !isEdit && wantsVehicle && vehicle.modelo && vehicle.placa
        ? vehicle
        : undefined;
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
                  <span className="text-[#FF7518]">{client?.nome}</span>
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

          <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
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

            <Field label="Email" optional>
              <InputWithIcon icon={Mail}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="nome@email.com"
                  className="input-field"
                />
              </InputWithIcon>
            </Field>

            <Field label="Endereço" optional full>
              <InputWithIcon icon={MapPin}>
                <input
                  type="text"
                  value={form.endereco}
                  onChange={(e) => handleChange("endereco", e.target.value)}
                  placeholder="Rua, número - Bairro"
                  className="input-field"
                />
              </InputWithIcon>
            </Field>

            <Field label="Status">
              <div className="flex gap-2">
                <StatusPill
                  label="Ativo"
                  color="green"
                  active={form.status === "ativo"}
                  onClick={() => handleChange("status", "ativo")}
                />
                <StatusPill
                  label="Inativo"
                  color="gray"
                  active={form.status === "inativo"}
                  onClick={() => handleChange("status", "inativo")}
                />
              </div>
            </Field>

            <Field label="Cliente desde">
              <div className="relative">
                <Calendar
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  disabled
                  value={
                    isEdit
                      ? client?.clienteDesde ?? ""
                      : "Definido automaticamente ao salvar"
                  }
                  className="w-full rounded-lg border border-dashed border-gray-200 bg-gray-100 py-2.5 pl-9 pr-3 text-sm text-gray-500 outline-none"
                />
              </div>
            </Field>
          </div>

          {/* Modo ADD — toggle de veículo */}
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
                <div className="mb-3.5 rounded-xl border border-gray-200 p-3.5">
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <Field label="Modelo">
                      <input
                        type="text"
                        value={vehicle.modelo}
                        onChange={(e) =>
                          setVehicle((v) => ({ ...v, modelo: e.target.value }))
                        }
                        placeholder="Ex: Toyota Camry"
                        className="input-field-plain"
                      />
                    </Field>
                    <Field label="Ano">
                      <input
                        type="text"
                        value={vehicle.ano}
                        onChange={(e) =>
                          setVehicle((v) => ({ ...v, ano: e.target.value }))
                        }
                        placeholder="Ex: 2019"
                        className="input-field-plain"
                      />
                    </Field>
                    <Field label="Placa">
                      <input
                        type="text"
                        value={vehicle.placa}
                        onChange={(e) =>
                          setVehicle((v) => ({ ...v, placa: e.target.value }))
                        }
                        placeholder="ABC-1234"
                        className="input-field-plain"
                      />
                    </Field>
                    <Field label="Cor">
                      <input
                        type="text"
                        value={vehicle.cor}
                        onChange={(e) =>
                          setVehicle((v) => ({ ...v, cor: e.target.value }))
                        }
                        placeholder="Ex: Azul Marinho"
                        className="input-field-plain"
                      />
                    </Field>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modo EDIT — veículos matriculados */}
          {isEdit && (
            <div>
              <SectionLabel>Veículos matriculados</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {vehicles.map((v) => (
                  <span
                    key={v.id}
                    className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 py-1.5 pl-2 pr-3.5 text-xs font-semibold"
                  >
                    <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                      <Car size={12} />
                    </span>
                    {v.modelo}
                    <span className="font-medium text-gray-400">
                      {v.placa}
                    </span>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={onAddVehicle}
                  className="flex items-center gap-1.5 rounded-full border border-dashed border-[#FF7518]/40 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#FF7518] hover:bg-[#FF7518]/5"
                >
                  <Plus size={12} />
                  Adicionar veículo
                </button>
              </div>
            </div>
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
              className="flex items-center gap-2 rounded-lg bg-[#FF7518] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#FF7518]/30 hover:bg-[#e6690f]"
            >
              <Check size={15} />
              {isEdit ? "Salvar Alterações" : "Salvar Cliente"}
            </button>
          </div>
        </div>
      </div>

      {/* Estilos utilitários para os inputs com ícone */}
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
        .input-field-plain {
          width: 100%;
          font-size: 13.5px;
          color: #1B2130;
          border: 1.5px solid #E7E9EE;
          border-radius: 7px;
          padding: 10px 12px;
          background: #FBFBFC;
          outline: none;
          transition: 0.13s;
        }
        .input-field-plain:focus {
          border-color: #FF7518;
          background: #fff;
          box-shadow: 0 0 0 3px #FDE7DA;
        }
      `}</style>
    </div>
  );
}

/* ---------- Subcomponentes internos ---------- */

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
  children: React.ReactNode;
}

function Field({ label, optional, full, children }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <label className="text-xs font-semibold text-[#1B2130]">
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
  children,
}: {
  icon: typeof User;
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

function StatusPill({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: "green" | "gray";
  active: boolean;
  onClick: () => void;
}) {
  const activeClasses =
    color === "green"
      ? "border-emerald-500 text-emerald-600 bg-emerald-50"
      : "border-gray-300 text-gray-600 bg-gray-100";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border-[1.5px] px-2.5 py-2 text-xs font-bold transition ${
        active
          ? activeClasses
          : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </button>
  );
}