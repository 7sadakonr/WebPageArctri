# Admin Analytics Backoffice — Design

Date: 2026-11-11 · Branch: `feat/admin-analytics`

## 1. Purpose and scope

A password-protected `/admin` page in the existing Arctri website that shows
web traffic and download analytics for the site owner / a small team.

**In scope**
- Overview dashboard: visits, download clicks, OS split, countries, referrers,
  time series, per-version GitHub download counts. Range selector 7 / 30 / 90 days.
- Single shared-password login, signed-cookie session.
- Collecting data on the public site (Vercel Web Analytics + `download_click` event).

**Out of scope (YAGNI)**
- User accounts / roles, own database, own event store, redirect-based download counting.
- Exporting, alerting, per-visitor drill-down, vue-router, chart library.

**Audience assumption (unconfirmed):** one person or a small trusted team; data is
private but not highly sensitive.

## 2. Data sources and their limits

| Source | Gives | Limits |
|---|---|---|
| Vercel Web Analytics REST API `GET /v1/query/web-analytics/visits/aggregate` | visits by country, OS, referrer, path, UTM, time | Needs Vercel access token + `projectId`; plan support to verify |
| Vercel custom event `download_click` (`platform`, `version`) | download intent per platform/version | Click is not a completed download; ad-blockers drop events; custom-event query support on the plan is **to verify before implementation** |
| GitHub Releases API `download_count` | per-asset counts | Installers are mirrored to Vercel Blob, so this only counts direct GitHub downloads; shown as a supplementary figure |

Data starts accumulating only after deploy. All figures are lower-bound estimates.

## 3. Architecture

```
Browser /admin (Vue)  --cookie-->  /api/admin/*  (Vercel Functions)
                                      ├─ Vercel REST API   (VERCEL_ACCESS_TOKEN)
                                      └─ GitHub API        (GITHUB_TOKEN)
```

Tokens live only in server env (no `VITE_` prefix) and never reach the client bundle.

### 3.1 Endpoints

| Endpoint | Behaviour |
|---|---|
| `POST /api/admin/login` | Compare body password with `ADMIN_PASSWORD` in constant time. Success: set session cookie, 204. Failure: 401. |
| `POST /api/admin/logout` | Clear cookie, 204. |
| `GET /api/admin/overview?range=7\|30\|90` | Validate cookie, fetch both sources in parallel, return one condensed JSON. |

### 3.2 Authentication

- Cookie: `HttpOnly; Secure; SameSite=Strict; Path=/`, value = `exp` signed with
  HMAC-SHA256 using `ADMIN_SESSION_SECRET`; lifetime 12 h; stateless.
- Non-login endpoints return 401 on missing / forged / expired cookie; the UI returns to login.
- Brute-force protection: Vercel Firewall rate-limit rule on `/api/admin/login`
  (about 5 requests/min/IP), configured in the Vercel dashboard, not in code.
- `/admin` is excluded from crawlers (`noindex` meta, `Disallow: /admin`).

### 3.3 Overview response

`overview.ts` is a pure function (raw upstream responses in, condensed JSON out):

```
{
  range: 7|30|90,
  sources: { vercel: "ok"|"error", github: "ok"|"error" },
  totals: { visits, downloadClicks },
  series: [{ date, visits, downloadClicks }],
  byOs: [{ name, visits }],
  byCountry: [{ code, visits }],
  byReferrer: [{ host, visits }],
  downloads: [{ version, platform, clicks, githubCount }]
}
```
`Cache-Control: private, max-age=300`.

### 3.4 Error handling

- Each source fails independently: still 200, with `sources.<name> = "error"`; the UI
  shows "could not load" on the affected cards only.
- Invalid upstream token: 502 with a generic message; detail logged server-side only.
- Invalid `range`: 400. Missing env vars: 500, variable names appear only in logs.

## 4. Frontend

### 4.1 Routing / bundling

No vue-router. `main.ts` checks `location.pathname`: `/admin*` dynamically imports
`AdminApp.vue`; anything else mounts the existing `App.vue`. Admin code stays out of
the landing bundle. Add `vercel.json` rewriting `/admin` to `index.html` while leaving
`/api/*` untouched.

### 4.2 File layout

```
api/admin/{login,logout,overview}.ts      thin handlers
api/_lib/{session,vercelAnalytics,githubReleases,overview}.ts
src/admin/AdminApp.vue                    switches login / dashboard
src/admin/LoginForm.vue
src/admin/Dashboard.vue                   range selector + card layout
src/admin/components/{StatCard,TimeSeries,BreakdownTable,DownloadsTable}.vue
src/admin/useOverview.ts                  fetch + loading / error / 401 state
```

### 4.3 UI

Reuse existing Tailwind tokens (`bg-surface`, `border-line`, `text-accent`). Time series
is hand-written SVG (no chart library). Follow the `dataviz` skill for colour and
accessibility when building it. i18n keys `admin.*` added to `en.ts` and `th.ts`.

### 4.4 Public-site instrumentation (existing files touched)

1. Add `@vercel/analytics`; call `inject()` in the landing path of `main.ts` only
   (so `/admin` visits are not counted).
2. `DownloadSection.vue`: `@click` on download links calls
   `track('download_click', { platform, version })`.
3. `index.html` / `public/robots.txt`: noindex and `Disallow: /admin`.

## 5. Configuration (owner must provide)

| Name | Where |
|---|---|
| `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | Vercel env |
| `VERCEL_ACCESS_TOKEN`, `VERCEL_PROJECT_ID` (and team id if applicable) | Vercel env |
| `GITHUB_TOKEN` (optional, raises rate limit) | Vercel env |
| Web Analytics enabled; login rate-limit rule | Vercel dashboard |

## 6. Testing

Add Vitest (fits the existing Vite setup).
- `session.ts`: valid, forged and expired cookies.
- `overview.ts`: fixtures shaped like real upstream responses.
- Handlers with mocked `fetch`: 401, 400, one source down, both OK.

## 7. Open items to verify before / during implementation

1. Vercel plan supports Web Analytics custom events and querying them via REST.
2. Exact event-query endpoint / parameters for `download_click`.
3. Confirm the audience assumption in section 1.
