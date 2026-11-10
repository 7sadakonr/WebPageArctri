# Admin Analytics Backoffice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a password-protected `/admin` dashboard to the Arctri website showing web traffic and download analytics.

**Architecture:** Vercel Functions in `/api/admin/*` authenticate with a stateless HMAC-signed cookie and proxy two upstreams (Vercel Web Analytics REST API, GitHub Releases API) through a pure `buildOverview` function. The Vue app mounts `AdminApp` (dynamic import) when `location.pathname` starts with `/admin`; the public site gets `@vercel/analytics` plus a `download_click` event.

**Tech Stack:** Vue 3, TypeScript, Vite 8, Tailwind 4, Vue I18n, Vercel Functions, Vitest (new), `@vercel/analytics` (new).

**Spec:** `docs/superpowers/specs/2026-11-11-admin-analytics-design.md`

## Global Constraints

- No vue-router, no chart library, no database, no user accounts (spec §1).
- Cookie: `HttpOnly; Secure; SameSite=Strict; Path=/`, HMAC-SHA256 over `exp`, lifetime 12 h (spec §3.2).
- `range` accepts only `7`, `30`, `90`; anything else returns 400 (spec §3.4).
- Overview response shape and `Cache-Control: private, max-age=300` exactly as spec §3.3.
- Tokens (`VERCEL_ACCESS_TOKEN`, `GITHUB_TOKEN`, `ADMIN_*`) are server env only, never `VITE_`-prefixed.
- Each upstream fails independently: still 200 with `sources.<name> = "error"` (spec §3.4).
- `/admin` visits are not counted by Web Analytics; `/admin` is `noindex` and `Disallow`ed.
- Copy lives in `src/i18n/en.ts` and `th.ts` under `admin.*`.

## Review Focus

1. Password with different length or non-ASCII characters: login must return 401, never throw (Task 2).
2. Cookie with tampered signature, malformed value, or `exp` in the past: 401 (Task 2).
3. Upstream returns an empty `data` array (new site, no traffic): overview returns zeros and empty lists, not an error (Task 3).
4. One upstream down or returns 401/5xx: other cards still render; status code stays 200 (Tasks 4, 6).
5. A 401 from `/api/admin/overview` while the dashboard is open (cookie expired): UI returns to the login form (Task 5).

---

### Task 1: Verify upstream APIs and set up Vitest

Resolves spec §7 items 1 and 2 before anything depends on them.

**Files:**
- Create: `vitest.config.ts`, `scripts/probe-analytics.mjs` (throwaway), `docs/superpowers/notes/2026-11-11-analytics-probe.md`
- Modify: `package.json` (add `vitest`, script `"test": "vitest run"`)

**Interfaces:**
- Produces: a notes file stating (a) whether `download_click` custom events are queryable via REST on the owner's plan and the exact endpoint and parameters, (b) the confirmed `visits/aggregate` query shape (`by`, `filter`, `since`, `until`). Tasks 3 and 6 follow it.

- [ ] **Step 1: Install and configure Vitest**

`npm i -D vitest`; `vitest.config.ts` includes `api/**/*.test.ts` and `src/**/*.test.ts`, environment `node`.

- [ ] **Step 2: Run the empty suite**

Run: `npm test`
Expected: exits 0 with "No test files found" handled (use `passWithNoTests: true`).

- [ ] **Step 3: Probe the Vercel API**

`scripts/probe-analytics.mjs` reads `VERCEL_ACCESS_TOKEN`, `VERCEL_PROJECT_ID` from env, calls `visits/aggregate` grouped by `osName` for the last 7 days, and tries the event-query endpoint found via `search_vercel_documentation` / the Vercel REST docs. Print status and body shape only (no token). The owner must supply the token and enable Web Analytics; if they have not, stop and ask.

- [ ] **Step 4: Record findings**

