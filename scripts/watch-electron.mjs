import { watch } from 'fs'
import { spawn } from 'child_process'
import { existsSync } from 'fs'

function build() {
    return new Promise((resolve) => {
        const child = spawn(process.execPath, ['scripts/build-electron.mjs'], {
            stdio: 'inherit',
            cwd: process.cwd(),
        })
        child.on('exit', resolve)
    })
}

// Initial build
await build()

// Watch src/main/ for changes
watch('src/main', { recursive: true }, async (event, filename) => {
    console.log(`[electron] ${filename} changed, rebuilding...`)
    await build()
})

watch('src/renderer', { recursive: true }, async (event, filename) => {
    console.log(`[electron] ${filename} changed, rebuilding...`)
    await build()
})