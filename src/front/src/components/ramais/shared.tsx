import { useState } from "react";
import { ArrowDownUp, ArrowDown, Eye, EyeOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ============================ Types ============================ */

export type Category =
  | "ramal_normal"
  | "porteiro_fechadura"
  | "portaria_atendedor"
  | "programador"
  | "sindico";

export type DesvioMode = "desativado" | "sempre" | "ocupado" | "externo";

export type RingType =
  | "padrao"
  | "longo"
  | "medio"
  | "curto"
  | "duplo_longo"
  | "duplo_medio"
  | "duplo_curto"
  | "triplo"
  | "alerta"
  | "crescente";

export type Hotline = "nenhum" | string;

export interface Ramal {
  numeroFixo: number;
  categoria: Category;
  numeroFlexivel: string;
  hotline: Hotline;
  desvioMode: DesvioMode;
  desvioValor: string;
  ringType: RingType;
  senha: string;
  blocoLogico?: number;
}

export type TabId =
  | "gerais"
  | "interfones"
  | "ramais"
  | "ramais_especiais"
  | "rfid";

export type ToastFn = (msg: string, v?: "info" | "error") => void;

/* ============================ Constants ============================ */

export const CATEGORIAS: { value: Category; label: string }[] = [
  { value: "ramal_normal", label: "Ramal normal" },
  { value: "porteiro_fechadura", label: "Porteiro/Fechadura" },
  { value: "portaria_atendedor", label: "Portaria/Atendedor" },
  { value: "programador", label: "Programador" },
  { value: "sindico", label: "Síndico" },
];

export const UNIQUE_CATEGORIES: Category[] = [
  "programador",
  "sindico",
];

export const MAX_PORTARIA_ATENDEDOR = 40;

export const MAX_PORTEIROS = 40;

export const DESVIOS: { value: DesvioMode; label: string }[] = [
  { value: "desativado", label: "Desativado" },
  { value: "sempre", label: "Sempre" },
  { value: "ocupado", label: "Quando ocupado" },
  { value: "externo", label: "Número externo" },
];

export const RINGS: { value: RingType; label: string }[] = [
  { value: "padrao", label: "Padrão" },
  { value: "longo", label: "Longo" },
  { value: "medio", label: "Médio" },
  { value: "curto", label: "Curto" },
  { value: "duplo_longo", label: "Duplo longo" },
  { value: "duplo_medio", label: "Duplo médio" },
  { value: "duplo_curto", label: "Duplo curto" },
  { value: "triplo", label: "Triplo" },
  { value: "alerta", label: "Alerta" },
  { value: "crescente", label: "Crescente" },
];

export const FIXOS = Array.from({ length: 16 }, (_, i) => 200 + i);

export type CondoModel = "" | "16" | "20" | "24";
export type RamaisCount = 0 | 16 | 20 | 24;

/* ============================ Helpers ============================ */

export function makeDefault(count: number = 16): Ramal[] {
  return Array.from({ length: count }, (_, i) => 200 + i).map((n) => ({
    numeroFixo: n,
    categoria: "ramal_normal",
    numeroFlexivel: String(n),
    hotline: "nenhum",
    desvioMode: "desativado",
    desvioValor: "",
    ringType: "medio",
    senha: "",
  }));
}

export const categoriaLabel = (c: Category) =>
  CATEGORIAS.find((x) => x.value === c)!.label;
export const ringLabel = (r: RingType) =>
  RINGS.find((x) => x.value === r)!.label;
export const desvioLabel = (d: DesvioMode) =>
  DESVIOS.find((x) => x.value === d)!.label;
export const isValidExternal = (v: string) => /^\d{8,15}$/.test(v);

export const isBlockedSource = (c: Category) =>
  c === "programador" || c === "portaria_atendedor" || c === "porteiro_fechadura";

export const isBlockedHotlineTarget = (c: Category) =>
  c === "programador" || c === "porteiro_fechadura";

export const isBlockedDesvioTarget = (c: Category) =>
  c === "programador" ||
  c === "portaria_atendedor" ||
  c === "porteiro_fechadura";

/* ============================ Shared UI ============================ */

export function TabBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 border-r last:border-r-0 transition-colors",
        active ? "bg-muted text-foreground" : "hover:bg-muted/50",
      )}
    >
      <span className="text-primary">{icon}</span>
      {label}
    </button>
  );
}

export function HeaderCell({
  label,
  sort,
  onSort,
}: {
  label: string;
  sort?: "none" | "desc";
  onSort?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSort}
      className="inline-flex w-full items-center justify-center gap-2 text-center hover:text-foreground"
    >
      <span className="whitespace-normal text-center leading-tight">{label}</span>

      {sort === "desc" ? (
        <ArrowDown className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <ArrowDownUp className="w-3.5 h-3.5 shrink-0 opacity-50" />
      )}
    </button>
  );
}

export function SenhaInput({
  value,
  onChange,
  onInvalid,
}: {
  value: string;
  onChange: (v: string) => void;
  onInvalid: (msg: string) => void;
}) {
  const [show, setShow] = useState(false);
  const invalid = value.length > 0 && value.length !== 4;
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 4);
          onChange(v);
        }}
        onBlur={() => {
          if (invalid)
            onInvalid(
              "A senha (fechaduras) deve ter exatamente 4 dígitos numéricos.",
            );
        }}
        inputMode="numeric"
        className={cn(
          "pr-9",
          invalid && "border-destructive focus-visible:ring-destructive",
        )}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}