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
