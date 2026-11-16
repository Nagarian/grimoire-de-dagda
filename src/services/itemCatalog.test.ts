import { afterEach, describe, expect, it } from 'vitest'
import { itemCatalog } from 'data/items'
import {
  findItemIdByName,
  getItemsForChapter,
  getLocalizedItem,
  getManualItemSuggestions,
} from 'services/itemCatalog'
import { i18n } from 'services/i18n'

const originalLanguage = i18n.language

afterEach(async () => {
  await i18n.changeLanguage(originalLanguage)
})

describe('item catalog', () => {
  it('has a unique id and localized name for every catalog entry', () => {
    expect(new Set(itemCatalog.map(item => item.id)).size).toBe(
      itemCatalog.length,
    )
    expect(() =>
      itemCatalog.forEach(item => getLocalizedItem(item.id)),
    ).not.toThrow()
  })

  it('localizes categories and falls back to French item text in English', async () => {
    const french = getLocalizedItem('t01_arc_et_carquois')
    expect(french).toMatchObject({
      name: 'Arc et carquois',
      categoryLabel: 'Arme',
    })

    await i18n.changeLanguage('en')
    expect(getLocalizedItem('t01_arc_et_carquois')).toMatchObject({
      name: 'Arc et carquois',
      categoryLabel: 'Weapon',
    })
  })

  it('returns only items found in the selected chapter', () => {
    expect(getItemsForChapter('T01', '7').map(item => item.id)).toEqual([
      't01_potion_de_soin',
    ])
    expect(getItemsForChapter('T02', '7')).toEqual([])
  })

  it('limits suggestions to the active book and destination, plus compendium items', () => {
    const t01Weapons = getManualItemSuggestions('T01', 'weapon')
    expect(t01Weapons.some(item => item.id === 't01_collier_de_charisme')).toBe(
      true,
    )
    expect(t01Weapons.some(item => item.id === 't02_pomme_verte')).toBe(false)
    expect(
      t01Weapons.some(item => item.id === 'compendium_arc_des_vents'),
    ).toBe(true)

    const t05Inventory = getManualItemSuggestions('T05', 'inventory')
    expect(t05Inventory.some(item => item.id === 't05_bague_de_nacre')).toBe(
      true,
    )
    expect(t05Inventory.some(item => item.id === 't05_epee_courte')).toBe(false)
    expect(
      getManualItemSuggestions('T05', 'armor').every(
        item => item.category === 'equipment' && Boolean(item.effect),
      ),
    ).toBe(true)
  })

  it('matches only unique known item names in the active book', () => {
    expect(findItemIdByName('T01', '  Potion de soin ')).toBe(
      't01_potion_de_soin',
    )
    expect(findItemIdByName('T01', 'Pomme rouge')).toBeUndefined()
  })
})
