import { Link } from "@tanstack/react-router";
import { LogIn, Settings } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export function WelcomePage() {
  return (
    <AppShell>
      <div className="relative h-full flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[hsl(210,40%,98%)] to-[hsl(210,45%,94%)]">
        <svg
          className="absolute bottom-0 left-0 w-full text-primary/20 pointer-events-none"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <path
              key={i}
              d={`M0,${180 + i * 18} C360,${120 + i * 18} 1080,${260 + i * 18} 1440,${160 + i * 18}`}
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              opacity={0.5 - i * 0.06}
            />
          ))}
        </svg>

        <div className="relative h-full flex-1 flex flex-col items-center justify-center px-6 text-center z-20">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">
            <span className="text-primary">Boas-vindas ao</span> <span className="text-foreground">CTI HDL</span>
          </h1>
          <p className="mt-8 max-w-3xl text-muted-foreground text-lg leading-relaxed">
            Gerencie e configure sua central de comunicação de forma rápida e intuitiva. Acompanhe chamadas e otimize
            seu sistema de comunicação sem complicações.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <button className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
              <LogIn className="w-4 h-4" /> Conectar CondoNet
            </button>
            <Link
              to="/programacoes"
              className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-card text-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/5 transition-colors"
            >
              <Settings className="w-4 h-4 text-primary" /> Nova Programação
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
