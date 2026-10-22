# Рабочий журнал DeafHub

## Границы работы
Репозиторий deafast/Deafhub, только preview/deafhub-setup. Не изменять main, production, дизайнерские образцы и финансовый модуль. Изучать сначала git status и git diff; сравнивать с актуальной удалённой Preview, а не старой локальной базой. Не сбрасывать рабочее дерево: часть уже опубликованного кода остаётся локально незакоммиченной.

## Изученные пути
- lib/tournament/engine.ts — подтверждённое состояние групп, Single/Double, BYE, Forfeit и переходы.
- components/hub/TournamentBracket.tsx — верхняя/нижняя сетки, финалы и связи матчей; TournamentEngine.tsx — группы/квалификация и формы результатов.
- app/tournaments/demo/TournamentDemo.tsx — вычисляемый read-only образец, Double по умолчанию; фиктивные команды не записываются в базу.
- components/auth/EmailAuth.tsx, EmailConfirmationPending.tsx — регистрация и ожидание подтверждения, провайдеры почты, повторная отправка с паузой.
- lib/auth/email-confirmation.ts — разрешённые домены почты, callback и cooldown.
- app/auth/callback/route.ts — PKCE, recovery, Steam и переход после email; app/auth/email-confirmed/page.tsx — серверная проверка подтверждения.
- supabase/templates/confirm-signup.html — RU/EN, настоящий логотип, неизменённая ConfirmationURL, inline CSS и необязательные адаптивные media queries.
- app/auth/email-preview/route.ts — только Preview/development, безопасная демонстрационная ссылка.
- docs/email-confirmation.md — настройки, доказательства и ограничения; docs/deafhub-status.md — основной реестр; docs/deafhub-development-plan.md — согласованный план.

## Проверенные результаты на 19 октября 2026
До последних текстовых правок: 106 тестов, TypeScript, ESLint и Next webpack build прошли. После редактуры текста письма: 24 email-теста прошли. Изменения a48957e / 239faa9 / 6d31355 побайтово сверены с GitHub.
Resend: preview-mail.deafhub.cc подтверждён; в Porkbun добавлены три записи только тестового поддомена, исходные A и www CNAME сохранены. Образец 01a1537c-60c5-720f-a7ea-3792bc2083b1 получил Delivered после редактуры текста. Полное подтверждение регистрации этим не проверялось.
SMTP Supabase выключен; ключ Resend не создан, реальные шаблоны Supabase не изменены. Vercel NEXT_PUBLIC_SUPABASE_URL hvxvwgnnmazpptuenidv задан для Preview; Site URL и два callback также Preview.

## Текущая доработка
Адаптивное письмо: основной текст 16 px, вспомогательный 14 px; до 600 px поля 20 px, логотип 190 px и заголовок 26/34; до 380 px заголовок 24/32. Без поддержки media queries остаётся гибкая таблица max-width 600 px и inline CSS. Не считать суженный браузерный образец реальным тестом Gmail/Mail.ru на телефоне.

## Следующий сеанс
Проверить status/diff и удалённый SHA. Открывать только изменённые участки и связанные зависимости; обязательные проверки прав, токенов и логики не пропускать. SMTP, настоящие ссылки регистрации, Mail.ru/Outlook и мобильные клиенты остаются незавершёнными; FC 100 игроков и solo-регистрация — также. Подробный реестр в deafhub-status.md.

## Steam / история — 19 октября, база 3a04ed4
Полностью прочитаны plan/status/01/02; выполнено сравнение с актуальным кодом. Старое дерево Deafhub-review сохранено; работа в отдельном Deafhub-steam. Доступ Git push без credentials не работает; авторизованная загрузка через GitHub browser, только Preview.
Изучены lib/steam/openid.ts, app/auth/steam/{route,callback/route,status/route}.ts, app/profile/page.tsx, PlayerDashboard, api/hub, hub-types, competition.sql. Новые lib/steam/link.ts (insert-only claim), profile.ts (официальный fixed-host API, закрытые профили, минимальные поля), app/api/steam-profile/route.ts (собственный ID через getUser/RLS), SteamProfile.tsx (RU/EN), lib/hub-history.ts (finished + snapshot + сортировка/даты). HubPanel — ссылки на турнир, без вымышленных счёта/даты.
Опубликованы 3c99f22 / abec775 / 88e3a3e / 52dffcc / 62f36ca / 2138034 / 67552e0; девять исходников побайтово сверены. 119 тестов (106 прежних + 12 новых + существующий Steam OpenID runner), tsc, ESLint изменённых TS/TSX, diff check, next build --webpack: PASS. React checklist: хуки без условных вызовов, AbortController cleanup, key SteamID, без синхронного setState в effect; серверный ключ не передаётся клиенту, реальные внешние значения не имитируются.
Read-only Supabase: RLS steam_accounts/steam_nonces, единственный SELECT policy self, PK steam_id / UNIQUE user_id; клиентских прав записи нет. Данные и настройки не менялись. Vercel search all env: STEAM/FACEIT — нет ключей. API login enabled true, Web API key отсутствует. FACEIT defer. Официальные URL и ограничения — steam-and-match-history.md.
Vercel 67552e0: Ready; browser /profile гостевой redirect, API Sign in required, steam/status enabled true linked false. Живого Steam E2E, public/private profile API и мобильного авторизованного QA нет. Не считать их завершёнными. main f68ee6d без изменений. Документы 01/02 внесены в реестр; четыре больших аудита из 01 не запускались.

