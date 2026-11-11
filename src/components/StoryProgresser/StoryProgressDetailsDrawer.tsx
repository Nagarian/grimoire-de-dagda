import {
  Accordion,
  Box,
  Drawer,
  IconButton,
  Portal,
  Text,
} from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LuX } from 'react-icons/lu'
import { CheckedStoryCheckboxes } from 'components/StoryProgresser/CheckedStoryCheckboxes'
import { getBookColorPalette } from 'components/ui/theme'
import type { BookId } from 'services/books'
import { getDestinationLabel } from 'services/storyNavigation'
import { getAllStoryCheckboxes } from 'services/storyCheckboxes'
import { isStoryDetailsAccordionSection } from 'services/storyProgress'
import type {
  StoryDetailsAccordionSection,
  StoryTrack,
} from 'services/storyProgress'

export function StoryProgressDetailsDrawer({
  open,
  onOpenChange,
  activeTrack,
  bookId,
  openSections,
  onOpenSectionsChange,
  onToggleCheckbox,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeTrack?: StoryTrack
  bookId?: BookId
  openSections: StoryDetailsAccordionSection[]
  onOpenSectionsChange: (openSections: StoryDetailsAccordionSection[]) => void
  onToggleCheckbox: (checkboxId: string) => boolean
}) {
  const { t } = useTranslation()
  return (
    <Drawer.Root
      open={open}
      onOpenChange={details => onOpenChange(details.open)}
      placement="end"
      size="sm"
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content colorPalette={getBookColorPalette(bookId)}>
            <Drawer.Header>
              <Drawer.Title>{t('story.historyAndCheckboxes')}</Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <IconButton
                  aria-label={t('story.closeHistory')}
                  variant="ghost"
                  size="sm"
                >
                  <LuX />
                </IconButton>
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body>
              <Accordion.Root
                multiple
                collapsible
                value={openSections}
                onValueChange={details =>
                  onOpenSectionsChange(
                    details.value.filter(isStoryDetailsAccordionSection),
                  )
                }
              >
                <AccordionSection
                  value="checked-boxes"
                  title={t('story.checkedBoxes')}
                >
                  <CheckedStoryCheckboxes
                    checkboxes={getAllStoryCheckboxes()}
                    checkedCheckboxIds={activeTrack?.checkedCheckboxIds ?? []}
                    showHeading={false}
                    onToggle={onToggleCheckbox}
                  />
                </AccordionSection>
                <AccordionSection value="history" title={t('story.history')}>
                  {activeTrack ? (
                    <Box
                      as="ol"
                      paddingStart="5"
                      marginTop="2"
                      maxHeight="60vh"
                      overflowY="auto"
                    >
                      {activeTrack.visits.map((visit, index) => (
                        <Box
                          as="li"
                          key={`${visit.chapterId}-${index}`}
                          aria-current={
                            index === activeTrack.visits.length - 1
                              ? 'location'
                              : undefined
                          }
                          paddingY="1"
                        >
                          {getDestinationLabel(visit)}
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Text color="fg.muted">{t('story.noTrack')}</Text>
                  )}
                </AccordionSection>
              </Accordion.Root>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}

function AccordionSection({
  value,
  title,
  children,
}: {
  value: string
  title: string
  children: ReactNode
}) {
  return (
    <Accordion.Item value={value}>
      <Accordion.ItemTrigger>
        <Text flex="1" textAlign="start" fontWeight="semibold">
          {title}
        </Text>
        <Accordion.ItemIndicator />
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <Accordion.ItemBody>{children}</Accordion.ItemBody>
      </Accordion.ItemContent>
    </Accordion.Item>
  )
}
