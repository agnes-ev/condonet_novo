// Sub-aba "Interfones/Porteiros" dentro de /programacoes.
// Configurações de porteiros, fechaduras e interfones.

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { type Ramal, type ToastFn } from "@/components/ramais/shared";

/* ============================ Types ============================ */

export type Volume = "baixo" | "medio" | "alto";
export type Acionamento = "f1" | "f2" | "ambas";
export type Abertura =
  | "bloquear_sempre"
  | "permitir_sempre"
  | "todos_dias"
  | "dias_uteis";
export type ModoBotoeira = "bloquear" | "f1" | "f2" | "ambas";
export type ModoFech =
  | "pulsado"
  | "pulso_unico"
  | "pulso_portao"
  | "continuo";

export interface PorteiroFechaduras {
  abertura: Abertura;
  inicial: string;
  final: string;
  modoBotoeira: ModoBotoeira;
  f1Modo: ModoFech;
  f1Tempo: number;
  f2Modo: ModoFech;
  f2Tempo: number;
}

export interface PorteiroConfig {
  bloco: string;
  blocoManual: boolean;
  fechaduras: PorteiroFechaduras;
}

export interface InterfonesState {
  volume: Volume;
  acionamento: Acionamento;
  selectedPorteiro: number | null;
  porteiros: Record<number, PorteiroConfig>;
}

/* ============================ Defaults ============================ */

export const defaultFechaduras = (): PorteiroFechaduras => ({
  abertura: "permitir_sempre",
  inicial: "00:00",
  final: "00:00",
  modoBotoeira: "ambas",
  f1Modo: "pulsado",
  f1Tempo: 2500,
  f2Modo: "pulsado",
  f2Tempo: 2500,
});

export const defaultPorteiroConfig = (bloco: number): PorteiroConfig => ({
  bloco: formatBloco(bloco),
  blocoManual: false,
  fechaduras: defaultFechaduras(),
});

export const defaultInterfonesState = (): InterfonesState => ({
  volume: "medio",
  acionamento: "ambas",
  selectedPorteiro: null,
  porteiros: {},
});

export function isInterfonesDefault(s: InterfonesState): boolean {
  if (s.volume !== "medio" || s.acionamento !== "ambas") return false;

  for (const k of Object.keys(s.porteiros)) {
    const p = s.porteiros[Number(k)];
    if (!p) continue;
    if (p.blocoManual) return false;

    const f = p.fechaduras;
    const d = defaultFechaduras();

    if (
      f.abertura !== d.abertura ||
      f.inicial !== d.inicial ||
      f.final !== d.final ||
      f.modoBotoeira !== d.modoBotoeira ||
      f.f1Modo !== d.f1Modo ||
      f.f1Tempo !== d.f1Tempo ||
      f.f2Modo !== d.f2Modo ||
      f.f2Tempo !== d.f2Tempo
    ) {
      return false;
    }
  }

  return true;
}

/* ============================ Constants ============================ */

const VOLUMES: { v: Volume; label: string }[] = [
  { v: "baixo", label: "Baixo" },
  { v: "medio", label: "Médio" },
  { v: "alto", label: "Alto" },
];

const ACIONAMENTOS: { v: Acionamento; label: string }[] = [
  { v: "f1", label: "Fechadura 1" },
  { v: "f2", label: "Fechadura 2" },
  { v: "ambas", label: "Ambas" },
];

const ABERTURAS: { v: Abertura; label: string }[] = [
  { v: "bloquear_sempre", label: "Bloquear sempre" },
  { v: "permitir_sempre", label: "Permitir sempre" },
  { v: "todos_dias", label: "Permitir todos os dias" },
  { v: "dias_uteis", label: "Permitir nos dias úteis" },
];

const MODOS_BOTOEIRA: { v: ModoBotoeira; label: string }[] = [
  { v: "bloquear", label: "Bloqueia botoeira" },
  { v: "f1", label: "Fechadura 1" },
  { v: "f2", label: "Fechadura 2" },
  { v: "ambas", label: "Ambas" },
];

const MODOS_FECH: { v: ModoFech; label: string }[] = [
  { v: "pulsado", label: "Pulsado" },
  { v: "pulso_unico", label: "Pulso único (contínuo)" },
  { v: "pulso_portao", label: "Pulso portão elétrico" },
  { v: "continuo", label: "Contínuo (On-Off)" },
];