## 21 октября: FC по уровням, база e626d86
Владелец возобновил только заявку/уровень/направление групп: 1 сильный + 2 средних, остальные случайно. Вместимость 100 остаётся отложенной, предел 64 не менялся. Новое дерево Deafhub-fc-seeding; предыдущие рабочие деревья не сбрасывались.
Пути: lib/tournament/fc-levels.ts (типы/подписи), fc-groups.ts (crypto server draw), API hub register_fc → hub_register_fc, engine launch берёт approved skill_level из БД. HubEntry nullable team + player snapshot; FcRegistrationForm в существующем HubPanel; TournamentEngine описывает жеребьёвку, дополнительные варианты групп. Награды: текущая hub_ops_action теперь LEFT JOIN команды, пустое имя вместо выдуманной команды. Миграции 20261021094215 / 20261021094734 применены и read-only сверены, RLS/ACL не расширялись до anon.
142 теста, tsc, ESLint, diff check, webpack build PASS. Изолированный SQL: scripts/local-fc-sql-check.mjs и db/fc-registration-check.sql PASS, регистрация+награды+rollback. PGlite 0.5.10 установлен только в /tmp/deafhub-sql-qa, зависимостей сайта не добавлено. Удалённые фикстуры отклонены auto-review, не обходить; реальных FC-турниров 0, авторизованный E2E и мобильный QA не подтверждены.
Preview a2e839d Ready; /tournaments/demo теперь также показывает FC-форму без отправки и четыре группы 1+2+1, RU/EN/выбор уровня проверены браузером. /api/hub гостю Sign in required; manifest 192/512 подтверждён. Подробности fc-registration-and-groups.md. main f68ee6d прежняя, production/Claude/финансы не менялись. Остальные отложенные задачи не возобновлять без указания.

## 21 октября: полный архив и зависимости, база e4a2151
Рабочее дерево Deafhub-history. Путь профиль → MatchHistory → api/match-history → hub_player_match_history. Новые lib/match-history{,-cursor}.ts; scoped api/hub для глубокого перехода. Миграция 20261021111817 применена и ACL read-only проверены, без remote fixtures. Изолированные scripts/lib/local-postgres.mjs, local-history-sql-check.mjs и db/player-match-history-check.sql; FC runner использует общий bootstrap. Полные детали match-history-pagination.md.
154 теста, tsc, ESLint изменённых TS/TSX, Next 16.4.2 webpack build, diff check, оба SQL runner PASS. История523 собственных/600 чужих, CAS последовательные stale/replay/key/owner PASS. Это не конкурентный HTTP и не авторизованный E2E. Сборка выявила optional NextRequest у GET: исправлен обязательный аргумент; обновлённый lint выявил async-state путь HubPanel: переписан на обработчики Promise, добавлена защита устаревших ответов.
Официальный Next/eslint16.4.2, совместимый audit fix без force; prod audit0, общий5high dev-цепочка braces. Код ecd0c9c0764a379b8019536def55c5d9102281c8, 16 файлов побайтово сверены. Старые рабочие деревья/node_modules не изменены, новое дерево имеет отдельную установку. main/production/дизайн/финансы и отложенные функции не изменялись.

Preview ecd0c9c: Vercel Ready; браузер API истории гостю Sign in required, турнирный demo открывается. Полный авторизованный E2E не выполнен.

