import { expect, test } from '@playwright/test'

test('首页和资料库入口可以直接使用', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/成都理工大学开源协会/)
  await expect(page.getByRole('heading', { level: 1, name: '开源协会' })).toBeVisible()
  await expect(page.locator('.osa-hero-stats').getByText('236', { exact: true })).toBeVisible()
  await expect(page.locator('.osa-tech-card')).toHaveCount(4)
  await expect(page.locator('.osa-competition-item')).toHaveCount(5)
  await page.getByRole('link', { name: '浏览资料库' }).click()
  await expect(page).toHaveURL(/\/library\/$/)
  await expect(page.getByRole('heading', { level: 1, name: '资料库' })).toBeVisible()
})

test('搜索条件写入地址并能定位资料', async ({ page }) => {
  await page.goto('/library/')
  const search = page.getByPlaceholder('搜索资料名称、芯片型号或技术方向')
  await search.fill('DP2025数码管段码表')
  await expect(page).toHaveURL(/q=DP2025/)
  await expect(page.getByRole('link', { name: /DP2025数码管段码表/ })).toBeVisible()
})

test('固定空分类明确显示暂无资料', async ({ page }) => {
  await page.goto('/library/')
  const rosHeading = page.getByRole('heading', { level: 2, name: 'ROS' })
  await expect(rosHeading).toBeVisible()
  await expect(rosHeading.locator('xpath=following-sibling::p[1]')).toHaveText('暂无资料')
})

test('PDF 阅读器能显示第一页且页面不横向溢出', async ({ page }) => {
  await page.goto('/library/?q=DP2025%E6%95%B0%E7%A0%81%E7%AE%A1%E6%AE%B5%E7%A0%81%E8%A1%A8')
  await page.getByRole('link', { name: /DP2025数码管段码表/ }).click()
  const viewer = page.locator('.kb-pdf-viewer')
  await expect(viewer).toBeVisible()
  await expect(viewer.locator('.kb-page-control > span').last()).toHaveText(/\/\s*\d+/, { timeout: 30000 })
  await expect(viewer.locator('.kb-pdf-loading')).toBeHidden({ timeout: 30000 })
  await expect.poll(
    async () => viewer.locator('canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).width),
    { timeout: 30000 }
  ).toBeGreaterThan(300)
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflows).toBe(false)
})

test('PDF 高清内容载入时仍可立即翻看前三页', async ({ page }) => {
  let releasePdfRequest!: () => void
  const pdfRequestGate = new Promise<void>((resolve) => {
    releasePdfRequest = resolve
  })

  await page.route(/\.pdf(?:\?.*)?$/i, async (route) => {
    await pdfRequestGate
    await route.abort('connectionfailed')
  })

  try {
    await page.goto('/library/?q=C%E8%AF%AD%E8%A8%80%E8%AF%BE%E7%A8%8B%E8%AE%B2%E4%B9%89')
    await page.getByRole('link', { name: /C语言课程讲义/ }).click()

    const viewer = page.locator('.kb-pdf-viewer')
    await expect(viewer.locator('.kb-page-control > span').last()).toHaveText(/\/\s*369/)
    await expect(viewer.getByRole('button', { name: '下一页' })).toBeEnabled()
    await viewer.getByRole('button', { name: '下一页' }).click()
    await expect(viewer.locator('.kb-pdf-placeholder')).toHaveAttribute('src', /-2\.jpg$/)
    await expect(viewer.locator('.kb-page-control input')).toHaveValue('2')
  } finally {
    releasePdfRequest()
  }
})

test('大型 PDF 仅在适合时使用线性化阅读副本', async ({ page }) => {
  const webPdfRequest = page.waitForRequest((request) => (
    request.url().includes('/uploads/previews/pdf-web/') && request.url().endsWith('.pdf')
  ))

  await page.goto('/library/?q=STM32F407%E6%95%B0%E6%8D%AE%E6%89%8B%E5%86%8C')
  await page.getByRole('link', { name: /STM32F407数据手册/ }).click()
  await webPdfRequest

  const viewer = page.locator('.kb-pdf-viewer')
  await expect(viewer.locator('.kb-pdf-loading')).toBeHidden({ timeout: 30000 })
  await expect.poll(
    async () => viewer.locator('canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).width),
    { timeout: 30000 }
  ).toBeGreaterThan(300)
})

test('省流量模式保留按需阅读并暂停完整缓存', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: {
        saveData: true,
        effectiveType: '4g',
        addEventListener() {},
        removeEventListener() {}
      }
    })
  })
  await page.goto('/library/?q=C%E8%AF%AD%E8%A8%80%E8%AF%BE%E7%A8%8B%E8%AE%B2%E4%B9%89')
  await page.getByRole('link', { name: /C语言课程讲义/ }).click()
  await expect(page.getByRole('button', { name: '缓存完整文档' })).toBeVisible({ timeout: 30000 })
  await expect(page.locator('.kb-page-control > span').last()).toHaveText(/\/\s*\d+/, { timeout: 30000 })
  await expect(page.locator('.kb-pdf-loading')).toBeHidden({ timeout: 30000 })
  await expect.poll(
    async () => page.locator('.kb-pdf-viewer canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).width),
    { timeout: 30000 }
  ).toBeGreaterThan(300)
})

test('PDF 首次分段请求失败后会自动恢复', async ({ page }) => {
  let intercepted = false
  await page.route(/\.pdf(?:\?.*)?$/i, async (route) => {
    const fileName = decodeURIComponent(route.request().url())
    if (!intercepted && fileName.includes('DP2025数码管段码表')) {
      intercepted = true
      await route.abort('connectionfailed')
      return
    }
    await route.continue()
  })
  await page.goto('/library/?q=DP2025%E6%95%B0%E7%A0%81%E7%AE%A1%E6%AE%B5%E7%A0%81%E8%A1%A8')
  await page.getByRole('link', { name: /DP2025数码管段码表/ }).click()
  await expect.poll(() => intercepted, { timeout: 10000 }).toBe(true)
  await expect(page.locator('.kb-page-control > span').last()).toHaveText(/\/\s*\d+/, { timeout: 30000 })
  await expect(page.locator('.kb-pdf-loading')).toBeHidden({ timeout: 30000 })
  await expect.poll(
    async () => page.locator('.kb-pdf-viewer canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).width),
    { timeout: 30000 }
  ).toBeGreaterThan(300)
})
