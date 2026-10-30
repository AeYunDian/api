# AyAccount SDK · `public/lib/ay-account`

A self-contained Material Design 3 login surface for AyAccount.
The surface uses MD3 color / type / shape / elevation / state tokens, with
logical CSS properties (`inline-start` / `inline-end`) throughout.

## Files

Open `/lib/ay-account/demo.html` for a ready-to-run playground.

| File                                    | Purpose                                                              |
| --------------------------------------- | -------------------------------------------------------------------- |
| `main.js`                               | Host SDK. Drop-in replacement for `account-sdk.js`; same public API. |
| `main.min.js`                           | Minified host SDK (no source map).                                   |
| `login.min.js`                          | Minified iframe script (no source map).                              |
| `build-min.mjs` / `build-min.bat`       | One-command regeneration of both min files.                          |
| `demo.html`                             | Simple demo page for fullscreen / inline / theme / language / toast. |
| `login.html`                            | The iframe login surface (inline + fullscreen, one responsive UI).   |
| `login.js`                              | The only UI script for `login.html` (strict mode, local toast).      |
| `login.css`                             | MD3 design tokens + login/register/third-party pages.                |
| `header-title.css` / `header-title.js`  | Original brand letter-wave effect.                                   |
| `toast.css`                             | Original toast visual rules (logical properties only).               |
| `toast-loading.svg` / `toast-error.svg` | Toast icons used by the iframe surface.                              |

## Usage (same API as before)

```html
<script src="https://online.undz.cn/lib/ay-account/main.js?v=3.2.2"></script>
<script>
  "use strict";
  const account = new AyAccount({ appId: "your_app_id" });

  // Fullscreen iframe overlay
  account.login().then((result) => {
    // result.user on success, null when closed
  });

  // Embedded (host container)
  account.login({
    container: "#login-slot",
    minHeight: "620px",
    theme: "dark", // "auto" | "light" | "dark" (default auto)
    hideOauthClient: false,
    hideClose: false,
  });
</script>
```

`register(config)`, `logout()`, `verify()`, `refresh()`, `changePassword(old, new)`,
`updateI18n()`, `changeLanguage()`, `close()` and `window.createAyAccount()` keep
their previous behaviour. Extra optional fields: `theme`, `lang`, `autoClose`,
`zIndex`, `height`, `only` (`"login"` / `"register"`), `hideFaq`, `hideSwitch`,
`scrim` (set `false` for a fully transparent desktop backdrop), `enter`
(`"next" | "back" | "up" | "down" | "none"`, or `{ mobile, desktop }`;
default `"back"`) and `fill` (embedded containers default to `true`;
fullscreen defaults to `false`).

The integrated toast is available as `account.toast` (`loading / success / error / hide`)
and lives in a shadow root, so it does not add globals.

## Build min files

```bash
node build-min.mjs
# or double-click build-min.bat
```

Generates `login.min.js` and `main.min.js` without source maps.

When `PRODUCE = true`, the iframe URL carries `min=1`; `login.html` loads
`login.min.js` first and automatically falls back to `login.js` if the min file
is missing. Host pages can use `main.min.js` directly.

## Notes

- `PRODUCE = true`: API + iframe + Geetest + toast icons all use
  `https://online.undz.cn`.
- `PRODUCE = false`: API endpoints still target `https://online.undz.cn`, while
  static assets (iframe page, Geetest, toast icons) resolve relative to the SDK
  script.
- Inline (`container`) mode delegates sign-in/register API calls to the host SDK,
  so Geetest appears in the host page.
- Opening `login()` / `register()` shows a host loading toast until the iframe
  sends `isReady`. `loadingToast` defaults to `false` in inline mode and `true`
  in fullscreen mode; pass a boolean to override it.
- Registration (SDK >= 3.2.0) calls `register/verification/start`; the backend
  chooses a traditional email-code page or a reverse-email page. The final
  `/register` call uses the returned `verifySessionId`.
- Fullscreen mode runs sign-in/register inside the iframe, so Geetest appears
  inside the iframe.
- `theme: "auto"` follows `prefers-color-scheme`.
- Page transitions: `next` / `back` for login ↔ register, `up` / `down` for
  the third-party panel.