## 21 октября: малая доработка истории, база e816245
Исправлен только components/hub/MatchHistory.tsx: ответ401 очищает page/nextCursor; Retry использует сохранённый cursor сбойного запроса, уже загруженные страницы не сбрасываются. Добавлен maintenance/tests/match-history-interactions.cjs: RU/EN expiry, next-page503→retry→dedup и unmount/abort. Реальные React hooks проверяются react-test-renderer19.2.3 (пин dev-only; пакет помечен deprecated, это не браузерный E2E). Общий набор158PASS, ESLint компонента, webpack build, tsc и diff check PASS. Регрессия на исходном компоненте:3FAIL/1PASS; исправленный:4PASS. Код70338c9, тесты2d2dc70, dev dependency451d70a; четыре файла побайтово сверены. Схема/данные/auth-настройки/design/main/production не менялись. Большой пункт реальной авторизованной приёмки остаётся открытым.

Preview малой доработки `2d2dc704cbfb5c4049be6f86abe44ad1e675b889`: Vercel Ready. Авторизованный браузерный E2E не заявлен.

## 22 октября: расписание/realtime + сверка схемы и параллельного HTTP
База7e5b6fc, восстановлена свежая рабочая копия после очистки scratch. Никаких повторных auth-запросов владельцу. Публикация кода расписания/realtime доe2f1d71: engine.ts Command schedule + UTC validation; API zod/organizer/CAS; MatchSchedule; updates.ts scoped callbacks/fallback/cleanup; TournamentEngine monotonic revision/abort. Миграция20261022053120 применена, RLStrue/anonfalse/authtrue. Демо локальное, не пишет БД. 170 тестов/tsc/lint/build/diff PASS, отдельный SQL schedule PASS. Реальный Realtime в двух авторизованных окнах не проверен, пункт остаётся открытым.
Закрыта техническая сверка схемы/истории/CAS HTTP: 220 structural records идентичны, пять миграций совпадают, bronze filename приведён к20261019050333 без смены SQL/переисполнения. HTTP handler через NextRequest/NextResponse и изолированный PGliteRPC:12unique=>1success11conflict;12samekey=>1revision/audit;changedpayload409;foreign403. Auth тестовый адаптер, SQLодно подключение, hosted нагрузка не заявлена. Прошли schedule/FC/history SQL rollback. Paths: db/hub-schema-snapshot.sql, scripts/local-schema-snapshot.mjs, compare-hub-schema.mjs, local-engine-http-check.mjs, docs/checks/2026-10-22-hub-schema.json. Подробности migration-verification.md и tournament-schedule-realtime.md. main/production UI/финансы/Claude не редактировались.

Браузер Preview e9d6ad0 Ready: в явно локальном демо проверены назначение01.11 18:30UTC, перенос02.11 20:15UTC, RU/EN, отмена и сброс при перезагрузке. Это не живая подписка двух аккаунтов.

## 22 октября — check-in и протоколы
- Отдельный worktree `/workspace/scratch/cc7f06ba3151/deafhub-readiness` от `1e4e1ed`; прежнее дерево сохранено. Новые API `tournament-checkin` / `tournament-results`; UI `TournamentCheckin.tsx` / `TournamentResults.tsx` внутри Operations. Engine API принимает понятные ошибки новых guards.
- Две опциональные hosted-миграции `20261022062526` / `20261022062542`: личная готовность, scoped referee, приватные протоколы/голоса/обоснование решения, deferred CAS result guard. Новые таблицы RLS; anon/read и прямые user/write закрыты. Реальных фикстур не создавали.
- 179 автоматических тестов; 23 check-in и 17 result SQL assertions PASS; TypeScript/ESLint/webpack build PASS. 311 записей metadata hosted/local совпали; новый snapshot checks/2026-10-22-workflow-schema.json.
- Не закрывать полный пункт14: нужны авторизованный браузерный E2E, автоматический допуск и полноценное отдельное дело протеста/апелляции; manual results пока старый organizer flow.
- Публикация подтверждена: runtime `989c7ea6a89ce28f34644debf666fd4868300566` Vercel Ready; код/тесты/доки до `e4cca3bd2231e095bc1905d25a0373041c9adcde`, 19 файлов совпали. Browser guest `/tournaments` и оба новых GET API закрыты авторизацией. Сам сайт не авторизован; GitHub/Supabase доступны. Preview `https://deafhub-kl5okvyoi-ionas-projects-019510f8.vercel.app/tournaments`. main прежний f68ee6d.

