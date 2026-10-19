# Проверка и доработка Preview — 19 октября 2026

База: `33bb9319ef9c28123d68913c78bad51a18d6c5be`.
План владельца принят как требования, не как свидетельство выполнения.
`main` повторно проверен: `f68ee6d1c70d115be90e6931434c24acbd3f9fd2`.
Других работающих агентов нет. Незакоммиченные файлы прежнего сеанса не менялись.

## Изменения GitHub

| Коммит | Изменённые файлы и назначение |
| --- | --- |
| `4b05f7b` | `lib/tournament-filters.ts`, `.test.mjs`, `lib/hub-types.ts`: фильтр реальных записей и тип отдельного счёта пенальти |
| `cd906c1` | `lib/tournament/engine.ts`, `.test.mjs`, `result-form.ts`, `result-form.test.mjs`: голы FC, пенальти, совместимость, проверки |
| `09e4483` | `components/hub/GameFilter.tsx`, `HubPanel.tsx`, `TeamsDirectory.tsx`, `TournamentEngine.tsx`: переключатель, URL, результаты и честный статус FC |
| `3ea7370` | `app/api/tournament-engine/route.ts`: отдельные числовые результаты пенальти |
| `83cc67e` | `app/api/hub/route.ts`: передача пенальти и размер состава FC=1 для новых турниров |
| `06bec57` | `maintenance/tests/game-filter.cjs`: доступный серверный рендер RU/EN |
| `cbc001b` | `docs/deafhub-development-plan.md`, `deafhub-status.md`, `tournament-engine.md`: план и доказательный реестр |

До финального документа все 17 опубликованных файлов побайтово сравнены с локальными.
Не изменены: main/production, SQL/права/учётные записи, финансы, фирменные цвета,
глобальные фон/волны/заставка/Canvas/Lenis, старые образцы и flip-карточки.

## Проверки

```sh
node --test lib/tournament/engine.test.mjs lib/tournament/result-form.test.mjs lib/tournament-filters.test.mjs maintenance/tests/team-directory.cjs maintenance/tests/game-filter.cjs
npx tsc --noEmit
npx eslint components/hub/GameFilter.tsx components/hub/HubPanel.tsx components/hub/TournamentEngine.tsx components/hub/TeamsDirectory.tsx lib/tournament-filters.ts lib/tournament/engine.ts lib/tournament/result-form.ts app/api/hub/route.ts app/api/tournament-engine/route.ts lib/hub-types.ts
npm run build -- --webpack
node scripts/tournament-operations-smoke.mjs
git diff --check
```

Результат: 63 теста = 44 движка + 4 формы результата + 6 фильтра/URL + 2 SSR RU/EN
+ 7 команд. Ошибок нет. Отдельно 6 HTTP-проверок гостевой авторизации/Origin прошли.
TypeScript, ESLint, diff check и сборка прошли; Next сгенерировал 22 страницы.
Последующая Vercel-сборка `cbc001b` также Ready.
Предупреждение Node о типе модулей в package.json не менялось вне задачи.

Проверенный адрес:
https://deafhub-89cs2zrdf-ionas-projects-019510f8.vercel.app/tournaments?game=fc

Браузер: каждая игра выбирается; URL и aria-pressed совпадают; Назад восстанавливает
CS2, Enter выбирает FC, reload сохраняет FC. Проверены обе локали и гостевая защита.
Проверка выполнена в настольном viewport. Логика фильтрует поданный список серверных
записей в локальных тестах; подмены API/публикации демо-турниров не было.

## Подтверждённые ограничения

- 100 участников по-прежнему отклоняются: лимит 64 в движке, API и SQL.
  Тест отказа не означает поддержку 100 игроков.
- В схеме индивидуальная заявка FC ещё привязана к team_id: отдельного пути нет.
  UI не предлагает искусственную команду для FC; прямой индивидуальный путь не готов.
- Новый FC использует один матч (голы + решающие пенальти); серии нескольких
  футбольных матчей BO3/BO5 не реализованы. Исторические FC сохраняют BO-семантику.
- MCP чтения проекта `hvxvwgnnmazpptuenidv` вернул отказ по правам. Dashboard
  перенаправил на вход. Миграции, живые RLS/CAS/награды и авторизованный E2E
  в этом сеансе не проверены. SQL и реальные данные не менялись.
- Не подтверждены реальный мобильный экран, доступность РФ/Беларуси,
  производительность на устройстве пользователя и закрытые состояния всех ролей.

## Следующая работа

Сначала восстановить авторизованный доступ к нужному Supabase и проверить
актуальную схему/окружение Preview. Затем отдельно реализовать индивидуальные
заявки FC и согласованно увеличить вместимость с транзакционными проверками,
тестами 100 участников и откатом QA-данных. Производительность сначала измерить.
Остальной актуальный реестр — `docs/deafhub-status.md`, четыре секции без дублей.


## Обновление после восстановления доступа, 19 октября

Владелец выполнил ручной вход. Dashboard подтверждает аккаунт deafast и проект
DeafHub hvxvwgnnmazpptuenidv; подключение nagato доступно. Прежняя блокировка снята.
Списки объектов/RLS и права RPC проверены чтением системных каталогов.
`db/tournament-operations-check.sql` повторно выполнен успешно в транзакции,
с завершением ROLLBACK. Итог: PASS; qa_users_removed=true,
qa_tournaments_removed=true. Пройдены проверки условий/допуска, мест/наград,
снимков профилей/команд/аватаров, повторной выдачи, отзыва, защиты исправлений,
приватности и запрета выдачи посторонним. Это SQL-проверка, не браузерный E2E.
История миграций по-прежнему пуста; схема не изменялась.
