import { createFileRoute } from "@tanstack/react-router";
import { WelcomePage } from "@/pages/WelcomePage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CTI HDL" },
      { name: "description", content: "CTI HDL — central de comunicação CondoNet." },
      { property: "og:title", content: "CTI HDL" },
      { property: "og:description", content: "CTI HDL — central de comunicação CondoNet." },
    ],
  }),
  component: Index,
});

function Index() {
  return <WelcomePage />;
}
