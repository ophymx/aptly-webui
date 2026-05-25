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
3. `/api/whoami` returns `{"user":"…","role":"reader"|"writer"}`. The UI
   hides write controls when `role !== "writer"`. **The UI's check is UX,
   not security** — nginx is the actual security boundary and must also
   reject writes from non-writers (see `limit_except` below). If the `role`
   field is absent entirely the UI defaults to writer (backwards-compatible
   with deployments that haven't wired role mapping yet).

Example with [oauth2-proxy](https://oauth2-proxy.github.io/oauth2-proxy/)
in front and a single role mapping from IdP groups to `reader` / `writer`:

```nginx
# Map IdP groups (a comma-separated list in X-Auth-Request-Groups) to a
# stable role string. Adjust the group name(s) to match your IdP.
map $authed_groups $aptly_role {
  "~\baptly-writers\b"   "writer";
  default                "reader";
}

server {
  listen 443 ssl http2;
  server_name aptly.example.internal;

  # SSL config omitted (use the LE fullchain, not just the leaf — Node
  # clients won't follow AIA to fetch the intermediate).

  # Require auth (oauth2-proxy upstream) for everything
  auth_request /oauth2/auth;
  error_page 401 = /oauth2/sign_in;

  # oauth2-proxy must be configured with --set-xauthrequest so it exposes
  # X-Auth-Request-{User,Email,Groups} on its /oauth2/auth response.
  auth_request_set $authed_user   $upstream_http_x_auth_request_user;
  auth_request_set $authed_email  $upstream_http_x_auth_request_email;
  auth_request_set $authed_groups $upstream_http_x_auth_request_groups;

  # SPA
  root /var/www/aptly-webui;
  index index.html;
  location / {
    try_files $uri /index.html;
  }

  # Whoami helper used by the UI top-bar and write-control gating.
  location = /api/whoami {
    default_type application/json;
    return 200 '{"user":"$authed_user","role":"$aptly_role"}';
  }

  # Proxy to aptly daemon. The actual security boundary lives here:
  # readers are blocked from any non-GET request regardless of what the
  # UI shows. The bearer token (if upstream needs one) is injected from
  # nginx; it never reaches the browser.
  location /api/ {
    # Block writes for non-writers. limit_except inverts the listed
    # methods, so the inner block applies to everything except GET/HEAD.
    limit_except GET HEAD {
      if ($aptly_role != "writer") {
        return 403;
      }
    }

    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-User $authed_user;
    # proxy_set_header Authorization "Bearer xxxxxxxxxxxxxxxx";
    # Large uploads (.deb packages):
    client_max_body_size 256m;
    proxy_request_buffering off;
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

**Notes**

- The `map` block lives at `http {}` level (not inside `server {}`). Put
  it in the same file alongside `server`, or in a separate `conf.d` file
  that's included before this one.
- Aptly's REST API uses GET for reads and POST/PUT/DELETE for all writes,
  so the method-based `limit_except` covers the full mutation surface.
- If your IdP delivers groups via a different oauth2-proxy header (e.g.
  `X-Forwarded-Groups`), swap the `auth_request_set` line accordingly.
- If you don't run an auth proxy at all, omit the `auth_request` lines
  and the `/api/whoami` block. The UI defaults to writer in that case.

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
