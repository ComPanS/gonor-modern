import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const sourceRoot = join(projectRoot, 'src')
const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx'])
const failures = []

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      await visit(path)
    } else if (sourceExtensions.has(extname(entry.name))) {
      inspect(path, await readFile(path, 'utf8'))
    }
  }
}

function inspect(path, source) {
  const rules = [
    {
      pattern: /(["'`])\/#[-\w]+\1/g,
      message: 'Root-relative hash link escapes a GitHub Pages project path; use #section.',
    },
    {
      pattern: /\bhref\s*=\s*(?:\{\s*)?(["'`])#\1(?:\s*\})?/g,
      message: 'Inert href="#" is not a meaningful destination.',
    },
  ]

  for (const rule of rules) {
    for (const match of source.matchAll(rule.pattern)) {
      const line = source.slice(0, match.index).split('\n').length
      failures.push(`${relative(projectRoot, path)}:${line}: ${rule.message}`)
    }
  }
}

await visit(sourceRoot)

if (failures.length > 0) {
  console.error('Unsafe internal links found:\n' + failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('Internal link validation passed.')
}
