import { cp, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const routes = ['/about', '/services', '/contact']
const dist = new URL('../dist/', import.meta.url).pathname

for (const route of routes) {
  const target = join(dist, route, 'index.html')
  await mkdir(dirname(target), { recursive: true })
  await cp(join(dist, 'index.html'), target)
}

await cp(join(dist, 'index.html'), join(dist, '404.html'))
await writeFile(join(dist, '.nojekyll'), '')
