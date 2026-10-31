import { describe, expect, it } from 'vitest'
import { books } from 'services/books'
import { config, getBookColorPalette } from './theme'

describe('book accent palettes', () => {
  it('uses the accent color declared on each book', () => {
    expect(books.map(book => [book.id, book.accentColor])).toEqual([
      ['T01', '#053cd4'],
      ['T02', '#005040'],
      ['T03', '#902028'],
      ['T04', '#400878'],
      ['T05', '#913000'],
      ['E01', '#733c82'],
    ])
    for (const book of books) {
      expect(getBookColorPalette(book.id)).toBe(book.id.toLowerCase())
    }

    expect(getBookColorPalette()).toBe('gray')
  })

  it('registers each exact accent as the palette 500 token', () => {
    const colors = config.theme?.tokens?.colors

    expect(colors).toMatchObject({
      t01: { 500: { value: '#053cd4' } },
      t02: { 500: { value: '#005040' } },
      t03: { 500: { value: '#902028' } },
      t04: { 500: { value: '#400878' } },
      t05: { 500: { value: '#913000' } },
      e01: { 500: { value: '#733c82' } },
    })
  })

  it('uses light and dark shades for readable text and hover surfaces', () => {
    const colors = config.theme?.semanticTokens?.colors

    expect(colors?.t04).toMatchObject({
      fg: {
        value: {
          _light: '{colors.t04.700}',
          _dark: '{colors.t04.200}',
        },
      },
      subtle: {
        value: {
          _light: '{colors.t04.50}',
          _dark: '{colors.t04.900}',
        },
      },
      muted: {
        value: {
          _light: '{colors.t04.100}',
          _dark: '{colors.t04.800}',
        },
      },
      solid: {
        value: {
          _light: '{colors.t04.500}',
          _dark: '{colors.t04.500}',
        },
      },
    })
  })
})
