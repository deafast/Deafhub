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