Write the notes file. If custom events are not queryable on the plan, stop and ask the owner to choose: upgrade, or fall back to GitHub counts only (spec section 2 is then revised before continuing).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts docs/superpowers/notes
git commit -m "chore: add vitest and record analytics API probe"
```

(`scripts/probe-analytics.mjs` is deleted before commit; it is throwaway.)

### Task 2: Session and password helpers

**Files:**
- Create: `api/_lib/session.ts`
- Test: `api/_lib/session.test.ts`

**Interfaces:**
- Produces:
  - `checkPassword(input: string, expected: string): boolean` (constant-time; false on length mismatch)
  - `createSessionCookie(secret: string, now?: number): string` (full `Set-Cookie` value, 12 h)
  - `clearSessionCookie(): string`
  - `isAuthenticated(request: Request, secret: string, now?: number): boolean`

- [ ] **Step 1: Write failing tests** in `session.test.ts`: `checkPassword` true on match, false on different length, false on non-ASCII mismatch, never throws; `isAuthenticated` true for a fresh cookie, false for tampered signature, malformed value, no cookie, and `now` > 12 h later; cookie string contains `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, `Max-Age=43200`.
- [ ] **Step 2: Run** `npx vitest run api/_lib/session.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** with `node:crypto` (`createHmac`, `timingSafeEqual`); cookie name `arctri_admin`, value `<exp>.<hexsig>`; hash both sides to equal length before `timingSafeEqual` in `checkPassword`.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(admin): signed session cookie helpers`.

### Task 3: Upstream clients and `buildOverview`

**Files:**
- Create: `api/_lib/vercelAnalytics.ts`, `api/_lib/githubReleases.ts`, `api/_lib/overview.ts`, `api/_lib/types.ts`
- Test: `api/_lib/overview.test.ts`, `api/_lib/fixtures/` (JSON shaped like the real responses captured in Task 1)

**Interfaces:**
- Consumes: findings in the Task 1 notes file.
- Produces (in `types.ts`): `Range = 7 | 30 | 90`; `Overview` exactly per spec §3.3.
  - `fetchVercelStats(range: Range, env: {token: string; projectId: string; teamId?: string}, fetchImpl?: typeof fetch): Promise<VercelRaw>`
  - `fetchGithubDownloads(repo: {owner: string; name: string}, token?: string, fetchImpl?: typeof fetch): Promise<GithubRaw>`
  - `buildOverview(range: Range, vercel: VercelRaw | Error, github: GithubRaw | Error): Overview`, where an `Error` argument sets that source to `"error"` and leaves its fields empty.

- [ ] **Step 1: Write failing tests**: both sources OK (totals and series match fixture sums); Vercel `data: []` gives zeros and empty arrays with `sources.vercel = "ok"` (Review Focus 3); Vercel `Error` gives `sources.vercel = "error"` while GitHub data is still present (Review Focus 4); GitHub `Error` mirror case; `downloads` rows join clicks and `githubCount` by `version`+`platform`.
- [ ] **Step 2: Run** `npx vitest run api/_lib/overview.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the three modules. Clients throw on non-2xx; they take `fetchImpl` for mocking. `REPO` comes from the same owner/name as `src/config.ts` (pass in, do not import from `src`).
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(admin): upstream clients and overview builder`.

### Task 4: API handlers and Vercel config

**Files:**
- Create: `api/admin/login.ts`, `api/admin/logout.ts`, `api/admin/overview.ts`, `vercel.json`, `public/robots.txt`
- Test: `api/admin/handlers.test.ts`

**Interfaces:**
- Consumes: Task 2 and Task 3 exports. Handlers are Web-standard `export async function POST/GET(request: Request): Promise<Response>` (confirm this export style works for this non-Next project during Step 3; fall back to `export default { fetch }` if not).
- Produces: HTTP contract of spec §3.1; `vercel.json` rewrites `/admin` and `/admin/(.*)` to `/index.html` and leaves `/api/*` alone.

