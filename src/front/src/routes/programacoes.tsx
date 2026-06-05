import { createFileRoute } from "@tanstack/react-router";
import { ProgramacoesPage } from "@/pages/ProgramacoesPage";

export const Route = createFileRoute("/programacoes")({
  head: () => ({
    meta: [
      { title: "Programações do PABX" },
      {
        name: "description",
        content: "Configuração de ramais do PABX CondoNet.",
      },
    ],
  }),
  component: () => <ProgramacoesPage />,
});