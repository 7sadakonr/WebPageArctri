// Mirrors the newest GitHub release of the Arctri app into our Vercel Blob store.
//
// Compares the app repo's latest (non-draft, pre-releases included) release with the
// version in latest.json. When they differ it downloads the installers, verifies their
// SHA-256 against the digest GitHub publishes, then hands them to publish-release.mjs.
//
// Env: BLOB_READ_WRITE_TOKEN (required unless DRY_RUN), GITHUB_TOKEN (optional, raises
// the API rate limit), FORCE=true (re-publish even if versions match), DRY_RUN=1 (only
// report what would be done).
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'

const APP_REPO = process.env.APP_REPO ?? '7sadakonr/Arctri'
const MANIFEST_URL =
  process.env.MANIFEST_URL ?? 'https://c6msr6ovuqmhahef.public.blob.vercel-storage.com/latest.json'
const force = process.env.FORCE === 'true'
const dryRun = Boolean(process.env.DRY_RUN)

// Which release asset feeds which download button.
const PLATFORMS = [
  { flag: '--win', re: /Setup.*x64\.exe$/i },
  { flag: '--mac-arm', re: /arm64\.dmg$/i },
  { flag: '--mac-intel', re: /x64\.dmg$/i },
]

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'arctri-website-sync' }
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

const res = await fetch(`https://api.github.com/repos/${APP_REPO}/releases?per_page=10`, { headers })
if (!res.ok) throw new Error(`GitHub API ${res.status} for ${APP_REPO}`)
const release = (await res.json()).find((r) => !r.draft)
if (!release) {
  console.log('No published release found, nothing to do.')
  process.exit(0)
}
const version = release.tag_name.replace(/^v/, '')

let current = null
try {
  const m = await fetch(MANIFEST_URL, { cache: 'no-store' })
  if (m.ok) current = (await m.json()).version
} catch {}

console.log(`GitHub latest: ${version} | published manifest: ${current ?? 'none'}`)
if (current === version && !force) {
  console.log('Already up to date.')
  process.exit(0)
}

const picked = PLATFORMS.map((p) => ({ ...p, asset: release.assets.find((a) => p.re.test(a.name)) }))
for (const p of picked) console.log(`  ${p.flag}: ${p.asset ? `${p.asset.name} (${(p.asset.size / 1048576).toFixed(1)} MB)` : 'not in this release'}`)
const found = picked.filter((p) => p.asset)
if (!found.length) {
  console.log('Release has no matching installers, skipping.')
  process.exit(0)
}
if (dryRun) {
  console.log('DRY_RUN set, stopping before download.')
  process.exit(0)
}
if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Missing BLOB_READ_WRITE_TOKEN')

const dir = await mkdtemp(join(tmpdir(), 'arctri-release-'))
try {
  const args = ['scripts/publish-release.mjs', '--version', version]
  for (const { flag, asset } of found) {
    const file = join(dir, asset.name)
    const dl = await fetch(asset.browser_download_url)
    if (!dl.ok) throw new Error(`Download failed (${dl.status}): ${asset.name}`)
    await pipeline(Readable.fromWeb(dl.body), createWriteStream(file))

    const expected = asset.digest?.replace(/^sha256:/, '').toLowerCase()
    if (expected) {
      const hash = createHash('sha256')
      await pipeline(createReadStream(file), hash)
      if (hash.digest('hex') !== expected) throw new Error(`Checksum mismatch: ${asset.name}`)
    } else {
      console.warn(`No digest published for ${asset.name}, skipping checksum.`)
    }
    console.log(`downloaded ${asset.name}`)
    args.push(flag, file)
  }
  execFileSync(process.execPath, args, { stdio: 'inherit' })
} finally {
  await rm(dir, { recursive: true, force: true })
}
