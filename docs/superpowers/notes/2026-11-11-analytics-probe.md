# Vercel Web Analytics API probe — 2026-11-11

Probed with the owner's token against the Arctri website project (last 7 days).

| Endpoint | Result |
|---|---|
| `GET /v1/query/web-analytics/visits/aggregate?by=osName` | 200, `{version, query, data: []}` (no traffic yet because the analytics script is not deployed) |
| `GET /v1/query/web-analytics/visits/aggregate?by=timestamp` | 400. `by` must be one of: hour, day, week, month, year, country, deviceType, environment, requestPath, referrerHostname, osName, browserName, route, utmSource, utmMedium, utmCampaign, utmContent, utmTerm, flags (or `flags/<name>`). Time series uses `by=day`. |
| `GET /v1/query/web-analytics/events/aggregate?by=eventName` | **402 payment_required: "Accessing Analytics custom events requires an Enterprise or Pro plan."** |

Query params confirmed: `projectId`, `since`, `until` (ISO), `limit`, `by`, optional `teamId`, `filter`.

## Consequence

Visits, countries, OS, referrers and the time series are available on the current plan.
Querying `download_click` custom events is not. Spec §2 / §7 needs an owner decision.
