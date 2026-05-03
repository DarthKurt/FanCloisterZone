import { build as viteBuild } from 'vite'
import { builtinModules } from 'module'

const external = [
    'electron',
    ...builtinModules,
    ...builtinModules.map((m) => `node:${m}`),
]

async function buildEntry(name) {
    await viteBuild({
        configFile: false,
        root: process.cwd(),
        build: {
            outDir: 'dist/main',
            emptyOutDir: name === 'main',
            minify: false,
            lib: {
                entry: `src/main/${name}.js`,
                formats: ['cjs'],
                fileName: () => `${name}.js`,
            },
            rollupOptions: { external },
        },
        logLevel: 'warn',
    })
    console.log(`[electron] ✔ ${name}.js`)
}

await buildEntry('main')
await buildEntry('preload')