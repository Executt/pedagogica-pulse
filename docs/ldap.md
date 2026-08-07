# LDAP — Configuração e Mapeamento

## Objetivo
Autenticar servidores da Secretaria com a identidade corporativa, mantendo
papéis pedagógicos no banco da aplicação.

## Modo recomendado
Federar via provedor de identidade compatível com SAML/OIDC apoiado no diretório
(ex.: AD FS, Entra ID, Keycloak com federação LDAP). O app consome apenas o IdP.

## Parâmetros
| Parâmetro | Exemplo |
| --- | --- |
| Host | `ldaps://ldap.educacao.municipio.gov.br:636` |
| Base DN | `dc=educacao,dc=municipio,dc=gov,dc=br` |
| Bind DN de serviço | `cn=svc-inteligencia,ou=servicos,dc=...` |
| Filtro de usuário | `(&(objectClass=user)(sAMAccountName={login}))` |
| Filtro de grupo | `(&(objectClass=group)(member={dn}))` |
| TLS | Obrigatório (LDAPS ou StartTLS) |

## Mapeamento de atributos
| LDAP | Aplicação |
| --- | --- |
| `mail` | e-mail de login |
| `displayName` / `cn` | `profiles.full_name` |
| `thumbnailPhoto` | `profiles.avatar_url` (opcional) |
| `department` / `ou` | unidade organizacional sugerida (`org_units.code`) |
| `employeeNumber` | matrícula funcional (metadado) |
| `memberOf` | papel sugerido em `user_roles` |

## Mapeamento de grupos → papéis
| Grupo LDAP | `app_role` |
| --- | --- |
| `SME-SUPERADMIN` | `superadmin` |
| `SME-SECRETARIA` | `secretario` |
| `SME-SUBSECRETARIA` | `subsecretario` |
| `SME-REGIONAL-<sigla>` | `gestor_regional` (org_unit correspondente) |
| `SME-DISTRITO-<sigla>` | `gestor_distrital` |
| `ESCOLA-<INEP>-DIRECAO` | `diretor` (school_id do INEP) |
| `ESCOLA-<INEP>-PEDAGOGO` | `pedagogo` |
| `ESCOLA-<INEP>-DOCENTE` | `professor` |

## Provisionamento
Sincronização diária: criar/atualizar `profiles` e reconciliar `user_roles`.
Remoção de grupo implica remoção do papel; toda alteração aparece em `audit_log`.
Contas sem grupo mapeado entram sem papel e não enxergam dados.
