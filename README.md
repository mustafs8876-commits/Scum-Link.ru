# LinkScum.ru — safe visual recreation

Самодостаточная статическая реконструкция внешнего вида по пользовательскому видеореференсу.

## Запуск

```bash
npm start
```

Откройте `http://localhost:4173`.

## Страницы

- `index.html` — главная / лендинг
- `payment.html` — выбор тарифа и информационные блоки
- `payment-rub.html` — безопасный визуальный макет страницы оплаты

## Что работает

- sticky header и адаптивное мобильное меню
- якорная навигация
- модальное окно активации ключа
- карточки тарифов и переходы между страницами
- фиксированные круглые action-кнопки
- фиксированная CTA-кнопка
- локальные toast-уведомления
- копирование фиктивного номера в макете оплаты
- responsive layout для desktop/tablet/mobile

## Безопасные ограничения

По референсу сайт рекламировал функции получения токенов/доступа к чужим аккаунтам и показывал реальные платежные реквизиты. Эти части **не реализованы**. В проекте нет:

- фишинговых ссылок;
- сбора токенов/куки/сессий/паролей;
- доступа к аккаунтам;
- реальных платежей или банковских реквизитов;
- Telegram API/ботов/автоматической выдачи ключей;
- сетевых запросов к внешним сервисам.

Сохранена только безопасная UI/UX-оболочка.

## 2026-09-16 visual refresh
The UI was restyled into a black / white / violet glassmorphism direction inspired by modern iOS surfaces: translucent panels, blur, hairline borders, pill controls, purple ambient light, soft spring-like hover states and scroll-reveal animations. Reduced-motion preferences are respected.

## Motion / Liquid Glass v2

В этой версии визуальная система усилена поверх предыдущего чёрно-бело-фиолетового оформления:

- многослойный animated aurora/mesh фон с лёгкой зернистостью;
- scroll progress line и усиление blur/shadow у header после прокрутки;
- новые reveal-анимации: blur + clip-path + появление слева/справа/pop;
- жидкие световые блики внутри карточек, следующие за курсором;
- мягкий cursor aura на desktop;
- magnetic micro-motion для основных кнопок;
- hero-parallax и редкие светящиеся particles;
- shimmer для градиентных заголовков и стоимости;
- spring-появление modal/toast и stagger для мобильного меню;
- самостоятельное «дыхание» featured-тарифа, ribbon и floating controls;
- сохранён `prefers-reduced-motion` — системное отключение анимаций у пользователя уважается.

Логика безопасного демо не менялась: внешние платежи, сбор данных и опасные действия по-прежнему отключены.


## Multi-game homepage

- `index.html` — новая главная страница выбора игры.
- `standoff2.html` — прежняя полностью собранная страница Standoff 2.
- `roblox.html`, `brawl-clash.html`, `pubg-mobile.html` — рабочие страницы-заготовки, чтобы ссылки с главной не были битые.

## Game cards update

The homepage cards now use the same proportions and composition as the supplied reference screenshot:
image on top, dark rounded body below, centered game title and subtitle. The four card images were cropped from the user-provided screenshot.


## Compact tariff section

`standoff2.html` now uses the compact tariff composition from the supplied video:
one centered glass panel, three mini tariff cards, a featured middle tariff, one primary CTA,
a benefits list, and an attached bottom purchase button. The colors and effects remain in the project's black/white/purple iOS-glass style.


## Payment method selector

Added a purple glass payment-method chooser matching the supplied video:
- `Рубли (₽)` → `payment-rub.html`
- `Голда (G)` → `payment-gold.html`
- `Другое` → `payment-other.html`

The selected tariff is preserved through the query string. All payment pages remain non-operational visual demos and do not process real payments or credentials.


## Telegram tariff menu

Each tariff now opens a compact purple glass detail menu matching the supplied screenshot composition. The modal updates the tariff name, price and access period dynamically. The Telegram button is intentionally non-operational in this safe reconstruction; no real payment or key delivery is performed.


## Corrected Gold payment flow

The tariff flow is now:
1. Choose a tariff.
2. Choose payment method.
3. `Рубли` opens the ruble page.
4. `Другое` opens the alternative payment page.
5. Only `Голда (G)` opens the Telegram-style payment modal.

Gold prices:
- EXTRA — 2998G
- Week — 2398G
- 3 days — 1998G


## Expanded Gold modal

The Gold-only Telegram modal now includes:
- a left benefits panel,
- a right tariff summary card,
- dynamic Gold price and access period,
- a feature list,
- the Telegram payment block,
- a post-payment note,
- a button to return to payment-method selection.

The layout is intentionally more compact than the supplied orange reference and remains in the purple iOS/glass visual style.
