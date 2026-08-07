# Schema do Banco

## org_units
`id`, `parent_id → org_units.id`, `type` (secretaria|subsecretaria|regional|distrito),
`name`, `short_name`, `code`, `active`, `created_at`, `updated_at`.
Trigger anti-ciclo na hierarquia.

## schools
`id`, `org_unit_id → org_units.id`, `name`, `city`, `inep_code`, `cnpj`, `address`,
`district`, `postal_code`, `state`, `phone`, `email`, `latitude`, `longitude`,
`modalities[]`, `shifts[]`, `capacity`, `active`, timestamps.

## profiles
`id → auth.users.id`, `full_name`, `avatar_url`, timestamps.

## user_roles
`id`, `user_id → auth.users.id`, `role` (app_role), `school_id → schools.id`,
`org_unit_id → org_units.id`, `created_at`. Papéis nunca ficam em `profiles`.

## classes
`id`, `school_id → schools.id`, `name`, `grade`, `year`, `teacher_id → auth.users.id`.

## students
`id`, `class_id → classes.id`, `full_name`, `avatar_url`, `birthdate`, `guardian_name`,
`guardian_contact`, `has_pei`, `risk` (low|medium|high), `attendance_rate`.

## observations
`id`, `student_id → students.id`, `author_id`, `type` (text|audio|image), `content`,
`media_url`, `sentiment`.

## materials
`id`, `school_id`, `class_id`, `student_id`, `uploader_id`, `name`, `description`,
`url`, `mime_type`, `size_bytes`, `tags[]`, `time_range_start`, `time_range_end`,
`duration_seconds`, `synced_at`, `external_id`, `sync_error`.

## ai_suggestions
`id`, `school_id`, `class_id`, `student_id`, `type`, `title`, `description`,
`status` (pending|applied|scheduled|discarded), `feedback`, `handled_by`, `handled_at`.

## announcements / events
`announcements`: `school_id`, `author_id`, `title`, `body`.
`events`: `school_id`, `class_id`, `student_id`, `creator_id`, `title`, `description`,
`location`, `starts_at`, `ends_at`.

## import_runs
`id`, `user_id`, `file_name`, `total_detected`, `inserted_count`, `updated_count`,
`skipped_count`, `units_count`, `issues` (jsonb), `created_at`.

## audit_log
`id`, `actor_id`, `entity`, `entity_id`, `action`, `field`, `old_value`, `new_value`,
`metadata` (jsonb), `created_at`.

## Integração
`configuracoes_integracao` (`key`, `value`, `updated_by`) e `logs_integracao`
(`direction`, `resource`, `method`, `status`, `signature_ok`, `ts_used`, `nonce_used`, `error`).
