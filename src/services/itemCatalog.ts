import { itemCatalog } from 'data/items'
import type { ItemBookId, ItemCategory, ItemId } from 'data/items'
import enItems from 'locales/en/items.json'
import frItems from 'locales/fr/items.json'
import { i18n } from 'services/i18n'

type ItemTranslation = {
  name: string
  effect?: string
}

type ItemLocale = {
  categories: Record<ItemCategory, string>
  items: Record<string, ItemTranslation>
}

export type LocalizedItem = {
  id: ItemId
  category: ItemCategory
  categoryLabel: string
  name: string
  effect?: string
  locations: readonly string[]
}

export type ItemDestination = 'inventory' | 'weapon' | 'armor'

const localeItems: Record<'en' | 'fr', ItemLocale> = {
  en: enItems,
  fr: frItems,
}

const itemIds = new Set<string>(itemCatalog.map(item => item.id))

export function isItemId(value: unknown): value is ItemId {
  return typeof value === 'string' && itemIds.has(value)
}

export function isItemBookId(value: string): value is ItemBookId {
  return ['T01', 'T02', 'T03', 'T04', 'T05'].includes(value)
}

export function getLocalizedItem(
  id: ItemId,
  language = i18n.resolvedLanguage,
): LocalizedItem {
  const definition = itemCatalog.find(item => item.id === id)
  if (!definition) {
    throw new Error(`Unknown item id: ${id}`)
  }

  const locale = language?.startsWith('en') ? 'en' : 'fr'
  const translation = localeItems[locale].items[id] ?? localeItems.fr.items[id]
  if (!translation) {
    throw new Error(`Missing French item translation: ${id}`)
  }

  return {
    ...translation,
    id,
    category: definition.category,
    categoryLabel: localeItems[locale].categories[definition.category],
    locations: definition.locations,
  }
}

export function getItemsForChapter(
  bookId: ItemBookId,
  chapterNumber: string,
): LocalizedItem[] {
  const location = `${bookId}-${chapterNumber}`
  return itemCatalog
    .filter(item =>
      item.locations.some(itemLocation => itemLocation === location),
    )
    .map(item => getLocalizedItem(item.id))
}

export function getManualItemSuggestions(
  bookId: ItemBookId,
  destination: ItemDestination,
  language = i18n.resolvedLanguage,
): LocalizedItem[] {
  return itemCatalog
    .filter(item => {
      const availableInBook =
        item.locations.length === 0 ||
        item.locations.some(location => location.startsWith(`${bookId}-`))
      if (!availableInBook) {
        return false
      }

      if (destination === 'weapon') {
        return (
          item.category === 'weapon' ||
          (bookId !== 'T05' && item.category === 'jewelry')
        )
      }

      if (destination === 'armor') {
        return (
          bookId === 'T05' &&
          item.category === 'equipment' &&
          Boolean(getLocalizedItem(item.id, language).effect)
        )
      }

      if (item.category === 'weapon') {
        return false
      }
      return bookId === 'T05' || item.category !== 'jewelry'
    })
    .map(item => getLocalizedItem(item.id, language))
}

export function findItemIdByName(
  bookId: ItemBookId,
  name: string,
): ItemId | undefined {
  const normalizedName = name.trim().toLocaleLowerCase('fr')
  const matches = itemCatalog.filter(item => {
    const availableInBook =
      item.locations.length === 0 ||
      item.locations.some(location => location.startsWith(`${bookId}-`))
    return (
      availableInBook &&
      getLocalizedItem(item.id, 'fr').name.trim().toLocaleLowerCase('fr') ===
        normalizedName
    )
  })

  return matches.length === 1 ? matches[0].id : undefined
}
