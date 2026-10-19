// Built Web composition at a phone viewport: the mobile plugin must attach to
// the current AppFrame, keep navigation usable, leave plugin fetching to the
// Host revision, and survive a controlled page reload without failed bundles.
import type { Browser, Page } from 'playwright'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  acknowledgeReloadConnectionLoss, launchWebScaffold, watchConsole, type WebScaffold,
} from './scaffold.ts'
import { connectFreshWorkspace } from './support.ts'

describe('web e2e: mobile shell and revision-safe PWA', () => {
  let scaffold: WebScaffold
  let browser: Browser
  let page: Page
  let tripwire: ReturnType<typeof watchConsole>
  const pluginFailures: string[] = []

  beforeAll(async () => {
    scaffold = await launchWebScaffold()
    browser = await chromium.launch()
    page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'en-US' })
    tripwire = watchConsole(page)
    page.on('response', (response) => {
      if (new URL(response.url()).pathname.startsWith('/plugins/') && !response.ok()) {
        pluginFailures.push(`${String(response.status())} ${response.url()}`)
      }
    })
    await page.goto(scaffold.authenticatedUrl, { waitUntil: 'load' })
    await page.locator('[data-mobile-frame]').waitFor({ timeout: 30_000 })
    await connectFreshWorkspace(page, scaffold.workspaceCwd, 'mobile-shell')
  }, 120_000)

  afterAll(async () => {
    await browser?.close()
    await scaffold?.close()
  })

  it('opens and closes the sidebar drawer through the phone controls', async () => {
    const frame = page.locator('[data-mobile-frame]')
    await expect.poll(() => frame.getAttribute('data-sidebar-collapsed')).not.toBeNull()
    expect(await frame.locator('[data-mobile-role="sidebar"]').count()).toBe(1)
    expect(await frame.locator('[data-mobile-role="center"]').count()).toBe(1)
    expect(await frame.locator('[data-mobile-role="rightbar"]').count()).toBe(1)

    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    await expect.poll(() => frame.getAttribute('data-sidebar-collapsed')).toBeNull()
    const scrim = page.getByRole('button', { name: 'Close panel' })
    await scrim.waitFor({ timeout: 10_000 })
    await scrim.click()
    await expect.poll(() => frame.getAttribute('data-sidebar-collapsed')).not.toBeNull()
  })

  it('marks the current composer toolbar structure for phone reflow', async () => {
    await page.locator('[data-input-access-mode]').waitFor({ timeout: 10_000 })
    expect(await page.locator('[data-composer-toolbar]').count()).toBe(1)
    expect(await page.locator('[data-composer-tools]').count()).toBe(1)
    expect(await page.locator('[data-composer-modes]').count()).toBe(1)
    expect(await page.locator('[data-composer-trailing]').count()).toBe(1)
    const editor = page.locator('[data-composer-input]')
    expect(await editor.getAttribute('enterkeyhint')).toBe('send')
    expect(await editor.evaluate(node => getComputedStyle(node).fontSize)).toBe('16px')
    const overflowing = await page.locator('[data-composer-toolbar] button').evaluateAll(nodes => nodes
      .filter((node) => {
        const rect = node.getBoundingClientRect()
        return rect.width > 0 && (rect.left < 0 || rect.right > innerWidth)
      }).map(node => node.getAttribute('aria-label')))
    expect(overflowing).toEqual([])
  })

  it('serves a push-only worker and reloads every current plugin revision', async () => {
    const worker = await page.evaluate(async () => await (await fetch('/sw.js')).text())
    expect(worker).toContain("self.addEventListener('push'")
    expect(worker).not.toContain("self.addEventListener('fetch'")

    await page.evaluate(async () => { await navigator.serviceWorker.ready })
    const warningCount = tripwire.warnings.length
    await page.reload({ waitUntil: 'load' })
    acknowledgeReloadConnectionLoss(tripwire, warningCount)
    await page.locator('[data-mobile-frame]').waitFor({ timeout: 30_000 })
    expect(pluginFailures).toEqual([])
    expect(tripwire.pageErrors).toEqual([])
    expect(tripwire.warnings).toEqual([])
  }, 60_000)
})
