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

// The demo project is Arctri's own documentation: each file explains one part of the app.
export const TREE: TreeNode[] = [
  { name: 'features', path: 'features', dir: true, children: [
    { name: 'terminal.md', path: 'features/terminal.md' },
    { name: 'shells.md', path: 'features/shells.md' },
    { name: 'command-blocks.md', path: 'features/command-blocks.md' },
    { name: 'autocomplete.md', path: 'features/autocomplete.md' },
    { name: 'agents.md', path: 'features/agents.md' },
    { name: 'files-and-git.md', path: 'features/files-and-git.md' },
    { name: 'workspace.md', path: 'features/workspace.md' },
  ] },
  { name: 'README.md', path: 'README.md' },
  { name: 'requirements.md', path: 'requirements.md' },
  { name: 'privacy.md', path: 'privacy.md' },
  { name: 'LICENSE', path: 'LICENSE' },
]

// Document files get their text from i18n: mock.docs.<key> (English and Thai).
export const DOC_KEYS: Record<string, string> = {
  'README.md': 'readme',
  'features/terminal.md': 'terminal',
  'features/shells.md': 'shells',
  'features/command-blocks.md': 'blocks',
  'features/autocomplete.md': 'autocomplete',
  'features/agents.md': 'agents',
  'features/files-and-git.md': 'files',
  'features/workspace.md': 'workspace',
  'requirements.md': 'requirements',
  'privacy.md': 'privacy',
}

export const FILES: Record<string, string[]> = {
  LICENSE: [
    'MIT License',
    '',
    'Permission is hereby granted, free of charge, to any person obtaining a copy',
    'of this software and associated documentation files (the "Software"), to deal',
    'in the Software without restriction.',
  ],
}

export const CHANGED = [
  { flag: 'M', path: 'README.md' },
  { flag: 'M', path: 'features/agents.md' },
]

export const KNOWN_COMMANDS = [
  'help', 'clear', 'cls', 'ls', 'dir', 'pwd', 'whoami', 'echo', 'date',
  'node -v', 'git status', 'git branch', 'claude', 'codex', 'agy',
]
