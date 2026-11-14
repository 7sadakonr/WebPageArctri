# Admin Insights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add period-over-period visit comparison and a release sync-status card to the `/admin` dashboard.

**Architecture:** Extend the existing `Overview` pipeline: `fetchVercelStats` gains a previous-window request, a new `fetchManifest` is a third independent source, and `buildOverview` computes `visitsChangePct` and `sync`. The Vue dashboard gets a change line on the Visits card and a `SyncCard`.

**Tech Stack:** Vue 3, TypeScript, Vitest, Vercel Functions (existing).

**Spec:** `docs/superpowers/specs/2026-11-14-admin-insights-design.md` (builds on `2026-11-11-admin-analytics-design.md`)

## Global Constraints

- No new storage, cron, env secret or dependency. Only optional env `MANIFEST_URL`, default `https://c6msr6ovuqmhahef.public.blob.vercel-storage.com/latest.json`.
- Each source fails independently: HTTP stays 200 with `sources.<name> = "error"` (spec §3).
- Version strings compare with a leading `v` stripped; drafts skipped, pre-releases counted (as `scripts/sync-release.mjs`).
- Status is never colour-only: text plus symbol. i18n keys in `en.ts` and `th.ts` under `admin.dashboard.*`.
- Run `npm test`, `npx tsc -p tsconfig.api.json` and `npm run build` before each commit.

## Review Focus

1. Previous period total is 0 (new site): `visitsChangePct` is `null`, never `Infinity`/`NaN` (Task 1).
2. GitHub has no published release, or only drafts: `sync.status` is `unknown`, not `behind` (Task 2).
3. Manifest `version` missing or not a string: `unknown`, no throw (Task 2).
4. Manifest URL returns 404/500 or the host is down: HTTP 200, `sources.manifest = "error"`, other cards intact (Task 2).
5. Tag `v1.2.0` vs manifest `1.2.0`: `in-sync` (Task 2).

---

### Task 1: Period comparison (API)

**Files:**
- Modify: `api/_lib/types.ts`, `api/_lib/vercelAnalytics.ts`, `api/_lib/overview.ts`
- Test: `api/_lib/overview.test.ts` (update fixtures: `VercelRaw` gains `previousSeries`; the "queries four dimensions" test now expects five requests, `day` twice)

**Interfaces:**
- Produces: `VercelRaw.previousSeries: VercelRow[]`; `Overview.totals` gains `visitsPrevious: number` and `visitsChangePct: number | null`. `buildOverview` signature unchanged in this task.

- [ ] **Step 1: Write failing tests** in `overview.test.ts`: with `series` visitors 10+5 and `previousSeries` visitors 10 total, `totals.visitsPrevious` is 10 and `visitsChangePct` is 50; a decrease (15 vs 20) gives -25; equal gives 0; `previousSeries: []` gives `visitsChangePct` null and `visitsPrevious` 0 (Review Focus 1); Vercel `Error` gives null. In the `fetchVercelStats` tests (use `vi.useFakeTimers` and `setSystemTime`), assert two `by=day` requests: one with `since = now - R days, until = now`, one with `since = now - 2R days, until = now - R days`, both `limit = R + 1`.
- [ ] **Step 2: Run** `npx vitest run api/_lib/overview.test.ts`. Expected: FAIL on the new assertions.
- [ ] **Step 3: Implement.** In `vercelAnalytics.ts` make the inner `query(by, since, until)` take an explicit window and request `previousSeries`; in `buildOverview` sum `previousSeries` with the same `count` helper and compute `Math.round((cur - prev) / prev * 100)`, `null` when `prev` is 0.
- [ ] **Step 4: Run** `npx vitest run api/_lib/overview.test.ts` then `npm test` and `npx tsc -p tsconfig.api.json`. Expected: PASS (update `api/admin/_handlers.test.ts` mock body only if it fails).
- [ ] **Step 5: Commit** `feat(admin): compare visits with the previous period`.

### Task 2: Sync status (API)

**Files:**
- Create: `api/_lib/manifest.ts`
- Modify: `api/_lib/types.ts`, `api/_lib/githubReleases.ts`, `api/_lib/overview.ts`, `api/admin/overview.ts`
- Test: `api/_lib/overview.test.ts`, `api/admin/_handlers.test.ts`

