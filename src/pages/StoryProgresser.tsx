import { Box, Heading, Text, Button } from '@chakra-ui/react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getBookColorPalette } from 'components/ui/theme'
import { StoryProgressHeader } from 'components/StoryProgresser/StoryProgressHeader'
import { StoryProgressDetailsDrawer } from 'components/StoryProgresser/StoryProgressDetailsDrawer'
import { StoryReader } from 'components/StoryProgresser/StoryReader'
import { useState } from 'react'
import { useStoryProgress } from 'components/StoryProgresser/useStoryProgress'
import type { BookId } from 'services/books'
import { toChapterId } from 'services/bookData'
import { getLocalizedBookTitle } from 'services/i18n'

export function StoryProgresser({
  onCurrentBookChange,
  onOpenSettings,
  onOpenCharacterSheet,
}: {
  onCurrentBookChange?: (bookId: BookId | undefined) => void
  onOpenSettings?: () => void
  onOpenCharacterSheet?: () => void
}) {
  const { t } = useTranslation()
  const [progressDetailsOpen, setProgressDetailsOpen] = useState(false)
  const story = useStoryProgress()
  const {
    activeTrack,
    choices,
    continueToBook,
    currentBook,
    currentChapter,
    currentPosition,
    error,
    isEnd,
    jumpTo,
    nextBook,
    progress,
    returnFromExtension,
    returnLabel,
    revealMapPath,
    toggleCheckbox,
    updateUiState,
    undoVisit,
    chooseDestination,
  } = story
  const savepointMarker =
    currentBook?.id === 'T01'
      ? currentChapter?.tokens.find(
          token => token.kind === 'marker' && token.key === 'S',
        )
      : undefined
  const resumeChapterNumber =
    savepointMarker?.kind === 'marker' ? savepointMarker.args.at(0) : undefined
  const savepointContext =
    currentBook?.id === 'T01' && currentPosition
      ? {
          markerChapterId: currentPosition.chapterId,
          resumeChapterId: resumeChapterNumber
            ? toChapterId('T01', resumeChapterNumber)
            : currentPosition.chapterId,
        }
      : undefined

  useEffect(() => {
    onCurrentBookChange?.(currentBook?.id)
  }, [currentBook?.id, onCurrentBookChange])

  if (!progress) {
    return (
      <Box padding="4" role="alert">
        <Text color="fg.error">{error ?? t('errors.loadTracks')}</Text>
      </Box>
    )
  }

  return (
    <Box
      height="100%"
      minHeight="0"
      width="100%"
      minWidth="0"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      colorPalette={getBookColorPalette(currentBook?.id)}
    >
      <StoryProgressHeader
        trackName={activeTrack?.name}
        bookTitle={
          currentBook ? getLocalizedBookTitle(currentBook.id) : undefined
        }
        canUndo={Boolean(activeTrack && activeTrack.visits.length > 1)}
        onUndo={undoVisit}
        onOpenProgressDetails={() => setProgressDetailsOpen(true)}
      />
      <StoryProgressDetailsDrawer
        open={progressDetailsOpen}
        onOpenChange={setProgressDetailsOpen}
        activeTrack={activeTrack}
        bookId={currentBook?.id}
        openSections={progress.uiState.storyDetailsAccordion}
        onOpenSectionsChange={storyDetailsAccordion =>
          updateUiState({ ...progress.uiState, storyDetailsAccordion })
        }
        onToggleCheckbox={toggleCheckbox}
      />

      {error && (
        <Box role="alert" paddingX="4" paddingY="2" bg="bg.error">
          <Text color="fg.error">{error}</Text>
        </Box>
      )}

      <Box
        as="main"
        flex="1"
        minHeight="0"
        overflowY="auto"
        paddingX={{ base: '3', sm: '5', md: '8' }}
        paddingY={{ base: '4', md: '8' }}
      >
        {activeTrack && currentPosition && currentBook && currentChapter ? (
          <StoryReader
            book={currentBook}
            position={currentPosition}
            choices={choices}
            isEnd={isEnd}
            nextBook={nextBook}
            returnLabel={returnLabel}
            onChoose={chooseDestination}
            onContinue={continueToBook}
            onReturn={returnFromExtension}
            onJump={jumpTo}
            checkedCheckboxIds={activeTrack.checkedCheckboxIds}
            revealedMapPathIds={activeTrack.revealedMapPathIds}
            onToggleCheckbox={toggleCheckbox}
            onRevealMapPath={revealMapPath}
            savepointResumeChapterId={savepointContext?.resumeChapterId}
            onOpenCharacterSheet={onOpenCharacterSheet}
          />
        ) : (
          <Box
            width="100%"
            maxWidth="breakpoint-md"
            minHeight="100%"
            marginX="auto"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            padding="6"
          >
            <Heading size="xl">{t('story.startAdventure')}</Heading>
            <Text marginTop="3" color="fg.muted">
              {t('story.startAdventureDescription')}
            </Text>
            <Button
              marginTop="5"
              size="lg"
              onClick={onOpenSettings}
              disabled={!onOpenSettings}
            >
              {t('track.manageInSettings')}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  )
}
