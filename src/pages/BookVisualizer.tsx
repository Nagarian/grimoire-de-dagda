import { Box, createListCollection, Portal, Select } from '@chakra-ui/react'
import { StoryDisplayer } from 'components/StoryDisplayer'
import { useStoryProgress } from 'components/StoryProgresser/useStoryProgress'
import { getBookColorPalette } from 'components/ui/theme'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Book, BookId, BookSelectionId } from 'services/books'
import { ALL_BOOKS_ID } from 'services/books'
import { books } from 'services/books'
import { getLocalizedBookTitle } from 'services/i18n'

export function BookVisualizer({ defaultBookId }: { defaultBookId?: BookId }) {
  const { t } = useTranslation()
  const { activeTrack, progress, updateUiState } = useStoryProgress()
  const [selection, setSelection] = useState<BookSelectionId[]>(() =>
    defaultBookId ? [defaultBookId] : [],
  )
  const chapterVisitCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const visit of activeTrack?.visits ?? []) {
      counts.set(visit.chapterId, (counts.get(visit.chapterId) ?? 0) + 1)
    }
    return counts
  }, [activeTrack?.visits])
  const collection = useMemo(
    () =>
      createListCollection<SelectItem>({
        items: [
          {
            label: t('bookSelector.allBooks'),
            value: ALL_BOOKS_ID,
            category: 'global',
          },
          ...books.map(book => ({
            label: getLocalizedBookTitle(book.id),
            value: book.id,
            category: book.category,
          })),
        ],
      }),
    [t],
  )
  const categories = useMemo(
    () =>
      collection.items.reduce<Record<string, SelectItem[]>>(
        (agg, item) => ({
          ...agg,
          [item.category]: [...(agg[item.category] ?? []), item],
        }),
        {},
      ),
    [collection],
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
            <Select.ValueText placeholder={t('bookSelector.placeholder')} />
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
                  <Select.ItemGroupLabel>
                    {category === 'Tome'
                      ? t('categories.book', { ns: 'books' })
                      : category === 'Extension'
                        ? t('categories.extension', { ns: 'books' })
                        : t('bookSelector.overview')}
                  </Select.ItemGroupLabel>
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
      {selectedId && (
        <StoryDisplayer
          bookId={selectedId}
          chapterVisitCounts={chapterVisitCounts}
          showVisitedChapterCounts={
            progress?.uiState.showVisitedChapterCounts ?? false
          }
          onVisitedChapterCountsToggle={
            progress
              ? () =>
                  updateUiState({
                    ...progress.uiState,
                    showVisitedChapterCounts:
                      !progress.uiState.showVisitedChapterCounts,
                  })
              : undefined
          }
        />
      )}
    </Box>
  )
}

type SelectItem = {
  label: string
  value: BookSelectionId
  category: 'global' | Book['category']
}
