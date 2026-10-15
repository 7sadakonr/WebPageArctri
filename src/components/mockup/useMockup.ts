import { inject, provide, reactive, ref, computed, type InjectionKey } from 'vue'
import { PROFILES, TREE, promptFor, type OS, type ShellId, type TreeNode } from './data'
import { execute } from './commands'

export interface Block {
  id: number
  prompt: string
  cmd: string
  out: string
  ok: boolean
  time: string
  label?: string
  collapsed: boolean
}

export interface Term {
  id: number
  shell: ShellId
  blocks: Block[]
  history: string[]
  input: string
  hIdx: number
  agent: string | null
}

export interface Row { node: TreeNode; depth: number }
export type WinState = 'normal' | 'minimized' | 'maximized'

export function createMockup(initial: OS) {
  let uid = 1
  const next = () => uid++

  const os = ref<OS>(initial) // fixed for the page's lifetime: detected from the visitor's browser
  const win = ref<WinState>('normal')
  const closed = ref(false)
  const branch = ref('main')
  const openMenu = ref<string | null>(null)

  const filesOpen = ref(true)
  const editorOpen = ref(true)
  const sideTab = ref<'files' | 'git'>('files')
  const filter = ref('')
  const expanded = ref<string[]>(['features'])
  const tabs = ref<string[]>(['README.md'])
  const activeFile = ref<string | null>('README.md')
  const activeLine = ref<number | null>(null)

  const selectedBlock = ref<number | null>(null)

  function seed(): Term[] {
    const shell = PROFILES[os.value].shells[0] as ShellId
    const prompt = promptFor(shell, os.value)
    const mk = (cmd: string, time: string): Block => ({
      id: next(), prompt, cmd, out: '', ok: true, time, label: 'Interactive program', collapsed: false,
    })
    const blocks = [mk('claude', '53 s'), mk('agy', '12 s'), mk('codex', '5.5 s')]
    selectedBlock.value = blocks[1].id
    return [{ id: next(), shell, blocks, history: [], input: '', hIdx: 0, agent: null }]
  }

  const terms = ref<Term[]>(seed())
  const activeTerm = ref<number | null>(terms.value[0].id)

  const activeTermObj = computed(() => terms.value.find((t) => t.id === activeTerm.value) ?? null)

  // ── window ──
  const closeWindow = () => { closed.value = true; openMenu.value = null }
  const reopenWindow = () => { closed.value = false; win.value = 'normal' }
  const minimize = () => { win.value = 'minimized'; openMenu.value = null }
  const restore = () => { win.value = 'normal' }
  const toggleMaximize = () => { win.value = win.value === 'maximized' ? 'normal' : 'maximized' }

  // ── menus ──
  const toggleMenu = (id: string) => { openMenu.value = openMenu.value === id ? null : id }
  const setMenu = (id: string) => { openMenu.value = id }
  const closeMenus = () => { openMenu.value = null }

  // ── terminals ──
  function newTerm(shell?: ShellId) {
    const t: Term = {
      id: next(), shell: shell ?? (PROFILES[os.value].shells[0] as ShellId),
      blocks: [], history: [], input: '', hIdx: 0, agent: null,
    }
    terms.value.push(t)
    activeTerm.value = t.id
    openMenu.value = null
  }

  function closeTerm(id: number) {
    const i = terms.value.findIndex((t) => t.id === id)
    if (i < 0) return
    terms.value.splice(i, 1)
    if (activeTerm.value === id) activeTerm.value = (terms.value[i] ?? terms.value[i - 1])?.id ?? null
  }

  function runCommand(t: Term, raw: string) {
    const cmd = raw.trim()
    t.input = ''
    if (!cmd) return
    t.history.push(cmd)
    t.hIdx = t.history.length
    const res = execute(cmd, { shell: t.shell, os: os.value, branch: branch.value })
    if (res.clear) { t.blocks.splice(0); return }
    const block: Block = {
      id: next(),
      prompt: promptFor(t.shell, os.value),
      cmd,
      out: res.out,
      ok: res.ok,
      time: res.agent ? '0 s' : `${Math.floor(20 + Math.random() * 180)}ms`,
      label: res.agent ? 'Interactive program' : undefined,
      collapsed: false,
    }
    t.blocks.push(block)
    selectedBlock.value = block.id
    if (res.agent) t.agent = res.agent
  }

  const clearTerm = (t: Term) => { t.blocks.splice(0) }
  const exitAgent = (t: Term) => { t.agent = null }

  // ── editor / files ──
  function openFile(path: string) {
    if (!tabs.value.includes(path)) tabs.value.push(path)
    activeFile.value = path
    activeLine.value = null
    editorOpen.value = true
  }

  function closeFile(path: string) {
    const i = tabs.value.indexOf(path)
    if (i < 0) return
    tabs.value.splice(i, 1)
    if (activeFile.value === path) activeFile.value = tabs.value[i] ?? tabs.value[i - 1] ?? null
    activeLine.value = null
  }

  function selectFile(path: string) { activeFile.value = path; activeLine.value = null }

  function toggleDir(path: string) {
    const i = expanded.value.indexOf(path)
    if (i >= 0) expanded.value.splice(i, 1)
    else expanded.value.push(path)
  }

  const rows = computed<Row[]>(() => {
    const q = filter.value.trim().toLowerCase()
    const walk = (nodes: TreeNode[], depth: number): Row[] => {
      const out: Row[] = []
      for (const n of nodes) {
        if (q) {
          if (n.dir) {
            const sub = walk(n.children ?? [], depth + 1)
            if (sub.length || n.name.toLowerCase().includes(q)) out.push({ node: n, depth }, ...sub)
          } else if (n.name.toLowerCase().includes(q)) out.push({ node: n, depth })
        } else {
          out.push({ node: n, depth })
          if (n.dir && expanded.value.includes(n.path)) out.push(...walk(n.children ?? [], depth + 1))
        }
      }
      return out
    }
    return walk(TREE, 0)
  })

  // ── menu actions ──
  function runAction(id: string) {
    openMenu.value = null
    const t = activeTermObj.value
    switch (id) {
      case 'new-tab':
      case 'new-terminal': newTerm(); break
      case 'close-tab': if (t) closeTerm(t.id); break
      case 'open-readme': openFile('README.md'); break
      case 'clear': if (t) clearTerm(t); break
      case 'toggle-files': filesOpen.value = !filesOpen.value; break
      case 'toggle-editor': editorOpen.value = !editorOpen.value; break
      case 'run-claude': {
        if (!t) newTerm()
        const target = activeTermObj.value
        if (target) runCommand(target, 'claude')
        break
      }
      case 'about': openMenu.value = 'about'; break
    }
  }

  return reactive({
    os, win, closed, branch, openMenu,
    filesOpen, editorOpen, sideTab, filter, expanded, tabs, activeFile, activeLine,
    selectedBlock, terms, activeTerm, activeTermObj, rows,
    closeWindow, reopenWindow, minimize, restore, toggleMaximize,
    toggleMenu, setMenu, closeMenus, runAction,
    newTerm, closeTerm, runCommand, clearTerm, exitAgent,
    openFile, closeFile, selectFile, toggleDir,
  })
}

export type Mockup = ReturnType<typeof createMockup>
const KEY: InjectionKey<Mockup> = Symbol('arctri-mockup')

export function provideMockup(initial: OS): Mockup {
  const m = createMockup(initial)
  provide(KEY, m)
  return m
}

export function useMockup(): Mockup {
  const m = inject(KEY)
  if (!m) throw new Error('useMockup() must be used inside <TerminalMockup>')
  return m
}
