# Administração

Credencial padrão de superadministrador: `admin@ana.gov.br`.
Trocar a senha no primeiro acesso e habilitar MFA.

## RBAC — passo a passo
1. Entrar como superadmin.
2. Criar/confirmar o usuário em `/auth`.
3. Atribuir papel em `user_roles` com `school_id` (escopo escola) ou `org_unit_id`
   (escopo rede/regional/distrito).
4. Validar em `/escolas` se o usuário enxerga apenas o escopo esperado.
5. Conferir o registro em `/admin/auditoria`.

## MFA — passo a passo
1. Autenticação → habilitar MFA (TOTP) para o projeto.
2. Exigir MFA para papéis `superadmin`, `secretario` e `subsecretario`.
3. Usuário registra o app autenticador no primeiro login após a ativação.
4. Guardar códigos de recuperação em cofre institucional.

## SMTP
1. Obter host, porta (587/STARTTLS), usuário e senha do provedor institucional.
2. Configurar o SMTP customizado na autenticação do projeto.
3. Definir remetente `nao-responda@<dominio-da-secretaria>`.
4. Publicar SPF, DKIM e DMARC no DNS.
5. Testar recuperação de senha e confirmação de cadastro.

## LDAP / Active Directory
Ver `ldap.md`.

## SEI (processo eletrônico)
1. Solicitar credenciais da API do SEI (usuário de serviço + chave).
2. Cadastrar `SEI_API_URL` e `SEI_API_TOKEN` como segredos de servidor.
3. Anexar o CSV de importações ao processo correspondente pela rotina semanal.
4. Registrar o número do processo no campo de descrição do material relacionado.

## WhatsApp / Microsoft Teams
1. WhatsApp Business Cloud API: registrar número, obter `WHATSAPP_TOKEN` e
   `WHATSAPP_PHONE_ID`; usar templates aprovados para avisos a responsáveis.
2. Teams: criar Incoming Webhook no canal da secretaria e salvar `TEAMS_WEBHOOK_URL`.
3. Enviar notificações apenas por server function; nunca do cliente.
4. Não incluir dados pessoais de aluno no corpo da notificação — apenas identificador
   e link para a ficha autenticada.

## Rotação do token de integração
Perfil → Integração → editar token → salvar. O status é invalidado e o teste de
conexão é reexecutado automaticamente. Rotacionar também no sistema web.
