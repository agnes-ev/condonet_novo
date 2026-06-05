// Sub-aba "Gerais" dentro de /programacoes.
// Modelo CondoNet, quantidade de ramais e senha de programação.

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { Check, ChevronDown, Eye, EyeOff, ArrowDownCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  CondoModel,
  RamaisCount,
  ToastFn,
} from "@/components/ramais/shared";

export interface GeraisState {
  modelo: CondoModel;
  qtd: RamaisCount;
  senha: string;
}

export const defaultGeraisState = (): GeraisState => ({
  modelo: "",
  qtd: 0,
  senha: "",
});

export const isGeraisDefault = (s: GeraisState) => {
  const d = defaultGeraisState();
  return s.modelo === d.modelo && s.qtd === d.qtd && s.senha === d.senha;
};

function DisabledClickNotify({
  disabled,
  message,
  showToast,
  children,
}: {
  disabled: boolean;
  message: string;
  showToast: ToastFn;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      {children}

      {disabled && (
        <button
          type="button"
          aria-label={message}
          className="absolute inset-0 z-10 cursor-not-allowed bg-transparent"
          onClick={() => showToast(message, "error")}
        />
      )}
    </div>
  );
}

const QTD_BY_MODEL: Record<Exclude<CondoModel, "">, RamaisCount[]> = {
  "16": [16],
  "20": [16, 20],
  "24": [16, 20, 24],
};

type DropdownOption<T extends string | number> = {
  value: T;
  label: string;
};

function BasicDropdown<T extends string | number>({
  value,
  options,
  placeholder = "--",
  disabled,
  onChange,
  className,
}: {
  value: T | null;
  options: DropdownOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: T) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((option) => option.value === value);

  const triggerClass =
    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  const dropdownClass =
    "absolute left-0 right-0 top-full z-50 mt-2 rounded-md border bg-popover p-2 shadow-lg";

  const dropdownListClass =
    "max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent";

  const dropdownItemClass =
    "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary focus-visible:bg-primary/10 focus-visible:text-primary active:bg-primary/10 active:text-primary";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    window.setTimeout(() => {
      menuRef.current?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }, 0);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={triggerClass}
      >
        <span
          className={
            selected
              ? "truncate text-left text-foreground"
              : "truncate text-left text-muted-foreground"
          }
        >
          {selected?.label ?? placeholder}
        </span>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && !disabled && (
        <div ref={menuRef} className={dropdownClass}>
          <div className={dropdownListClass}>
            {options.map((option) => {
              const checked = option.value === value;

              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={dropdownItemClass}
                >
                  <span className="min-w-0 truncate">{option.label}</span>

                  {checked && (
                    <Check className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function GeraisPage({
  state,
  setState,
  onModelQtdChange,
  showToast,
}: {
  state: GeraisState;
  setState: Dispatch<SetStateAction<GeraisState>>;
  onModelQtdChange: (qtd: RamaisCount) => void;
  showToast: ToastFn;
}) {
  const [showSenha, setShowSenha] = useState(false);

  const senhaInvalid = state.senha.length > 0 && state.senha.length !== 4;

  const modeloOptions: DropdownOption<Exclude<CondoModel, "">>[] = [
    { value: "16", label: "CondoNet 16" },
    { value: "20", label: "CondoNet 20" },
    { value: "24", label: "CondoNet 24" },
  ];

  const qtdOptions: DropdownOption<RamaisCount>[] =
    state.modelo === ""
      ? []
      : QTD_BY_MODEL[state.modelo].map((qtd) => ({
          value: qtd,
          label: String(qtd),
        }));

  const setModelo = (modelo: Exclude<CondoModel, "">) => {
    const allowed = QTD_BY_MODEL[modelo];
    const nextQtd: RamaisCount = allowed.includes(state.qtd) ? state.qtd : 0;

    setState((s) => ({
      ...s,
      modelo,
      qtd: nextQtd,
    }));

    onModelQtdChange(nextQtd);
  };

  const setQtd = (qtd: RamaisCount) => {
    setState((s) => ({
      ...s,
      qtd,
    }));

    onModelQtdChange(qtd);
  };

  return (
    <>
      <div className="mt-8">
        <Button variant="outline" className="gap-2" disabled>
          <ArrowDownCircle className="h-4 w-4" />
          Receber Programações
        </Button>
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-base font-medium">
          Programações Gerais da Central/PABX
        </h2>

        <div className="rounded-md border bg-card px-5 py-5">
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex min-w-[220px] flex-col gap-1.5">
              <label className="text-sm text-foreground">
                CondoNet <span className="text-destructive">*</span>
              </label>

              <BasicDropdown<Exclude<CondoModel, "">>
                value={state.modelo === "" ? null : state.modelo}
                options={modeloOptions}
                placeholder="--"
                onChange={setModelo}
              />
            </div>

            <div className="flex min-w-[220px] flex-col gap-1.5">
              <label className="text-sm text-foreground">
                Quantidade de ramais <span className="text-destructive">*</span>
              </label>

              <DisabledClickNotify
                disabled={state.modelo === ""}
                message="Selecione primeiro o modelo do CondoNet para habilitar a quantidade de ramais."
                showToast={showToast}
              >
                <BasicDropdown<RamaisCount>
                  value={state.qtd === 0 ? null : state.qtd}
                  options={qtdOptions}
                  placeholder="--"
                  disabled={state.modelo === ""}
                  onChange={setQtd}
                />
              </DisabledClickNotify>
            </div>

            <div className="flex min-w-[220px] flex-col gap-1.5">
              <label className="text-sm text-foreground">
                Senha de programação
              </label>

              <div className="relative">
                <Input
                  type={showSenha ? "text" : "password"}
                  value={state.senha}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 4);

                    setState((s) => ({
                      ...s,
                      senha: v,
                    }));
                  }}
                  onBlur={() => {
                    if (senhaInvalid) {
                      showToast(
                        "A senha de programação deve ter exatamente 4 dígitos numéricos.",
                        "error",
                      );
                    }
                  }}
                  inputMode="numeric"
                  placeholder="••••"
                  className={cn(
                    "h-10 pr-9",
                    senhaInvalid &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />

                <button
                  type="button"
                  onClick={() => setShowSenha((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}