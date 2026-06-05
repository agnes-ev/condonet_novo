// Sub-aba "Ramais" dentro de /programacoes.
// Recebe estado via props do container ProgramacoesPage.

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  Search,
  Pencil,
  Check,
  X,
  Copy,
  ArrowDownUp,
  ListOrdered,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";

import {
  CATEGORIAS,
  DESVIOS,
  RINGS,
  UNIQUE_CATEGORIES,
  MAX_PORTEIROS,
  MAX_PORTARIA_ATENDEDOR,
  categoriaLabel,
  desvioLabel,
  ringLabel,
  isBlockedSource,
  isBlockedHotlineTarget,
  isBlockedDesvioTarget,
  isValidExternal,
  HeaderCell,
  SenhaInput,
  type Category,
  type DesvioMode,
  type Hotline,
  type Ramal,
  type RingType,
  type ToastFn,
} from "@/components/ramais/shared";

export type PortariaHorarioState = {
  distinguir: boolean;
  diurno: number[];
  noturno: number[];
};

type RamaisPageProps = {
  rows: Ramal[];
  setRows: Dispatch<SetStateAction<Ramal[]>>;
  showToast: ToastFn;
  onOpenPlanoNumeracao: () => void;
  portariaHorario?: PortariaHorarioState;
  setPortariaHorario?: (
    updater:
      | PortariaHorarioState
      | ((state: PortariaHorarioState) => PortariaHorarioState),
  ) => void;
};

type SortField =
  | "categoria"
  | "numeroFixo"
  | "numeroFlexivel"
  | "hotline"
  | "desvio"
  | "ringType"
  | "senha";

type Option<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type CategoriaSelectValue =
  | Category
  | "portaria_atendedor_diurno"
  | "portaria_atendedor_noturno";

