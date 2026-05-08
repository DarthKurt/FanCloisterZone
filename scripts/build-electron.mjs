import { build as viteBuild } from 'vite'
import { builtinModules } from 'module'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')

const external = [
    'electron',
    'electron-log',
    'electron-log/main',
    'electron-updater',
    'discord-rpc',
    ...builtinModules,
    ...builtinModules.map((m) => `node:${m}`),
]

async function buildEntry(name) {
    await viteBuild({
        configFile: false,
        root: ROOT,
        build: {
            outDir: 'dist/main',
            emptyOutDir: name === 'index',
            minify: false,
            lib: {
                entry: `src/main/${name}.js`,
                formats: ['cjs'],
                fileName: () => `${name}.js`,
            },
            rollupOptions: { external },
        },
        // DEV_RESOURCES_PATH is only consumed by preload.js
        ...(name === 'preload' && {
            define: {
                DEV_RESOURCES_PATH: JSON.stringify(resolve(ROOT, 'src/extraResources'))
            }
        }),
        logLevel: 'warn',
    })
    console.log(`[electron] ✔ ${name}.js`)
}

await buildEntry('index')
await buildEntry('preload')