const formatBloco = (value: number | string) => {
  const digits = String(value).replace(/\D/g, "");

  if (digits === "") return "";

  return digits.slice(0, 2).padStart(2, "0");
};

/* ============================ Sub-components ============================ */

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={"flex flex-col gap-1.5 " + (className ?? "")}>
      <label className="text-sm text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>

      {children}
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-base font-medium">{title}</h2>
      <div className="rounded-md border bg-card px-5 py-5">{children}</div>
    </section>
  );
}

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

function BasicDropdown<T extends string>({
  value,
  options,
  disabled,
  placeholder = "Selecione",
  onChange,
}: {
  value: T;
  options: { v: T; label: string }[];
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((option) => option.v === value);

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
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={triggerClass}
      >
        <span
          className={
            selectedOption
              ? "truncate text-left text-foreground"
              : "truncate text-left text-muted-foreground"
          }
        >
          {selectedOption?.label ?? placeholder}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div ref={menuRef} className={dropdownClass}>
          <div className={dropdownListClass}>
            {options.map((option) => {
              const checked = option.v === value;

              return (
                <button
                  key={option.v}
                  type="button"
                  onClick={() => {
                    onChange(option.v);
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

function RamalDropdown({
  value,
  ramais,
  disabled,
  placeholder = "Selecione",
  onChange,
}: {
  value: number | null;
  ramais: Ramal[];
  disabled?: boolean;
  placeholder?: string;
  onChange: (numeroFixo: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const ramalLabel = (ramal: Ramal) =>
    `Ramal (${ramal.numeroFixo}) - ${ramal.numeroFlexivel || "--"}`;

  const selectedRamal =
    value !== null
      ? ramais.find((ramal) => ramal.numeroFixo === value) ?? null
      : null;

  const normalize = (text: string | number | null | undefined) =>
    String(text ?? "")
      .toLowerCase()
      .trim();

  const filteredRamais = ramais.filter((ramal) => {
    const query = normalize(search);

    if (!query) return true;

    return (
      normalize(ramal.numeroFixo).includes(query) ||
      normalize(ramal.numeroFlexivel).includes(query) ||
      normalize(ramalLabel(ramal)).includes(query)
    );
  });

  const triggerClass =
    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  const dropdownClass =
    "absolute left-0 right-0 top-full z-50 mt-2 rounded-md border bg-popover p-2 shadow-lg";

  const dropdownListClass =
    "max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent";

  const dropdownItemClass =
    "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary focus-visible:bg-primary/10 focus-visible:text-primary active:bg-primary/10 active:text-primary";

  const searchBoxClass =
    "mb-2 flex items-center gap-2 rounded-md border border-input bg-background px-2";

  const searchInputClass =
    "h-8 border-0 px-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0";

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
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={triggerClass}
      >
        <span
          className={
            selectedRamal
              ? "truncate text-left text-foreground"
              : "truncate text-left text-muted-foreground"
          }
        >
          {selectedRamal ? ramalLabel(selectedRamal) : placeholder}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div ref={menuRef} className={dropdownClass}>
          <div className={searchBoxClass}>
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar ramal"
              className={searchInputClass}
            />
          </div>

          <div className={dropdownListClass}>
            {filteredRamais.length === 0 ? (
              <div className="px-2 py-2 text-sm text-muted-foreground">
                Nenhum ramal encontrado.
              </div>
            ) : (
              filteredRamais.map((ramal) => {
                const checked = ramal.numeroFixo === value;

                return (
                  <button
                    key={ramal.numeroFixo}
                    type="button"
                    onClick={() => {
                      onChange(ramal.numeroFixo);
                      setOpen(false);
                    }}
                    className={dropdownItemClass}
                  >
                    <span className="min-w-0 truncate">
                      {ramalLabel(ramal)}
                    </span>

                    {checked && (
                      <Check className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================ Main ============================ */

export function InterfonesPage({
  rows,
  state,
  setState,
  showToast,
}: {
  rows: Ramal[];
  state: InterfonesState;
  setState: (
    updater: InterfonesState | ((s: InterfonesState) => InterfonesState),
  ) => void;
  showToast: ToastFn;
}) {
  const porteiros = useMemo(
    () =>
      rows
        .filter((r) => r.categoria === "porteiro_fechadura")
        .map((r) => r.numeroFixo)
        .sort((a, b) => a - b),
    [rows],
  );

  const porteirosRamais = useMemo(
    () =>
      rows
        .filter((r) => r.categoria === "porteiro_fechadura")
        .sort((a, b) => a.numeroFixo - b.numeroFixo),
    [rows],
  );

  const selected =
    state.selectedPorteiro && porteiros.includes(state.selectedPorteiro)
      ? state.selectedPorteiro
      : porteiros[0] ?? null;

  const getBlocoAutomaticoLivre = (numeroFixoAtual: number) => {
    const usados = new Set<string>();
    const atribuicoes = new Map<number, string>();

    const porteirosOrdenados = [...porteiros].sort((a, b) => a - b);

    for (const numero of porteirosOrdenados) {
      const config = state.porteiros[numero];
      const ramal = rows.find((r) => r.numeroFixo === numero);

      if (config?.blocoManual && config.bloco !== "") {
        const blocoManual = formatBloco(config.bloco);

        atribuicoes.set(numero, blocoManual);
        usados.add(blocoManual);
        continue;
      }

      if (ramal?.blocoLogico !== undefined) {
        const blocoLogico = formatBloco(ramal.blocoLogico);

        atribuicoes.set(numero, blocoLogico);
        usados.add(blocoLogico);
        continue;
      }
    }

    for (const numero of porteirosOrdenados) {
      if (atribuicoes.has(numero)) continue;

      for (let i = 0; i <= 99; i++) {
        const bloco = formatBloco(i);

        if (!usados.has(bloco)) {
          atribuicoes.set(numero, bloco);
          usados.add(bloco);
          break;
        }
      }
    }

    return atribuicoes.get(numeroFixoAtual) ?? "00";
  };

  const ensureConfig = (ramal: number): PorteiroConfig => {
    const existing = state.porteiros[ramal];
    if (existing) return existing;

    const blocoAutomatico = getBlocoAutomaticoLivre(ramal);

    return defaultPorteiroConfig(Number(blocoAutomatico));
  };

  const current = selected !== null ? ensureConfig(selected) : null;

  const blocoAutomatico =
    selected !== null ? getBlocoAutomaticoLivre(selected) : "00";

  const blocoExibido = current?.blocoManual ? current.bloco : blocoAutomatico;

  const hasPorteiros = porteiros.length > 0;
  const displayFechaduras = current?.fechaduras ?? defaultFechaduras();

  const update = (patch: Partial<InterfonesState>) =>
    setState((s) => ({ ...s, ...patch }));

  const updatePorteiro = (ramal: number, patch: Partial<PorteiroConfig>) =>
    setState((s) => {
      const prev = s.porteiros[ramal] ?? ensureConfig(ramal);

      return {
        ...s,
        porteiros: { ...s.porteiros, [ramal]: { ...prev, ...patch } },
      };
    });

  const updateFechaduras = (
    ramal: number,
    patch: Partial<PorteiroFechaduras>,
  ) =>
    setState((s) => {
      const prev = s.porteiros[ramal] ?? ensureConfig(ramal);

      return {
        ...s,
        porteiros: {
          ...s.porteiros,
          [ramal]: { ...prev, fechaduras: { ...prev.fechaduras, ...patch } },
        },
      };
    });

  const handleSelectPorteiro = (ramal: number) => {
    if (!state.porteiros[ramal]) {
      const idx = porteiros.indexOf(ramal);

      setState((s) => ({
        ...s,
        selectedPorteiro: ramal,
        porteiros: {
          ...s.porteiros,
          [ramal]: defaultPorteiroConfig(idx >= 0 ? idx : 0),
        },
      }));

      return;
    }

    update({ selectedPorteiro: ramal });
  };

  const fech = current?.fechaduras;

  const fechadurasDisabled = !hasPorteiros || selected === null;

  const fechadurasMessage =
    'Selecione um ramal classificado como "Porteiro/Fechadura" para configurar as fechaduras.';

  const periodoDisabled =
    !fech ||
    (fech.abertura !== "todos_dias" && fech.abertura !== "dias_uteis");

  const blocoAntesDaEdicaoRef = useRef({
    valor: "",
    blocoManual: false,
  });

  const blocoFoiEditadoRef = useRef(false);

  return (
    <div>
      {/* Porteiros */}
      <SectionCard title="Porteiros">
        <div className="grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="Ramal do porteiro" required>
            <DisabledClickNotify
              disabled={!hasPorteiros}
              message='Classifique pelo menos um ramal como "Porteiro/Fechadura" na aba "Ramais" antes de configurar porteiros.'
              showToast={showToast}
            >
              <RamalDropdown
                value={selected}
                ramais={porteirosRamais}
                disabled={!hasPorteiros}
                placeholder="Selecione"
                onChange={handleSelectPorteiro}
              />
            </DisabledClickNotify>
          </Field>

          <Field label="Bloco do porteiro">
            <DisabledClickNotify
              disabled={!hasPorteiros || selected === null}
              message='Selecione um ramal classificado como "Porteiro/Fechadura" para configurar o bloco do porteiro.'
              showToast={showToast}
            >
              <Input
                inputMode="numeric"
                maxLength={2}
                value={blocoExibido}
                disabled={!hasPorteiros || selected === null}
                placeholder="--"
                onFocus={() => {
                  blocoAntesDaEdicaoRef.current = {
                    valor: blocoExibido,
                    blocoManual: current?.blocoManual ?? false,
                  };

                  blocoFoiEditadoRef.current = false;
                }}
                onChange={(e) => {
                  if (!hasPorteiros || selected === null) return;

                  blocoFoiEditadoRef.current = true;

                  const v = e.target.value.replace(/\D/g, "").slice(0, 2);

                  updatePorteiro(selected, {
                    bloco: v,
                    blocoManual: true,
                  });
                }}
                onBlur={() => {
                  if (!hasPorteiros || selected === null || !current) return;

                  if (!blocoFoiEditadoRef.current) return;

                  const valorAtual = current.bloco;

                  if (valorAtual === "") {
                    updatePorteiro(selected, {
                      bloco: blocoAntesDaEdicaoRef.current.valor,
                      blocoManual: blocoAntesDaEdicaoRef.current.blocoManual,
                    });

                    return;
                  }

                  updatePorteiro(selected, {
                    bloco: formatBloco(valorAtual),
                    blocoManual: true,
                  });
                }}
              />
            </DisabledClickNotify>
          </Field>
        </div>
      </SectionCard>

      {/* Fechaduras */}
      <SectionCard title="Fechaduras">
        <div className="flex flex-wrap gap-5">
          <Field label="Abertura das fechaduras" className="min-w-[200px]">
            <DisabledClickNotify
              disabled={fechadurasDisabled}
              message={fechadurasMessage}
              showToast={showToast}
            >
              <BasicDropdown<Abertura>
                value={displayFechaduras.abertura}
                disabled={fechadurasDisabled}
                options={ABERTURAS}
                onChange={(v) => {
                  if (fechadurasDisabled) return;
                  updateFechaduras(selected!, { abertura: v });
                }}
              />
            </DisabledClickNotify>
          </Field>

          <Field label="Período de abertura">
            <DisabledClickNotify
              disabled={fechadurasDisabled}
              message={fechadurasMessage}
              showToast={showToast}
            >
              <div className="flex gap-2">
                <div className="flex flex-col items-center gap-1">
                  <Input
                    type="time"
                    value={displayFechaduras.inicial}
                    disabled={fechadurasDisabled || periodoDisabled}
                    onChange={(e) => {
                      if (fechadurasDisabled) return;
                      updateFechaduras(selected!, { inicial: e.target.value });
                    }}
                    className="w-[120px]"
                  />
                  <span className="text-xs text-muted-foreground">Inicial</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <Input
                    type="time"
                    value={displayFechaduras.final}
                    disabled={fechadurasDisabled || periodoDisabled}
                    onChange={(e) => {
                      if (fechadurasDisabled) return;
                      updateFechaduras(selected!, { final: e.target.value });
                    }}
                    className="w-[120px]"
                  />
                  <span className="text-xs text-muted-foreground">Final</span>
                </div>
              </div>
            </DisabledClickNotify>
          </Field>

          <Field label="Modo da botoeira" className="min-w-[180px]">
            <DisabledClickNotify
              disabled={fechadurasDisabled}
              message={fechadurasMessage}
              showToast={showToast}
            >
              <BasicDropdown<ModoBotoeira>
                value={displayFechaduras.modoBotoeira}
                disabled={fechadurasDisabled}
                options={MODOS_BOTOEIRA}
                onChange={(v) => {
                  if (fechadurasDisabled) return;
                  updateFechaduras(selected!, { modoBotoeira: v });
                }}
              />
            </DisabledClickNotify>
          </Field>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-foreground">
              Fechadura 1<span className="ml-0.5 text-destructive">*</span>
            </label>

            <DisabledClickNotify
              disabled={fechadurasDisabled}
              message={fechadurasMessage}
              showToast={showToast}
            >
              <div className="flex gap-2">
                <div className="flex flex-col items-start gap-1">
                  <div className="w-[160px]">
                    <BasicDropdown<ModoFech>
                      value={displayFechaduras.f1Modo}
                      disabled={fechadurasDisabled}
                      options={MODOS_FECH}
                      onChange={(v) => {
                        if (fechadurasDisabled) return;
                        updateFechaduras(selected!, { f1Modo: v });
                      }}
                    />
                  </div>

                  <span className="text-xs text-muted-foreground">Modo</span>
                </div>

                <div className="flex flex-col items-start gap-1">
                  <Input
                    inputMode="numeric"
                    value={String(displayFechaduras.f1Tempo)}
                    disabled={fechadurasDisabled}
                    onChange={(e) => {
                      if (fechadurasDisabled) return;

                      const v = Math.min(
                        8999,
                        Number(e.target.value.replace(/\D/g, "") || 0),
                      );

                      updateFechaduras(selected!, { f1Tempo: v });
                    }}
                    className="w-[100px]"
                  />

                  <span className="text-xs text-muted-foreground">
                    Tempo (ms)
                  </span>
                </div>
              </div>
            </DisabledClickNotify>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-foreground">
              Fechadura 2<span className="ml-0.5 text-destructive">*</span>
            </label>

            <DisabledClickNotify
              disabled={fechadurasDisabled}
              message={fechadurasMessage}
              showToast={showToast}
            >
              <div className="flex gap-2">
                <div className="flex flex-col items-start gap-1">
                  <div className="w-[160px]">
                    <BasicDropdown<ModoFech>
                      value={displayFechaduras.f2Modo}
                      disabled={fechadurasDisabled}
                      options={MODOS_FECH}
                      onChange={(v) => {
                        if (fechadurasDisabled) return;
                        updateFechaduras(selected!, { f2Modo: v });
                      }}
                    />
                  </div>

                  <span className="text-xs text-muted-foreground">Modo</span>
                </div>

                <div className="flex flex-col items-start gap-1">
                  <Input
                    inputMode="numeric"
                    value={String(displayFechaduras.f2Tempo)}
                    disabled={fechadurasDisabled}
                    onChange={(e) => {
                      if (fechadurasDisabled) return;

                      const v = Math.min(
                        8999,
                        Number(e.target.value.replace(/\D/g, "") || 0),
                      );

                      updateFechaduras(selected!, { f2Tempo: v });
                    }}
                    className="w-[100px]"
                  />

                  <span className="text-xs text-muted-foreground">
                    Tempo (ms)
                  </span>
                </div>
              </div>
            </DisabledClickNotify>
          </div>
        </div>
      </SectionCard>

      {/* Interfones */}
      <SectionCard title="Interfones">
        <div className="grid max-w-3xl grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="Volume do toque">
            <DisabledClickNotify
              disabled={!hasPorteiros}
              message='Classifique pelo menos um ramal como "Porteiro/Fechadura" na aba "Ramais" para habilitar as configurações de interfone.'
              showToast={showToast}
            >
              <BasicDropdown<Volume>
                value={state.volume}
                disabled={!hasPorteiros}
                options={VOLUMES}
                onChange={(v) => update({ volume: v })}
              />
            </DisabledClickNotify>
          </Field>

          <Field label="Acionamento">
            <DisabledClickNotify
              disabled={!hasPorteiros}
              message='Classifique pelo menos um ramal como "Porteiro/Fechadura" na aba "Ramais" para habilitar o acionamento do interfone.'
              showToast={showToast}
            >
              <BasicDropdown<Acionamento>
                value={state.acionamento}
                disabled={!hasPorteiros}
                options={ACIONAMENTOS}
                onChange={(v) => update({ acionamento: v })}
              />
            </DisabledClickNotify>
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}