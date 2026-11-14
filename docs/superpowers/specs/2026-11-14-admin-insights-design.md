# Admin Insights: period comparison and sync status — Design

Date: 2026-11-14 · Branch: `feat/admin-analytics` (extends `2026-11-11-admin-analytics-design.md`)

## 1. Scope

Two additions to the existing `/admin` dashboard. Both use data sources already in place; no new
storage, cron, token or Vercel plan.

1. **Period comparison:** the Visits card shows the change versus the previous period of equal length.
2. **Sync status:** a card compares the version on the website's download manifest with the newest
   GitHub release.

**Dropped (owner decision 2026-11-14):** daily download chart (needed a cron job and a private Blob store).
**Still out of scope:** sync trigger button, alerts, backfill.

## 2. Period comparison

- `fetchVercelStats` makes one more `by=day` request for the previous window
  (`since = now - 2*range`, `until = now - range`, `limit = range + 1`), returned as `VercelRaw.previousSeries`.
- `Overview.totals` gains `visitsPrevious: number` and `visitsChangePct: number | null`.
  `visitsChangePct = round((visits - visitsPrevious) / visitsPrevious * 100)`; `null` when
  `visitsPrevious` is 0 (no division by zero) or when the Vercel source failed.
- UI: the Visits `StatCard` shows `▲ 12%` / `▼ 5%` / `0%` as text with an arrow (never colour alone),
  `—` for `null`, with a short caption "vs previous N days".
- Failure: the extra request is part of the Vercel source; any failure there keeps the existing
  behaviour (`sources.vercel = "error"`).

## 3. Sync status

- New third source `manifest`: `GET` of the manifest URL (env `MANIFEST_URL`, default
  `https://c6msr6ovuqmhahef.public.blob.vercel-storage.com/latest.json`, same as `src/config.ts`),
  reading `version`.
- `GithubRaw` gains `latestTag: string | null`: the first non-draft release (pre-releases included, as
  in `scripts/sync-release.mjs`) with a leading `v` stripped. No extra GitHub request.
- `Overview.sources` gains `manifest: "ok" | "error"`; `Overview` gains
  `sync: { website: string | null; github: string | null; status: "in-sync" | "behind" | "unknown" }`.
  - `in-sync`: both versions known and equal.
  - `behind`: both known and different.
  - `unknown`: either side missing or its source failed.
- UI: a `SyncCard` shows both versions and the status as text + icon, read-only. Note on the card: a release
  with no matching installers is skipped by the sync job and will show as `behind`.
- Failure: manifest or GitHub failing is independent of the other sources (HTTP stays 200).

## 4. Code changes

- `api/_lib/types.ts`: new fields above; `VercelRaw.previousSeries`, `GithubRaw.latestTag`, `ManifestRaw = { version: string | null }`.
- `api/_lib/vercelAnalytics.ts`: previous-window request. `api/_lib/githubReleases.ts`: set `latestTag`.
- New `api/_lib/manifest.ts`: `fetchManifest(url, fetchImpl?) => Promise<ManifestRaw>` (throws on non-2xx).
- `api/_lib/overview.ts`: `buildOverview(range, vercel, github, manifest)`; `api/admin/overview.ts` fetches the three sources in parallel.
- Frontend: `StatCard` optional change line; new `src/admin/components/SyncCard.vue`; `Dashboard.vue` layout; i18n keys `admin.dashboard.*` in `en.ts` and `th.ts`.

## 5. Testing (Vitest, as before)

- Change %: up, down, zero, previous = 0 gives `null`, Vercel error gives `null`.
- `fetchVercelStats`: requests two `day` windows with the expected `since`/`until`.
- Sync status: in-sync, behind, GitHub missing, manifest error, `v`-prefixed tag, draft skipped, pre-release counted.
- Handler: manifest down while others are fine keeps HTTP 200 with `sources.manifest = "error"`.

## 6. Open items

1. Confirm the manifest field name `version` against the live `latest.json` (the existing `useLatestRelease` reads `j.version`, so this is already relied on).
2. Whether the Vercel API returns the previous-window rows in the same shape (to verify in the first task with the owner's token).
