export const REPO = { owner: '7sadakonr', name: 'Arctri' }
export const REPO_URL = `https://github.com/${REPO.owner}/${REPO.name}`

// Installers and latest.json live in our own Vercel Blob store (see scripts/publish-release.mjs).
export const MANIFEST_URL: string =
  import.meta.env.VITE_MANIFEST_URL ?? 'https://c6msr6ovuqmhahef.public.blob.vercel-storage.com/latest.json'
