import { cp, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const dist = new URL('../dist/', import.meta.url).pathname

await cp(join(dist, 'index.html'), join(dist, '404.html'))
await writeFile(join(dist, '.nojekyll'), '')