**Interfaces:**
- Produces:
  - `ManifestRaw = { version: string | null }`; `GithubRaw.latestTag: string | null`
  - `fetchManifest(url: string, fetchImpl?: typeof fetch): Promise<ManifestRaw>`; `DEFAULT_MANIFEST_URL: string` (both exported from `manifest.ts`)
  - `buildOverview(range: Range, vercel: VercelRaw | Error, github: GithubRaw | Error, manifest: ManifestRaw | Error): Overview`
  - `Overview.sources.manifest: SourceStatus`; `Overview.sync: { website: string | null; github: string | null; status: 'in-sync' | 'behind' | 'unknown' }`

- [ ] **Step 1: Write failing tests.** `overview.test.ts`: `fetchGithubDownloads` returns `latestTag` `'0.3.0'` for the first non-draft release and `null` when there are none or only drafts; `fetchManifest` returns the string `version`, `null` for a missing or non-string `version` (Review Focus 3), and throws on non-2xx; `buildOverview` sync: equal gives `in-sync`, differing gives `behind`, `v1.2.0` vs `1.2.0` gives `in-sync` (Review Focus 5), GitHub `latestTag` null gives `unknown` (Review Focus 2), either source `Error` gives `unknown` with that `sources` entry `"error"`. Update existing `buildOverview` calls to pass a fourth argument. `_handlers.test.ts`: extend `mockUpstreams` to answer URLs containing `blob.vercel-storage.com` with `{ version: '1.0.0' }` (option `manifest?: number` for status); assert overview has `sync.status === 'in-sync'`, and with `manifest: 404` still HTTP 200 with `sources.manifest === 'error'` and other sources `ok` (Review Focus 4).
- [ ] **Step 2: Run** `npx vitest run api/`. Expected: FAIL (module `manifest` missing, type and shape errors).
- [ ] **Step 3: Implement** the interfaces above. `latestTag` is the first non-draft release tag with `^v` stripped. Status logic: either value `null` gives `unknown`, else strict string equality. In `api/admin/overview.ts` read `process.env.MANIFEST_URL ?? DEFAULT_MANIFEST_URL`, run the manifest fetch in parallel with the others using the same `.catch(asError)` and server-side logging pattern.
- [ ] **Step 4: Run** `npm test`, `npx tsc -p tsconfig.api.json`. Expected: all PASS.
- [ ] **Step 5: Commit** `feat(admin): release sync status source`.

### Task 3: Dashboard UI, copy and docs

**Files:**
- Create: `src/admin/formatChange.ts`, `src/admin/components/SyncCard.vue`
- Test: `src/admin/formatChange.test.ts`
- Modify: `src/admin/components/StatCard.vue`, `src/admin/Dashboard.vue`, `src/i18n/en.ts`, `src/i18n/th.ts`, `.env.example` (optional `MANIFEST_URL`), `README.md` (env table row, note on sync card)

**Interfaces:**
- Consumes: `Overview` from Tasks 1-2.
- Produces: `formatChange(pct: number | null): string`; `StatCard` optional prop `change?: number | null` (shown only when the prop is passed) and `changeLabel?: string`; `SyncCard` props `{ sync: Overview['sync']; failed?: boolean }`.

- [ ] **Step 1: Write failing test** `formatChange.test.ts`: `12` gives `'▲ 12%'`, `-5` gives `'▼ 5%'`, `0` gives `'0%'`, `null` gives `'—'`.
- [ ] **Step 2: Run** `npx vitest run src/admin/formatChange.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `formatChange`, then the components. `StatCard` renders the change line under the value with `changeLabel` ("vs previous N days"); `Dashboard` passes `data.totals.visitsChangePct`; the Visits card shows `—` while `sources.vercel` is error (existing failed state). `SyncCard` shows website version, GitHub version, status text with a symbol (`✓ in sync`, `⚠ behind`, `? unknown`) and the note about releases without matching installers; failed state uses the existing "could not load" copy. Add EN/TH keys (`vsPrevious`, `sync.title`, `sync.website`, `sync.github`, `sync.status.*`, `sync.note`).
- [ ] **Step 4: Run** `npm test`, `npx tsc -p tsconfig.api.json`, `npm run build`. Expected: PASS and build succeeds.
- [ ] **Step 5: Manual check** (owner, with `vercel dev`): Visits card shows a percentage or `—`, Sync card shows both versions; confirm no layout overflow at 375 px and TH copy. Record the result in the final message (not verifiable without a browser here).
- [ ] **Step 6: Commit** `feat(admin): comparison line and sync status card`.

---

## Self-review notes

- Spec coverage: §2 → Tasks 1 and 3; §3 → Tasks 2 and 3; §4 → all; §5 → tests in each task; §6.2 is verified by Task 1's first run against fixtures (live check by owner in Task 3 Step 5).
- Proportion: three tasks, signatures and assertions only.
