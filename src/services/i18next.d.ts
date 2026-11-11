import 'i18next'
import type frBooks from 'locales/fr/books.json'
import type frCommon from 'locales/fr/common.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof frCommon
      books: typeof frBooks
    }
  }
}
