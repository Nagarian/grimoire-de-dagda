import Extension1 from 'data/E01-le-royaume-des-ombres.txt?raw'
import Book1 from 'data/T01-la-harpe-des-quatres-saisons.txt?raw'
import Book2 from 'data/T02-la-confrerie-de-nuada.txt?raw'
import Book3 from 'data/T03-les-entrailles-du-temps.txt?raw'
import Book4 from 'data/T04-la-prophetie-sombre.txt?raw'

export type BookId = 'E01' | 'T01' | 'T02' | 'T03' | 'T04'

export type Book = {
  id: BookId
  title: string
  category: 'Extension' | 'Tome'
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
    title: 'La harpe des quatres saisons',
    category: 'Tome',
    chapterToSkip: ['1'],
    content: Book1,
  },
  {
    id: 'T02',
    title: 'La confrérie de Nuada',
    category: 'Tome',
    chapterToSkip: ['42'],
    content: Book2,
  },
  {
    id: 'T03',
    title: 'Les entrailles du temps',
    category: 'Tome',
    chapterToSkip: ['42'],
    content: Book3,
  },
  {
    id: 'T04',
    title: 'La Prophétie Sombre',
    category: 'Tome',
    chapterToSkip: ['42'],
    content: Book4,
  },
  {
    id: 'E01',
    title: 'Le royaume des ombres',
    category: 'Extension',
    chapterToSkip: ['1'],
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
