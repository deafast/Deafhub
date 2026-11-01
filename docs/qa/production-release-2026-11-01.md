# Production release 01.11.2026

Владелец явно разрешил перенос текущего Preview на deafhub.cc и использование той же базы с аккаунтами/историей. Дополнительно подтвердил четыре существующие переменные для Production и снятие branch-привязки двух серверных секретов с областью Production+все Preview.

Код cc2064ed0a357f2f53d01f5e78d53424ea1ded84. Создана production-сборка dpl_K7q4Aa6nLHmafGqDPNBKHCSDtd84. Предыдущий Production для отката: dpl_F1D8KE3ETr3cZYaKagVjrNGTgYb4 (f68ee6d).

NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: target preview,production. SUPABASE_SERVICE_ROLE_KEY / STEAM_WEB_API_KEY: target preview,production; gitBranch=null. Значения не читались/не ротировались. GOOGLE_AUTH_ENABLED не переносился. Схема, Auth-настройки, SMTP и финансы не менялись. main не изменён.

Сборка и последующая проверка домена ещё требуют подтверждения. Свежий вход пользователя на новом домене обязателен; браузерная сессия Preview не переносится автоматически. Реальная почтовая регистрация и полный матч двух людей ранее не подтверждены.

Публикация подтверждена: dpl_K7q4Aa6nLHmafGqDPNBKHCSDtd84 READY, aliases deafhub.cc/www.deafhub.cc, aliasError=null. Главная HTTP200; /auth/steam/status HTTP200 enabled=true; /api/hub без авторизации HTTP401. /auth/steam HTTP307 на официальный steamcommunity.com/openid/login, callback origin https://www.deafhub.cc. Основной сайт визуально проверен desktop и390×844; кнопка Steam активна после проверки готовности. Полный вход со Steam-учётными данными выполняет владелец; не объявлен завершённым. SMTP/свежий email signup и полноценный матч остаются непроверенными.
