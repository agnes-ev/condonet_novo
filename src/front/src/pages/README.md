# Pages

Cada tela do app tem um arquivo aqui — um arquivo por tela, nome = nome da tela.

Convenção:
- Toda nova tela vira `src/pages/<NomeDaTela>Page.tsx`.
- Esse arquivo é o ponto de entrada da tela. Pode conter o componente direto
  ou re-exportar de `src/components/...` quando a tela compartilha estado com
  outras (ex.: sub-abas de Programações do PABX).
- Rotas em `src/routes/` importam sempre de `@/pages/...`, nunca direto de
  `@/components/...`.

Telas atuais:
- `WelcomePage.tsx` — tela inicial (rota `/`).
- `ProgramacoesPage.tsx` — Programações do PABX (rota `/programacoes`),
  container com sub-abas.
- `RamaisPage.tsx` — sub-aba "Ramais".
- `RamaisEspeciaisPage.tsx` — sub-aba "Ramais especiais".