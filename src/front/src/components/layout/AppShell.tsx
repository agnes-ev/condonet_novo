import { Link, useRouter } from "@tanstack/react-router";
import { Home, LogIn, Minus, Phone, Square, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ShellTab = {
  id: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
  onClose?: () => void;
  icon?: React.ReactNode;
};

export function AppShell({
  children,
  openTab,
  tabs,
}: {
  children: React.ReactNode;
  openTab?: {
    label: string;
    to: string;
  };
  tabs?: ShellTab[];
}) {

  const router = useRouter();
  const path = router.state.location.pathname;

  return (
    // h-screen e overflow-hidden garantem o tamanho fixo da janela do app
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden select-none">
      {/* Title bar (shrink-0 impede que a barra encolha) */}
      <div className="h-14 shrink-0 bg-[hsl(212,53%,18%)] text-white flex items-center px-3 gap-6">
        <div className="w-7 h-7 grid grid-cols-3 gap-[2px] opacity-90">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white/80 rounded-[1px]" />
          ))}
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <span className="cursor-default">Arquivo</span>
          <span className="cursor-default">Pabx</span>
          <span className="cursor-default">Ferramentas</span>
          <span className="cursor-default">Configurações</span>
          <span className="cursor-default">Ajuda</span>
        </nav>
        <div className="flex-1" />
        <button className="flex items-center gap-2 text-sm">
          <LogIn className="w-4 h-4" />
          <span className="font-medium">Conectar CondoNet</span>
        </button>
        <div className="flex items-center gap-3 ml-4 text-white/80">
          <Minus className="w-4 h-4" />
          <Square className="w-3.5 h-3.5" />
          <XIcon className="w-4 h-4" />
        </div>
      </div>

      {/* Tab bar (shrink-0 impede que a barra encolha) */}
      <div className="h-11 shrink-0 border-b bg-background flex items-center px-3 gap-2">
        <Link
          to="/"
          className={cn(
            "w-9 h-9 rounded hover:bg-muted flex items-center justify-center",
            path === "/" && "bg-muted",
          )}
        >
          <Home className="w-4 h-4 text-primary" />
        </Link>

        {tabs && tabs.length > 0 ? (
          tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={tab.onClick}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card text-sm",
                tab.active
                  ? "border-primary/40 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
              )}
            >
              {tab.icon}

              <span>{tab.label}</span>

              {tab.onClose && (
                <span
                  role="button"
                  tabIndex={0}
                  className="text-muted-foreground hover:text-foreground ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    tab.onClose?.();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      tab.onClose?.();
                    }
                  }}
                >
                  <XIcon className="w-3.5 h-3.5" />
                </span>
              )}
            </button>
          ))
        ) : (
          openTab && (
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card text-sm",
                path === openTab.to && "border-primary/40",
              )}
            >
              <Phone className="w-4 h-4 text-primary" />
              {openTab.label}
              <Link to="/" className="text-muted-foreground hover:text-foreground ml-2">
                <XIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          )
        )}
      </div>

      {/* Área do conteúdo (ocupa 100% do espaço restante) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">{children}</div>
    </div>
  );
}
