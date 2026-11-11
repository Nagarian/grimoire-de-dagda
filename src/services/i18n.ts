import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enBooks from 'locales/en/books.json'
import enCommon from 'locales/en/common.json'
import frBooks from 'locales/fr/books.json'
import frCommon from 'locales/fr/common.json'

type AnnotationCatalog = Record<string, Record<string, string>>
type StringCatalog = Record<string, string>

const annotationCatalogs: Record<'en' | 'fr', AnnotationCatalog> = {
  en: enBooks.annotations,
  fr: frBooks.annotations,
}
const bookTitleCatalogs: Record<'en' | 'fr', StringCatalog> = {
  en: enBooks.titles,
  fr: frBooks.titles,
}
const chapterTypeCatalogs: Record<'en' | 'fr', StringCatalog> = {
  en: enBooks.chapterTypes,
  fr: frBooks.chapterTypes,
}
const localeStorageKey = 'grimoire-de-dagda:locale'
const storedLanguage =
  typeof window !== 'undefined'
    ? window.localStorage.getItem(localeStorageKey)
    : null

void i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, books: enBooks },
    fr: { common: frCommon, books: frBooks },
  },
  lng: storedLanguage === 'en' ? 'en' : 'fr',
  supportedLngs: ['en', 'fr'],
  fallbackLng: 'fr',
  defaultNS: 'common',
  ns: ['common', 'books'],
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', language => {
  const locale = language.split('-')[0]
  if (typeof window !== 'undefined' && (locale === 'en' || locale === 'fr')) {
    window.localStorage.setItem(localeStorageKey, locale)
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
})

export function getBookAnnotationLabel(
  bookId: string,
  annotationId: string,
  language = i18n.resolvedLanguage,
): string {
  const locale = language?.startsWith('en') ? 'en' : 'fr'
  const label =
    annotationCatalogs[locale][bookId]?.[annotationId] ??
    annotationCatalogs.fr[bookId]?.[annotationId]

  if (!label) {
    throw new Error(
      `Missing ${locale} annotation ${annotationId} for book ${bookId}`,
    )
  }
  return label
}

export function getLocalizedBookTitle(
  bookId: string,
  language = i18n.resolvedLanguage,
): string {
  return getLocalizedBookValue(bookTitleCatalogs, bookId, language)
}

export function getLocalizedChapterTypeLabel(
  typeId: string,
  language = i18n.resolvedLanguage,
): string {
  return getLocalizedBookValue(chapterTypeCatalogs, typeId, language)
}

export function getChapterLabel(chapterNumber: string): string {
  return i18n.t('chapter.number', { number: chapterNumber })
}

export function getDestinationLabel(
  bookId: string,
  chapterNumber: string,
): string {
  const book = getLocalizedBookTitle(bookId)
  return chapterNumber === 'MAP'
    ? i18n.t('chapter.mapDestination', { book })
    : i18n.t('chapter.destination', {
        book,
        number: chapterNumber,
      })
}

function getLocalizedBookValue(
  catalogs: Record<'en' | 'fr', StringCatalog>,
  key: string,
  language?: string,
): string {
  const locale = language?.startsWith('en') ? 'en' : 'fr'
  const value = catalogs[locale][key] ?? catalogs.fr[key]
  if (!value) {
    throw new Error(`Missing ${locale} book translation for ${key}`)
  }
  return value
}

export { i18n }
