import {
  Accordion,
  Box,
  Drawer,
  IconButton,
  Portal,
  Text,
} from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { LuX } from 'react-icons/lu'
import { CheckedStoryCheckboxes } from 'components/StoryProgresser/CheckedStoryCheckboxes'
import { getBookColorPalette } from 'components/ui/theme'
import type { BookId } from 'services/books'
import { getDestinationLabel } from 'services/storyNavigation'
import { getAllStoryCheckboxes } from 'services/storyCheckboxes'
import type { StoryTrack } from 'services/storyProgress'

export function StoryProgressDetailsDrawer({
  open,
  onOpenChange,
  activeTrack,
  bookId,
  onToggleCheckbox,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeTrack?: StoryTrack
  bookId?: BookId
  onToggleCheckbox: (checkboxId: string) => boolean
}) {
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
              <Drawer.Title>Historique et cases cochées</Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <IconButton
                  aria-label="Fermer l’historique"
                  variant="ghost"
                  size="sm"
                >
                  <LuX />
                </IconButton>
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body>
              <Accordion.Root multiple collapsible>
                <AccordionSection value="checked-boxes" title="Cases cochées">
                  <CheckedStoryCheckboxes
                    checkboxes={getAllStoryCheckboxes()}
                    checkedCheckboxIds={activeTrack?.checkedCheckboxIds ?? []}
                    showHeading={false}
                    onToggle={onToggleCheckbox}
                  />
                </AccordionSection>
                <AccordionSection value="history" title="Historique">
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
                    <Text color="fg.muted">Aucun parcours sélectionné.</Text>
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
