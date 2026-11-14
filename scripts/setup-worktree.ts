// Prepares a freshly created git worktree: copies untracked local files from the main checkout and installs dependencies.
// Run with: node scripts/setup-worktree.ts (Node 26 strips TS types natively)
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync } from 'node:fs'
import path from 'node:path'

const LOCAL_FILES: Array<string> = ['.env', '.data', '.claude/settings.local.json']

function git(args: Array<string>, cwd: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

const worktreeRoot = git(['rev-parse', '--show-toplevel'], process.cwd())
// The first entry of `git worktree list` is always the main checkout
const mainRoot = git(['worktree', 'list', '--porcelain'], worktreeRoot).split('\n')[0].replace(/^worktree /, '')

if (path.resolve(mainRoot) === path.resolve(worktreeRoot)) {
  console.log('Running in the main checkout — skipping local file copy.')
} else {
  for (const relative of LOCAL_FILES) {
    const source = path.join(mainRoot, relative)
    const target = path.join(worktreeRoot, relative)
    if (!existsSync(source)) {
      console.log(`skip   ${relative} (missing in main checkout)`)
    } else if (existsSync(target)) {
      console.log(`keep   ${relative} (already present)`)
    } else {
      cpSync(source, target, { recursive: true })
      console.log(`copied ${relative}`)
    }
  }
}

console.log('Installing dependencies…')
execFileSync('pnpm', ['install', '--frozen-lockfile'], { cwd: worktreeRoot, stdio: 'inherit' })
console.log('Worktree ready.')
