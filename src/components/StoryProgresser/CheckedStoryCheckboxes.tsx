import { Box, Heading, Stack, Text } from '@chakra-ui/react'
import { books } from 'services/books'
import { getChapterNumberFromId } from 'services/chapterDsl'
import type { StoryCheckbox } from 'services/storyCheckboxes'
import { StoryCheckboxItem } from './StoryCheckboxItem'

export function CheckedStoryCheckboxes({
  checkboxes,
  checkedCheckboxIds,
  onToggle,
  showHeading = true,
}: {
  checkboxes: StoryCheckbox[]
  checkedCheckboxIds: string[]
  onToggle: (checkboxId: string) => void
  showHeading?: boolean
}) {
  const checkedIds = new Set(checkedCheckboxIds)

  return (
    <Box>
      {showHeading && <Heading size="md">Cases cochées</Heading>}
      {checkedIds.size === 0 ? (
        <Text color="fg.muted" marginTop={showHeading ? '2' : undefined}>
          Aucune case cochée pour le moment.
        </Text>
      ) : (
        <Stack gap="4" marginTop={showHeading ? '3' : undefined}>
          {books.map(book => {
            const bookGroups = groupBookCheckboxes(
              checkboxes.filter(checkbox =>
                checkbox.chapterId.startsWith(`${book.id}-`),
              ),
            ).filter(group =>
              group.checkboxes.some(checkbox => checkedIds.has(checkbox.id)),
            )
            if (bookGroups.length === 0) {
              return null
            }

            return (
              <Box key={book.id}>
                <Heading size="sm" marginBottom="2">
                  {book.title}
                </Heading>
                <Stack gap="3">
                  {bookGroups.map(group => (
                    <Box key={group.chapterId}>
                      {group.chapterCheckbox ? (
                        <StoryCheckboxItem
                          checkbox={group.chapterCheckbox}
                          checked={checkedIds.has(group.chapterCheckbox.id)}
                          onToggle={onToggle}
                        />
                      ) : (
                        <Text fontWeight="semibold">
                          Chapitre {getChapterNumberFromId(group.chapterId)}
                        </Text>
                      )}
                      {group.lineCheckboxes.length > 0 && (
                        <Stack gap="2" marginStart="6" marginTop="2">
                          {group.lineCheckboxes.map(checkbox => (
                            <StoryCheckboxItem
                              key={checkbox.id}
                              checkbox={checkbox}
                              checked={checkedIds.has(checkbox.id)}
                              onToggle={onToggle}
                            />
                          ))}
                        </Stack>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )
          })}
        </Stack>
      )}
    </Box>
  )
}

type ChapterCheckboxGroup = {
  chapterId: string
  chapterCheckbox?: StoryCheckbox
  lineCheckboxes: StoryCheckbox[]
  checkboxes: StoryCheckbox[]
}

function groupBookCheckboxes(
  checkboxes: StoryCheckbox[],
): ChapterCheckboxGroup[] {
  const groups = new Map<string, ChapterCheckboxGroup>()

  for (const checkbox of checkboxes) {
    const chapterId = checkbox.chapterId
    let group = groups.get(chapterId)
    if (!group) {
      group = {
        chapterId,
        lineCheckboxes: [],
        checkboxes: [],
      }
      groups.set(chapterId, group)
    }

    group.checkboxes.push(checkbox)
    if (checkbox.kind === 'chapter') {
      group.chapterCheckbox = checkbox
    } else {
      group.lineCheckboxes.push(checkbox)
    }
  }

  return [...groups.values()].sort(
    (first, second) =>
      Number(getChapterNumberFromId(first.chapterId)) -
      Number(getChapterNumberFromId(second.chapterId)),
  )
}
