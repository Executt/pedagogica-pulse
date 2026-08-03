# Arquitetura — Inteligência Pedagógica

## Camadas

```text
src/
  domain/          entidades, tipos e regras puras (education/…)
  application/
    ports/         interfaces de repositório
    use-cases/     casos de uso
  infrastructure/
    supabase/      repositórios concretos (Data API + RLS)
    mock/          repositórios fake (modo demo)
    container.ts   composition root
  hooks/           adaptação dos casos de uso para React Query
  components/      Design System e blocos de UI
  routes/          telas (_authenticated/*) e API (api/public/pulse/* = v0)
```

## Regras permanentes

1. UI → hook → caso de uso → port → repositório. Sem atalhos.
2. Nenhum componente importa Supabase ou mock-mode diretamente.
3. Toda integração externa passa pelo Integration Hub (ADR-002).
4. Autorização sempre via RLS + funções `SECURITY DEFINER`; nunca papel gravado em `profiles`.
5. Migrations aditivas; nada de `DROP` sem migração de dados verificada.

## Resiliência de leitura

`useSmartQuery` + `api-health` implementam circuit breaker (3 falhas → 5 min de cooldown) com
fallback automático para o repositório mock, e `query-persist` mantém cache local de 24h.

## Estado da evolução

Consulte `docs/CHANGELOG.md` e o plano diretor em `.lovable/plan/`.