## 22 октября — сначала короткая доработка
- Worktree `/workspace/scratch/cc7f06ba3151/deafhub-quick-session` от 7588200; прежние рабочие деревья сохранены.
- Исправлены только catch ручного refresh в TournamentCheckin.tsx / TournamentResults.tsx: 401 очищает данные/формы, в результатах также state. Схема/сервер/дизайн не менялись.
- maintenance/tests/workflow-expired-session.cjs: 4 FAIL на прежнем коде, 4 PASS после исправления; общий набор 183 PASS. tsc/ESLint двух компонентов/webpack build/diff PASS. Предыдущие неизменённые SQL-проверки повторно не запускались.
- На постоянном branch Preview браузер пока гость; полный Auth E2E не заявлять. Реестр 40 выполнено / 14 не завершено / 6 запланировано / 6 отложено: новая малая ошибка закрыта, исходные 14 комплексных пунктов сохраняются.

Код малой правки `1b65061496d11971adae1e634adacbb124256f73`; тесты `2250730069ff67cd241386105f05447248685e0d`, 3 файла побайтово сверены с GitHub.

## 22 октября — следующая малая доработка
- Worktree `/workspace/scratch/cc7f06ba3151/deafhub-quick-retry` от 8c9e8bc. Изменены только обработчики refresh в TournamentCheckin/TournamentResults: очищают старый notice; результаты очищают прежний error перед повтором. Предыдущее очищение приватных данных при 401 сохранено.
- Новый workflow-retry.cjs: 8 тестов RU/EN; 6 FAIL/2 PASS на прежнем HEAD, 8 PASS на исправлении. Вместе с прежними 401 тестами 12 PASS; общий набор 191 PASS. tsc/ESLint компонентов/webpack build/diff PASS. Неизменённые SQL/схема/зависимости повторно не анализировались.
- Реестр 41 выполнено / 14 не завершено / 6 запланировано / 6 отложено. Новая группа малых дефектов закрыта; полный авторизованный E2E всё ещё не заявлен.

Код повторной загрузки: `1dccfaef438e8afdac0606c4dcbee9374ad8b728`, тесты `18cb79b6626773028ed67275e1986fe98a1c5f7e`; 3 файла побайтово сверены с GitHub.

## 22 октября — полнота протоколов/подтверждений
- Worktree `/workspace/scratch/cc7f06ba3151/deafhub-report-pages` от 1f67117. Единственный runtime-файл app/api/tournament-results/route.ts. Прежний limit1024/один запрос голосов заменены курсором sequence (200) и пакетами80/range200 с порядком report_id+entry_id; короткая серверная страница не принимается за конец. До4096 протоколов; при превышении/непрогрессе/ошибке страницы явный503 без частичного списка. Голосов максимум2 на протокол по действующему RPC.
- 7 тестов tournament-report-pages.cjs: 1205 протоколов/2410 голосов, maxRows37, поздний отказ, отказ голосов, повтор курсора, граница4096, guest/empty. На старом HEAD5FAIL/2PASS; исправление7PASS. Общий набор198PASS; tsc/ESLint API/webpack build/diff PASS.
- Текущие официальные select/range docs Supabase сверены. Без изменения RLS/схемы/реальных данных. Остальные неизменённые файлы и SQL-тесты не перечитывались/не перезапускались. Реестр42/14/6/6; не выдавать unit HTTP fixture за настоящий Auth E2E.

- В том же продолжении исправлен короткий дефект формы отправки: отсутствующие па/pb давали null!==empty и выдуманные penalties0:0 для Dota/CS; частичный FC shootout молча отбрасывался. Теперь FC требует оба поля либо оба пустых, Dota/CS не отправляют penalties. Лимит64/группы/правила/дизайн не менялись.
- result-form-scores.cjs:12 RU/EN сценариев, до исправления8FAIL/4PASS, после12PASS; общий набор210PASS, tsc/ESLint API+компонент/webpack build/diff PASS. Реестр43/14/6/6.

Сохранены: сервер586603ba018245525c207d18d1490411782b353f, формаfa43806636647398df84c88aefd8396f68c2498f, тестыdd029d5ce696acb6c56fc622eadc169b91870d9a. Четыре исходника/теста побайтово совпали с GitHub.


