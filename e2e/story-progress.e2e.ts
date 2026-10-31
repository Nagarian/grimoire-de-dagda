import { expect, test } from '@playwright/test'

test('mobile reading keeps focus on choices and restores progress after reload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('./')

  await expect(
    page.getByRole('heading', { name: 'Commencez votre aventure' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Aller à un autre chapitre…' }),
  ).toHaveCount(0)

  await page.getByRole('button', { name: 'Créer un parcours' }).click()
  await page.getByLabel('Nom (facultatif)').fill('Lecture mobile')
  await page.getByRole('button', { name: 'Créer le parcours' }).click()
  await expect(page.getByRole('heading', { name: 'Chapitre 1' })).toBeVisible()
  await expect
    .poll(() =>
      page
        .getByRole('button', { name: 'Chapitre 61' })
        .evaluate(element => getComputedStyle(element).borderColor),
    )
    .toBe('rgb(5, 60, 212)')

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)

  await page.getByRole('button', { name: 'Ouvrir le menu du parcours' }).click()
  await expect(page.getByRole('heading', { name: 'Historique' })).toBeVisible()
  await page.getByRole('button', { name: 'Fermer le menu' }).click()

  await page.getByRole('button', { name: 'Chapitre 61' }).click()
  await expect(page.getByRole('heading', { name: 'Chapitre 61' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Chapitre 61' })).toBeVisible()

  await page.getByRole('button', { name: 'Aller à un autre chapitre…' }).click()
  await page.locator('select').nth(0).selectOption('T02')
  await page.getByRole('button', { name: 'Ajouter au parcours' }).click()
  await expect(page.locator('header')).toContainText('La confrérie de Nuada')
  await expect
    .poll(() =>
      page
        .getByRole('button', { name: /^Chapitre/ })
        .first()
        .evaluate(element => getComputedStyle(element).borderColor),
    )
    .toBe('rgb(0, 80, 64)')
})

test('manual navigation opens only after a deliberate request', async ({
  page,
}) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Créer un parcours' }).click()
  await page.getByRole('button', { name: 'Créer le parcours' }).click()

  await expect(
    page.getByRole('dialog', { name: 'Aller à un autre chapitre' }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Aller à un autre chapitre…' }).click()
  await expect(
    page.getByRole('dialog', { name: 'Aller à un autre chapitre' }),
  ).toBeVisible()
})

test('book choice colors remain readable in dark mode, including hover', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'))
  await page.goto('./')
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.getByRole('button', { name: 'Créer un parcours' }).click()
  await page.getByRole('button', { name: 'Créer le parcours' }).click()
  await page.getByRole('button', { name: 'Aller à un autre chapitre…' }).click()
  await page.locator('select').nth(0).selectOption('T04')
  await page.getByRole('button', { name: 'Ajouter au parcours' }).click()

  const choice = page.getByRole('button', { name: /^Chapitre/ }).first()
  await expect(choice).toBeVisible()
  const foreground = await choice.evaluate(
    element => getComputedStyle(element).color,
  )

  await choice.hover()
  const hoveredBackground = await choice.evaluate(
    element => getComputedStyle(element).backgroundColor,
  )
  const contrast = await choice.evaluate((element, foregroundColor) => {
    const channels = (color: string) => {
      const srgbChannels = color.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/)
      if (srgbChannels) {
        return srgbChannels.slice(1).map(channel => Number(channel) * 255)
      }
      return color
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number)
    }
    const luminance = (color: string) => {
      const linear = channels(color).map(channel => {
        const value = channel / 255
        return value <= 0.04045
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!
    }
    const foregroundLuminance = luminance(foregroundColor)
    const backgroundLuminance = luminance(
      getComputedStyle(element).backgroundColor,
    )
    return (
      (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
      (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
    )
  }, foreground)

  expect(hoveredBackground).not.toBe('rgba(0, 0, 0, 0)')
  expect(
    contrast,
    `Expected readable text, received ${foreground} on ${hoveredBackground}`,
  ).toBeGreaterThanOrEqual(4.5)
})

test('book visualizer applies the selected book color palette to its graph', async ({
  page,
}) => {
  await page.goto('./')
  await page.getByRole('tab', { name: 'Book Tree Vizualizer' }).click()
  await page.getByRole('combobox').click()
  await page.getByRole('option', { name: 'La Prophétie Sombre' }).click()

  const graph = page.getByRole('img', { name: 'Arbre des chapitres' })
  await expect(graph).toBeVisible()

  const focusColor = await graph.evaluate(element =>
    getComputedStyle(element)
      .getPropertyValue('--chakra-colors-color-palette-focus-ring')
      .trim(),
  )

  expect(focusColor).toBe('#400878')
})
