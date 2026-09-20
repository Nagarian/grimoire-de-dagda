import { Box, createListCollection, Portal, Select } from '@chakra-ui/react'
import { StoryDisplayer } from 'components/StoryDisplayer'
import { useState } from 'react'
import type { Book, BookId } from 'services/books'
import { books } from 'services/books'

export function BookVisualizer() {
  const [selection, setSelection] = useState<BookId[]>()

  return (
    <Box
      height="100%"
      display="grid"
      gridTemplateRows="auto 1fr"
      gap="2"
      padding="2"
    >
      <Select.Root
        collection={collection}
        value={selection}
        onValueChange={e => {
          setSelection(e.value as BookId[])
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
            <Select.Content>
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
      {selection?.[0] && <StoryDisplayer bookId={selection[0]} />}
    </Box>
  )
}

type SelectItem = {
  label: string
  value: BookId
  category: Book['category']
}

const collection = createListCollection<SelectItem>({
  items: books.map(book => ({
    label: book.title,
    value: book.id,
    category: book.category,
  })),
})

const categories = collection.items.reduce<Record<string, SelectItem[]>>(
  (agg, item) => ({
    ...agg,
    [item.category]: [...(agg[item.category] ?? []), item],
  }),
  {},
)
