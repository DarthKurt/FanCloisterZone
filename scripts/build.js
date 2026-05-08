'use strict'

/**
 * Production build script:
 * 1. Download game engine (unless --skip-engine)
 * 2. nuxt generate → dist/renderer/
 * 3. electron-vite build → dist/main/ + dist/preload/
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

// Resolve binaries without triggering package "exports" resolution errors.
// Only treat a candidate path as valid if the file actually exists on disk.
const _nuxtCandidate = path.join(ROOT, 'node_modules', 'nuxt', 'bin', 'nuxt.mjs')
const NUXT_BIN = fs.existsSync(_nuxtCandidate) ? _nuxtCandidate : null
const _evCandidateA = path.join(ROOT, 'node_modules', 'electron-vite', 'bin', 'electron-vite.js')
const _evCandidateB = path.join(ROOT, 'node_modules', '.bin', 'electron-vite')
let ELECTRON_VITE_BIN = null
if (fs.existsSync(_evCandidateA)) ELECTRON_VITE_BIN = _evCandidateA
else if (fs.existsSync(_evCandidateB)) ELECTRON_VITE_BIN = _evCandidateB
else ELECTRON_VITE_BIN = null

const NUXT_OUTPUT_DIR = path.join(ROOT, 'src', 'renderer', '.output', 'public')
const RENDERER_DIST_DIR = path.join(ROOT, 'dist', 'renderer')
const skipEngine = process.argv.includes('--skip-engine')

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`)
  execSync(cmd, { stdio: 'inherit', ...opts })
}

function runNodeScript(label, scriptPath, args, opts = {}) {
  const quotedArgs = args.map(arg => JSON.stringify(arg)).join(' ')
  console.log(`\n> node ${path.relative(ROOT, scriptPath)} ${quotedArgs}`)
  execSync(`${JSON.stringify(process.execPath)} ${JSON.stringify(scriptPath)} ${args.map(arg => JSON.stringify(arg)).join(' ')}`, {
    stdio: 'inherit',
    ...opts
  })
}

if (!skipEngine) {
  try {
    run('node build-scripts/download-game-engine.js', { cwd: ROOT })
  } catch {
    console.warn('Warning: could not download game engine, continuing...')
  }
}

// Build renderer (Nuxt 3 static generation)
if (NUXT_BIN) {
  runNodeScript('nuxt generate', NUXT_BIN, ['generate'], {
    cwd: path.join(ROOT, 'src', 'renderer'),
    env: { ...process.env, NODE_ENV: 'production' }
  })
} else {
  // Fallback to `yarn exec nuxt generate` when direct bin path can't be resolved.
  // Run from repo root and pass the renderer directory so Yarn PnP resolves packages.
  run(`yarn exec nuxt generate ${JSON.stringify(path.join(ROOT, 'src', 'renderer'))}`, { cwd: ROOT, env: { ...process.env, NODE_ENV: 'production' } })
}

fs.rmSync(RENDERER_DIST_DIR, { recursive: true, force: true })
fs.mkdirSync(path.dirname(RENDERER_DIST_DIR), { recursive: true })
fs.cpSync(NUXT_OUTPUT_DIR, RENDERER_DIST_DIR, { recursive: true })

// Build main process + preload via electron-vite
if (ELECTRON_VITE_BIN) {
  runNodeScript('electron-vite build', ELECTRON_VITE_BIN, ['build'], {
    cwd: ROOT,
    env: { ...process.env, NODE_ENV: 'production' }
  })
} else {
  run('yarn exec electron-vite build', { cwd: ROOT, env: { ...process.env, NODE_ENV: 'production' } })
}

console.log('\nBuild complete!')