- [ ] **Step 1: Write failing tests** (mock `fetch`, set env in `beforeEach`): login wrong password 401, right password 204 with `Set-Cookie`; overview without cookie 401; `?range=14` 400; both upstreams OK 200 with `Cache-Control: private, max-age=300`; Vercel upstream 500 gives 200 with `sources.vercel = "error"`; missing `ADMIN_SESSION_SECRET` gives 500 whose body does not contain the variable name.
- [ ] **Step 2: Run** `npx vitest run api/admin/handlers.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the handlers using Task 2 and 3 functions; upstream token rejection (401/403 from Vercel or GitHub) is logged server-side and reported as that source `"error"`.
- [ ] **Step 4: Run** the same command. Expected: PASS. Then `npx vercel dev` (owner env) and `curl -i localhost:3000/api/admin/overview` returns 401.
- [ ] **Step 5: Commit** `feat(admin): login/logout/overview endpoints and vercel.json`.

### Task 5: Frontend shell, login, and data hook

**Files:**
- Modify: `src/main.ts` (path switch; `inject()` from `@vercel/analytics` only on the landing path), `index.html` (`<meta name="robots" content="noindex">` is added at runtime by `AdminApp` since the page is shared)
- Create: `src/admin/AdminApp.vue`, `src/admin/LoginForm.vue`, `src/admin/useOverview.ts`
- Modify: `src/i18n/en.ts`, `src/i18n/th.ts` (`admin.login.*`, `admin.error.*`)
- Test: `src/admin/useOverview.test.ts`

**Interfaces:**
- Produces: `useOverview(range: Ref<Range>): { data: Ref<Overview | null>; loading: Ref<boolean>; error: Ref<string | null>; unauthorized: Ref<boolean> }`. `AdminApp` shows `LoginForm` when `unauthorized` is true; `LoginForm` POSTs to `/api/admin/login` then triggers a refetch.

- [ ] **Step 1: Write failing tests** for `useOverview`: 200 populates `data`; 401 sets `unauthorized` (Review Focus 5); network failure sets `error`; changing `range` refetches.
- [ ] **Step 2: Run** `npx vitest run src/admin/useOverview.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the hook, `AdminApp`, `LoginForm`, and the `main.ts` branch: `/admin*` dynamic-imports `AdminApp` and skips `inject()`; everything else behaves as today.
- [ ] **Step 4: Run** tests (PASS) and `npm run build` (type check and bundle succeed; landing chunk does not contain `AdminApp`).
- [ ] **Step 5: Commit** `feat(admin): frontend shell, login form, data hook`.

### Task 6: Dashboard components

**Files:**
- Create: `src/admin/Dashboard.vue`, `src/admin/components/{StatCard,TimeSeries,BreakdownTable,DownloadsTable}.vue`
- Modify: `src/i18n/en.ts`, `src/i18n/th.ts` (`admin.dashboard.*`)

**Interfaces:**
- Consumes: `Overview` and `useOverview`. Each card receives its slice plus `sources.*` and shows the translated "could not load" state when that source is `"error"`.
- Produces: `TimeSeries` props `{ series: {date: string; visits: number; downloadClicks: number}[] }`, hand-written SVG, two series with distinguishable non-color cues, `role="img"` with an `aria-label` summary.

- [ ] **Step 1: Load the `dataviz` skill** and apply its palette and accessibility rules to `TimeSeries`.
- [ ] **Step 2: Implement** the components and `Dashboard` with the 7/30/90 selector (default 30). Reuse existing tokens (`bg-surface`, `border-line`, `text-accent`).
- [ ] **Step 3: Verify manually** with `npm run dev` and the `run` skill: login, switch ranges, force one source to `"error"` (temporarily bad `GITHUB_TOKEN`) and confirm only that card degrades; check EN/TH and a 375 px-wide viewport.
- [ ] **Step 4: Run** `npm run build`. Expected: succeeds.
- [ ] **Step 5: Commit** `feat(admin): dashboard UI`.

### Task 7: Public-site instrumentation and docs

**Files:**
- Modify: `src/components/DownloadSection.vue` (download links call `track('download_click', { platform, version })` from `@vercel/analytics` on click; `platform` values `windows`, `mac-arm`, `mac-intel`; `version` is `release.tag`), `README.md` (env var table from spec §5, setup steps, the lower-bound caveat)
- Modify: `package.json` (`@vercel/analytics`)

- [ ] **Step 1: Implement** the click tracking; `track` must not throw if blocked (wrap in try/catch).
- [ ] **Step 2: Verify**: `npm run build` passes; in dev, clicking a download button fires one `download_click` with the right payload (browser network panel or console stub).
- [ ] **Step 3: Update README**, including the manual dashboard steps (enable Web Analytics, create token, add login rate-limit rule).
- [ ] **Step 4: Commit** `feat: track download clicks and document admin setup`.

---

## Self-review notes

- Spec coverage: §2 and §7 → Task 1; §3.1/3.2/3.4 → Tasks 2, 4; §3.3 → Task 3; §4.1 → Tasks 4, 5; §4.2/4.3 → Tasks 5, 6; §4.4 → Tasks 5, 7; §5 → Task 7; §6 → Tasks 2-5.
- Task 1 is a deliberate gate: if custom events are not queryable, spec and Tasks 3 and 6 are revised before continuing.
- Rate limiting is a dashboard setting (spec §3.2), covered only in README.
