# Padronização Visual

## Princípios
Mobile-first (largura máxima 480px), cantos generosos, hierarquia tipográfica clara e
contraste AA. Nenhuma cor literal em componentes: tudo por token semântico em `src/styles.css`.

## Cores (tokens OKLCH)
| Token | Uso |
| --- | --- |
| `--background` / `--foreground` | Fundo e texto base |
| `--primary` (teal profundo) | Ações principais, navegação ativa, ícones-chave |
| `--secondary` | Superfícies suaves, chips, campos |
| `--accent` (coral) | Destaques humanos, IA, chamadas de atenção |
| `--destructive` | Erros bloqueantes, exclusão |
| `--success` / `--warning` / `--info` | Estados semânticos |
| `--risk-low` / `--risk-medium` / `--risk-high` | Selo de risco do aluno |
| `--chart-1..5` | Séries de gráficos (recharts) |

Dark mode via `.dark` (`@custom-variant dark`). Nunca usar `text-white`, `bg-black` ou `bg-[#hex]`.

## Tipografia
Escala Tailwind: `text-[10px]` (metadados), `text-[11px]` (apoio), `text-xs` (secundário),
`text-sm` (corpo), `text-base` (títulos de tela), `text-lg/xl` (números de destaque).
Pesos: `font-medium` para rótulos, `font-semibold` para títulos, `font-bold` só em KPIs.

## Espaçamento e raio
- Padding horizontal padrão de tela: `px-5`; vertical `pt-4 pb-8`.
- Espaçamento entre cards: `space-y-3`; dentro do card: `space-y-2`.
- Raio: `--radius: 1rem`; cards `rounded-2xl`, campos/botões `rounded-xl`, chips `rounded-lg`.
- Altura de toque mínima: 44px (`h-11` em ações primárias, `h-10` em campos).

## Ícones
`lucide-react`, tamanho `size-4` (inline), `size-5` (navegação), `size-8` (estado vazio),
`strokeWidth` 2 (2.5 quando ativo).

## Componentes
shadcn/ui em `src/components/ui`. Componentes compartilhados do produto:
`MobileShell`, `RiskBadge`, `ApiStatusBadge`, `OrgScopeFilter`, `ErrorRetry`.
