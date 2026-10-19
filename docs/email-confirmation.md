# Подтверждение email DEAF|HUB — Preview

19 октября 2026. Только `preview/deafhub-setup`; main и production не изменяются.

## Реализовано в коде

- `EmailAuth.tsx`: после signup без сессии отдельный экран ожидания; пароль очищается.
- `EmailConfirmationPending.tsx`: адрес в памяти компонента, фиксированные ссылки Gmail/Mail.ru/Outlook/Яндекс, инструкция для неизвестных провайдеров. Автоматического открытия писем нет.
- Повторная отправка: штатный `auth.resend({type:'signup',...})`, защита от параллельных кликов, пауза 60 секунд, deadline в sessionStorage без адреса/пароля. Это клиентская защита удобства; серверные ограничения Supabase сохраняются и не заменяются ею.
- `confirmationCallback()` оставляет прежний `/auth/callback` без нового query, совместимый с текущим allow list. Recovery сохраняет `?flow=recovery`; Steam/прочие callback-потоки сохраняют `/auth/complete`.
- Email-поток после успешного `exchangeCodeForSession` открывает `/auth/email-confirmed`; страница повторно проверяет `getUser()` и `email_confirmed_at`. Прямой URL не выдаёт подтверждение гостю или неподтверждённому пользователю.
- Ошибки, использованные/истёкшие ссылки и недоступность обмена отображаются без токенов; callback-ответы `no-store` и `no-referrer`.
- Язык signup сохраняется только как косметическое `user_metadata.locale`; для прав доступа эти данные не используются.

## Письмо

`supabase/templates/confirm-signup.html`: единый Go HTML-шаблон Confirm sign up.
`locale=ru` выбирает русский, иначе английский. Предлагаемая тема:
`DEAF|HUB — Подтвердите почту / Confirm email`.

- Настоящий `public/branding/deafhub-wordmark-no-glints.png`, без нового логотипа.
- Публичный HTTPS URL оригинального файла зафиксирован на GitHub `0d032de`; HTTP 200 и `image/png` проверены. Картинка 2172×724, 847418 байт; оригинал не изменялся. Перед production желательно согласовать собственный постоянный домен для email-ассета.
- Тёмный #07131C, голубой #22D3EE; таблицы, inline CSS, системный Arial, alt, фоновые атрибуты, fallback-ссылка, MSO padding. Нет JS, форм, видео и анимаций.
- Единственная настоящая ссылка подтверждения — неизменённая `{{ .ConfirmationURL }}`. Токен, hash и redirect не конструируются вручную.
- Макет гибкий до 600 px. Почтовые клиенты могут изменять цвета в тёмном режиме; одинаковое отображение во всех клиентах не заявляется.

## Проверенные настройки реального Supabase

Панель проекта `hvxvwgnnmazpptuenidv`, аккаунт deafast, проверена после ручного входа 19 октября.

- Custom SMTP выключен (`Enable custom SMTP`: off).
- Confirm sign up: стандартная тема `Confirm your email address`.
- Панель сообщает: `Set up custom SMTP to edit templates`; Source/Save disabled. Используются стандартные письма.
- Site URL: `https://deafhub-git-preview-deafhub-setup-ionas-projects-019510f8.vercel.app`.
- Разрешены только этот origin + `/auth/callback` и `/auth/callback?flow=recovery`.
- Настройки не изменены. Для настоящего email-сценария использовать постоянный Preview origin; отдельные immutable deployment URL не находятся в allow list.
- Загрузка HTML в репозиторий сама по себе НЕ подключает шаблон в hosted Supabase.

## Проверки и пределы

- Автоматические тесты: распознавание провайдеров и поддельных доменов; границы cooldown; RU/EN экрана ожидания; callback signup/Steam/recovery; ошибки/отсутствие code/сетевой сбой; отсутствие токенов в redirect; защита подтверждённой страницы; состав шаблона и рендер Preview RU/EN/узкая ширина. SDK-клиент в тестах подменён; это не доставка реального письма.
- Пройдены 106 тестов: 73 прежних, 9 сетки, 24 email. TypeScript, ESLint изменённых файлов и Next webpack build прошли.
- Preview проверен в браузере: RU/EN, загруженный оригинальный логотип, узкий макет (таблица 328 px), ссылки пяти вариантов провайдера, гостевой запрет success и callback без code. Это не мобильное устройство и не настоящий почтовый клиент.
- `/auth/email-preview?lang=ru` / `?lang=en` — рендер именно исходного шаблона; вместо токенов безопасный `#demo-confirmation`. `width=360` — ограничение ширины макета, не эмуляция Gmail или устройства.
- `/auth/confirmation-preview` — read-only образец экрана для разных провайдеров; письма не отправляются.
- Обе демонстрации на сервере закрыты вне Vercel Preview/development. CSP email-preview запрещает скрипты, формы и произвольные сетевые ресурсы.

**Не проверено:** получение/доставка нового фирменного письма в Gmail/Mail.ru; Outlook Word/mobile и тёмный/светлый режим реальных клиентов; реальный одноразовый токен, истечение и переход из письма. Причина: SMTP не подключён и шаблон не установлен. Модульные callback-проверки этого не заменяют.

## Что требуется для отправки

1. Выделить согласованный тестовый почтовый канал/SMTP с подтверждённым отправителем и доступом владельца; не создавать платные аккаунты автоматически.
2. Подготовить конкретное изменение настроек для просмотра и отдельно согласовать применение к общему проекту Supabase. Не отключать подтверждение email и ограничения отправки.
3. Установить шаблон и тему только после согласования; проверить полученные письма на подконтрольных Gmail/Mail.ru и Outlook, оба режима и реальные ссылки. Не считать production готовым до этой проверки.

Официальные источники:
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/reference/javascript/auth-resend
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/auth-smtp
- https://support.google.com/mail/answer/8494
- https://help.mail.ru/mail/login/
- https://support.microsoft.com/en-us/accounts-billing/manage/how-to-sign-in-to-hotmail
- https://yandex.ru/support/yandex-360/customers/mail/ru/auth.html
