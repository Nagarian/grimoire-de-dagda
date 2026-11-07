import { Box, createListCollection, Portal, Select } from '@chakra-ui/react'
import { StoryDisplayer } from 'components/StoryDisplayer'
import { getBookColorPalette } from 'components/ui/theme'
import { useState } from 'react'
import type { Book, BookId, BookSelectionId } from 'services/books'
import { ALL_BOOKS_ID } from 'services/books'
import { books } from 'services/books'

export function BookVisualizer({ defaultBookId }: { defaultBookId?: BookId }) {
  const [selection, setSelection] = useState<BookSelectionId[]>(() =>
    defaultBookId ? [defaultBookId] : [],
  )
  const selectedId = selection.at(0)
  const colorPalette = getBookColorPalette(
    selectedId === ALL_BOOKS_ID ? undefined : selectedId,
  )

  return (
    <Box
      height="100%"
      display="grid"
      gridTemplateRows="auto 1fr"
      gap="2"
      padding="2"
      colorPalette={colorPalette}
    >
      <Select.Root
        collection={collection}
        value={selection}
        onValueChange={e => {
          setSelection(e.value as BookSelectionId[])
        }}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Choisir un livre" />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content colorPalette={colorPalette}>
              {Object.entries(categories).map(([category, items]) => (
                <Select.ItemGroup key={category}>
                  <Select.ItemGroupLabel>{category}</Select.ItemGroupLabel>
                  {items.map(item => (
                    <Select.Item key={item.value} item={item}>
                      {item.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.ItemGroup>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      {selectedId && <StoryDisplayer bookId={selectedId} />}
    </Box>
  )
}

type SelectItem = {
  label: string
  value: BookSelectionId
  category: 'Vue globale' | Book['category']
}

const collection = createListCollection<SelectItem>({
  items: [
    {
      label: 'Tous les livres',
      value: ALL_BOOKS_ID,
      category: 'Vue globale',
    },
    ...books.map(book => ({
      label: book.title,
      value: book.id,
      category: book.category,
    })),
  ],
})

const categories = collection.items.reduce<Record<string, SelectItem[]>>(
  (agg, item) => ({
    ...agg,
    [item.category]: [...(agg[item.category] ?? []), item],
  }),
  {},
)
