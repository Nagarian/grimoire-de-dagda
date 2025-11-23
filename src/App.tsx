import { Box, Tabs, useTabs } from '@chakra-ui/react'
import { StoryDisplayer } from 'components/StoryDisplayer'
import { ColorModeButton } from 'components/ui/color-mode'
import { UIProvider } from 'components/ui/UIProvider'

export function App() {
  const tabs = useTabs({
    defaultValue: 'main',
  })
  return (
    <UIProvider>
      <Tabs.RootProvider value={tabs} variant="enclosed" fitted>
        <Box
          display="grid"
          gridTemplateRows="auto 1fr auto"
          height="100vh"
          minWidth="breakpoint-sm"
        >
          <ColorModeButton />

          <Box as="main" minHeight="0" overflowY="auto">
            <Tabs.Content value="main">
              <StoryDisplayer />
            </Tabs.Content>
          </Box>

          <Tabs.List>
            <Tabs.Trigger value="main">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="second">Tab 2</Tabs.Trigger>
            <Tabs.Trigger value="third">Tab 3</Tabs.Trigger>
          </Tabs.List>
        </Box>
      </Tabs.RootProvider>
    </UIProvider>
  )
}
