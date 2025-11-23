import { Box, Tabs, useTabs } from '@chakra-ui/react'
import { StoryDisplayer } from 'components/StoryDisplayer'
import { ColorModeButton } from 'components/ui/color-mode'
import { UIProvider } from 'components/ui/UIProvider'
import Book1 from '../scripts/01-la-harpe-des-quatres-saisons.mermaid?raw'
import Book2 from '../scripts/02-la-confrerie-de-nuada.mermaid?raw'
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
          gridTemplateRows="auto 1fr auto"
          height="100vh"
          minWidth="breakpoint-sm"
        >
          <ColorModeButton />

        <Box
          as="main"
          minHeight="0"
          display="grid"
          width="100%"
          height="100%"
        >
          <Tabs.Content value="book1" width="100%" height="100%">
            <StoryDisplayer marmaidContent={Book1} />
          </Tabs.Content>
          <Tabs.Content value="book2" width="100%" height="100%">
            <StoryDisplayer marmaidContent={Book2} />
          </Tabs.Content>
        </Box>          <Tabs.List>
            <Tabs.Trigger value="book1">
              La harpe des quatres saisons
            </Tabs.Trigger>
            <Tabs.Trigger value="book2">La confrérie de Nuada</Tabs.Trigger>
          </Tabs.List>
        </Box>
      </Tabs.RootProvider>
    </UIProvider>
  )
}
