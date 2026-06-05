import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  ArrowLeft,
  Check,
  RotateCcw,
  Building2,
  Layers2,
  Copy,
  LayoutList,
  Pencil,
  CircleAlert,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Ramal, ToastFn } from "@/components/ramais/shared";

type PlanoMode = "sequencial" | "andares" | "blocos" | "manual";

type PlanoForm = {
  numeroFixoInicial: string;
  numeroFlexivelInicial: string;
  quantidadeApartamentos: string;
  numeroAndares: string;
  apartamentosPorAndar: string;
  numeroBlocos: string;
  blocoInicial: string;
  flexivelPrimeiroAptoPrimeiroAndar: string;
  flexivelPrimeiroAptoSegundoAndar: string;
};

type PlanoItem = {
  numeroFixo: number;
  numeroFlexivel: string;
  bloco?: number;
  andar?: number;
  apartamento?: number;
};

type DropdownOption = {
  value: string;
  label: string;
};

const emptyForm = (): PlanoForm => ({
  numeroFixoInicial: "",
  numeroFlexivelInicial: "",
  quantidadeApartamentos: "",
  numeroAndares: "",
  apartamentosPorAndar: "",
  numeroBlocos: "",
  blocoInicial: "",
  flexivelPrimeiroAptoPrimeiroAndar: "",
  flexivelPrimeiroAptoSegundoAndar: "",
});

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const toNumber = (value: string) => Number(value || 0);

function ModeButton({
  active,
  icon,
  label,
  description,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[78px] flex-1 items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "bg-card hover:border-primary/40 hover:bg-primary/5",
      )}
    >
      <span
        className={cn(
          "mt-0.5 rounded-md border p-2",
          active ? "border-primary/40 text-primary" : "text-muted-foreground",
        )}
      >
        {icon}
      </span>

      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-xs leading-snug text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-foreground">
        {label} <span className="text-destructive">*</span>
      </span>

      {children}
    </label>
  );
}

