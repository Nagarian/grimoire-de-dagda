import Extension1 from 'data/E01-le-royaume-des-ombres.txt?raw'
import Book1 from 'data/T01-la-harpe-des-quatres-saisons.txt?raw'
import Book2 from 'data/T02-la-confrerie-de-nuada.txt?raw'
import Book3 from 'data/T03-les-entrailles-du-temps.txt?raw'
import Book4 from 'data/T04-la-prophetie-sombre.txt?raw'
import Book5 from 'data/T05-l-eveil-des-oublies.txt?raw'

export type BookId = 'E01' | 'T01' | 'T02' | 'T03' | 'T04' | 'T05'

export const ALL_BOOKS_ID = 'ALL_BOOKS' as const
export type BookSelectionId = BookId | typeof ALL_BOOKS_ID

export type Book = {
  id: BookId
  category: 'Extension' | 'Tome'
  accentColor: string
  /**
   * Chapters whose incoming paths are dropped. They are the "go back to the
   * beginning" links, which would otherwise tie nearly every leaf to a single
   * chapter and wreck the layout.
   */
  chapterToSkip: string[]
  /** The raw chapter DSL, parsed by `parseBook`. */
  content: string
}

export const books: Book[] = [
  {
    id: 'T01',
    category: 'Tome',
    accentColor: '#053cd4',
    chapterToSkip: [],
    content: Book1,
  },
  {
    id: 'T02',
    category: 'Tome',
    accentColor: '#005040',
    chapterToSkip: [],
    content: Book2,
  },
  {
    id: 'T03',
    category: 'Tome',
    accentColor: '#902028',
    chapterToSkip: [],
    content: Book3,
  },
  {
    id: 'T04',
    category: 'Tome',
    accentColor: '#400878',
    chapterToSkip: [],
    content: Book4,
  },
  {
    id: 'T05',
    category: 'Tome',
    accentColor: '#913000',
    chapterToSkip: [],
    content: Book5,
  },
  {
    id: 'E01',
    category: 'Extension',
    accentColor: '#733c82',
    chapterToSkip: [],
    content: Extension1,
  },
]

export function getBook(id: BookId): Book {
  const book = books.find(candidate => candidate.id === id)
  if (!book) {
    throw new Error(`Unknown book: ${id}`)
  }
  return book
}
