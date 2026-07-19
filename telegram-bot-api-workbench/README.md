# Telegram Bot API Workbench

A self-contained browser workbench for inspecting and operating the Telegram Bot API without a local application server.

## Capabilities

- Authenticate and inspect bot identity with `getMe`.
- Inspect, configure, and remove webhooks.
- Send, edit, and delete messages.
- Answer callback queries.
- Fetch updates once or continuously with automatic offset advancement.
- Discover chat IDs from received updates.
- Manage bot commands and inspect chats or members.
- Run arbitrary Bot API methods with JSON parameters.
- Upload files through a generic multipart runner.
- Export non-secret field profiles, updates, and redacted request logs.
- Copy reusable JavaScript request, polling, and upload wrappers.

## Security model

The bot token is never embedded in the artifact. It remains in page memory unless the operator explicitly enables current-tab storage, which uses `sessionStorage`. Token-, secret-, password-, and authorization-like fields are redacted from the in-memory log.

This remains a developer tool, not a secure public bot frontend. A browser-only application cannot hide a bot token from the browser operator, extensions, injected scripts, or a compromised device. Production applications should keep the token on a trusted backend.

The document includes a restrictive Content Security Policy, a no-referrer policy, disabled sensitive browser capabilities, no external dependencies, no analytics, and no service worker.

## Browser constraints

Telegram Bot API calls are sent directly to `https://api.telegram.org` as form-encoded POST requests. Browser network, CORS, CSP, privacy-extension, and corporate-proxy rules can still prevent direct access. Webhook configuration requires a reachable HTTPS receiver; this artifact does not receive webhook updates.

## Run locally

Open `index.html` directly or serve the directory from a trusted local HTTP server:

    python -m http.server 8080

Then open:

    http://localhost:8080/telegram-bot-api-workbench/

Use a dedicated development bot and revoke its token with BotFather after any suspected exposure.
