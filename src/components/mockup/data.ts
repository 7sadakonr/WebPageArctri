export type OS = 'windows' | 'mac'
export type ShellId = 'powershell' | 'cmd' | 'wsl' | 'zsh' | 'bash'

export interface Profile {
  label: string
  path: string
  shells: ShellId[]
  menus: boolean
  user: string
}

export const PROFILES: Record<OS, Profile> = {
  windows: { label: 'Windows', path: 'D:\\Arctri', shells: ['powershell', 'cmd', 'wsl'], menus: true, user: 'arctri\\dev' },
  mac: { label: 'macOS', path: '~/Arctri', shells: ['zsh', 'bash'], menus: false, user: 'dev' },
}

export const SHELL_NAMES: Record<ShellId, string> = {
  powershell: 'Windows PowerShell',
  cmd: 'Command Prompt',
  wsl: 'Ubuntu (WSL)',
  zsh: 'zsh',
  bash: 'bash',
}

export function promptFor(shell: ShellId, os: OS): string {
  const p = PROFILES[os].path
  switch (shell) {
    case 'powershell': return `PS ${p}>`
    case 'cmd': return `${p}>`
    case 'wsl': return 'dev@arctri:/mnt/d/Arctri$'
    case 'zsh': return `${p} %`
    default: return `${p} $`
  }
}

export interface MenuItem { id: string; label: string }
export interface Menu { id: string; label: string; items: MenuItem[] }

export const MENUS: Menu[] = [
  { id: 'file', label: 'File', items: [
    { id: 'new-tab', label: 'New Tab' },
    { id: 'open-readme', label: 'Open README' },
    { id: 'close-tab', label: 'Close Tab' },
  ] },
  { id: 'edit', label: 'Edit', items: [{ id: 'clear', label: 'Clear Terminal' }] },
  { id: 'view', label: 'View', items: [
    { id: 'toggle-files', label: 'Toggle Files Panel' },
    { id: 'toggle-editor', label: 'Toggle Editor' },
  ] },
  { id: 'terminal', label: 'Terminal', items: [
    { id: 'new-terminal', label: 'New Terminal' },
    { id: 'run-claude', label: 'Run claude' },
  ] },
  { id: 'help', label: 'Help', items: [{ id: 'about', label: 'About Arctri' }] },
]

export const BRANCHES = ['main', 'dark-theme', 'feat/os-aware-mockup']

export interface TreeNode { name: string; path: string; dir?: boolean; children?: TreeNode[] }

export const TREE: TreeNode[] = [
  { name: 'dist', path: 'dist', dir: true, children: [
    { name: 'index.html', path: 'dist/index.html' },
  ] },
  { name: 'node_modules', path: 'node_modules', dir: true, children: [
    { name: '.package-lock.json', path: 'node_modules/.package-lock.json' },
  ] },
  { name: 'public', path: 'public', dir: true, children: [
    { name: 'icon.png', path: 'public/icon.png' },
  ] },
  { name: 'src', path: 'src', dir: true, children: [
    { name: 'components', path: 'src/components', dir: true, children: [
      { name: 'HeroSection.vue', path: 'src/components/HeroSection.vue' },
      { name: 'NavBar.vue', path: 'src/components/NavBar.vue' },
    ] },
    { name: 'App.vue', path: 'src/App.vue' },
    { name: 'main.ts', path: 'src/main.ts' },
    { name: 'style.css', path: 'src/style.css' },
  ] },
  { name: 'index.html', path: 'index.html' },
  { name: 'README.md', path: 'README.md' },
  { name: 'LICENSE', path: 'LICENSE' },
  { name: 'package.json', path: 'package.json' },
  { name: 'vite.config.ts', path: 'vite.config.ts' },
]

// README.md comes from i18n (mock.readme); everything else is static.
export const FILES: Record<string, string[]> = {
  'index.html': [
    '<!doctype html>',
    '<html lang="en">',
    '  <head>',
    '    <meta charset="UTF-8" />',
    '    <title>Arctri — The agent-first terminal</title>',
    '    <link rel="icon" href="/icon.png" />',
    '  </head>',
    '  <body>',
    '    <div id="app"></div>',
    '    <script type="module" src="/src/main.ts"></script>',
    '  </body>',
    '</html>',
  ],
  'package.json': [
    '{',
    '  "name": "arctri-website",',
    '  "private": true,',
    '  "type": "module",',
    '  "scripts": {',
    '    "dev": "vite",',
    '    "build": "vue-tsc --noEmit && vite build"',
    '  }',
    '}',
  ],
  'vite.config.ts': [
    "import { defineConfig } from 'vite'",
    "import vue from '@vitejs/plugin-vue'",
    "import tailwindcss from '@tailwindcss/vite'",
    '',
    'export default defineConfig({ plugins: [vue(), tailwindcss()] })',
  ],
  LICENSE: [
    'MIT License',
    '',
    'Permission is hereby granted, free of charge, to any person obtaining a copy',
    'of this software and associated documentation files (the "Software"), to deal',
    'in the Software without restriction.',
  ],
  'src/App.vue': [
    '<script setup lang="ts">',
    "import NavBar from './components/NavBar.vue'",
    "import HeroSection from './components/HeroSection.vue'",
    '</script>',
    '',
    '<template>',
    '  <NavBar />',
    '  <main>',
    '    <HeroSection />',
    '  </main>',
    '</template>',
  ],
  'src/main.ts': [
    "import { createApp } from 'vue'",
    "import App from './App.vue'",
    "import './style.css'",
    '',
    "createApp(App).mount('#app')",
  ],
  'src/style.css': [
    '@import "tailwindcss";',
    '',
    'html { scroll-behavior: smooth; }',
  ],
  'src/components/HeroSection.vue': [
    '<template>',
    '  <section class="relative px-5 pt-36 text-center">',
    '    <h1>The terminal built for AI coding agents</h1>',
    '  </section>',
    '</template>',
  ],
  'src/components/NavBar.vue': [
    '<template>',
    '  <header class="fixed inset-x-0 top-0 z-50">',
    '    <a href="#">Arctri</a>',
    '  </header>',
    '</template>',
  ],
  'dist/index.html': ['<!doctype html>', '<!-- built output -->'],
  'node_modules/.package-lock.json': ['{', '  "lockfileVersion": 3', '}'],
  'public/icon.png': ['(binary file, no preview available)'],
}

export const CHANGED = [
  { flag: 'M', path: 'src/App.vue' },
  { flag: 'M', path: 'README.md' },
]

export const KNOWN_COMMANDS = [
  'help', 'clear', 'cls', 'ls', 'dir', 'pwd', 'whoami', 'echo', 'date',
  'node -v', 'git status', 'git branch', 'claude', 'codex', 'agy',
]