function BasicDropdown({
  value,
  options,
  placeholder = "Selecione",
  onChange,
}: {
  value: string;
  options: DropdownOption[];
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((option) => option.value === value);

  const triggerClass =
    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  const dropdownClass =
    "absolute left-0 right-0 top-full z-50 mt-2 rounded-md border bg-popover p-2 shadow-lg";

  const dropdownListClass =
    "max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent";

  const dropdownItemClass =
    "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-primary/10 hover:text-foreground focus:bg-primary/10 focus:text-primary focus-visible:bg-primary/10 focus-visible:text-primary active:bg-primary/10 active:text-primary";

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
    <div ref={rootRef} className="relative">
      <button
        type="button"
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

      {open && (
        <div ref={menuRef} className={dropdownClass}>
          <div className={dropdownListClass}>
            {options.map((option) => {
              const checked = option.value === value;

              return (
                <button
                  key={option.value}
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

export function PlanoNumeracaoPage({
  rows,
  setRows,
  showToast,
  onBack,
}: {
  rows: Ramal[];
  setRows: Dispatch<SetStateAction<Ramal[]>>;
  showToast: ToastFn;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<PlanoMode>("sequencial");
  const [form, setForm] = useState<PlanoForm>(() => emptyForm());
  const [preview, setPreview] = useState<PlanoItem[]>([]);

  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const ramaisOrdenados = useMemo(
    () => [...rows].sort((a, b) => a.numeroFixo - b.numeroFixo),
    [rows],
  );

  const numeroFixoOptions = ramaisOrdenados.map((ramal) => ({
    value: String(ramal.numeroFixo),
    label: String(ramal.numeroFixo),
  }));

  const manualPreview = () =>
    ramaisOrdenados.map((ramal) => ({
      numeroFixo: ramal.numeroFixo,
      numeroFlexivel: ramal.numeroFlexivel ?? "",
      bloco: ramal.blocoLogico,
    }));

  const setModeAndReset = (nextMode: PlanoMode) => {
  setMode(nextMode);

    if (nextMode === "manual") {
      setPreview(manualPreview());
      return;
    }

    setPreview([]);
  };

  const update = (patch: Partial<PlanoForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));

    if (mode !== "manual") {
      setPreview([]);
    }
  };

  const reset = () => {
    if (
      JSON.stringify(form) === JSON.stringify(emptyForm()) &&
      preview.length === 0
    ) {
      showToast("Não há alterações para restaurar no plano de numeração.");
      return;
    }

    setForm(emptyForm());

    if (mode === "manual") {
      setPreview(manualPreview());
    } else {
      setPreview([]);
    }

    showToast("Plano de numeração restaurado.");
  };

  const startIndex = ramaisOrdenados.findIndex(
    (r) => String(r.numeroFixo) === form.numeroFixoInicial,
  );

  const ramaisDisponiveis =
    startIndex >= 0 ? ramaisOrdenados.length - startIndex : 0;

  const quantidadeCalculada = useMemo(() => {
    if (mode === "manual") {
      return ramaisOrdenados.length;
    }

    if (mode === "sequencial") {
      return toNumber(form.quantidadeApartamentos);
    }

    if (mode === "andares") {
      return toNumber(form.numeroAndares) * toNumber(form.apartamentosPorAndar);
    }

    return (
      toNumber(form.numeroBlocos) *
      toNumber(form.numeroAndares) *
      toNumber(form.apartamentosPorAndar)
    );
  }, [form, mode, ramaisOrdenados.length]);

  const exceedsRamais =
    mode !== "manual" &&
    quantidadeCalculada > 0 &&
    form.numeroFixoInicial !== "" &&
    quantidadeCalculada > ramaisDisponiveis;

  const requiredFilled = (() => {
    if (mode === "manual") {
      return preview.length > 0;
    }

    if (!form.numeroFixoInicial) return false;

    if (mode === "sequencial") {
      return (
        form.numeroFlexivelInicial !== "" &&
        form.quantidadeApartamentos !== ""
      );
    }

    if (mode === "andares") {
      return (
        form.numeroAndares !== "" &&
        form.apartamentosPorAndar !== "" &&
        form.flexivelPrimeiroAptoPrimeiroAndar !== "" &&
        form.flexivelPrimeiroAptoSegundoAndar !== ""
      );
    }

    const numeroAndares = toNumber(form.numeroAndares);

    return (
      form.numeroAndares !== "" &&
      form.apartamentosPorAndar !== "" &&
      form.numeroBlocos !== "" &&
      form.blocoInicial !== "" &&
      form.flexivelPrimeiroAptoPrimeiroAndar !== "" &&
      (numeroAndares === 1 || form.flexivelPrimeiroAptoSegundoAndar !== "")
    );
  })();

  const validationMessage = (() => {
    if (mode === "manual") {
      return "";
    }

    if (!requiredFilled) {
      return "Preencha todos os campos obrigatórios para gerar o plano de numeração.";
    }

    if (mode === "sequencial") {
      if (toNumber(form.quantidadeApartamentos) < 1) {
        return "A quantidade de apartamentos deve ser maior que zero.";
      }

      if (toNumber(form.numeroFlexivelInicial) < 1) {
        return "O número flexível inicial deve ser maior que zero.";
      }
    }

    if (mode === "andares") {
      if (toNumber(form.numeroAndares) < 2) {
        return "No modo Automático com andares, o número de andares deve ser no mínimo 2.";
      }

      if (toNumber(form.apartamentosPorAndar) < 1) {
        return "O número de apartamentos por andar deve ser maior que zero.";
      }

      if (
        toNumber(form.flexivelPrimeiroAptoPrimeiroAndar) < 1 ||
        toNumber(form.flexivelPrimeiroAptoSegundoAndar) < 1
      ) {
        return "Os números flexíveis informados devem ser maiores que zero.";
      }
    }

    if (mode === "blocos") {
      if (toNumber(form.numeroAndares) < 1) {
        return "No modo Automático com blocos, use 1 andar quando o condomínio não possuir divisão por andares.";
      }

      if (toNumber(form.apartamentosPorAndar) < 1) {
        return "O número de apartamentos por andar deve ser maior que zero.";
      }

      if (toNumber(form.numeroBlocos) < 1) {
        return "O número de blocos deve ser maior que zero.";
      }

      if (toNumber(form.blocoInicial) < 1) {
        return "O número do 1° bloco deve ser maior que zero.";
      }

      if (toNumber(form.flexivelPrimeiroAptoPrimeiroAndar) < 1) {
        return "O número flexível do 1° apartamento do 1° andar deve ser maior que zero.";
      }

      if (
        toNumber(form.numeroAndares) > 1 &&
        toNumber(form.flexivelPrimeiroAptoSegundoAndar) < 1
      ) {
        return "Informe o número flexível do 1° apartamento do 2° andar.";
      }
    }

    if (exceedsRamais) {
      return "O plano excede a quantidade de ramais disponíveis a partir do número fixo inicial selecionado.";
    }

    return "";
  })();

  const getRowsFromInitial = () => {
    if (startIndex < 0) return [];

    return ramaisOrdenados.slice(startIndex, startIndex + quantidadeCalculada);
  };

  const generatePlano = (): PlanoItem[] => {
    const targetRows = getRowsFromInitial();

    if (mode === "sequencial") {
      const inicial = toNumber(form.numeroFlexivelInicial);

      return targetRows.map((ramal, index) => ({
        numeroFixo: ramal.numeroFixo,
        numeroFlexivel: String(inicial + index),
        apartamento: index + 1,
      }));
    }

    const andares = toNumber(form.numeroAndares);
    const aptosPorAndar = toNumber(form.apartamentosPorAndar);
    const flex1 = toNumber(form.flexivelPrimeiroAptoPrimeiroAndar);
    const flex2 = toNumber(form.flexivelPrimeiroAptoSegundoAndar);
    const incrementoAndar = flex2 > 0 ? flex2 - flex1 : 0;

    if (mode === "andares") {
      return targetRows.map((ramal, index) => {
        const andar = Math.floor(index / aptosPorAndar) + 1;
        const apartamento = (index % aptosPorAndar) + 1;
        const baseDoAndar = flex1 + (andar - 1) * incrementoAndar;

        return {
          numeroFixo: ramal.numeroFixo,
          numeroFlexivel: String(baseDoAndar + apartamento - 1),
          andar,
          apartamento,
        };
      });
    }

    const blocoInicial = toNumber(form.blocoInicial);
    const aptosPorBloco = andares * aptosPorAndar;

    return targetRows.map((ramal, index) => {
      const blocoOffset = Math.floor(index / aptosPorBloco);
      const indexDentroBloco = index % aptosPorBloco;
      const andar = Math.floor(indexDentroBloco / aptosPorAndar) + 1;
      const apartamento = (indexDentroBloco % aptosPorAndar) + 1;
      const bloco = blocoInicial + blocoOffset;
      const baseDoAndar = flex1 + (andar - 1) * incrementoAndar;
      const flexivelSemBloco = baseDoAndar + apartamento - 1;

      return {
        numeroFixo: ramal.numeroFixo,
        numeroFlexivel: `${bloco}${flexivelSemBloco}`,
        bloco,
        andar,
        apartamento,
      };
    });
  };

  const duplicatedFlexiveis = useMemo(() => {
    const counts = new Map<string, number>();

    preview.forEach((item) => {
      if (item.numeroFlexivel === "") return;

      counts.set(
        item.numeroFlexivel,
        (counts.get(item.numeroFlexivel) ?? 0) + 1,
      );
    });

    return new Set(
      Array.from(counts.entries())
        .filter(([, count]) => count > 1)
        .map(([value]) => value),
    );
  }, [preview]);

  const invalidPreviewRows = useMemo(() => {
    const invalid = new Map<number, string>();

    preview.forEach((item) => {
      if (item.numeroFlexivel === "") {
        invalid.set(item.numeroFixo, "O ramal flexível não pode ficar vazio.");
        return;
      }

      if (duplicatedFlexiveis.has(item.numeroFlexivel)) {
        invalid.set(item.numeroFixo, "Este ramal flexível está repetido.");
      }
    });

    return invalid;
  }, [duplicatedFlexiveis, preview]);

  const hasPreviewErrors = invalidPreviewRows.size > 0;

  const canGenerate =
    mode !== "manual" &&
    rows.length > 0 &&
    requiredFilled &&
    quantidadeCalculada > 0 &&
    validationMessage === "";

  const canApply =
    preview.length > 0 &&
    !hasPreviewErrors &&
    (mode === "manual" || !exceedsRamais);

  const handleGenerate = () => {
    if (validationMessage) {
      showToast(validationMessage, "error");
      return;
    }

    const generated = generatePlano();

    setPreview(generated);

    const hasDuplicates = generated.some((item, index) =>
      generated.some(
        (other, otherIndex) =>
          otherIndex !== index && other.numeroFlexivel === item.numeroFlexivel,
      ),
    );

    if (hasDuplicates) {
      showToast(
        "O plano foi gerado, mas existem números flexíveis repetidos. Corrija antes de aplicar.",
        "error",
      );
      return;
    }

    showToast("Plano de numeração gerado com sucesso.");
  };

  const handleApply = () => {
    if (preview.length === 0) {
      showToast(
        mode === "manual"
          ? "Preencha a numeração manual antes de aplicar."
          : "Gere o plano de numeração antes de aplicar.",
        "error",
      );
      return;
    }

    if (hasPreviewErrors) {
      showToast(
        "Corrija os ramais flexíveis vazios ou repetidos antes de aplicar a numeração.",
        "error",
      );
      return;
    }

    if (exceedsRamais) {
      showToast(
        "O plano excede a quantidade de ramais disponíveis a partir do número fixo inicial selecionado.",
        "error",
      );
      return;
    }

    const map = new Map(
      preview.map((item) => [
        item.numeroFixo,
        {
          numeroFlexivel: item.numeroFlexivel,
          blocoLogico: item.bloco,
        },
      ]),
    );

    setRows((prev) =>
      prev.map((ramal) => {
        const plano = map.get(ramal.numeroFixo);

        if (!plano) {
          return mode === "blocos"
            ? ramal
            : { ...ramal, blocoLogico: undefined };
        }

        return {
          ...ramal,
          numeroFlexivel: plano.numeroFlexivel,
          blocoLogico: mode === "blocos" ? plano.blocoLogico : undefined,
        };
      }),
    );

    showToast("Plano de numeração aplicado aos ramais.");
    onBack();
  };

  const updatePreviewItem = (numeroFixo: number, numeroFlexivel: string) => {
    setPreview((prev) =>
      prev.map((item) =>
        item.numeroFixo === numeroFixo
          ? { ...item, numeroFlexivel }
          : item,
      ),
    );
  };

  const focusNextInput = (currentIndex: number) => {
    const nextItem = preview[currentIndex + 1];

    if (!nextItem) return;

    inputRefs.current[nextItem.numeroFixo]?.focus();
    inputRefs.current[nextItem.numeroFixo]?.select();
  };

  const groupedPreview = useMemo(() => {
    if (mode === "sequencial" || mode === "manual") {
      return [];
    }

    if (mode === "andares") {
      const byAndar = new Map<number, PlanoItem[]>();

      preview.forEach((item) => {
        if (!item.andar) return;

        byAndar.set(item.andar, [...(byAndar.get(item.andar) ?? []), item]);
      });

      return Array.from(byAndar.entries())
        .sort(([a], [b]) => b - a)
        .map(([andar, items]) => ({
          title: `${andar}° andar`,
          rows: [{ label: "", items }],
        }));
    }

    const byBloco = new Map<number, Map<number, PlanoItem[]>>();

    preview.forEach((item) => {
      if (!item.bloco || !item.andar) return;

      if (!byBloco.has(item.bloco)) {
        byBloco.set(item.bloco, new Map());
      }

      const blocoMap = byBloco.get(item.bloco)!;

      blocoMap.set(item.andar, [...(blocoMap.get(item.andar) ?? []), item]);
    });

    return Array.from(byBloco.entries())
      .sort(([a], [b]) => a - b)
      .map(([bloco, andares]) => ({
        title: `Bloco ${bloco}`,
        rows: Array.from(andares.entries())
          .sort(([a], [b]) => b - a)
          .map(([andar, items]) => ({
            label: `${andar}° andar`,
            items,
          })),
      }));
  }, [mode, preview]);

  useEffect(() => {
    if (mode === "manual") {
      setPreview(manualPreview());
    }
  }, [mode, rows]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-auto px-10 py-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-md p-2 transition-colors hover:bg-primary/10 hover:text-primary"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <h1 className="text-2xl font-semibold tracking-tight">
            Plano de numeração
          </h1>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-4">
          <ModeButton
            active={mode === "sequencial"}
            icon={<Copy className="h-4 w-4" />}
            label="Sequencial"
            description="Gera uma sequência simples de números flexíveis."
            onClick={() => setModeAndReset("sequencial")}
          />

          <ModeButton
            active={mode === "andares"}
            icon={<Layers2 className="h-4 w-4" />}
            label="Automático com andares"
            description="Gera numeração por andares, sem separar por blocos."
            onClick={() => setModeAndReset("andares")}
          />

          <ModeButton
            active={mode === "blocos"}
            icon={<Building2 className="h-4 w-4" />}
            label="Automático com blocos"
            description="Gera numeração considerando blocos, andares e apartamentos."
            onClick={() => setModeAndReset("blocos")}
          />

          <ModeButton
            active={mode === "manual"}
            icon={<Pencil className="h-4 w-4" />}
            label="Manual"
            description="Permite editar manualmente os números flexíveis."
            onClick={() => setModeAndReset("manual")}
          />
        </div>

        {mode !== "manual" && (
          <div className="mt-5 rounded-lg border bg-card p-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-4">
              <Field label="Número fixo inicial">
                <BasicDropdown
                  value={form.numeroFixoInicial}
                  options={numeroFixoOptions}
                  placeholder="Selecione"
                  onChange={(value) => update({ numeroFixoInicial: value })}
                />
              </Field>

              {mode === "sequencial" && (
                <>
                  <Field label="Número flexível inicial">
                    <Input
                      inputMode="numeric"
                      value={form.numeroFlexivelInicial}
                      onChange={(e) =>
                        update({
                          numeroFlexivelInicial: onlyDigits(e.target.value),
                        })
                      }
                    />
                  </Field>

                  <Field label="Quantidade de apartamentos">
                    <Input
                      inputMode="numeric"
                      value={form.quantidadeApartamentos}
                      onChange={(e) =>
                        update({
                          quantidadeApartamentos: onlyDigits(e.target.value),
                        })
                      }
                    />
                  </Field>
                </>
              )}

              {(mode === "andares" || mode === "blocos") && (
                <>
                  <Field label="Número de andares do prédio">
                    <Input
                      inputMode="numeric"
                      value={form.numeroAndares}
                      onChange={(e) => {
                        const value = onlyDigits(e.target.value);

                        update({
                          numeroAndares: value,
                          ...(mode === "blocos" && value === "1"
                            ? { flexivelPrimeiroAptoSegundoAndar: "" }
                            : {}),
                        });
                      }}
                    />
                  </Field>

                  <Field label="Número de apartamentos por andar">
                    <Input
                      inputMode="numeric"
                      value={form.apartamentosPorAndar}
                      onChange={(e) =>
                        update({
                          apartamentosPorAndar: onlyDigits(e.target.value),
                        })
                      }
                    />
                  </Field>

                  {mode === "blocos" && (
                    <>
                      <Field label="Número de blocos">
                        <Input
                          inputMode="numeric"
                          value={form.numeroBlocos}
                          onChange={(e) =>
                            update({
                              numeroBlocos: onlyDigits(e.target.value),
                            })
                          }
                        />
                      </Field>

                      <Field label="Número do 1° bloco">
                        <Input
                          inputMode="numeric"
                          value={form.blocoInicial}
                          onChange={(e) =>
                            update({
                              blocoInicial: onlyDigits(e.target.value),
                            })
                          }
                        />
                      </Field>
                    </>
                  )}

                  <Field label="Número flexível do 1° apartamento do 1° andar">
                    <Input
                      inputMode="numeric"
                      value={form.flexivelPrimeiroAptoPrimeiroAndar}
                      onChange={(e) =>
                        update({
                          flexivelPrimeiroAptoPrimeiroAndar: onlyDigits(
                            e.target.value,
                          ),
                        })
                      }
                    />
                  </Field>

                  <Field label="Número flexível do 1° apartamento do 2° andar">
                    <Input
                      inputMode="numeric"
                      value={
                        mode === "blocos" && form.numeroAndares === "1"
                          ? ""
                          : form.flexivelPrimeiroAptoSegundoAndar
                      }
                      disabled={mode === "blocos" && form.numeroAndares === "1"}
                      onChange={(e) =>
                        update({
                          flexivelPrimeiroAptoSegundoAndar: onlyDigits(
                            e.target.value,
                          ),
                        })
                      }
                    />
                  </Field>
                </>
              )}
            </div>

            {form.numeroFixoInicial && quantidadeCalculada > 0 && (
              <div
                className={cn(
                  "mt-4 flex flex-wrap gap-x-10 gap-y-2 rounded-md border px-3 py-2 text-sm",
                  exceedsRamais
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-border bg-muted/40 text-muted-foreground",
                )}
              >
                <span>
                  Quantidade de ramais disponíveis:{" "}
                  <strong>{ramaisDisponiveis}</strong>
                </span>

                <span>
                  Quantidade de ramais em uso:{" "}
                  <strong>{quantidadeCalculada}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-5">
          <div className="min-h-[300px] rounded-lg border bg-card p-5">
            <h2 className="text-base font-semibold">
              {mode === "manual" ? "Numeração manual" : "Prévia visual"}
            </h2>

            {preview.length === 0 ? (
              <div className="mt-10 flex min-h-[190px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                {mode === "manual"
                  ? "Não há ramais disponíveis para editar."
                  : "Gere o plano para visualizar a organização da numeração."}
              </div>
            ) : mode === "manual" ? (
              <div className="mt-4 overflow-hidden rounded-lg border">
                <div className="grid grid-cols-[1fr_1fr_44px] border-b bg-muted/30 px-5 py-3 text-sm text-foreground">
                  <span>Ramal fixo</span>
                  <span>Ramal flexível</span>
                  <span />
                </div>

                <div className="max-h-[460px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
                  {preview.map((item, index) => {
                    const error = invalidPreviewRows.get(item.numeroFixo);

                    return (
                      <div
                        key={item.numeroFixo}
                        className="grid grid-cols-[1fr_1fr_44px] items-center border-b px-5 py-3 last:border-b-0"
                      >
                        <span className="text-sm">{item.numeroFixo}</span>

                        <Input
                          ref={(element) => {
                            inputRefs.current[item.numeroFixo] = element;
                          }}
                          inputMode="numeric"
                          value={item.numeroFlexivel}
                          onChange={(e) =>
                            updatePreviewItem(
                              item.numeroFixo,
                              onlyDigits(e.target.value),
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              focusNextInput(index);
                            }
                          }}
                          className={cn(
                            "max-w-[150px]",
                            error &&
                              "border-destructive focus-visible:ring-destructive",
                          )}
                        />

                        <div className="flex justify-end">
                          {error && (
                            <CircleAlert
                              className="h-5 w-5 text-destructive"
                              aria-label={error}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : mode === "sequencial" ? (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                {preview.map((item) => {
                  const error = invalidPreviewRows.get(item.numeroFixo);

                  return (
                    <div
                      key={item.numeroFixo}
                      className={cn(
                        "relative rounded-md border bg-muted/30 px-3 py-2 text-center text-sm",
                        error && "border-destructive bg-destructive/5 pr-6",
                      )}
                    >
                      {error && (
                        <CircleAlert
                          className="absolute right-2 top-2 h-4 w-4 text-destructive"
                          aria-label={error}
                        />
                      )}

                      <div className="text-xs text-muted-foreground">
                        Fixo {item.numeroFixo}
                      </div>

                      <div className="font-semibold">
                        {item.numeroFlexivel}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {groupedPreview.map((group) => (
                  <div key={group.title} className="rounded-lg border p-4">
                    <h3 className="font-semibold">{group.title}</h3>

                    <div className="mt-3 space-y-3">
                      {group.rows.map((row, rowIndex) => (
                        <div key={row.label || rowIndex}>
                          {row.label && (
                            <div className="mb-2 text-xs font-medium text-muted-foreground">
                              {row.label}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {row.items.map((item) => {
                              const error = invalidPreviewRows.get(
                                item.numeroFixo,
                              );

                              return (
                                <span
                                  key={`${item.numeroFixo}-${item.numeroFlexivel}`}
                                  className={cn(
                                    "relative rounded-md border bg-muted/40 px-2.5 py-1 text-sm",
                                    error &&
                                      "border-destructive bg-destructive/5 pr-7",
                                  )}
                                >
                                  {item.numeroFlexivel}

                                  {error && (
                                    <CircleAlert
                                      className="absolute right-1.5 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive"
                                      aria-label={error}
                                    />
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hasPreviewErrors && (
              <p className="mt-3 text-sm text-destructive">
                Corrija os ramais flexíveis vazios ou repetidos antes de aplicar
                a numeração.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 border-t bg-card px-6 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        <Button variant="outline" className="gap-2" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          Restaurar
        </Button>

        {mode !== "manual" && (
          <Button
            variant="outline"
            className={cn("gap-2", !canGenerate && "opacity-50")}
            aria-disabled={!canGenerate}
            onClick={handleGenerate}
          >
            <LayoutList className="h-4 w-4" />
            Gerar plano
          </Button>
        )}

        <Button
          className={cn("gap-2", !canApply && "opacity-50")}
          aria-disabled={!canApply}
          onClick={handleApply}
        >
          <Check className="h-4 w-4" />
          Aplicar numeração
        </Button>
      </div>
    </div>
  );
}