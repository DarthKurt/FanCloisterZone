import { spawn } from 'node:child_process'

const yarnCmd = process.platform === 'win32' ? 'yarn.cmd' : 'yarn'

const child = spawn(
  yarnCmd,
  ['nuxt', 'dev', '--no-fork'],
  {
    stdio: 'inherit',
    env: {
      ...process.env
    }
  }
)

child.on('exit', (code) => {
  process.exit(code ?? 0)
})