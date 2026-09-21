import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

const rawUrl = process.argv[2] || process.env.SCREENSHOT_URL
const outputPath = resolve(
  process.cwd(),
  process.argv[3] || 'outreach/screenshots/landing.jpg',
)

if (!rawUrl) {
  console.error('Usage: npm run screenshot -- <published-url> [output-path]')
  process.exit(1)
}

let url
try {
  url = new URL(rawUrl)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
} catch {
  console.error(`Invalid published URL: ${rawUrl}`)
  process.exit(1)
}

await mkdir(dirname(outputPath), { recursive: true })
const { chromium } = await import('playwright')

const launchBrowser = async () => {
  try {
    return await chromium.launch({ headless: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes('playwright install')) throw error

    console.log('Chromium is not installed. Installing it now...')
    const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
    const result = spawnSync(npx, ['playwright', 'install', 'chromium'], {
      stdio: 'inherit',
    })

    if (result.status !== 0) {
      throw new Error('Unable to install Chromium for Playwright')
    }

    return chromium.launch({ headless: true })
  }
}

const browser = await launchBrowser()

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  })

  await page.goto(url.href, { waitUntil: 'networkidle', timeout: 45_000 })
  await page.evaluate(() => document.fonts.ready)

  const brokenImages = await page.locator('img').evaluateAll((images) =>
    images
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src || image.alt || '<unknown>'),
  )

  if (brokenImages.length > 0) {
    throw new Error(`Broken images detected:\n${brokenImages.join('\n')}`)
  }

  const screenshot = await page.screenshot({
    type: 'jpeg',
    quality: 84,
    animations: 'disabled',
    caret: 'hide',
    scale: 'css',
  })

  await writeFile(outputPath, screenshot)
  console.log(`Screenshot saved: ${outputPath}`)
} finally {
  await browser.close()
}
