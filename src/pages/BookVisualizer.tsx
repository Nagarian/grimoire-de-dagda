import { Box, createListCollection, Portal, Select } from '@chakra-ui/react'
import { StoryDisplayer } from 'components/StoryDisplayer'
import { useState } from 'react'
import Extension1 from '../../scripts/E01-le-royaume-des-ombres.mermaid?raw'
import Book1 from '../../scripts/T01-la-harpe-des-quatres-saisons.mermaid?raw'
import Book2 from '../../scripts/T02-la-confrerie-de-nuada.mermaid?raw'
import Book3 from '../../scripts/T03-les-entrailles-du-temps.mermaid?raw'
import Book4 from '../../scripts/T04-la-prophetie-sombre.mermaid?raw'

export function BookVisualizer() {
  const [selection, setSelection] = useState<string[]>()

  return (
    <Box
      height="100%"
      display="grid"
      gridTemplateRows="auto 1fr"
      gap="2"
      padding="2"
    >
      <Select.Root
        collection={books}
        value={selection}
        onValueChange={e => {
          setSelection(e.value)
        }}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Choose the book" />
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
                    <Select.Item key={item.label} item={item}>
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
      {selection?.length && <StoryDisplayer marmaidContent={selection[0]} />}
    </Box>
  )
}

type SelectItem = {
  label: string
  value: string
  category: string
}

const books = createListCollection<SelectItem>({
  items: [
    { label: 'La harpe des quatres saisons', value: Book1, category: 'Book' },
    { label: 'La confrérie de Nuada', value: Book2, category: 'Book' },
    { label: 'Les entrailles du temps', value: Book3, category: 'Book' },
    { label: 'La Prophétie Sombre', value: Book4, category: 'Book' },
    {
      label: 'Le royaume des ombres',
      value: Extension1,
      category: 'Extension',
    },
  ],
})

const categories = books.items.reduce<Record<string, SelectItem[]>>(
  (agg, item) => ({
    ...agg,
    [item.category]: [...(agg[item.category] ?? []), item],
  }),
  {},
)
