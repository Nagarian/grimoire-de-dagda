import { Box, Tabs, useTabs } from '@chakra-ui/react'
import { UIProvider } from 'components/ui/UIProvider'
import { BookVisualizer } from 'pages/BookVisualizer'
import { Settings } from 'pages/Settings'
import { CharacterSheetPage } from 'pages/CharacterSheet'
import { StoryProgresser } from 'pages/StoryProgresser'
import { useState } from 'react'
import type { BookId } from 'services/books'
import {
  defaultStoryProgressUiState,
  isStoryProgressPage,
  loadStoryProgress,
  saveStoryProgress,
} from 'services/storyProgress'
import {
  LuBookOpen,
  LuGitBranch,
  LuSettings,
  LuUserRound,
} from 'react-icons/lu'

export function App() {
  const [storyBookId, setStoryBookId] = useState<BookId>()
  const [initialPage] = useState(() => {
    try {
      return loadStoryProgress().uiState.currentPage
    } catch {
      return defaultStoryProgressUiState.currentPage
    }
  })
  const [pageSaveError, setPageSaveError] = useState<string>()
  function persistPage(pageValue: string) {
    if (!isStoryProgressPage(pageValue)) {
      return
    }
    try {
      const progress = loadStoryProgress()
      if (progress.uiState.currentPage !== pageValue) {
        saveStoryProgress({
          ...progress,
          uiState: {
            ...progress.uiState,
            currentPage: pageValue,
          },
        })
      }
      setPageSaveError(undefined)
    } catch (error) {
      setPageSaveError(
        error instanceof Error
          ? error.message
          : 'Impossible d’enregistrer la page affichée.',
      )
    }
  }
  const tabs = useTabs({
    defaultValue: initialPage,
    onValueChange: details => persistPage(details.value),
  })

  return (
    <UIProvider>
      <Tabs.RootProvider
        value={tabs}
        variant="enclosed"
        fitted
        lazyMount
        unmountOnExit
      >
        <Box
          display="grid"
          gridTemplateRows="1fr auto"
          height="100vh"
          minWidth="0"
        >
          <Box as="main" minHeight="0" display="flex" flexDirection="column">
            {pageSaveError && (
              <Box role="alert" paddingX="4" paddingY="2" bg="bg.error">
                <Box color="fg.error">{pageSaveError}</Box>
              </Box>
            )}
            <Tabs.Content value="story-progresser" width="100%" height="100%">
              <StoryProgresser
                onCurrentBookChange={setStoryBookId}
                onOpenSettings={() => tabs.setValue('settings')}
                onOpenCharacterSheet={() => tabs.setValue('character-sheet')}
              />
            </Tabs.Content>
            <Tabs.Content value="character-sheet" width="100%" height="100%">
              <CharacterSheetPage
                onCurrentBookChange={setStoryBookId}
                onOpenSettings={() => tabs.setValue('settings')}
              />
            </Tabs.Content>
            <Tabs.Content value="book-visualizer" width="100%" height="100%">
              <BookVisualizer defaultBookId={storyBookId} />
            </Tabs.Content>
            <Tabs.Content value="settings" width="100%" height="100%">
              <Settings onCurrentBookChange={setStoryBookId} />
            </Tabs.Content>
          </Box>
          <Tabs.List>
            <Tabs.Trigger value="story-progresser">
              <LuBookOpen aria-hidden="true" />
              Story Progresser
            </Tabs.Trigger>
            <Tabs.Trigger value="character-sheet">
              <LuUserRound aria-hidden="true" />
              Character Sheet
            </Tabs.Trigger>
            <Tabs.Trigger value="book-visualizer">
              <LuGitBranch aria-hidden="true" />
              Book Tree Vizualizer
            </Tabs.Trigger>
            <Tabs.Trigger value="settings">
              <LuSettings aria-hidden="true" />
              Settings
            </Tabs.Trigger>
          </Tabs.List>
        </Box>
      </Tabs.RootProvider>
    </UIProvider>
  )
}
