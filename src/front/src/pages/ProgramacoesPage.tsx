// Container da rota /programacoes. Mantém o estado dos ramais e renderiza
// a sub-aba ativa (Ramais / Ramais especiais / etc).

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  X,
  RotateCcw,
  History,
  Save,
  Info,
  Radio,
  ChartColumnBig,
  Phone,
  List,
  ArrowUpCircle,
  ListOrdered,
  Settings2,
  Headset,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";

import {
  TabBtn,
  UNIQUE_CATEGORIES,
  MAX_PORTARIA_ATENDEDOR,
  isBlockedSource,
  isBlockedHotlineTarget,
  isBlockedDesvioTarget,
  makeDefault,
  type Category,
  type Ramal,
  type TabId,
  type RamaisCount,
} from "@/components/ramais/shared";

import { RamaisPage } from "@/pages/AbasProgramaçõesDoPABX/RamaisPage";

import {
  RamaisEspeciaisPage,
  defaultPortariaHorarioState,
  type PortariaHorarioState,
} from "@/pages/AbasProgramaçõesDoPABX/RamaisEspeciaisPage";

import {
  InterfonesPage,
  defaultInterfonesState,
  isInterfonesDefault,
  type InterfonesState,
} from "@/pages/AbasProgramaçõesDoPABX/InterfonesPage";

import {
  GeraisPage,
  defaultGeraisState,
  isGeraisDefault,
  type GeraisState,
} from "@/pages/AbasProgramaçõesDoPABX/GeraisPage";

import { PlanoNumeracaoPage } from "@/pages/PlanoNumeracaoPage";
import { useNavigate } from "@tanstack/react-router";