export function RamaisPage({
  rows,
  setRows,
  showToast,
  onOpenPlanoNumeracao,
  portariaHorario,
  setPortariaHorario,
}: RamaisPageProps) {
  const [editing, setEditing] = useState<Record<number, Ramal>>({});
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);

  const [replicarOpen, setReplicarOpen] = useState(false);

  const [origemOpen, setOrigemOpen] = useState(false);
  const [origemSearch, setOrigemSearch] = useState("");

  const [destinosOpen, setDestinosOpen] = useState(false);
  const [destinoSearch, setDestinoSearch] = useState("");

  const [replicarCampos, setReplicarCampos] = useState({
    categoria: false,
    hotline: false,
    desvio: false,
    ringType: false,
  });

  const [ramalOrigem, setRamalOrigem] = useState("");
  const [ramaisDestino, setRamaisDestino] = useState<number[]>([]);

  const [editingPortariaTurno, setEditingPortariaTurno] = useState<
    Record<number, "diurno" | "noturno" | undefined>
  >({});

  const editingCount = Object.keys(editing).length;
  const canSaveAll = editingCount > 1;

  const ramalLabel = (ramal: Ramal) =>
    `Ramal (${ramal.numeroFixo}) - ${ramal.numeroFlexivel || "--"}`;

  const ramalLabelByNumero = (numero: string | number) => {
    const ramal = rows.find((r) => String(r.numeroFixo) === String(numero));

    if (!ramal) {
      return `Ramal (${numero}) - --`;
    }

    return ramalLabel(ramal);
  };

  const displayCategoriaLabel = (cat: Category, numeroFixo?: number) => {
    if (
      cat === "portaria_atendedor" &&
      numeroFixo !== undefined &&
      portariaHorario?.distinguir
    ) {
      if (portariaHorario.diurno.includes(numeroFixo)) {
        return `${categoriaLabel(cat)} (diurno)`;
      }

      if (portariaHorario.noturno.includes(numeroFixo)) {
        return `${categoriaLabel(cat)} (noturno)`;
      }
    }

    return categoriaLabel(cat);
  };

  const normalize = (value: string | number | null | undefined) =>
    String(value ?? "").toLowerCase().trim();

  const triggerClass =
    "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  const dropdownClass =
    "absolute left-0 right-0 top-full z-50 mt-2 rounded-md border bg-popover p-2 shadow-lg";

  const dropdownListClass =
    "max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent";

  const dropdownItemClass =
    "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-primary/10 hover:text-foreground focus:bg-primary/10 focus:text-primary focus-visible:bg-primary/10 focus-visible:text-primary active:bg-primary/10 active:text-primary";

  const searchBoxClass =
    "mb-2 flex items-center gap-2 rounded-md border border-input bg-background px-2";

  const searchInputClass =
    "h-8 border-0 px-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0";

  const startEdit = (r: Ramal) => {
    setEditing((prev) => ({
      ...prev,
      [r.numeroFixo]: { ...r },
    }));

    if (r.categoria === "portaria_atendedor" && portariaHorario?.distinguir) {
      setEditingPortariaTurno((prev) => ({
        ...prev,
        [r.numeroFixo]: portariaHorario.noturno.includes(r.numeroFixo)
          ? "noturno"
          : "diurno",
      }));
    }
  };

  const cancelEdit = (n: number) => {
    setEditing((prev) => {
      const copy = { ...prev };
      delete copy[n];
      return copy;
    });

    setEditingPortariaTurno((prev) => {
      const copy = { ...prev };
      delete copy[n];
      return copy;
    });
  };

  const updateEdit = (n: number, patch: Partial<Ramal>) => {
    setEditing((prev) => ({
      ...prev,
      [n]: {
        ...prev[n],
        ...patch,
      },
    }));
  };

  const validateRamal = (
    e: Ramal,
    originalNumeroFixo: number,
    baseRows: Ramal[],
  ) => {
    if (e.numeroFlexivel.length === 0 || e.numeroFlexivel.length > 8) {
      return "Número flexível deve ter de 1 a 8 dígitos.";
    }

    const duplicate = baseRows.some(
      (r) =>
        r.numeroFixo !== originalNumeroFixo &&
        r.numeroFlexivel === e.numeroFlexivel,
    );

    if (duplicate) {
      return `O número flexível "${e.numeroFlexivel}" já está em uso por outro ramal.`;
    }

    if (e.senha.length > 0 && e.senha.length !== 4) {
      return "A senha (fechaduras) deve ter exatamente 4 dígitos numéricos.";
    }

    if (e.desvioMode === "sempre" || e.desvioMode === "ocupado") {
      const num = parseInt(e.desvioValor, 10);
      const min = baseRows[0]?.numeroFixo ?? 200;
      const max = baseRows[baseRows.length - 1]?.numeroFixo ?? 215;

      if (!e.desvioValor || Number.isNaN(num) || num < min || num > max) {
        return `Selecione um ramal existente (${min} a ${max}) como destino do desvio.`;
      }

      if (num === e.numeroFixo) {
        return "Um ramal não pode desviar para ele mesmo.";
      }

      const dest = baseRows.find((r) => r.numeroFixo === num);

      if (dest && isBlockedDesvioTarget(dest.categoria)) {
        return `O ramal ${num} (${categoriaLabel(dest.categoria)}) não pode ser destino de desvio.`;
      }
    }

    if (e.desvioMode === "externo" && !isValidExternal(e.desvioValor)) {
      return "Informe um número externo válido (8 a 15 dígitos).";
    }

    if (isBlockedSource(e.categoria) && e.hotline !== "nenhum") {
      return `Ramais do tipo "${categoriaLabel(e.categoria)}" não podem ter hotline.`;
    }

    if (isBlockedSource(e.categoria) && e.desvioMode !== "desativado") {
      return `Ramais do tipo "${categoriaLabel(e.categoria)}" não podem ter desvio.`;
    }

    return null;
  };

  const getCategoriaSelectValue = (
    ramal: Ramal,
    numeroFixoOriginal: number,
  ): CategoriaSelectValue => {
    if (
      ramal.categoria === "portaria_atendedor" &&
      portariaHorario?.distinguir
    ) {
      const editingTurno = editingPortariaTurno[numeroFixoOriginal];

      if (editingTurno === "diurno") {
        return "portaria_atendedor_diurno";
      }

      if (editingTurno === "noturno") {
        return "portaria_atendedor_noturno";
      }

      if (portariaHorario.noturno.includes(numeroFixoOriginal)) {
        return "portaria_atendedor_noturno";
      }

      return "portaria_atendedor_diurno";
    }

    return ramal.categoria;
  };

  const applyPortariaTurno = (
    numeroFixo: number,
    categoria: Category,
    turno?: "diurno" | "noturno",
  ) => {
    if (!setPortariaHorario || !portariaHorario?.distinguir) return;

    setPortariaHorario((prev) => {
      const diurno = prev.diurno.filter((numero) => numero !== numeroFixo);
      const noturno = prev.noturno.filter((numero) => numero !== numeroFixo);

      if (categoria !== "portaria_atendedor" || !turno) {
        return {
          ...prev,
          diurno,
          noturno,
        };
      }

      return {
        ...prev,
        diurno: turno === "diurno" ? [...diurno, numeroFixo] : diurno,
        noturno: turno === "noturno" ? [...noturno, numeroFixo] : noturno,
      };
    });
  };

  const saveEdit = (n: number) => {
    const e = editing[n];
    if (!e) return;

    const error = validateRamal(e, n, rows);

    if (error) {
      showToast(error, "error");
      return;
    }

    setRows((prev) =>
      prev.map((r) => {
        if (r.numeroFixo === n) return e;

        if (
          UNIQUE_CATEGORIES.includes(e.categoria) &&
          r.categoria === e.categoria
        ) {
          return {
            ...r,
            categoria: "ramal_normal",
          };
        }

        return r;
      }),
    );

    applyPortariaTurno(n, e.categoria, editingPortariaTurno[n]);

    cancelEdit(n);
  };

  const saveAllEdits = () => {
    if (!canSaveAll) return;

    const editEntries = Object.entries(editing).map(([numero, value]) => ({
      numeroFixoOriginal: Number(numero),
      value,
    }));

    const flexiveis = new Map<string, number>();

    for (const { numeroFixoOriginal, value } of editEntries) {
      if (value.numeroFlexivel) {
        const existing = flexiveis.get(value.numeroFlexivel);

        if (existing !== undefined && existing !== numeroFixoOriginal) {
          showToast(
            `O número flexível "${value.numeroFlexivel}" está repetido nas linhas em edição.`,
            "error",
          );
          return;
        }

        flexiveis.set(value.numeroFlexivel, numeroFixoOriginal);
      }
    }

    const uniqueCategoriesInEdit = new Map<Category, number>();

    for (const { numeroFixoOriginal, value } of editEntries) {
      if (!UNIQUE_CATEGORIES.includes(value.categoria)) continue;

      const existing = uniqueCategoriesInEdit.get(value.categoria);

      if (existing !== undefined && existing !== numeroFixoOriginal) {
        showToast(
          `A categoria "${categoriaLabel(value.categoria)}" só pode estar em um ramal.`,
          "error",
        );
        return;
      }

      uniqueCategoriesInEdit.set(value.categoria, numeroFixoOriginal);
    }

    const proposedRows = rows.map((row) => editing[row.numeroFixo] ?? row);

    const portariaCount = proposedRows.filter(
      (row) => row.categoria === "portaria_atendedor",
    ).length;

    if (portariaCount > MAX_PORTARIA_ATENDEDOR) {
      showToast(
        "É permitido configurar no máximo 40 ramais como Portaria/Atendedor.",
        "error",
      );
      return;
    }

    const porteirosCountProposed = proposedRows.filter(
      (row) => row.categoria === "porteiro_fechadura",
    ).length;

    if (porteirosCountProposed > MAX_PORTEIROS) {
      showToast(
        `Limite de ${MAX_PORTEIROS} ramais Porteiro/Fechadura atingido.`,
        "error",
      );
      return;
    }

    for (const { numeroFixoOriginal, value } of editEntries) {
      const error = validateRamal(value, numeroFixoOriginal, proposedRows);

      if (error) {
        showToast(`Ramal ${numeroFixoOriginal}: ${error}`, "error");
        return;
      }
    }

    setRows((prev) =>
      prev.map((row) => {
        const edited = editing[row.numeroFixo];

        if (edited) return edited;

        for (const editedRamal of Object.values(editing)) {
          if (
            UNIQUE_CATEGORIES.includes(editedRamal.categoria) &&
            row.categoria === editedRamal.categoria
          ) {
            return {
              ...row,
              categoria: "ramal_normal",
            };
          }
        }

        return row;
      }),
    );

    setEditing({});
    setEditingPortariaTurno({});
    showToast("Alterações salvas com sucesso.");
  };

  const filtered = useMemo(() => {
    let list = rows;

    if (search.trim()) {
      const q = search.toLowerCase();

      list = list.filter(
        (r) =>
          String(r.numeroFixo).includes(q) ||
          r.numeroFlexivel.toLowerCase().includes(q) ||
          displayCategoriaLabel(r.categoria, r.numeroFixo)
            .toLowerCase()
            .includes(q) ||
          String(r.hotline).toLowerCase().includes(q) ||
          desvioLabel(r.desvioMode).toLowerCase().includes(q) ||
          ringLabel(r.ringType).toLowerCase().includes(q),
      );
    }

    if (!sortField) {
      return list;
    }

    return [...list].sort((a, b) => {
      if (sortField === "numeroFixo") {
        return b.numeroFixo - a.numeroFixo;
      }

      const getValue = (r: Ramal) => {
        switch (sortField) {
          case "categoria":
            return displayCategoriaLabel(r.categoria, r.numeroFixo);

          case "numeroFlexivel":
            return r.numeroFlexivel;

          case "hotline":
            return String(r.hotline);

          case "desvio":
            return desvioLabel(r.desvioMode);

          case "ringType":
            return ringLabel(r.ringType);

          case "senha":
            return r.senha;

          default:
            return "";
        }
      };

      return getValue(b).localeCompare(getValue(a), "pt-BR", {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, [rows, search, sortField, portariaHorario]);

  const toggleSort = (field: SortField) => {
    setSortField((current) => (current === field ? null : field));
  };

  const sortState = (field: SortField): "none" | "desc" =>
    sortField === field ? "desc" : "none";

  const porteirosCount = rows.filter(
    (r) => r.categoria === "porteiro_fechadura",
  ).length;

  const origemSelecionada = rows.find(
    (r) => String(r.numeroFixo) === ramalOrigem,
  );

  const origensFiltradas = rows.filter((r) => {
    const query = origemSearch.trim().toLowerCase();

    if (!query) return true;

    return (
      String(r.numeroFixo).includes(query) ||
      r.numeroFlexivel.toLowerCase().includes(query) ||
      ramalLabel(r).toLowerCase().includes(query)
    );
  });

  const destinosDisponiveis = rows.filter(
    (r) => String(r.numeroFixo) !== ramalOrigem,
  );

  const destinosFiltrados = destinosDisponiveis.filter((r) => {
    const query = destinoSearch.trim().toLowerCase();

    if (!query) return true;

    return (
      String(r.numeroFixo).includes(query) ||
      r.numeroFlexivel.toLowerCase().includes(query) ||
      ramalLabel(r).toLowerCase().includes(query)
    );
  });

  const todosDestinosSelecionados =
    destinosDisponiveis.length > 0 &&
    destinosDisponiveis.every((r) => ramaisDestino.includes(r.numeroFixo));

  const algumCampoReplicarSelecionado =
    Object.values(replicarCampos).some(Boolean);

  const replicarValido =
    algumCampoReplicarSelecionado &&
    Boolean(origemSelecionada) &&
    ramaisDestino.length > 0;

  const toggleCampoReplicar = (campo: keyof typeof replicarCampos) => {
    setReplicarCampos((prev) => ({
      ...prev,
      [campo]: !prev[campo],
    }));
  };

  const toggleDestino = (numeroFixo: number) => {
    setRamaisDestino((prev) =>
      prev.includes(numeroFixo)
        ? prev.filter((n) => n !== numeroFixo)
        : [...prev, numeroFixo],
    );
  };

  const toggleTodosDestinos = () => {
    if (todosDestinosSelecionados) {
      setRamaisDestino([]);
      return;
    }

    setRamaisDestino(destinosDisponiveis.map((r) => r.numeroFixo));
  };

  const resetReplicarProgramacoes = () => {
    setReplicarCampos({
      categoria: false,
      hotline: false,
      desvio: false,
      ringType: false,
    });

    setRamalOrigem("");
    setRamaisDestino([]);
    setOrigemSearch("");
    setOrigemOpen(false);
    setDestinoSearch("");
    setDestinosOpen(false);
  };

  const abrirReplicarProgramacoes = () => {
    if (rows.length === 0) {
      showToast(
        "Selecione primeiro o modelo do CondoNet e a quantidade de ramais na aba Gerais para habilitar a replicação de programações.",
        "error",
      );
      return;
    }

    resetReplicarProgramacoes();
    setReplicarOpen(true);
  };

  const handleReplicarProgramacoes = () => {
    setOrigemOpen(false);
    setDestinosOpen(false);

    const algumCampoSelecionado = Object.values(replicarCampos).some(Boolean);

    if (!algumCampoSelecionado) {
      showToast("Selecione pelo menos uma programação para replicar.", "error");
      return;
    }

    if (!origemSelecionada) {
      showToast("Selecione o ramal de origem.", "error");
      return;
    }

    if (ramaisDestino.length === 0) {
      showToast("Selecione pelo menos um ramal de destino.", "error");
      return;
    }

    const categoriasUnicas: Category[] = ["programador", "sindico"];

    if (
      replicarCampos.categoria &&
      categoriasUnicas.includes(origemSelecionada.categoria)
    ) {
      showToast(
        `A categoria "${categoriaLabel(origemSelecionada.categoria)}" é única e não pode ser replicada para outros ramais.`,
        "error",
      );
      return;
    }

    if (
      replicarCampos.categoria &&
      origemSelecionada.categoria === "portaria_atendedor"
    ) {
      const atuaisPortaria = rows.filter(
        (r) => r.categoria === "portaria_atendedor",
      ).length;

      const destinosQueAindaNaoSaoPortaria = ramaisDestino.filter(
        (numeroFixo) => {
          const ramal = rows.find((r) => r.numeroFixo === numeroFixo);
          return ramal?.categoria !== "portaria_atendedor";
        },
      ).length;

      if (
        atuaisPortaria + destinosQueAindaNaoSaoPortaria >
        MAX_PORTARIA_ATENDEDOR
      ) {
        showToast(
          "É permitido configurar no máximo 40 ramais como Portaria/Atendedor.",
          "error",
        );
        return;
      }
    }

    setRows((prev) =>
      prev.map((ramal) => {
        if (!ramaisDestino.includes(ramal.numeroFixo)) {
          return ramal;
        }

        return {
          ...ramal,
          ...(replicarCampos.categoria
            ? {
                categoria: origemSelecionada.categoria,
              }
            : {}),
          ...(replicarCampos.hotline
            ? {
                hotline: origemSelecionada.hotline,
              }
            : {}),
          ...(replicarCampos.desvio
            ? {
                desvioMode: origemSelecionada.desvioMode,
                desvioValor: origemSelecionada.desvioValor,
              }
            : {}),
          ...(replicarCampos.ringType
            ? {
                ringType: origemSelecionada.ringType,
              }
            : {}),
        };
      }),
    );

    showToast("Programações replicadas com sucesso.");
    setReplicarOpen(false);
    resetReplicarProgramacoes();
  };

  function BasicDropdown<T extends string>({
    value,
    options,
    onChange,
    disabled,
    placeholder = "Selecione",
    className,
  }: {
    value: T;
    options: Option<T>[];
    onChange: (value: T) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
  }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

    const selected = options.find((option) => option.value === value);

    useEffect(() => {
      if (!open) return;

      const handlePointerDown = (event: PointerEvent) => {
        if (!rootRef.current) return;

        if (!rootRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      };

      document.addEventListener("pointerdown", handlePointerDown);

      return () => {
        document.removeEventListener("pointerdown", handlePointerDown);
      };
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
          <div className={dropdownClass}>
            <div className={dropdownListClass}>
              {options.map((option) => {
                const checked = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-disabled={option.disabled}
                    onClick={() => {
                      if (option.disabled) return;

                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      dropdownItemClass,
                      option.disabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <span className="min-w-0 truncate">
                      {option.label}
                      {option.disabled ? " (em uso)" : ""}
                    </span>

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
    onChange,
    ramais,
    includeNenhum,
    nenhumLabel = "Nenhum",
    placeholder = "Selecione",
    disabled,
    className,
  }: {
    value: string | undefined;
    onChange: (value: string) => void;
    ramais: Ramal[];
    includeNenhum?: boolean;
    nenhumLabel?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
  }) {
    const [open, setOpen] = useState(false);
    const [localSearch, setLocalSearch] = useState("");
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!open) return;

      const handlePointerDown = (event: PointerEvent) => {
        if (!rootRef.current) return;

        if (!rootRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      };

      document.addEventListener("pointerdown", handlePointerDown);

      return () => {
        document.removeEventListener("pointerdown", handlePointerDown);
      };
    }, [open]);

    const selectedRamal =
      value && value !== "nenhum"
        ? rows.find((ramal) => String(ramal.numeroFixo) === String(value)) ??
          null
        : null;

    const filteredRamais = ramais.filter((ramal) => {
      const query = normalize(localSearch);

      if (!query) return true;

      return (
        normalize(ramal.numeroFixo).includes(query) ||
        normalize(ramal.numeroFlexivel).includes(query) ||
        normalize(ramalLabel(ramal)).includes(query)
      );
    });

    const display =
      value === "nenhum"
        ? nenhumLabel
        : selectedRamal
          ? ramalLabel(selectedRamal)
          : placeholder;

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
              value
                ? "truncate text-left text-foreground"
                : "truncate text-left text-muted-foreground"
            }
          >
            {display}
          </span>

          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {open && !disabled && (
          <div className={dropdownClass}>
            <div className={searchBoxClass}>
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />

              <Input
                value={localSearch}
                onChange={(event) => setLocalSearch(event.target.value)}
                placeholder="Pesquisar ramal"
                className={searchInputClass}
              />
            </div>

            <div className={dropdownListClass}>
              {includeNenhum && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("nenhum");
                    setOpen(false);
                    setLocalSearch("");
                  }}
                  className={dropdownItemClass}
                >
                  <span>{nenhumLabel}</span>

                  {value === "nenhum" && (
                    <Check className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
              )}

              {filteredRamais.length === 0 ? (
                <div className="px-2 py-2 text-sm text-muted-foreground">
                  Nenhum ramal encontrado.
                </div>
              ) : (
                filteredRamais.map((ramal) => {
                  const checked = String(ramal.numeroFixo) === String(value);

                  return (
                    <button
                      key={ramal.numeroFixo}
                      type="button"
                      onClick={() => {
                        onChange(String(ramal.numeroFixo));
                        setOpen(false);
                        setLocalSearch("");
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

  const ReplicarRamalOrigemDropdown = () => (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOrigemOpen((prev) => !prev);
          setDestinosOpen(false);
        }}
        className={triggerClass}
      >
        <span
          className={
            origemSelecionada
              ? "truncate text-left text-foreground"
              : "truncate text-left text-muted-foreground"
          }
        >
          {origemSelecionada
            ? ramalLabel(origemSelecionada)
            : "Selecione o ramal origem"}
        </span>

        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            origemOpen && "rotate-180",
          )}
        />
      </button>

      {origemOpen && (
        <div className={dropdownClass}>
          <div className={searchBoxClass}>
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />

            <Input
              value={origemSearch}
              onChange={(e) => setOrigemSearch(e.target.value)}
              placeholder="Pesquisar ramal"
              className={searchInputClass}
            />
          </div>

          <div className={dropdownListClass}>
            {origensFiltradas.length === 0 ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">
                Nenhum ramal encontrado.
              </p>
            ) : (
              origensFiltradas.map((ramal) => (
                <button
                  key={ramal.numeroFixo}
                  type="button"
                  className={dropdownItemClass}
                  onClick={() => {
                    const value = String(ramal.numeroFixo);

                    setRamalOrigem(value);

                    setRamaisDestino((prev) =>
                      prev.filter((n) => String(n) !== value),
                    );

                    setOrigemOpen(false);
                    setOrigemSearch("");
                    setDestinosOpen(false);
                  }}
                >
                  <span className="min-w-0 truncate">{ramalLabel(ramal)}</span>

                  {String(ramal.numeroFixo) === ramalOrigem && (
                    <Check className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  const ReplicarRamaisDestinoDropdown = () => (
    <div className="relative">
      <button
        type="button"
        disabled={!ramalOrigem}
        onClick={() => {
          if (!ramalOrigem) return;

          setDestinosOpen((prev) => !prev);
          setOrigemOpen(false);
        }}
        className={triggerClass}
      >
        <span
          className={
            ramaisDestino.length === 0
              ? "truncate text-left text-muted-foreground"
              : "truncate text-left text-foreground"
          }
        >
          {!ramalOrigem
            ? "Selecione primeiro o ramal origem"
            : ramaisDestino.length === 0
              ? "Selecionar ramais"
              : `${ramaisDestino.length} ramal(is) selecionado(s)`}
        </span>

        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            destinosOpen && "rotate-180",
          )}
        />
      </button>

      {destinosOpen && ramalOrigem && (
        <div className={dropdownClass}>
          <div className={searchBoxClass}>
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />

            <Input
              value={destinoSearch}
              onChange={(e) => setDestinoSearch(e.target.value)}
              placeholder="Pesquisar ramal"
              className={searchInputClass}
            />
          </div>

          <div className="mb-2 border-b pb-2">
            <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-primary/10 hover:text-primary">
              <Checkbox
                checked={todosDestinosSelecionados}
                onCheckedChange={toggleTodosDestinos}
              />
              Todos
            </label>
          </div>

          <div className={dropdownListClass}>
            {destinosFiltrados.length === 0 ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">
                Nenhum ramal encontrado.
              </p>
            ) : (
              destinosFiltrados.map((ramal) => (
                <label
                  key={ramal.numeroFixo}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <Checkbox
                    checked={ramaisDestino.includes(ramal.numeroFixo)}
                    onCheckedChange={() => toggleDestino(ramal.numeroFixo)}
                  />

                  <span className="min-w-0 truncate">{ramalLabel(ramal)}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  const cols = "grid-cols-[1.1fr_0.73fr_0.73fr_1fr_2fr_1fr_0.85fr_88px]";

  return (
    <>
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ramais</h2>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className={cn(
              "gap-2",
              rows.length === 0 && "cursor-not-allowed opacity-50",
            )}
            aria-disabled={rows.length === 0}
            onClick={() => {
              if (rows.length === 0) {
                showToast(
                  "Selecione primeiro o modelo do CondoNet e a quantidade de ramais na aba Gerais para habilitar o plano de numeração.",
                  "error",
                );
                return;
              }

              onOpenPlanoNumeracao();
            }}
          >
            <ListOrdered className="h-4 w-4" />
            Plano de numeração
          </Button>

          <Button
            variant="outline"
            className={cn(
              "gap-2",
              rows.length === 0 && "cursor-not-allowed opacity-50",
            )}
            aria-disabled={rows.length === 0}
            onClick={abrirReplicarProgramacoes}
          >
            <Copy className="h-4 w-4" />
            Replicar programações
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar"
              className="w-64 pl-9"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-visible border-t">
        <div
          className={cn(
            "grid gap-4 border-b px-2 py-4 text-sm text-muted-foreground",
            cols,
          )}
        >
          <HeaderCell
            label="Categoria"
            sort={sortState("categoria")}
            onSort={() => toggleSort("categoria")}
          />

          <HeaderCell
            label="Número fixo"
            sort={sortState("numeroFixo")}
            onSort={() => toggleSort("numeroFixo")}
          />

          <HeaderCell
            label="Número flexível"
            sort={sortState("numeroFlexivel")}
            onSort={() => toggleSort("numeroFlexivel")}
          />

          <HeaderCell
            label="Hotline"
            sort={sortState("hotline")}
            onSort={() => toggleSort("hotline")}
          />

          <HeaderCell
            label="Desvio"
            sort={sortState("desvio")}
            onSort={() => toggleSort("desvio")}
          />

          <HeaderCell
            label="Tipo de toque"
            sort={sortState("ringType")}
            onSort={() => toggleSort("ringType")}
          />

          <HeaderCell
            label="Senha (fechaduras)"
            sort={sortState("senha")}
            onSort={() => toggleSort("senha")}
          />

          <div className="flex items-center justify-end">
            <button
              type="button"
              disabled={!canSaveAll}
              onClick={saveAllEdits}
              title="Salvar todas as linhas em edição"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded transition-colors",
                canSaveAll
                  ? "text-primary hover:bg-primary/10"
                  : "cursor-not-allowed text-muted-foreground/50",
              )}
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>

        {filtered.map((r) => {
          const e = editing[r.numeroFixo];
          const isEditing = Boolean(e);
          const current = e ?? r;

          const takenUnique = new Set(
            rows
              .filter(
                (x) =>
                  x.numeroFixo !== r.numeroFixo &&
                  UNIQUE_CATEGORIES.includes(x.categoria),
              )
              .map((x) => x.categoria),
          );

          const blockedSource = isBlockedSource(current.categoria);

         const isModoDistinguirPortaria = portariaHorario?.distinguir === true;

        const portariaAtendedorCount = rows.filter(
          (row) => row.categoria === "portaria_atendedor",
        ).length;

          const categoriaOptions: Option<CategoriaSelectValue>[] = CATEGORIAS.flatMap(
            (categoria) => {
              const isPortariaAtendedor = categoria.value === "portaria_atendedor";

              if (isPortariaAtendedor && isModoDistinguirPortaria) {
                const disabled =
                  current.categoria !== "portaria_atendedor" &&
                  portariaAtendedorCount >= MAX_PORTARIA_ATENDEDOR;

                return [
                  {
                    value: "portaria_atendedor_diurno",
                    label: "Portaria (diurno)",
                    disabled,
                  },
                  {
                    value: "portaria_atendedor_noturno",
                    label: "Portaria (noturno)",
                    disabled,
                  },
                ];
              }

              const disabled =
                (UNIQUE_CATEGORIES.includes(categoria.value) &&
                  takenUnique.has(categoria.value) &&
                  current.categoria !== categoria.value) ||
                (isPortariaAtendedor &&
                  current.categoria !== "portaria_atendedor" &&
                  portariaAtendedorCount >= MAX_PORTARIA_ATENDEDOR);

              return [
                {
                  value: categoria.value as CategoriaSelectValue,
                  label: categoria.label,
                  disabled,
                },
              ];
            },
          );



          return (
            <div
              key={r.numeroFixo}
              data-ramal={r.numeroFixo}
              className={cn("grid items-center gap-4 border-b px-2 py-3", cols)}
            >
              <div className="flex items-center justify-center text-center">
                {isEditing ? (
                  <BasicDropdown<CategoriaSelectValue>
                    value={getCategoriaSelectValue(current, r.numeroFixo)}
                    options={categoriaOptions}
                    className="min-w-[185px]"
                   onChange={(value) => {
                    const isPortariaDiurno = value === "portaria_atendedor_diurno";
                    const isPortariaNoturno = value === "portaria_atendedor_noturno";

                    const categoriaReal: Category =
                      isPortariaDiurno || isPortariaNoturno
                        ? "portaria_atendedor"
                        : value;

                    const turno: "diurno" | "noturno" | undefined = isPortariaDiurno
                      ? "diurno"
                      : isPortariaNoturno
                        ? "noturno"
                        : undefined;

                    if (
                      UNIQUE_CATEGORIES.includes(categoriaReal) &&
                      takenUnique.has(categoriaReal)
                    ) {
                      showToast(
                        `Já existe um ramal com a categoria "${categoriaLabel(categoriaReal)}".`,
                        "error",
                      );
                      return;
                    }

                    if (
                      categoriaReal === "porteiro_fechadura" &&
                      current.categoria !== "porteiro_fechadura" &&
                      porteirosCount >= MAX_PORTEIROS
                    ) {
                      showToast(
                        `Limite de ${MAX_PORTEIROS} ramais Porteiro/Fechadura atingido.`,
                        "error",
                      );
                      return;
                    }

                    const patch: Partial<Ramal> = {
                      categoria: categoriaReal,
                    };

                    if (isBlockedSource(categoriaReal)) {
                      patch.hotline = "nenhum";
                      patch.desvioMode = "desativado";
                      patch.desvioValor = "";
                    }

                    if (categoriaReal === "portaria_atendedor" && turno) {
                      setEditingPortariaTurno((prev) => ({
                        ...prev,
                        [r.numeroFixo]: turno,
                      }));
                    } else {
                      setEditingPortariaTurno((prev) => {
                        const copy = { ...prev };
                        delete copy[r.numeroFixo];
                        return copy;
                      });
                    }

                    updateEdit(r.numeroFixo, patch);
                  }}
                  />
                ) : (
                  <span className="text-sm">
                    {displayCategoriaLabel(
                      current.categoria,
                      current.numeroFixo,
                    )}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center text-center">
                <span className="text-sm">{current.numeroFixo}</span>
              </div>

              <div className="flex items-center justify-center text-center">
                {isEditing ? (
                  <Input
                    value={current.numeroFlexivel}
                    onChange={(ev) => {
                      const v = ev.target.value.replace(/\D/g, "").slice(0, 8);
                      updateEdit(r.numeroFixo, {
                        numeroFlexivel: v,
                      });
                    }}
                    inputMode="numeric"
                  />
                ) : (
                  <span className="text-sm">{current.numeroFlexivel}</span>
                )}
              </div>

              <div className="flex items-center justify-center text-center">
                {isEditing ? (
                  blockedSource ? (
                    <button
                      type="button"
                      onClick={() =>
                        showToast(
                          `Ramais do tipo "${categoriaLabel(current.categoria)}" não podem ter hotline.`,
                          "error",
                        )
                      }
                      className="flex h-9 w-[185px] shrink-0 cursor-not-allowed items-center justify-between rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
                    >
                      Nenhum
                      <ArrowDownUp className="h-3.5 w-3.5 opacity-40" />
                    </button>
                  ) : (
                    <RamalDropdown
                      value={current.hotline}    
                      includeNenhum
                      className="w-[185px]"
                      ramais={rows.filter(
                        (x) =>
                          x.numeroFixo !== r.numeroFixo &&
                          !isBlockedHotlineTarget(x.categoria),
                      )}
                      onChange={(v) =>
                        updateEdit(r.numeroFixo, {
                          hotline: v as Hotline,
                        })
                      }
                    />
                  )
                ) : (
                  <span className="text-sm">
                    {current.hotline === "nenhum"
                      ? "Nenhum"
                      : ramalLabelByNumero(current.hotline)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center text-center">
                {isEditing ? (
                  blockedSource ? (
                    <button
                      type="button"
                      onClick={() =>
                        showToast(
                          `Ramais do tipo "${categoriaLabel(current.categoria)}" não podem ter desvio.`,
                          "error",
                        )
                      }
                      className="flex h-9 w-[150px] shrink-0 cursor-not-allowed items-center justify-between rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
                    >
                      Desativado
                      <ArrowDownUp className="h-3.5 w-3.5 opacity-40" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <BasicDropdown<DesvioMode>
                        value={current.desvioMode}
                        className="w-[150px]"
                        options={DESVIOS.map((d) => ({
                          value: d.value,
                          label: d.label,
                        }))}
                        onChange={(mode) => {
                          updateEdit(r.numeroFixo, {
                            desvioMode: mode,
                            desvioValor:
                              mode === "desativado" ? "" : current.desvioValor,
                          });
                        }}
                      />

                      {current.desvioMode !== "desativado" &&
                        (current.desvioMode === "externo" ? (
                          <Input
                            value={current.desvioValor}
                            onChange={(ev) => {
                              const v = ev.target.value
                                .replace(/\D/g, "")
                                .slice(0, 15);

                              updateEdit(r.numeroFixo, {
                                desvioValor: v,
                              });
                            }}
                            placeholder="Número externo"
                            inputMode="numeric"
                            className="min-w-[185px]"
                          />
                        ) : (
                          <RamalDropdown
                            value={current.desvioValor || undefined}
                            placeholder="Ramal destino"
                            className="min-w-[185px]"
                            ramais={rows.filter(
                              (x) =>
                                x.numeroFixo !== r.numeroFixo &&
                                !isBlockedDesvioTarget(x.categoria),
                            )}
                            onChange={(v) =>
                              updateEdit(r.numeroFixo, {
                                desvioValor: v,
                              })
                            }
                          />
                        ))}
                    </div>
                  )
                ) : (
                  <span className="text-sm ">
                    {current.desvioMode === "desativado"
                      ? "Desativado"
                      : current.desvioMode === "externo"
                        ? `${desvioLabel(current.desvioMode)}: ${current.desvioValor}`
                        : `${desvioLabel(current.desvioMode)}: ${ramalLabelByNumero(current.desvioValor)}`}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center text-center">
                {isEditing ? (
                  <BasicDropdown<RingType>
                    value={current.ringType}
                    className="w-[150px]"
                    options={RINGS.map((rg) => ({
                      value: rg.value,
                      label: rg.label,
                    }))}
                    onChange={(v) =>
                      updateEdit(r.numeroFixo, {
                        ringType: v,
                      })
                    }
                  />
                ) : (
                  <span className="text-sm">{ringLabel(current.ringType)}</span>
                )}
              </div>

              <div className="flex items-center justify-center text-center w-[100px]">
                
                {isEditing ? (
                  <SenhaInput
                    value={current.senha}
                    onChange={(v) =>
                      updateEdit(r.numeroFixo, {
                        senha: v,
                      })
                    }
                    onInvalid={(m) => showToast(m, "error")}
                  />
                ) : (
                  <span className="text-sm">{current.senha ? "••••" : ""}</span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => saveEdit(r.numeroFixo)}
                      className="flex h-8 w-8 items-center justify-center rounded text-primary hover:bg-primary/10"
                      title="Salvar"
                    >
                      <Check className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => cancelEdit(r.numeroFixo)}
                      className="flex h-8 w-8 items-center justify-center rounded text-destructive hover:bg-destructive/10"
                      title="Cancelar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(r)}
                    className="flex h-8 w-8 items-center justify-center rounded text-primary hover:bg-primary/10"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={replicarOpen}
        onOpenChange={(open) => {
          if (!open) return;
          setReplicarOpen(true);
        }}
      >
        <DialogContent
          className="max-w-[760px] [&>button.absolute]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Replicar programações</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="mb-3 text-sm font-medium">
                Programações a replicar
              </h3>

              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={replicarCampos.categoria}
                    onCheckedChange={() => toggleCampoReplicar("categoria")}
                  />
                  Categoria
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={replicarCampos.hotline}
                    onCheckedChange={() => toggleCampoReplicar("hotline")}
                  />
                  Hotline
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={replicarCampos.desvio}
                    onCheckedChange={() => toggleCampoReplicar("desvio")}
                  />
                  Desvio
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={replicarCampos.ringType}
                    onCheckedChange={() => toggleCampoReplicar("ringType")}
                  />
                  Tipo de toque
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-foreground">
                  Ramal origem:
                </label>

                <ReplicarRamalOrigemDropdown />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-foreground">
                  Ramais de destino:
                </label>

                <ReplicarRamaisDestinoDropdown />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReplicarOpen(false);
                resetReplicarProgramacoes();
              }}
            >
              Cancelar
            </Button>

            <Button
              className={cn(!replicarValido && "cursor-not-allowed opacity-50")}
              aria-disabled={!replicarValido}
              onClick={handleReplicarProgramacoes}
            >
              Replicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}