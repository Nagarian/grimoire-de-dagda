import { Box, Heading, Text, Button } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { getBookColorPalette } from 'components/ui/theme'
import { StoryProgressDrawer } from 'components/StoryProgresser/StoryProgressDrawer'
import { StoryProgressHeader } from 'components/StoryProgresser/StoryProgressHeader'
import { StoryReader } from 'components/StoryProgresser/StoryReader'
import { CharacterSheetDrawer } from 'components/StoryProgresser/CharacterSheetDrawer'
import { useStoryProgress } from 'components/StoryProgresser/useStoryProgress'
import type { BookId } from 'services/books'
import { toChapterId } from 'services/bookData'

export function StoryProgresser({
  onCurrentBookChange,
}: {
  onCurrentBookChange?: (bookId: BookId | undefined) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const story = useStoryProgress()
  const {
    activeTrack,
    changeTrack,
    choices,
    continueToBook,
    createTrack,
    currentBook,
    currentChapter,
    currentPosition,
    currentBookSheet,
    deleteTrack,
    error,
    isEnd,
    jumpTo,
    nextBook,
    progress,
    renameTrack,
    returnFromExtension,
    returnLabel,
    restoreSavepoint,
    revealMapPath,
    removeE01Capsule,
    saveAtSavepoint,
    setGameMode,
    toggleCheckbox,
    undoVisit,
    updateCharacterSheet,
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
        <Text color="fg.error">
          {error ?? 'Impossible de charger les parcours enregistrés.'}
        </Text>
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
        bookTitle={currentBook?.title}
        bookId={currentBook?.id}
        canUndo={Boolean(activeTrack && activeTrack.visits.length > 1)}
        onUndo={undoVisit}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenCharacterSheet={() => setSheetOpen(true)}
      />

      {error && !menuOpen && (
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
            onOpenCharacterSheet={() => setSheetOpen(true)}
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
            <Heading size="xl">Commencez votre aventure</Heading>
            <Text marginTop="3" color="fg.muted">
              Créez un parcours pour choisir votre tome de départ.
            </Text>
            <Button marginTop="5" size="lg" onClick={() => setMenuOpen(true)}>
              Créer un parcours
            </Button>
          </Box>
        )}
      </Box>

      <StoryProgressDrawer
        open={menuOpen}
        onOpenChange={setMenuOpen}
        tracks={progress.tracks}
        activeTrack={activeTrack}
        bookId={currentBook?.id}
        error={error}
        onChangeTrack={changeTrack}
        onCreateTrack={createTrack}
        onRenameTrack={renameTrack}
        onDeleteTrack={deleteTrack}
        onToggleCheckbox={toggleCheckbox}
      />
      <CharacterSheetDrawer
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        bookId={currentBook?.id}
        sheet={currentBookSheet}
        gameMode={activeTrack?.characterSheet.gameMode ?? null}
        savepointContext={savepointContext}
        onUpdate={updateCharacterSheet}
        onSetGameMode={setGameMode}
        onSaveAtSavepoint={saveAtSavepoint}
        onRestoreSavepoint={restoreSavepoint}
        onRemoveCapsule={removeE01Capsule}
      />
    </Box>
  )
}
