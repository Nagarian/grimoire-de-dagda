import { Box, Tabs, useTabs } from '@chakra-ui/react'
import { UIProvider } from 'components/ui/UIProvider'
import { BookVisualizer } from 'pages/BookVisualizer'
import { CharacterSheetPage } from 'pages/CharacterSheetPage'
import { Settings } from 'pages/Settings'
import './components/Mermaider'

export function App() {
  const tabs = useTabs({
    defaultValue: 'main',
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
          minWidth="breakpoint-sm"
        >
          <Box as="main" minHeight="0" display="flex" flexDirection="column">
            <Tabs.Content value="story-progresser" width="100%" height="100%">
              <CharacterSheetPage />
            </Tabs.Content>
            <Tabs.Content value="book-visualizer" width="100%" height="100%">
              <BookVisualizer />
            </Tabs.Content>
            <Tabs.Content value="settings" width="100%" height="100%">
              <Settings />
            </Tabs.Content>
          </Box>
          <Tabs.List>
            <Tabs.Trigger value="story-progresser">
              Story Progresser
            </Tabs.Trigger>
            <Tabs.Trigger value="book-visualizer">
              Book Tree Vizualizer
            </Tabs.Trigger>
            <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
          </Tabs.List>
        </Box>
      </Tabs.RootProvider>
    </UIProvider>
  )
}
