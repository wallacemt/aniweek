// Run with Vite running: PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node apps/web/tests/enhancements.smoke.mjs
// All API requests are mocked; no account or database is modified.
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ headless: true })
const base = process.env.WEB_URL || 'http://127.0.0.1:5173'
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, timezoneId: 'America/Bahia' })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    const weekday = weekdays[new Date().getDay()]
    const anime = { id: 'anime-1', malId: 52991, title: 'Frieren', releaseDate: '2023-09-29', imageUrl: null, synopsis: null, episodes: 28, genres: [], malUrl: null, linkAccess: null }
    const entry = { id: 'entry-1', weekday, position: 0, currentEpisode: 2, totalEpisodes: 28, status: 'WATCHING', anime }
    const board = { id: 'calendar-1', season: 'FALL', year: 2026, createdAt: '2026-09-30', entries: Object.fromEntries([...weekdays, 'BACKLOG'].map(day => [day, day === weekday ? [entry] : []])) }
    let patches = 0
    await page.route('**/*', async route => {
      const request = route.request()
      if (!['fetch', 'xhr'].includes(request.resourceType())) return route.continue()
      const path = new URL(request.url()).pathname
      let data
      if (path.endsWith('/auth/refresh')) data = { accessToken: 'test-only' }
      else if (path.endsWith('/auth/me')) data = { id: 'test-user', username: 'teste', email: 'test@example.com', avatarUrl: null }
      else if (path.endsWith('/calendars/current-season')) data = { season: 'FALL', year: 2026 }
      else if (/\/calendars\/(current|calendar-1)$/.test(path)) data = board
      else if (path.endsWith('/themes/active')) data = null
      else if (path.endsWith('/social/notifications/stream')) return route.fulfill({ contentType: 'text/event-stream', body: '' })
      else if (path.endsWith('/social/notifications')) data = []
      else if (path.endsWith('/animes/anime-1') && request.method() === 'PATCH') {
        Object.assign(anime, request.postDataJSON()); patches++; data = anime
      } else return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) })
    })
    await page.goto(base)
    await page.getByRole('heading', { name: 'Sua semana de animes começa aqui' }).waitFor({ timeout: 90000 })
    await page.screenshot({ path: `/tmp/aniweek-welcome-${viewport.width}.png`, fullPage: true })
    await page.getByRole('button', { name: 'Entendi, vamos começar' }).click()
    await page.reload()
    await page.getByRole('button', { name: 'Editar anime' }).waitFor()
    assert.equal(await page.getByRole('heading', { name: 'Sua semana de animes começa aqui' }).count(), 0)
    assert.match(await page.locator('time').innerText(), /29\/09\/2023/)
    const edit = page.getByRole('button', { name: 'Editar anime' })
    await edit.focus()
    await page.getByRole('tooltip', { name: 'Editar anime' }).waitFor()
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('tooltip').count(), 0)
    await page.screenshot({ path: `/tmp/aniweek-calendar-${viewport.width}.png`, fullPage: true })
    await edit.click()
    await page.getByLabel('Data de lançamento (opcional)').fill('2026-10-01')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('time')?.dateTime === '2026-10-01')
    assert.equal(patches, 1)
    await edit.click()
    await page.getByLabel('Data de lançamento (opcional)').fill('')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await page.locator('time').waitFor({ state: 'detached' })
    assert.equal(patches, 2)
    await page.getByRole('link', { name: 'Ajuda', exact: true }).click()
    await page.getByRole('heading', { name: 'Como usar o AnimeWeek' }).waitFor()
    await page.getByText('Por que alguns animes não têm data de lançamento?', { exact: true }).click()
    assert.equal(await page.locator('details[open]').count(), 1)
    await page.screenshot({ path: `/tmp/aniweek-help-faq-${viewport.width}.png`, fullPage: true })
    await page.getByRole('heading', { name: 'Como usar o AnimeWeek' }).scrollIntoViewIfNeeded()
    await page.screenshot({ path: `/tmp/aniweek-help-${viewport.width}.png`, fullPage: true })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    assert.deepEqual(errors, [])
    console.log(`PASS ${viewport.width}px: date edit/clear, onboarding persistence, keyboard tooltip, help/FAQ, no page errors`)
    await context.close()
  }
} finally { await browser.close() }