export function ProgramacoesPage() {
  const navigate = useNavigate();

  const [gerais, setGerais] = useState<GeraisState>(defaultGeraisState);
  const [rows, setRows] = useState<Ramal[]>(() => makeDefault(0));
  const [interfones, setInterfones] = useState<InterfonesState>(
    defaultInterfonesState,
  );

  const [portariaHorario, setPortariaHorario] =
    useState<PortariaHorarioState>(() => defaultPortariaHorarioState());

  const [toast, setToast] = useState<{
    msg: string;
    variant?: "info" | "error";
  } | null>(null);

  const [tab, setTab] = useState<TabId>("gerais");
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [planoNumeracaoOpen, setPlanoNumeracaoOpen] = useState(false);

  const [activeWindow, setActiveWindow] = useState<
    "programacoes" | "planoNumeracao"
  >("programacoes");

  const showToast = useCallback(
    (msg: string, variant: "info" | "error" = "info") => {
      setToast({ msg, variant });
    },
    [],
  );

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const isCurrentTabBlocked = (() => {
    if (tab === "ramais") return rows.length === 0;
    if (tab === "ramais_especiais") return rows.length === 0;

    if (tab === "interfones") {
      return !rows.some((r) => r.categoria === "porteiro_fechadura");
    }

    if (tab === "rfid") return true;

    return false;
  })();

  const isCurrentTabDefault = (() => {
    if (tab === "gerais") return isGeraisDefault(gerais);

    if (tab === "ramais" || tab === "ramais_especiais") {
      return JSON.stringify(rows) === JSON.stringify(makeDefault(gerais.qtd));
    }

    if (tab === "interfones") {
      return isInterfonesDefault(interfones);
    }

    return true;
  })();

  const restoreDisabled = isCurrentTabDefault || isCurrentTabBlocked;

  const hasChanges =
    !isGeraisDefault(gerais) ||
    !isInterfonesDefault(interfones) ||
    JSON.stringify(rows) !== JSON.stringify(makeDefault(gerais.qtd));

  const handleSave = useCallback(() => {
    if (!hasChanges) {
      showToast("Não há alterações para salvar.", "error");
      return;
    }

    // Salvamento principal ainda não implementado no protótipo.
    showToast("Alterações prontas para salvar.");
  }, [hasChanges, showToast]);

  const doRestore = () => {
    if (tab === "gerais") {
      setGerais(defaultGeraisState());
      setRows(makeDefault(0));
    } else if (tab === "ramais" || tab === "ramais_especiais") {
      setRows(makeDefault(gerais.qtd));
    } else if (tab === "interfones") {
      setInterfones(defaultInterfonesState());
    }

    setRestoreOpen(false);
    showToast("Valores padrão restaurados.");
  };

  const handleRestoreClick = () => {
    if (restoreDisabled) {
      showToast("Não há alterações para restaurar nesta aba.", "error");
      return;
    }

    setRestoreOpen(true);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || restoreOpen) return;

      const target = event.target;

      if (!(target instanceof HTMLInputElement)) return;
      if (target.disabled || target.readOnly) return;

      if (
        [
          "button",
          "submit",
          "reset",
          "image",
          "checkbox",
          "radio",
          "file",
          "color",
          "range",
          "hidden",
        ].includes(target.type)
      ) {
        return;
      }

      if (
        target.closest(
          "[aria-expanded='true'], [role='combobox'], button, a, textarea, select, [role='button'], [role='link']",
        )
      ) {
        return;
      }

      if (target.closest("dialog, [role='dialog']")) return;

      event.preventDefault();
      handleSave();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [restoreOpen, handleSave]);

  const setUniqueCategory = (numeroFixo: number, cat: Category) => {
    setRows((prev) => {
      const totalPortaria = prev.filter(
        (r) => r.categoria === "portaria_atendedor",
      ).length;

      const ramalAtual = prev.find((r) => r.numeroFixo === numeroFixo);

      if (
        cat === "portaria_atendedor" &&
        ramalAtual?.categoria !== "portaria_atendedor" &&
        totalPortaria >= MAX_PORTARIA_ATENDEDOR
      ) {
        showToast(
          "É permitido configurar no máximo 40 ramais como Portaria/Atendedor.",
          "error",
        );

        return prev;
      }

      return prev.map((r) => {
        if (r.numeroFixo === numeroFixo) {
          const next: Ramal = {
            ...r,
            categoria: cat,
          };

          if (isBlockedSource(cat)) {
            next.hotline = "nenhum";
            next.desvioMode = "desativado";
            next.desvioValor = "";
          }

          return next;
        }

        if (UNIQUE_CATEGORIES.includes(cat) && r.categoria === cat) {
          return {
            ...r,
            categoria: "ramal_normal",
          };
        }

        let cleaned = r;

        if (
          cleaned.hotline === String(numeroFixo) &&
          isBlockedHotlineTarget(cat)
        ) {
          cleaned = {
            ...cleaned,
            hotline: "nenhum",
          };
        }

        if (
          (cleaned.desvioMode === "sempre" ||
            cleaned.desvioMode === "ocupado") &&
          cleaned.desvioValor === String(numeroFixo) &&
          isBlockedDesvioTarget(cat)
        ) {
          cleaned = {
            ...cleaned,
            desvioMode: "desativado",
            desvioValor: "",
          };
        }

        return cleaned;
      });
    });
  };

  return (
    <AppShell
      tabs={[
        {
          id: "programacoes",
          label: "Programações do PABX",
          active: activeWindow === "programacoes",
          onClick: () => setActiveWindow("programacoes"),
          onClose: () => {
            if (planoNumeracaoOpen) {
              setActiveWindow("planoNumeracao");
              return;
            }

            navigate({ to: "/" });
          },
          icon: <Settings2 className="w-4 h-4 text-primary" />,
        },
        ...(planoNumeracaoOpen
          ? [
              {
                id: "planoNumeracao",
                label: "Plano de numeração",
                active: activeWindow === "planoNumeracao",
                onClick: () => setActiveWindow("planoNumeracao"),
                onClose: () => {
                  setPlanoNumeracaoOpen(false);

                  if (activeWindow === "planoNumeracao") {
                    setActiveWindow("programacoes");
                  }
                },
                icon: <ListOrdered className="w-4 h-4 text-primary" />,
              },
            ]
          : []),
      ]}
    >
      {toast && (
        <div className="fixed top-[118px] right-4 z-999 flex flex-col gap-2">
          <div
            className={cn(
              "flex items-start gap-3 rounded-md px-4 py-3 max-w-md shadow-lg border animate-in fade-in slide-in-from-top-2",
              toast.variant === "error"
                ? "bg-red-50 border-red-300 text-red-700"
                : "bg-white border-border text-foreground",
            )}
            role="alert"
          >
            <Info
              className={cn(
                "w-5 h-5 mt-0.5 shrink-0",
                toast.variant === "error"
                  ? "text-destructive"
                  : "text-primary",
              )}
            />

            <span className="text-sm leading-snug">{toast.msg}</span>

            <button
              onClick={() => setToast(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Fechar"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeWindow === "planoNumeracao" && planoNumeracaoOpen ? (
        <PlanoNumeracaoPage
          rows={rows}
          setRows={setRows}
          showToast={showToast}
          onBack={() => setActiveWindow("programacoes")}
        />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 px-10 py-6 overflow-y-scroll overflow-x-hidden overscroll-contain">
            <div className="flex items-start justify-between gap-6">
              <h1 className="text-2xl font-semibold tracking-tight">
                Programações do PABX
              </h1>
            </div>

            <div className="mt-6 inline-flex rounded-md border bg-card overflow-hidden text-sm">
              <TabBtn
                icon={<ChartColumnBig className="w-4 h-4" />}
                label="Gerais"
                active={tab === "gerais"}
                onClick={() => setTab("gerais")}
              />

              <TabBtn
                icon={<Phone className="w-4 h-4" />}
                label="Interfones/Porteiros"
                active={tab === "interfones"}
                onClick={() => setTab("interfones")}
              />

              <TabBtn
                icon={<List className="w-4 h-4" />}
                label="Ramais"
                active={tab === "ramais"}
                onClick={() => setTab("ramais")}
              />

              <TabBtn
                icon={<Headset className="w-4 h-4" />}
                label="Ramais de serviço"
                active={tab === "ramais_especiais"}
                onClick={() => setTab("ramais_especiais")}
              />

              <TabBtn
                icon={<Radio className="w-4 h-4" />}
                label="RFID"
                active={tab === "rfid"}
                onClick={() => setTab("rfid")}
              />
            </div>

            {tab === "gerais" && (
              <GeraisPage
                state={gerais}
                setState={setGerais}
                onModelQtdChange={(qtd: RamaisCount) => {
                  setRows(makeDefault(qtd));
                }}
                showToast={showToast}
              />
            )}

            {tab === "ramais" && (
              <RamaisPage
                rows={rows}
                setRows={setRows}
                showToast={showToast}
                onOpenPlanoNumeracao={() => {
                  setPlanoNumeracaoOpen(true);
                  setActiveWindow("planoNumeracao");
                }}
                portariaHorario={portariaHorario}
                setPortariaHorario={setPortariaHorario}
              />
            )}

            {tab === "ramais_especiais" && (
              <RamaisEspeciaisPage
                rows={rows}
                setUniqueCategory={setUniqueCategory}
                showToast={showToast}
                portariaHorario={portariaHorario}
                setPortariaHorario={setPortariaHorario}
              />
            )}

            {tab === "interfones" && (
              <InterfonesPage
                rows={rows}
                state={interfones}
                setState={setInterfones}
                showToast={showToast}
              />
            )}

            {tab !== "gerais" &&
              tab !== "ramais" &&
              tab !== "ramais_especiais" &&
              tab !== "interfones" && (
                <div className="mt-12 text-muted-foreground text-sm">
                  Conteúdo desta aba ainda não disponível.
                </div>
              )}
          </div>

          <div className="shrink-0 border-t bg-card px-6 py-3 flex items-center justify-end gap-3 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
            <Button
              variant="outline"
              className={cn(
                "gap-2",
                restoreDisabled && "opacity-50 cursor-not-allowed",
              )}
              aria-disabled={restoreDisabled}
              onClick={handleRestoreClick}
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar
            </Button>

            <Button variant="outline" className="gap-2">
              <History className="w-4 h-4" />
              Alterações
            </Button>

            <Button variant="outline" className="gap-2" disabled>
              <Save className="w-4 h-4" />
              Salvar
            </Button>

            <Button variant="outline" className="gap-2" disabled>
              <ArrowUpCircle className="w-4 h-4" />
              Enviar programações
            </Button>
          </div>

          <AlertDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restaurar configurações</AlertDialogTitle>

                <AlertDialogDescription>
                  Tem certeza de que deseja redefinir todos os dados dessa tela?
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel className="gap-2 border-destructive/60 text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <X className="w-4 h-4" />
                  Cancelar
                </AlertDialogCancel>

                <AlertDialogAction onClick={doRestore} className="gap-2">
                  <Check className="w-4 h-4" />
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </AppShell>
  );
}