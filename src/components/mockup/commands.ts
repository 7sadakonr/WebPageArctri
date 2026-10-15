import { KNOWN_COMMANDS, BRANCHES, CHANGED, PROFILES, TREE, type OS, type ShellId } from './data'

export interface ExecResult {
  out: string
  ok: boolean
  clear?: boolean
  agent?: string
}

interface Ctx { shell: ShellId; os: OS; branch: string }

const AGENTS: Record<string, string> = { claude: 'Claude Code', codex: 'Codex CLI', agy: 'agy' }
const rootNames = () => [...TREE].sort((a, b) => Number(!!b.dir) - Number(!!a.dir))

function notFound(cmd: string, shell: ShellId): string {
  switch (shell) {
    case 'powershell':
      return `${cmd} : The term '${cmd}' is not recognized as the name of a cmdlet, function, script file, or operable program.`
    case 'cmd':
      return `'${cmd}' is not recognized as an internal or external command,\noperable program or batch file.`
    case 'zsh':
      return `zsh: command not found: ${cmd}`
    default:
      return `bash: ${cmd}: command not found`
  }
}

function listing(shell: ShellId, os: OS): string {
  const nodes = rootNames()
  if (shell === 'powershell') {
    const rows = nodes.map((n) => `${n.dir ? 'd----' : '-a---'}  ${n.name}`)
    return [`    Directory: ${PROFILES[os].path}`, '', 'Mode   Name', '----   ----', ...rows].join('\n')
  }
  if (shell === 'cmd') {
    const rows = nodes.map((n) => (n.dir ? `<DIR>   ${n.name}` : `        ${n.name}`))
    return [` Directory of ${PROFILES[os].path}`, '', ...rows].join('\n')
  }
  return nodes.map((n) => n.name).join('  ')
}

export function execute(raw: string, ctx: Ctx): ExecResult {
  const { shell, os, branch } = ctx
  const [cmd = '', ...rest] = raw.trim().split(/\s+/)
  const name = cmd.toLowerCase()
  const arg = rest.join(' ')

  if (name === 'cls' && (shell === 'powershell' || shell === 'cmd')) return { out: '', ok: true, clear: true }
  if (name === 'clear' && shell !== 'cmd') return { out: '', ok: true, clear: true }

  if (name === 'help') {
    return { ok: true, out: `Demo commands: ${KNOWN_COMMANDS.filter((c) => !c.includes(' ')).join(', ')}, node -v, git status, git branch` }
  }
  if (name === 'ls' && shell !== 'cmd') return { ok: true, out: listing(shell, os) }
  if (name === 'dir') return { ok: true, out: listing(shell, os) }
  if (name === 'pwd' && shell !== 'cmd') {
    const path = shell === 'wsl' ? '/mnt/d/Arctri' : PROFILES[os].path
    return { ok: true, out: shell === 'powershell' ? `Path\n----\n${path}` : path }
  }
  if (name === 'cd' && shell === 'cmd' && !arg) return { ok: true, out: PROFILES[os].path }
  if (name === 'whoami') return { ok: true, out: shell === 'powershell' || shell === 'cmd' ? PROFILES.windows.user : 'dev' }
  if (name === 'echo') return { ok: true, out: arg }
  if (name === 'date') return { ok: true, out: new Date().toString() }
  if (name === 'node' && (arg === '-v' || arg === '--version')) return { ok: true, out: 'v24.21.0' }

  if (name === 'git') {
    if (arg === 'status') {
      const changed = CHANGED.map((c) => `\tmodified:   ${c.path}`)
      return { ok: true, out: [`On branch ${branch}`, 'Changes not staged for commit:', ...changed].join('\n') }
    }
    if (arg === 'branch') {
      return { ok: true, out: BRANCHES.map((b) => `${b === branch ? '*' : ' '} ${b}`).join('\n') }
    }
    return { ok: false, out: `git: '${arg}' is not supported in this demo (try: git status, git branch)` }
  }

  const agent = AGENTS[name]
  if (agent && !arg) return { ok: true, out: `Starting ${agent}…`, agent }

  return { ok: false, out: notFound(cmd, shell) }
}

export function suggest(input: string, history: string[]): string | null {
  if (!input) return null
  const pool = [...history].reverse().concat(KNOWN_COMMANDS)
  return pool.find((c) => c.startsWith(input) && c !== input) ?? null
}
