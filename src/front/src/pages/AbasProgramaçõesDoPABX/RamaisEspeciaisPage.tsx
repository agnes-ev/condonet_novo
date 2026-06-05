// Sub-aba "Ramais de serviço" dentro de /programacoes.
// Recebe estado via props do container ProgramacoesPage.

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  MAX_PORTARIA_ATENDEDOR,
  type Category,
  type Ramal,
  type ToastFn,
} from "@/components/ramais/shared";

export type PortariaHorarioState = {
  distinguir: boolean;
  diurno: number[];
  noturno: number[];
};

export const defaultPortariaHorarioState = (): PortariaHorarioState => ({
  distinguir: false,
  diurno: [],
  noturno: [],
});

export function RamaisEspeciaisPage({
  rows,
  setUniqueCategory,
  showToast,
  portariaHorario,
  setPortariaHorario,
}: {
  rows: Ramal[];
  setUniqueCategory: (numeroFixo: number, cat: Category) => void;
  showToast: ToastFn;
  portariaHorario: PortariaHorarioState;
  setPortariaHorario: (
    updater:
      | PortariaHorarioState
      | ((state: PortariaHorarioState) => PortariaHorarioState),
  ) => void;
}) {
  const hasRamais = rows.length > 0;

  const [programadorOpen, setProgramadorOpen] = useState(false);
  const [sindicoOpen, setSindicoOpen] = useState(false);
  const [portariaOpen, setPortariaOpen] = useState(false);
  const [portariaDiurnoOpen, setPortariaDiurnoOpen] = useState(false);
  const [portariaNoturnoOpen, setPortariaNoturnoOpen] = useState(false);

  const [programadorSearch, setProgramadorSearch] = useState("");
  const [sindicoSearch, setSindicoSearch] = useState("");
  const [portariaSearch, setPortariaSearch] = useState("");
  const [portariaDiurnoSearch, setPortariaDiurnoSearch] = useState("");
  const [portariaNoturnoSearch, setPortariaNoturnoSearch] = useState("");

  const dropdownAreaRef = useRef<HTMLDivElement | null>(null);

  const portariaSelecionados = useMemo(
    () => rows.filter((r) => r.categoria === "portaria_atendedor"),
    [rows],
  );

  const portariaUnica = useMemo(() => {
    if (portariaHorario.distinguir) return [];

    return portariaSelecionados.map((ramal) => ramal.numeroFixo);
  }, [portariaHorario.distinguir, portariaSelecionados]);

  const totalPortariaSelecionada = portariaHorario.distinguir
    ? new Set([...portariaHorario.diurno, ...portariaHorario.noturno]).size
    : portariaUnica.length;

  const ramalLabel = (ramal: Ramal) =>
    `Ramal (${ramal.numeroFixo}) - ${ramal.numeroFlexivel || "--"}`;

  const normalize = (value: string | number | null | undefined) =>
    String(value ?? "")
      .toLowerCase()
      .trim();

  const filterRamais = (search: string) => {
    const query = normalize(search);

    if (!query) return rows;

    return rows.filter((ramal) => {
      const fixo = normalize(ramal.numeroFixo);
      const flexivel = normalize(ramal.numeroFlexivel);
      const label = normalize(ramalLabel(ramal));

      return (
        fixo.includes(query) ||
        flexivel.includes(query) ||
        label.includes(query)
      );
    });
  };

  const closeAllDropdowns = () => {
    setProgramadorOpen(false);
    setSindicoOpen(false);
    setPortariaOpen(false);
    setPortariaDiurnoOpen(false);
    setPortariaNoturnoOpen(false);
  };

  const openProgramadorDropdown = () => {
    setProgramadorOpen((prev) => !prev);
    setSindicoOpen(false);
    setPortariaOpen(false);
    setPortariaDiurnoOpen(false);
    setPortariaNoturnoOpen(false);
  };

  const openSindicoDropdown = () => {
    setSindicoOpen((prev) => !prev);
    setProgramadorOpen(false);
    setPortariaOpen(false);
    setPortariaDiurnoOpen(false);
    setPortariaNoturnoOpen(false);
  };

  const openPortariaDropdown = () => {
    setPortariaOpen((prev) => !prev);
    setProgramadorOpen(false);
    setSindicoOpen(false);
    setPortariaDiurnoOpen(false);
    setPortariaNoturnoOpen(false);
  };

  const openPortariaDiurnoDropdown = () => {
    setPortariaDiurnoOpen((prev) => !prev);
    setProgramadorOpen(false);
    setSindicoOpen(false);
    setPortariaOpen(false);
    setPortariaNoturnoOpen(false);
  };

  const openPortariaNoturnoDropdown = () => {
    setPortariaNoturnoOpen((prev) => !prev);
    setProgramadorOpen(false);
    setSindicoOpen(false);
    setPortariaOpen(false);
    setPortariaDiurnoOpen(false);
  };

  const isBlockedForPortaria = (ramal: Ramal) =>
    ramal.categoria === "programador" ||
    ramal.categoria === "sindico" ||
    ramal.categoria === "porteiro_fechadura";

  const limparPortariasAtuais = () => {
    rows.forEach((ramal) => {
      if (ramal.categoria === "portaria_atendedor") {
        setUniqueCategory(ramal.numeroFixo, "ramal_normal");
      }
    });
  };

  const togglePortariaUnica = (ramal: Ramal) => {
    if (isBlockedForPortaria(ramal)) {
      showToast("Este ramal já está em uso por outra função especial.", "error");
      return;
    }

    const alreadySelected = ramal.categoria === "portaria_atendedor";

    if (alreadySelected) {
      setUniqueCategory(ramal.numeroFixo, "ramal_normal");
      return;
    }

    if (portariaUnica.length >= MAX_PORTARIA_ATENDEDOR) {
      showToast(
        "É permitido configurar no máximo 40 ramais como Portaria/Atendedor.",
        "error",
      );
      return;
    }

    setUniqueCategory(ramal.numeroFixo, "portaria_atendedor");
  };

  const togglePortariaPorTurno = (
    ramal: Ramal,
    turno: "diurno" | "noturno",
  ) => {
    if (isBlockedForPortaria(ramal)) {
      showToast("Este ramal já está em uso por outra função especial.", "error");
      return;
    }

    setPortariaHorario((prev) => {
      const diurno = [...prev.diurno];
      const noturno = [...prev.noturno];

      const listaAtual = turno === "diurno" ? diurno : noturno;
      const outraLista = turno === "diurno" ? noturno : diurno;

      const jaSelecionado = listaAtual.includes(ramal.numeroFixo);

      if (jaSelecionado) {
        const novaListaAtual = listaAtual.filter(
          (numero) => numero !== ramal.numeroFixo,
        );

        const continuaEmOutroTurno = outraLista.includes(ramal.numeroFixo);

        if (!continuaEmOutroTurno) {
          setUniqueCategory(ramal.numeroFixo, "ramal_normal");
        }

        return {
          ...prev,
          diurno: turno === "diurno" ? novaListaAtual : diurno,
          noturno: turno === "noturno" ? novaListaAtual : noturno,
        };
      }

      const totalAtual = new Set([...diurno, ...noturno]).size;
      const novoNumeroJaExisteNoOutroTurno = outraLista.includes(
        ramal.numeroFixo,
      );

      if (
        totalAtual >= MAX_PORTARIA_ATENDEDOR &&
        !novoNumeroJaExisteNoOutroTurno
      ) {
        showToast(
          "É permitido configurar no máximo 40 ramais como Portaria/Atendedor.",
          "error",
        );

        return prev;
      }

      setUniqueCategory(ramal.numeroFixo, "portaria_atendedor");

      return {
        ...prev,
        diurno:
          turno === "diurno"
            ? [...diurno, ramal.numeroFixo]
            : diurno.filter((numero) => numero !== ramal.numeroFixo),
        noturno:
          turno === "noturno"
            ? [...noturno, ramal.numeroFixo]
            : noturno.filter((numero) => numero !== ramal.numeroFixo),
      };
    });
  };

  const handleToggleDistinguirHorario = () => {
    if (!hasRamais) {
      showToast(
        'Selecione o modelo do CondoNet e a quantidade de ramais na aba Gerais antes de configurar os ramais de serviço.',
        "error",
      );
      return;
    }

    closeAllDropdowns();

    setPortariaHorario((prev) => {
      const novoValor = !prev.distinguir;

      if (novoValor) {
        const portariasAtuais = rows
          .filter((ramal) => ramal.categoria === "portaria_atendedor")
          .map((ramal) => ramal.numeroFixo);

        return {
          distinguir: true,
          diurno: portariasAtuais,
          noturno: [],
        };
      }

      const todosSelecionados = Array.from(
        new Set([...prev.diurno, ...prev.noturno]),
      ).slice(0, MAX_PORTARIA_ATENDEDOR);

      limparPortariasAtuais();

      todosSelecionados.forEach((numero) => {
        setUniqueCategory(numero, "portaria_atendedor");
      });

      return {
        distinguir: false,
        diurno: [],
        noturno: [],
      };
    });
  };

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

  const getResumoPortariaUnica = () => {
    if (portariaUnica.length === 0) return "Selecionar ramais";

    return `${portariaUnica.length} ramal(is) selecionado(s)`;
  };

  const getResumoTurno = (turno: "diurno" | "noturno") => {
    const total =
      turno === "diurno"
        ? portariaHorario.diurno.length
        : portariaHorario.noturno.length;

    if (total === 0) return "Selecionar ramais";

    return `${total} ramal(is) selecionado(s)`;
  };

  const MultiRamalDropdown = ({
    label,
    selectedValues,
    open,
    search,
    setSearch,
    onOpen,
    onToggle,
  }: {
    label: string;
    selectedValues: number[];
    open: boolean;
    search: string;
    setSearch: Dispatch<SetStateAction<string>>;
    onOpen: () => void;
    onToggle: (ramal: Ramal) => void;
  }) => {
    const filteredRamais = filterRamais(search);

    return (
      <div className="flex min-w-[260px] flex-col gap-1">
        <label className="text-sm text-foreground">{label}</label>

        <div className="relative">
          <button
            type="button"
            disabled={!hasRamais}
            onClick={() => {
              if (!hasRamais) {
                showToast(
                  'Selecione o modelo do CondoNet e a quantidade de ramais na aba Gerais antes de configurar os ramais de serviço.',
                  "error",
                );
                return;
              }

              onOpen();
            }}
            className={triggerClass}
          >
            <span
              className={
                selectedValues.length > 0
                  ? "truncate text-left text-foreground"
                  : "truncate text-left text-muted-foreground"
              }
            >
              {selectedValues.length === 0
                ? "Selecionar ramais"
                : `${selectedValues.length} ramal(is) selecionado(s)`}
            </span>

            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {open && hasRamais && (
            <div className={dropdownClass}>
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
                    const checked = selectedValues.includes(ramal.numeroFixo);

                    const blocked =
                      ramal.categoria !== "ramal_normal" &&
                      ramal.categoria !== "portaria_atendedor";

                    return (
                      <button
                        key={ramal.numeroFixo}
                        type="button"
                        aria-disabled={blocked}
                        onClick={() => {
                          if (blocked) {
                            showToast(
                              "Este ramal já está em uso por outra função especial.",
                              "error",
                            );
                            return;
                          }

                          onToggle(ramal);
                        }}
                        className={`${dropdownItemClass} ${
                          blocked ? "cursor-not-allowed opacity-50" : ""
                        }`}
                      >
                        <span className="min-w-0 truncate">
                          {ramalLabel(ramal)}
                        </span>

                        <div className="ml-3 flex shrink-0 items-center gap-2">
                          {blocked && (
                            <span className="text-xs text-muted-foreground">
                              em uso
                            </span>
                          )}

                          {checked && (
                            <Check className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SingleSpecialDropdown = ({
    label,
    cat,
    open,
    setOpen,
    search,
    setSearch,
    onOpen,
  }: {
    label: string;
    cat: Category;
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    search: string;
    setSearch: Dispatch<SetStateAction<string>>;
    onOpen: () => void;
  }) => {
    const selected = rows.find((r) => r.categoria === cat) ?? null;
    const filteredRamais = filterRamais(search);

    return (
      <div className="flex min-w-[260px] flex-col gap-1">
        <label className="text-sm text-foreground">{label}</label>

        <div className="relative">
          <button
            type="button"
            disabled={!hasRamais}
            onClick={() => {
              if (!hasRamais) {
                showToast(
                  'Selecione o modelo do CondoNet e a quantidade de ramais na aba Gerais antes de configurar os ramais de serviço.',
                  "error",
                );
                return;
              }

              onOpen();
            }}
            className={triggerClass}
          >
            <span
              className={
                selected
                  ? "truncate text-left text-foreground"
                  : "truncate text-left text-muted-foreground"
              }
            >
              {selected ? ramalLabel(selected) : "Selecionar ramal"}
            </span>

            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {open && hasRamais && (
            <div className={dropdownClass}>
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
                    const checked = ramal.categoria === cat;

                    const blocked =
                      ramal.categoria !== "ramal_normal" &&
                      ramal.categoria !== cat;

                    return (
                      <button
                        key={ramal.numeroFixo}
                        type="button"
                        aria-disabled={blocked}
                        onClick={() => {
                          if (blocked) {
                            showToast(
                              "Este ramal já está em uso por outra função especial.",
                              "error",
                            );
                            return;
                          }

                          setUniqueCategory(ramal.numeroFixo, cat);
                          setOpen(false);
                        }}
                        className={`${dropdownItemClass} ${
                          blocked ? "cursor-not-allowed opacity-50" : ""
                        }`}
                      >
                        <span className="min-w-0 truncate">
                          {ramalLabel(ramal)}
                        </span>

                        <div className="ml-3 flex shrink-0 items-center gap-2">
                          {blocked && (
                            <span className="text-xs text-muted-foreground">
                              em uso
                            </span>
                          )}

                          {checked && (
                            <Check className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        dropdownAreaRef.current &&
        !dropdownAreaRef.current.contains(target)
      ) {
        closeAllDropdowns();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);



  
  return (
    <>

      <div ref={dropdownAreaRef}>
        <section className="mt-4">
          <h3 className="mb-2 text-base font-medium">
            Ramal da portaria/atendedor
          </h3>

          <div className="rounded-md border bg-card px-5 py-5">
            <div className="flex flex-wrap items-start gap-6">
              {!portariaHorario.distinguir ? (
                <MultiRamalDropdown
                  label="Ramal da portaria"
                  selectedValues={portariaUnica}
                  open={portariaOpen}
                  search={portariaSearch}
                  setSearch={setPortariaSearch}
                  onOpen={openPortariaDropdown}
                  onToggle={togglePortariaUnica}
                />
              ) : (
                <>
                  <MultiRamalDropdown
                    label="Ramal da portaria — Diurno"
                    selectedValues={portariaHorario.diurno}
                    open={portariaDiurnoOpen}
                    search={portariaDiurnoSearch}
                    setSearch={setPortariaDiurnoSearch}
                    onOpen={openPortariaDiurnoDropdown}
                    onToggle={(ramal) => togglePortariaPorTurno(ramal, "diurno")}
                  />

                  <MultiRamalDropdown
                    label="Ramal da portaria — Noturno"
                    selectedValues={portariaHorario.noturno}
                    open={portariaNoturnoOpen}
                    search={portariaNoturnoSearch}
                    setSearch={setPortariaNoturnoSearch}
                    onOpen={openPortariaNoturnoDropdown}
                    onToggle={(ramal) =>
                      togglePortariaPorTurno(ramal, "noturno")
                    }
                  />
                </>
              )}

              <div className="flex min-h-[64px] items-center pt-6">
                <button
                  type="button"
                  onClick={handleToggleDistinguirHorario}
                  className="flex items-center gap-3 text-sm text-foreground"
                >
                  <span
                    className={`flex h-6 w-11 items-center rounded-full border transition-colors ${
                      portariaHorario.distinguir
                        ? "border-primary bg-primary"
                        : "border-input bg-muted"
                    }`}
                  >
                    <span
                      className={`h-5 w-5 rounded-full bg-background shadow-sm transition-transform ${
                        portariaHorario.distinguir
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      }`}
                    />
                  </span>

                  Distinguir horário diurno / noturno
                </button>
              </div>
            </div>

          
          </div>
        </section>

        <section className="mt-6">
          <h3 className="mb-2 text-base font-medium">Outros ramais</h3>

          <div className="rounded-md border bg-card px-5 py-5">
            <div className="flex flex-wrap items-center gap-6">
              <SingleSpecialDropdown
                label="Ramal do programador"
                cat="programador"
                open={programadorOpen}
                setOpen={setProgramadorOpen}
                search={programadorSearch}
                setSearch={setProgramadorSearch}
                onOpen={openProgramadorDropdown}
              />

              <SingleSpecialDropdown
                label="Ramal do síndico"
                cat="sindico"
                open={sindicoOpen}
                setOpen={setSindicoOpen}
                search={sindicoSearch}
                setSearch={setSindicoSearch}
                onOpen={openSindicoDropdown}
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}