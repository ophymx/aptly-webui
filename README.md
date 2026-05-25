# aptly-webui

A read-only web UI for browsing an [aptly](https://www.aptly.info/) instance:
repositories, mirrors, snapshots, publications, and packages.

It is a static SPA. It makes requests to `/api` on the same origin and expects
that path to be reverse-proxied to the aptly daemon. Aptly's HTTP API has no
authentication or CORS, so this UI is intended to live behind a proxy that
handles both.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS (warm-dark theme, Newsreader + IBM Plex Mono/Sans)
- TanStack Query for data fetching/caching
- React Router for client-side routing
- No backend of its own — pure SPA

## Develop

```sh
npm install
cp .env.example .env.local
# edit .env.local — set APTLY_API and (optionally) APTLY_TOKEN
npm run dev
```

The Vite dev server proxies `/api/*` to `APTLY_API`. If `APTLY_TOKEN` is set,
the proxy injects `Authorization: Bearer ${APTLY_TOKEN}` on every forwarded
request — the token stays on the dev machine and never reaches the browser.
`.env.local` is gitignored.

If you're running a local aptly daemon instead:

```sh
aptly api serve -listen=:8080
# then in .env.local: APTLY_API=http://localhost:8080 (no token needed)
```

## Build

```sh
npm run build      # → dist/
npm run preview    # serve dist/ locally
npm run typecheck  # tsc, no emit
```

`dist/` is a fully static bundle (HTML + JS + CSS). Drop it behind any
HTTP server.

## Deploy behind nginx

The UI assumes:

1. Static files are served at `/`.
2. `/api/*` is reverse-proxied to the aptly daemon.
3. `/api/whoami` returns `{"user": "..."}` if you want the signed-in user
   displayed in the top bar. (Optional — the UI falls back silently.)

Example nginx config combining all three, with an upstream OIDC auth proxy
(e.g. `oauth2-proxy`) injecting `X-Forwarded-User`:

```nginx
server {
  listen 443 ssl http2;
  server_name aptly.example.internal;

  # SSL config omitted...

  # Require auth (oauth2-proxy upstream) for everything
  auth_request /oauth2/auth;
  error_page 401 = /oauth2/sign_in;

  auth_request_set $authed_user $upstream_http_x_auth_request_user;

  # SPA
  root /var/www/aptly-webui;
  index index.html;
  location / {
    try_files $uri /index.html;
  }

  # Proxy to aptly daemon. If the aptly endpoint requires a bearer token,
  # inject it from a secret loaded into nginx (do NOT pass it from the browser).
  location /api/ {
    rewrite ^/api/(.*)$ /api/$1 break;  # keep /api prefix
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-User $authed_user;
    # proxy_set_header Authorization "Bearer xxxxxxxxxxxxxxxx";  # if upstream needs one
  }

  # Whoami helper used by the UI top-bar
  location = /api/whoami {
    default_type application/json;
    return 200 '{"user":"$authed_user"}';
  }

  # oauth2-proxy callback
  location /oauth2/ {
    proxy_pass http://127.0.0.1:4180;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto https;
  }
}
```

If you do not have an auth layer, omit the `auth_request` lines and the
`/api/whoami` block. The UI will simply not show a user pill.

## What's covered

| Section       | Routes                                  | Notes                                                                   |
| ------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| Overview      | `/`                                     | Counts, recent snapshots, published distributions, daemon version.      |
| Repositories  | `/repos`, `/repos/:name`                | Local repos + their packages.                                           |
| Mirrors       | `/mirrors`, `/mirrors/:name`            | Upstream mirrors, their metadata, packages.                             |
| Snapshots     | `/snapshots`, `/snapshots/:name`        | Point-in-time copies, sortable, filterable.                             |
| Publications  | `/publish`                              | Currently-published distributions.                                      |
| Packages      | `/packages`, `/packages/:key`           | aptly-syntax search; full control fields, hashes, relations on detail.  |

All views are **read-only** by design. Mutations (create/update/delete) live
on the [aptly CLI](https://www.aptly.info/doc/aptly/) for now.

## Aesthetic notes

- Warm-ink dark palette (no purple gradients) with a single amber accent.
- Serif display (Newsreader) for titles, IBM Plex Mono for any identifier,
  IBM Plex Sans for body.
- Treats the package archive as a **library catalog**: kicker labels, thin
  amber rules, italic counts. Dense tables, generous whitespace around them.

## Project layout

```
src/
  lib/         api client, query hooks, formatters
  components/
    ui/        primitives (button, input, badge, table, ...)
    data/      kicker headers, status dot, key-value list
    layout/    Shell + TopNav
  pages/       one file per route
  index.css    design tokens + base layer
```
