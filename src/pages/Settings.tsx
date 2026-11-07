import { Box, Field } from '@chakra-ui/react'
import { useEffect } from 'react'
import { TrackManagementPanel } from 'components/Settings/TrackManagementPanel'
import { SettingsSection } from 'components/Settings/SettingsSection'
import { useStoryProgress } from 'components/StoryProgresser/useStoryProgress'
import { ColorModeButton } from 'components/ui/color-mode'
import { PageHeader } from 'components/ui/PageHeader'
import type { BookId } from 'services/books'

export function Settings({
  onCurrentBookChange,
}: {
  onCurrentBookChange?: (bookId: BookId | undefined) => void
}) {
  const story = useStoryProgress()
  const activeTrack = story.activeTrack

  useEffect(() => {
    onCurrentBookChange?.(story.currentBook?.id)
  }, [onCurrentBookChange, story.currentBook?.id])

  return (
    <Box height="100%" minHeight="0" display="flex" flexDirection="column">
      <PageHeader
        subtitle={activeTrack?.name ?? 'Préférences'}
        title="Paramètres"
      />
      <Box
        flex="1"
        minHeight="0"
        overflowY="auto"
        padding={{ base: '4', md: '8' }}
      >
        <Box
          width="100%"
          maxWidth="breakpoint-md"
          marginX="auto"
          display="flex"
          flexDirection="column"
          gap="6"
        >
          {story.progress && (
            <TrackManagementPanel
              tracks={story.progress.tracks}
              activeTrack={activeTrack}
              bookId={story.currentBook?.id}
              error={story.error}
              onChangeTrack={story.changeTrack}
              onCreateTrack={story.createTrack}
              onRenameTrack={story.renameTrack}
              onDeleteTrack={story.deleteTrack}
            />
          )}
          <SettingsSection title="Apparence">
            <Field.Root
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gap="4"
            >
              <Field.Label marginBottom="0">
                Choisissez la couleur du thème
              </Field.Label>
              <ColorModeButton />
            </Field.Root>
          </SettingsSection>
        </Box>
      </Box>
    </Box>
  )
}
