import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'
import type { BookId } from 'services/books'
import { books } from 'services/books'

function bookPaletteName(bookId: BookId): string {
  return bookId.toLowerCase()
}

function createBookPalette(accent: string) {
  const shades = {
    50: `color-mix(in srgb, white 95%, ${accent})`,
    100: `color-mix(in srgb, white 90%, ${accent})`,
    200: `color-mix(in srgb, white 80%, ${accent})`,
    300: `color-mix(in srgb, white 60%, ${accent})`,
    400: `color-mix(in srgb, white 30%, ${accent})`,
    500: accent,
    600: `color-mix(in srgb, black 10%, ${accent})`,
    700: `color-mix(in srgb, black 20%, ${accent})`,
    800: `color-mix(in srgb, black 30%, ${accent})`,
    900: `color-mix(in srgb, black 40%, ${accent})`,
    950: `color-mix(in srgb, black 50%, ${accent})`,
  }
  const tokens = Object.fromEntries(
    Object.entries(shades).map(([shade, value]) => [shade, { value }]),
  )

  return {
    ...tokens,
  }
}

function createBookSemanticPalette(name: string) {
  const semanticToken = (lightShade: number, darkShade: number) => ({
    value: {
      _light: `{colors.${name}.${lightShade}}`,
      _dark: `{colors.${name}.${darkShade}}`,
    },
  })

  return {
    contrast: { value: '#ffffff' },
    fg: semanticToken(700, 200),
    subtle: semanticToken(50, 900),
    muted: semanticToken(100, 800),
    emphasized: semanticToken(200, 700),
    solid: semanticToken(500, 500),
    border: semanticToken(500, 500),
    focusRing: semanticToken(500, 300),
  }
}

export function getBookColorPalette(bookId?: BookId): string {
  return bookId ? bookPaletteName(bookId) : 'gray'
}

export const config = defineConfig({
  strictTokens: true,
  theme: {
    tokens: {
      colors: Object.fromEntries(
        books.map(book => [
          bookPaletteName(book.id),
          createBookPalette(book.accentColor),
        ]),
      ),
    },
    semanticTokens: {
      colors: Object.fromEntries(
        books.map(book => [
          bookPaletteName(book.id),
          createBookSemanticPalette(bookPaletteName(book.id)),
        ]),
      ),
    },
  },
})

export const system = createSystem(defaultConfig, config)

export default system
