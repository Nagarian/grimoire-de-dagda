import {
  Box,
  Button,
  createListCollection,
  Dialog,
  Field,
  IconButton,
  Portal,
  Select,
} from '@chakra-ui/react'
import { useState } from 'react'
import { LuX } from 'react-icons/lu'
import type { BookId } from 'services/books'
import { books } from 'services/books'
import { getBookData, isBookId } from 'services/bookData'
import type { StoryPosition } from 'services/storyProgress'
import { getBookColorPalette } from 'components/ui/theme'

const bookCollection = createListCollection({
  items: books.map(book => ({ label: book.title, value: book.id })),
})

type FormSubmitEvent = {
  preventDefault: () => void
}

export function ManualChapterDialog({
  currentPosition,
  onJump,
}: {
  currentPosition?: StoryPosition
  onJump: (position: StoryPosition) => boolean
}) {
  const [open, setOpen] = useState(false)
  const [bookId, setBookId] = useState<BookId>(currentPosition?.bookId ?? 'T01')
  const [chapterId, setChapterId] = useState(currentPosition?.chapterId ?? '1')
  const book = getBookData(bookId)
  const chapterCollection = createListCollection({
    items: book.chapters.map(chapter => ({
      label: chapter.id === 'MAP' ? 'Carte du monde' : `Chapitre ${chapter.id}`,
      value: chapter.id,
    })),
  })

  function selectBook(value: string | undefined) {
    if (value && isBookId(value)) {
      const nextBook = getBookData(value)
      setBookId(nextBook.id)
      setChapterId(nextBook.startId)
    }
  }

  function submit(event: FormSubmitEvent) {
    event.preventDefault()
    if (onJump({ bookId, chapterId })) {
      setOpen(false)
    }
  }

  function openDialog() {
    if (currentPosition) {
      setBookId(currentPosition.bookId)
      setChapterId(currentPosition.chapterId)
    }
    setOpen(true)
  }

  return (
    <>
      <Button variant="ghost" alignSelf="center" onClick={openDialog}>
        Aller à un autre chapitre…
      </Button>
      <Dialog.Root open={open} onOpenChange={details => setOpen(details.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content
              colorPalette={getBookColorPalette(currentPosition?.bookId)}
            >
              <Dialog.Header>
                <Dialog.Title>Aller à un autre chapitre</Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <IconButton aria-label="Fermer" variant="ghost" size="sm">
                    <LuX />
                  </IconButton>
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body>
                <Box
                  as="form"
                  display="flex"
                  flexDirection="column"
                  gap="3"
                  onSubmit={submit}
                >
                  <Field.Root>
                    <Field.Label>Livre</Field.Label>
                    <Select.Root
                      collection={bookCollection}
                      value={[bookId]}
                      onValueChange={event => selectBook(event.value.at(0))}
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Portal>
                        <Select.Positioner>
                          <Select.Content>
                            {bookCollection.items.map(item => (
                              <Select.Item key={item.value} item={item}>
                                {item.label}
                                <Select.ItemIndicator />
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Chapitre</Field.Label>
                    <Select.Root
                      collection={chapterCollection}
                      value={[chapterId]}
                      onValueChange={event => {
                        const selected = event.value.at(0)
                        if (selected) {
                          setChapterId(selected)
                        }
                      }}
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Portal>
                        <Select.Positioner>
                          <Select.Content>
                            {chapterCollection.items.map(item => (
                              <Select.Item key={item.value} item={item}>
                                {item.label}
                                <Select.ItemIndicator />
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>
                  </Field.Root>
                  <Dialog.Footer paddingX="0">
                    <Button type="submit" width="100%">
                      Ajouter au parcours
                    </Button>
                  </Dialog.Footer>
                </Box>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
