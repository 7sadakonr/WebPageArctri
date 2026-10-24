// Uploads Arctri installers to the Vercel Blob store and rewrites latest.json.
//
//   npm run publish-release -- --version 0.2.0-beta \
//     --win  path\to\Arctri-Setup-0.2.0-x64.exe \
//     --mac-arm path\to\Arctri-0.2.0-arm64.dmg \
//     --mac-intel path\to\Arctri-0.2.0.dmg
//
// Needs BLOB_READ_WRITE_TOKEN (put it in .env.local, which is git-ignored).
// latest.json is rebuilt from the flags you pass, so pass every platform you want listed.
import { put } from '@vercel/blob'
import { createReadStream, statSync } from 'node:fs'
import { basename } from 'node:path'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    version: { type: 'string' },
    win: { type: 'string' },
    'mac-arm': { type: 'string' },
    'mac-intel': { type: 'string' },
  },
})

// A pasted CI secret often carries a trailing newline, which makes the Authorization header invalid.
if (process.env.BLOB_READ_WRITE_TOKEN) {
  process.env.BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN.replace(/\s+/g, '')
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Missing BLOB_READ_WRITE_TOKEN (add it to .env.local).')
  process.exit(1)
}
if (!values.version || !(values.win || values['mac-arm'] || values['mac-intel'])) {
  console.error('Usage: npm run publish-release -- --version <v> [--win <exe>] [--mac-arm <dmg>] [--mac-intel <dmg>]')
  process.exit(1)
}

async function upload(file) {
  const blob = await put(`releases/${values.version}/${basename(file)}`, createReadStream(file), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    multipart: true,
  })
  console.log(`uploaded ${basename(file)}`)
  return { url: blob.url, size: statSync(file).size }
}

const manifest = { version: values.version }
if (values.win) manifest.windows = await upload(values.win)
if (values['mac-arm']) manifest.macArm = await upload(values['mac-arm'])
if (values['mac-intel']) manifest.macIntel = await upload(values['mac-intel'])

const latest = await put('latest.json', JSON.stringify(manifest, null, 2), {
  access: 'public',
  addRandomSuffix: false,
  allowOverwrite: true,
  contentType: 'application/json',
  cacheControlMaxAge: 60,
})
console.log(`\nManifest: ${latest.url}`)
console.log('If this differs from MANIFEST_URL in src/config.ts, set VITE_MANIFEST_URL on Vercel to this URL.')