## 22 октября — автоматический допуск
- Worktree deafhub-auto-admit от b6923c201eaa6d94f024b6fbd3040022b5489123; прежние деревья сохранены. Новый API tournament-admission, TournamentAutoAdmission внутри прежнего Operations, RU/EN названия аудита. Миграция 20261022104233 уже применена к hvxvwgnnmazpptuenidv.
- hub_admission_rules выключено по умолчанию; opt-in owner RPC, reason/audit, prelaunch lock. helper требует текущие rules/policy, точный snapshot-состав, положительный review от текущего organizer и обязательные личные acceptance. Триггеры после review/attest; повтор безопасен, rejected не открывает, awards/results не трогает. Auth.uid, RLS, empty search_path, internal helper ACL закрыт.
- 215 unit/route/component тестов, 24 изолированных SQL assertions, tsc/ESLint/webpack build/diff PASS. Hosted/local schema 322 записи совпали; snapshot docs/checks/2026-10-22-auto-admission-schema.json, compare script обновлён. Hosted rules0rows, anon_read=false, user_write=false; фикстур/ролей/фальшивых результатов не создавали. Старые advisor warnings сохранены; новый узкий authenticated definer RPC проверен.
- QA logs: ../qa-auto-admit/{tests,sql,types,lint,build}.log. Изолированный PGlite: ../sql-qa-runtime/node_modules/@electric-sql/pglite (DEAFHUB_PGLITE_PATH); /tmp ранее очищался. Не повторять неизменённые SQL-тесты без новой причины.
- Подзадача автодопуска завершена по коду/SQL; полный пункт14 требует настоящего авторизованного браузерного E2E. Отдельная апелляционная система не согласована владельцем и не добавляется как обязательный объём. Реестр44/14/6/6. Публикация/Preview фиксируются после подтверждения.


Публикация автодопуска подтверждена: миграция `4b6169cfe40a3ec355fe276bee4c56ad90b22587`, API `e9cd6501e10b3d1ebf75c46eacab65cb2b987e89`, интерфейс `fa8fab4d5d854ac9bf2907e4c5e52187346adbfb`, тесты/SQL/schema до `ac3f570d43fdb13deff05a2a62fd0e126f3a5255`. Девять исходников/тестов/schema побайтово совпали с GitHub. Vercel runtime `fa8fab4` — Ready; браузер `/tournaments` открывается, новый API гостю отвечает Sign in required. Preview: https://deafhub-h3hzp45dt-ionas-projects-019510f8.vercel.app/tournaments . Это гостевая проверка, не авторизованный E2E. Реестр44/14/6/6.


## 22 октября — защита legacy результатов
- В рамках пункта14 найден и воспроизведён обход require_confirmation=true через hub_action/create_match. Новый trigger hub_legacy_confirmation_guard запрещает insert/update hub_matches при обязательных подтверждениях; owner должен использовать engine/reports. Опциональный false сохраняет прежний ручной режим. Не удаляет и не переписывает историю. Hosted required_tournaments0 до применения.
- Миграция создана CLI, затем имя сверено с реальной hosted-версией20261022105700. Внутренняя функция revoke execute от public/anon/authenticated, empty search_path, та же блокировка tournament. API возвращает безопасную понятную ошибку, RU/EN UI поясняет границу.
- scripts/local-legacy-confirmation-check.mjs:15 SQL PASS (до guard Missing expected rejection); local-results-sql-check.mjs теперь включает guard,17 PASS. maintenance/tests/legacy-confirmation-boundary.cjs:1FAIL/1PASS до API-правки,2PASS после. Общий набор217PASS; tsc/ESLint/webpack build/diff PASS. Схема324 записи hosted/local совпала, checks/2026-10-22-confirmation-boundary-schema.json; security advisor прежний1INFO/1anonWARN/9authWARN/1passwordWARN. Fixtures only local rollback.
- GitHub e0e0d3d migration /2e4252e API /bacaa38 UI /f8c23ce tests /dfca83e SQL /9fd6bb3 snapshot. Все10файлов побайтово совпали. Deployment bacaa38 отменён более новым коммитом, не ошибка сборки; 9fd6bb3 Ready. Preview https://deafhub-9efm4b3y5-ionas-projects-019510f8.vercel.app/tournaments, browser EN/RU guest и admission API Sign in required.
- Реестр44/14/6/6; legacy boundary закрыта внутри текущей подзадачи, отдельный счётчик найденных багов не раздувался. Пункт14 теперь требует именно настоящего Auth/browser QA. Остальные пункты зависят от приложения Auth/реальных матчей, SMTP/API keys и устройств/географии. BrowserAuth не предоставляет автоматической выдачи сессии; новый запрос владельцу, ушедшему на работу, не запускался.
- Логи ../qa-legacy-confirmation. Основной runtime 9fd6bb3; main по ls-remote f68ee6d без изменений. Следующему сеансу читать status/diff и этот журнал; неизменённые деревья/SQL не пересматривать без причины.
