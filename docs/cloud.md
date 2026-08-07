# cloud.md — Configuração de Nuvem

## Componentes
Banco Postgres gerenciado, autenticação, storage e execução serverless de
server functions/rotas HTTP no runtime de edge.

## Ambientes
- Preview: build contínuo do branch de trabalho.
- Produção: publicação manual.

## Variáveis e segredos
Cliente: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (geradas, não editar).
Servidor: `PULSE_API_URL`, `PULSE_API_TOKEN`, `PULSE_INGEST_URL`, `PULSE_INGEST_TOKEN`,
`LOVABLE_API_KEY`. Chave de serviço e senha do banco não são acessíveis.

## Storage
Bucket `materials` (privado). Política de acesso por escopo de escola.

## Migrations
Toda mudança de schema é uma migration aprovada; dados são carregados por operação
de inserção, nunca em migration de estrutura (exceto seed inicial documentado).

## Limites operacionais
Payload de upload 20 MB; cache de consultas persistido por 24h no dispositivo;
refetch em segundo plano a cada 3 minutos quando o modo demo está desligado.
