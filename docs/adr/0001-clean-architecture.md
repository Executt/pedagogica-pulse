# ADR-001 — Clean Architecture como base da evolução

Data: 2026-08-03 · Status: Aceito

## Contexto
O projeto nasceu como app mobile-first com acesso direto ao banco a partir das telas e uma
segunda fonte de dados (mock local) embutida nos componentes. A evolução para plataforma
corporativa da Secretaria exige múltiplas origens de dados, RBAC hierárquico e integrações
externas, o que torna o acoplamento atual insustentável.

## Decisão
Adotar Clean Architecture com quatro camadas:

- `src/domain` — entidades e regras puras (sem React, sem Supabase).
- `src/application` — casos de uso e ports (interfaces de repositório).
- `src/infrastructure` — adaptadores concretos (Supabase, Mock, IA, Integration Hub) e composition root.
- `src/hooks` / `src/components` / `src/routes` — camada de interface (UI e HTTP).

Fluxo obrigatório: **UI → hook → caso de uso → port → repositório**.
Nenhum componente novo pode importar `@/integrations/supabase/client` ou `@/lib/mock-mode`.

## Consequências
- O modo demo deixa de ser um `if` nas telas e passa a ser a escolha de um adaptador.
- Regras de negócio ficam testáveis sem DOM e sem banco.
- Custo: uma indireção a mais por leitura; aceitável frente ao ganho de isolamento.
