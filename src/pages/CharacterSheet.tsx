import { Box, Button, Heading, IconButton, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { LuMenu } from 'react-icons/lu'
import { CharacterSheet } from 'components/CharacterSheet/CharacterSheet'
import { CharacterSheetMenu } from 'components/CharacterSheet/CharacterSheetMenu'
import { DiceRoller } from 'components/StoryProgresser/DiceRoller'
import { PageHeader } from 'components/ui/PageHeader'
import { getBookColorPalette } from 'components/ui/theme'
import { useStoryProgress } from 'components/StoryProgresser/useStoryProgress'
import type { BookId } from 'services/books'
import { toChapterId } from 'services/bookData'

export function CharacterSheetPage({
  onCurrentBookChange,
  onOpenSettings,
}: {
  onCurrentBookChange?: (bookId: BookId | undefined) => void
  onOpenSettings?: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const story = useStoryProgress()
  const {
    activeTrack,
    currentBook,
    currentChapter,
    currentPosition,
    currentBookSheet,
    error,
    restoreSavepoint,
    removeE01Capsule,
    saveAtSavepoint,
    setGameMode,
    updateCharacterSheet,
  } = story
  const savepointMarker =
    currentBook?.id === 'T01'
      ? currentChapter?.tokens.find(
          token => token.kind === 'marker' && token.key === 'S',
        )
      : undefined
  const resumeChapterNumber =
    savepointMarker?.kind === 'marker' ? savepointMarker.args.at(0) : undefined
  const savepointChapterId =
    currentBook?.id === 'T01' && currentPosition
      ? resumeChapterNumber
        ? toChapterId('T01', resumeChapterNumber)
        : currentPosition.chapterId
      : undefined

  useEffect(() => {
    onCurrentBookChange?.(currentBook?.id)
  }, [currentBook?.id, onCurrentBookChange])

  if (!story.progress) {
    return (
      <Box
        height="100%"
        minHeight="0"
        display="flex"
        flexDirection="column"
        colorPalette={getBookColorPalette(currentBook?.id)}
      >
        <PageHeader
          subtitle="Feuille de personnage"
          title="Aucun parcours sélectionné"
        />
        <Box padding="4" role="alert">
          <Text color="fg.error">
            {error ?? 'Impossible de charger les parcours enregistrés.'}
          </Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box
      height="100%"
      minHeight="0"
      display="flex"
      flexDirection="column"
      colorPalette={getBookColorPalette(currentBook?.id)}
    >
      <PageHeader
        subtitle={activeTrack?.name ?? 'Feuille de personnage'}
        title={currentBook?.title ?? 'Aucun parcours sélectionné'}
        actions={
          <>
            {currentBook && <DiceRoller bookId={currentBook.id} />}
            {activeTrack && (
              <IconButton
                aria-label="Ouvrir les feuilles enregistrées et les sauvegardes"
                title="Feuilles enregistrées et sauvegardes"
                variant="ghost"
                onClick={() => setMenuOpen(true)}
              >
                <LuMenu />
              </IconButton>
            )}
          </>
        }
      />
      {activeTrack && (
        <CharacterSheetMenu
          open={menuOpen}
          onOpenChange={setMenuOpen}
          activeTrack={activeTrack}
          currentBookId={currentBook?.id}
          savepointChapterId={savepointChapterId}
          error={menuOpen ? error : undefined}
          onSaveAtSavepoint={saveAtSavepoint}
          onRestoreSavepoint={restoreSavepoint}
        />
      )}
      {error && !menuOpen && (
        <Box role="alert" paddingX="4" paddingY="2" bg="bg.error">
          <Text color="fg.error">{error}</Text>
        </Box>
      )}
      {activeTrack ? (
        <Box flex="1" minHeight="0">
          <CharacterSheet
            bookId={currentBook?.id}
            sheet={currentBookSheet}
            gameMode={activeTrack.characterSheet.gameMode}
            onUpdate={updateCharacterSheet}
            onSetGameMode={setGameMode}
            onRemoveCapsule={removeE01Capsule}
          />
        </Box>
      ) : (
        <Box
          flex="1"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap="3"
          padding="6"
          textAlign="center"
        >
          <Heading size="xl">Aucun parcours sélectionné</Heading>
          <Text color="fg.muted">
            Sélectionnez ou créez un parcours dans les paramètres pour afficher
            sa feuille de personnage.
          </Text>
          <Button onClick={onOpenSettings} disabled={!onOpenSettings}>
            Gérer les parcours dans les paramètres
          </Button>
        </Box>
      )}
    </Box>
  )
}
