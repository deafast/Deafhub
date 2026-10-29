# Локальная функциональная приёмка — 29.10.2026

Это выполнение SQL/RPC в изолированном PGlite0.5.10, без сети, hosted Supabase, ключей и реальных данных. Auth.uid/роли эмулируются локально. Это не настоящая браузерная/почтовая/Realtime-приёмка.

## Исправлено в стенде

- SQL из Windows checkout нормализуется CRLF→LF только перед локальным выполнением. Иначе md5(pg_get_functiondef) не совпадал с защищённым baseline и стенд останавливался. Защитные проверки и файлы миграций не менялись.
- bronze-db-local поддерживает DEAFHUB_PGLITE_PATH; зависимости приложения не менялись.
- local-engine-http-check подключает фактический lib/request-body.ts через существующий test-support, который отсутствовал в устаревшем resolver стенда.

## Выполнено успешно

| Сценарий | Результат |
|---|---|
| maintenance/lfp-db-check.cjs | Opt-in, капитан, приватность, принятие, дубли, отзыв, grants, пагинация2000объявлений PASS |
| scripts/local-checkin-sql-check.mjs |23проверки: личная готовность, RLS/ACL, версии, состав, идемпотентность, запрет после запуска, audit, rollback |
| scripts/local-results-sql-check.mjs |17проверок: два подтверждения, спор, судья, запрет собственного решения, исправление, replay, audit, rollback |
| scripts/local-schedule-sql-check.mjs | Запись расписания, один audit, повторы, stale revision, чужой организатор, запрет прямого RPC PASS |
| scripts/local-auto-admission-check.mjs |24проверки: opt-in, точный состав, условия, организатор, версии, отключение, launch lock, ACL, rollback |
| scripts/local-history-sql-check.mjs | CAS/replay/повтор ключа/чужой организатор;523собственных матча по страницам, исключение чужих и назначенных, приватность audit, ACL, rollback PASS |
| scripts/bronze-db-local.mjs | Базовые миграции, legacy и отдельная бронза, правило формата, места1/2/3, дубли наград, запрет исправлений, rollback PASS |
| scripts/local-fc-sql-check.mjs | Auth, условия, игра, уровни, собственные snapshots, отсутствие фиктивных команд, RLS, индивидуальные награды и отсутствие дублей PASS |
| scripts/local-legacy-confirmation-check.mjs |15проверок запрета обхода RPC/прямой записи, opt-out, launch lock, исторический счёт, ACL/RLS, rollback |
| scripts/local-engine-http-check.mjs | Настоящий API handler + localhost HTTP + реальный локальный RPC:12разных одновременных запросов→1success/11conflict;12одинаковых ключей→одна revision/audit;подмена payload409,чужой организатор403;rollback |

Локальные данные откатываются/удаляются при закрытии изолированных БД. Полные сценарии пункта1/2/3/4/11/12 не объявлены завершёнными: требуется ранее согласованная hosted-приёмка, временно остановленная последующим запретом владельца.

## Повторный запуск

Установленная изолированная зависимость находится в node_modules/.cache/deafhub-sql-qa/node_modules/@electric-sql/pglite. Перед запуском любого указанного файла задать DEAFHUB_PGLITE_PATH абсолютным путём к этому каталогу и запустить node <путь>. Чтение SQL идёт из корня E:\DEAFHUB. pnpm/package.json приложения не изменялись. Это10групп проверок, а не10закрытых продуктовых задач;523матча — тестовая выборка, не523теста.
