# Inventário de Funcionalidades

## Identidade e acesso
Login/cadastro, perfil e onboarding, papéis hierárquicos, superadmin.

## Rede e hierarquia
Cadastro de unidades (Secretaria→Regional→Distrito), escolas com INEP/CNPJ,
filtro hierárquico nas listas de escolas, turmas e alunos.

## Pedagógico
Turmas com indicadores, ficha do aluno (risco, frequência, PEI), observações
(texto/áudio/imagem), curadoria de sugestões de IA com aceite/descarte.

## Registros
Upload por câmera, galeria, áudio e documento; pré-visualização com validação de
tipo/tamanho/duração; intervalo de tempo do trecho; catálogo pesquisável;
sincronização automática com o sistema web e selo de status.

## Comunicação
Agenda de eventos e comunicados por escola.

## Administração
Importador inteligente de PDF (extração, validação, revisão manual editável,
ações em lote por tipo de inconsistência ou hierarquia, comparação lado a lado
PDF × base, confirmação final), histórico de importações com exportação CSV,
trilha de auditoria, configuração e rotação de token de integração, diagnóstico.

## Plataforma
Modo demo com dados mockados, exportação/importação de cenários JSON, paginação
incremental, retry com fallback, circuit breaker e cache persistente.
